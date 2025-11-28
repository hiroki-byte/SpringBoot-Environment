# 第6章: 本番用 Dockerfile

[← 目次に戻る](./00_index.md) | [← 第5章: 開発用Dockerfile](./05_docker_dev.md) | [→ 第7章: Next.js設定](./07_nextjs_config.md)

---

## 📋 この章で学ぶこと

- 本番用Dockerfileの設計思想
- マルチステージビルドとは
- イメージサイズの最適化
- セキュリティのベストプラクティス
- Frontend と Backend の本番用Dockerfile解説

---

## 1. 本番用Dockerfileの目標

### 開発用との違い

| 項目 | 開発用 | 本番用 |
|------|--------|--------|
| サイズ | 大きくてもOK | できる限り小さく |
| ツール | デバッグツール込み | 最小限のみ |
| セキュリティ | 低優先 | 最優先 |
| 最適化 | 低優先 | 最優先 |
| ビルド時間 | 速い方が良い | 遅くてもOK（1回だけ） |

### 本番用の設計原則

1. **最小限の原則**: 必要最小限のファイルのみを含める
2. **セキュリティ**: root userを避ける、脆弱性のあるパッケージを含めない
3. **イミュータブル**: 実行時にファイルを変更しない
4. **高速起動**: 起動時間を最小化

---

## 2. マルチステージビルドとは？

### 定義

**マルチステージビルド** は、1つのDockerfileの中で複数の `FROM` 命令を使い、複数のステージに分けてビルドする手法です。

### なぜ必要？

**シングルステージの問題**:
```dockerfile
FROM node:20-bookworm
WORKDIR /app
COPY package*.json ./
RUN npm install    # ← 開発用ライブラリも全部インストール
COPY . .
RUN npm run build  # ← ビルドツールが残る
CMD ["npm", "start"]
```

**問題点**:
- `npm install` で開発用ライブラリ（TypeScript、ESLint等）も全部含まれる
- ビルドツール（Webpack等）がイメージに残る
- イメージサイズが巨大（1GB以上）

**マルチステージの解決**:
```dockerfile
# ステージ1: ビルド
FROM node:20-bookworm AS builder
WORKDIR /app
COPY . .
RUN npm run build  # ビルド成果物を生成

# ステージ2: 実行
FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist  # ビルド成果物のみコピー
CMD ["node", "dist/server.js"]
```

**結果**: イメージサイズが1/10になることも

---

## 3. ファイル: `frontend/Dockerfile.prod`

### ファイルの役割

Next.jsアプリケーションを本番環境用に最適化してビルドし、最小限のイメージで実行します。

### 完全なファイル内容

```dockerfile
FROM node:20-bookworm-slim AS base

# Install dependencies only when needed
FROM base AS deps
# RUN apk add --no-cache libc6-compat # Not needed for Debian
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm config set fetch-retry-maxtimeout 600000 && npm config set fetch-retry-mintimeout 10000 && npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

---

### ステージ1: base（ベースイメージ）

```dockerfile
FROM node:20-bookworm-slim AS base
```

#### `node:20-bookworm-slim`

**`slim` とは？**: Debianの軽量版

**サイズ比較**:
- `node:20-bookworm`: 約350MB
- `node:20-bookworm-slim`: 約150MB
- `node:20-alpine`: 約50MB

**なぜAlpineではなくDebian slim？**:
- 互換性（glibcを使用）
- Alpineより安定している
- サイズとのバランス

#### `AS base`

**役割**: このステージに `base` という名前を付ける

**他のステージから参照**:
```dockerfile
FROM base AS deps  # ← baseステージを親として使用
```

**利点**: ベースイメージを1箇所で管理

---

### ステージ2: deps（依存関係のインストール）

```dockerfile
# Install dependencies only when needed
FROM base AS deps
# RUN apk add --no-cache libc6-compat # Not needed for Debian
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm config set fetch-retry-maxtimeout 600000 && npm config set fetch-retry-mintimeout 10000 && npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi
```

#### コメント: `# RUN apk add --no-cache libc6-compat`

**これは何？**: Alpineバージョンからの移行の痕跡

**Alpine版では必要だった**:
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache libc6-compat  # glibcの互換レイヤー
```

**Debian版では不要**: 標準でglibcが入っている

#### `COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./`

**`*`（アスタリスク）の意味**: ファイルが存在しなくてもエラーにならない

**具体例**:
- `yarn.lock*`: yarn.lockがあればコピー、なければスキップ
- `package-lock.json*`: 同上
- `pnpm-lock.yaml*`: 同上

**なぜ複数のパッケージマネージャーに対応？**:
- プロジェクトによってnpm/yarn/pnpmを使い分けられるようにするため

#### `RUN` ブロック（パッケージマネージャーの自動判別）

**構造**:
```bash
if [ 条件1 ]; then
    処理1
elif [ 条件2 ]; then
    処理2
else
    処理3
fi
```

##### `if [ -f yarn.lock ]; then yarn --frozen-lockfile;`

**`[ -f yarn.lock ]` の意味**: yarn.lockファイルが存在するか？

**`yarn --frozen-lockfile`**:
- `package.json` と `yarn.lock` の整合性をチェック
- 不整合があればエラー（バージョンの不一致を防ぐ）
- 新しいパッケージを追加しない（lockファイルを変更しない）

##### `npm config set fetch-retry-maxtimeout 600000 && npm config set fetch-retry-mintimeout 10000 && npm ci`

**`npm config set fetch-retry-maxtimeout 600000`**:
- パッケージダウンロードのリトライタイムアウトを600秒（10分）に設定
- ネットワークが不安定な環境での対策

**`npm ci` とは？**:

| コマンド | 特徴 | 用途 |
|---------|------|------|
| `npm install` | `package-lock.json` を生成/更新 | 開発 |
| `npm ci` | `package-lock.json` 必須、厳密 | CI/CD、本番 |

**`npm ci` の挙動**:
1. `node_modules` を完全削除
2. `package-lock.json` から厳密にインストール
3. `package.json` との不整合を許さない

**なぜ `npm ci` を使う？**:
- 再現性（常に同じバージョンをインストール）
- 高速（lockファイルから直接インストール）
- 安全（予期しないバージョン変更を防ぐ）

##### `else echo "Lockfile not found." && exit 1;`

**役割**: どのlockファイルも見つからなければエラーで終了

**`exit 1` の意味**: 終了コード1（エラー）でプロセスを終了

---

### ステージ3: builder（ビルド）

```dockerfile
# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build
```

#### `COPY --from=deps /app/node_modules ./node_modules`

**`--from=deps` とは？**: 別のステージ（deps）からファイルをコピー

**構文**: `COPY --from=<ステージ名> <元のパス> <先のパス>`

**この行の意味**:
```
depsステージの /app/node_modules
    ↓ コピー
builderステージの ./node_modules
```

**なぜ別ステージからコピー？**:
- depsステージでインストールした依存関係を再利用
- 再度 `npm install` する必要がない（高速化）

#### `COPY . .`

ソースコードをすべてコピー。

#### `# ENV NEXT_TELEMETRY_DISABLED 1`

**Next.js Telemetry とは？**:
- Next.jsが収集する匿名の使用統計データ
- どの機能が使われているかを把握（Next.jsの改善に活用）

**無効化する理由**:
- プライバシーの懸念
- 企業ポリシー
- CIでのビルド時間の短縮

コメントアウトを外せば無効化できる。

#### `RUN npm run build`

**実行内容**:
```json
// package.json
"scripts": {
  "build": "next build"
}
```

**Next.jsのビルド処理**:
1. TypeScriptをJavaScriptにコンパイル
2. ページを最適化
3. 静的ファイルを生成
4. `standalone` モード（後述）でサーバーコードを出力

**生成されるファイル**:
```
.next/
├── static/       # CSS, JS, 画像等
├── server/       # サーバーサイドのコード
└── standalone/   # 実行に必要な最小限のファイル
```

---

### ステージ4: runner（実行）

```dockerfile
# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### `ENV NODE_ENV production`

**`NODE_ENV` とは？**: Node.jsアプリケーションの実行環境を示す標準的な環境変数

**値の種類**:
- `development`: 開発モード
- `production`: 本番モード
- `test`: テストモード

**`production` の効果**:
- エラーメッセージを詳細に表示しない（セキュリティ）
- キャッシュを積極的に使用（パフォーマンス）
- デバッグログを出力しない

#### `RUN addgroup --system --gid 1001 nodejs`

**役割**: システムグループ `nodejs` を作成

**`--system` オプション**: システムグループとして作成（UID/GIDが1000未満）

**`--gid 1001` オプション**: グループIDを1001に指定

**なぜグループを作る？**:
- セキュリティのベストプラクティス
- rootユーザーで実行しない

#### `RUN adduser --system --uid 1001 nextjs`

**役割**: システムユーザー `nextjs` を作成

**`--uid 1001` オプション**: ユーザーIDを1001に指定

**なぜ1001？**:
- 1000は通常、最初の一般ユーザーに割り当てられる
- 1001は衝突を避けるための慣習

#### `COPY --from=builder /app/public ./public`

**publicフォルダとは？**:
- Next.jsの静的ファイル（画像、フォント等）を置く場所
- `/public/logo.png` → `http://example.com/logo.png` でアクセス可能

#### `RUN mkdir .next` と `RUN chown nextjs:nodejs .next`

**.nextフォルダとは？**:
- Next.jsのビルド成果物とキャッシュ
- 実行時に一部のファイルが更新される可能性がある（プリレンダリングキャッシュ等）

**なぜ権限を変更？**:
- `nextjs` ユーザーが書き込めるように
- rootで実行していないため

#### `COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./`

**`standalone` とは？**:

Next.jsの特殊な出力モード（`next.config.mjs` で設定）:
```javascript
module.exports = {
  output: 'standalone',
};
```

**効果**:
- ビルド時に、実行に必要な最小限のファイルだけを `.next/standalone/` フォルダに出力
- `node_modules` から使われているファイルだけを抽出
- サーバーコード `server.js` を生成

**サイズ比較**:
- 通常モード: `node_modules` 全体（300MB）
- standaloneモード: 必要なファイルのみ（30MB）

#### `COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static`

**`.next/static` とは？**:
- コンパイルされたJavaScript、CSS
- 静的に生成されたHTMLファイル

**なぜ別途コピー？**:
- `standalone` に含まれないため
- ブラウザがアクセスする静的リソース

#### `--chown=nextjs:nodejs`

**役割**: コピー時に所有者を変更

**通常の方法**:
```dockerfile
COPY --from=builder /app/.next/static ./.next/static
RUN chown -R nextjs:nodejs ./.next/static
```

**`--chown` を使う利点**:
- 1つのレイヤーで完結（イメージサイズ削減）
- より効率的

#### `USER nextjs`

**役割**: 以降のコマンドを `nextjs` ユーザーで実行

**セキュリティ上の重要性**:

**rootで実行した場合のリスク**:
```
コンテナが侵入された
    ↓
攻撃者がroot権限を取得
    ↓
ホストシステムへの攻撃が可能に
```

**非rootユーザーで実行**:
```
コンテナが侵入された
    ↓
攻撃者はnextjsユーザーの権限のみ
    ↓
被害を最小限に
```

#### `ENV HOSTNAME "0.0.0.0"`

**役割**: 次.jsサーバーがバインドするアドレスを指定

**`0.0.0.0` の意味**: すべてのネットワークインターフェースでリッスン

**他の選択肢**:
- `localhost` / `127.0.0.1`: ローカルからのみアクセス可能
- `0.0.0.0`: 外部からもアクセス可能

Docker環境では `0.0.0.0` が必須。

#### `CMD ["node", "server.js"]`

**`server.js` とは？**:
- Next.jsの `standalone` モードで生成されるサーバーファイル
- Express等を使わず、Nodeで直接実行

**なぜ `npm start` ではない？**:
- `npm` を経由すると、シグナルが正しく伝わらない
- 直接 `node` で実行する方が効率的

---

## 4. ファイル: `backend/Dockerfile.prod`

### 完全なファイル内容

```dockerfile
FROM gradle:8.7.0-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle build -x test --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

### ステージ1: build（ビルド）

```dockerfile
FROM gradle:8.7.0-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle build -x test --no-daemon
```

#### `FROM gradle:8.7.0-jdk21 AS build`

**公式Gradleイメージ**:
- Gradleがプリインストールされている
- JDK 21を含む

#### `RUN gradle build -x test --no-daemon`

**`gradle build`**: Javaプロジェクトをビルド

**`-x test`**: テストをスキップ
- 本番ビルドではテストを別途CI/CDで実行済みを前提
- ビルド時間の短縮

**`--no-daemon`**: Gradleデーモンを使用しない

**Gradleデーモンとは？**:
- Gradleのプロセスをバックグラウンドで常駐させる機能
- 2回目以降のビルドが高速化

**なぜ `--no-daemon`？**:
- Dockerでは1回しかビルドしない（キャッシュ効果がない）
- メモリの無駄遣いを避ける

**生成されるファイル**:
```
build/libs/backend-0.0.1-SNAPSHOT.jar
```

---

### ステージ2: 実行

```dockerfile
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### `FROM eclipse-temurin:21-jre`

**JREを使う理由**:

| 種類 | サイズ | 内容 | 用途 |
|------|--------|------|------|
| JDK | 約400MB | JRE + コンパイラ + デバッグツール | 開発、ビルド |
| JRE | 約200MB | Java実行環境のみ | 本番実行 |

**本番環境ではJREで十分**:
- コンパイルは不要（JARファイルが既にある）
- イメージサイズが半分に

#### `COPY --from=build /app/build/libs/*.jar app.jar`

**`*.jar` のワイルドカード**:
- `backend-0.0.1-SNAPSHOT.jar`（バージョンが変わっても対応）

**`app.jar` にリネーム**:
- 実行コマンドをシンプルに

#### `RUN groupadd -r spring && useradd -r -g spring spring`

**Debianのユーザー作成コマンド**:

| Alpine | Debian |
|--------|--------|
| `addgroup -S` | `groupadd -r` |
| `adduser -S` | `useradd -r` |

**`-r` オプション**: システムユーザー/グループとして作成

#### `USER spring:spring`

**書式**: `USER <ユーザー>:<グループ>`

フロントエンドと同じく、非rootユーザーで実行。

#### `ENTRYPOINT ["java", "-jar", "app.jar"]`

**`ENTRYPOINT` vs `CMD`**:

```dockerfile
# CMDのみ
CMD ["java", "-jar", "app.jar"]
# 実行: docker run my-image
# →  java -jar app.jar

# ENTRYPOINTのみ
ENTRYPOINT ["java", "-jar", "app.jar"]
# 実行: docker run my-image
# →  java -jar app.jar

# 両方
ENTRYPOINT ["java"]
CMD ["-jar", "app.jar"]
# 実行: docker run my-image -Xmx512m -jar app.jar
# →  java -Xmx512m -jar app.jar（JVMオプションを追加可能）
```

**この場合**: `ENTRYPOINT` で固定

---

## 5. イメージサイズの比較

### Frontend

| ステージ | イメージ | サイズ |
|---------|---------|--------|
| 開発用 | node:20-bookworm | 約350MB |
| 本番用 | node:20-bookworm-slim + standalone | 約180MB |

### Backend

| ステージ | イメージ | サイズ |
|---------|---------|--------|
| 開発用 | eclipse-temurin:21-jdk | 約450MB |
| 本番用 | eclipse-temurin:21-jre | 約220MB |

---

## 6. セキュリティのベストプラクティス

### 1. 非rootユーザーで実行

```dockerfile
RUN adduser --system nextjs
USER nextjs
```

### 2. 最小限のベースイメージ

```dockerfile
FROM node:20-bookworm-slim  # slimを使用
```

### 3. マルチステージビルド

```dockerfile
# ビルドツールを本番イメージに含めない
FROM gradle:8.7.0-jdk21 AS build
FROM eclipse-temurin:21-jre  # JREのみ
```

### 4. 不要なファイルの除外

```
# .dockerignore
node_modules
.git
*.log
```

---

## 7. まとめ

### 本番用Dockerfileの特徴

1. **マルチステージビルド**: サイズ削減
2. **slim/JRE**: 最小限のベースイメージ
3. **非rootユーザー**: セキュリティ強化
4. **standalone出力**: Next.jsの最適化

### 次の章へ

この章では本番用Dockerfileを学びました。次に、本番環境用のDocker Compose設定を見てから、Next.jsの設定ファイルを詳しく見ていきます。

---

## 8. ファイル: `docker-compose.prod.yml`

### ファイルの役割

**`docker-compose.prod.yml`** は、本番環境用のDocker Compose設定ファイルです。開発用（`docker-compose.yml`）と異なり、本番デプロイに特化した設定になっています。

### 対象ファイルの場所

```
プロジェクトルート/
└── docker-compose.prod.yml  ← このファイル
```

### 完全なファイル内容

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/${POSTGRES_DB}
      - SPRING_DATASOURCE_USERNAME=${SPRING_DATASOURCE_USERNAME}
      - SPRING_DATASOURCE_PASSWORD=${SPRING_DATASOURCE_PASSWORD}
    depends_on:
      - db
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  db-data:
```

---

### 開発用との主な違い

| 項目 | 開発用 (`docker-compose.yml`) | 本番用 (`docker-compose.prod.yml`) |
|------|------------------------------|-----------------------------------|
| Dockerfile | `Dockerfile.dev` | `Dockerfile.prod` |
| ボリュームマウント | ソースコードをマウント | なし（イメージに焼き込む） |
| ホットリロード | あり | なし |
| キャッシュボリューム | `gradle-cache`, `node_modules` | なし |
| イメージサイズ | 大きい | 最小化 |

---

### セクション別詳細解説

#### Backend サービス

```yaml
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/${POSTGRES_DB}
      - SPRING_DATASOURCE_USERNAME=${SPRING_DATASOURCE_USERNAME}
      - SPRING_DATASOURCE_PASSWORD=${SPRING_DATASOURCE_PASSWORD}
    depends_on:
      - db
    networks:
      - app-network
```

##### `dockerfile: Dockerfile.prod`

**開発用との違い**:
```yaml
# 開発用
dockerfile: Dockerfile.dev

# 本番用
dockerfile: Dockerfile.prod
```

**効果**:
- マルチステージビルドでイメージを最小化
- JREのみを使用（JDK不要）
- ソースコードをイメージに焼き込む

##### ボリュームがない

**開発用にはあったもの**:
```yaml
# 開発用のみ
volumes:
  - ./backend:/app         # ソースコードマウント
  - gradle-cache:/root/.gradle  # キャッシュ
```

**本番用では不要**:
- ソースコードはイメージに焼き込み済み
- ホットリロード不要
- キャッシュも不要（ビルドは1回のみ）

---

#### Frontend サービス

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    networks:
      - app-network
```

##### シンプルな設定

**開発用と比較**:

**開発用**:
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile.dev
  volumes:
    - ./frontend:/app        # ソースマウント
    - /app/node_modules      # 匿名ボリューム
  environment:
    - WATCHPACK_POLLING=true # ホットリロード
```

**本番用**:
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile.prod
  ports:
    - "3000:3000"
  networks:
    - app-network
```

**削除されたもの**:
1. `volumes`: ソースコードはイメージ内
2. `environment`: ホットリロード不要

---

#### Database サービス

```yaml
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - app-network
```

##### 開発用と同じ

**変更なし**: データベースサービスは開発・本番で同じ設定

**理由**:
- データの永続化が必要（`db-data` ボリューム）
- 設定は環境変数で管理（`.env` ファイル）

---

### 使用方法

#### ビルド

```bash
docker-compose -f docker-compose.prod.yml build
```

**`-f` オプション**:
- ファイル名を明示的に指定
- デフォルトの `docker-compose.yml` ではなく、`docker-compose.prod.yml` を使用

**実行内容**:
1. `Dockerfile.prod` でイメージをビルド
2. マルチステージビルドで最適化
3. 本番用イメージを作成

#### 起動

```bash
docker-compose -f docker-compose.prod.yml up -d
```

**`-d` オプション**: デタッチドモード（バックグラウンド実行）

#### 停止

```bash
docker-compose -f docker-compose.prod.yml down
```

#### ログ確認

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

---

### 本番デプロイのベストプラクティス

#### 1. 環境変数の管理

**`.env.prod` ファイル**:
```bash
POSTGRES_DB=production_db
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=強力なパスワード
SPRING_DATASOURCE_USERNAME=prod_user
SPRING_DATASOURCE_PASSWORD=強力なパスワード
```

**使用方法**:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

#### 2. シークレットの管理

**Docker Secrets（Swarm/Kubernetes）**:
```yaml
services:
  backend:
    secrets:
      - db_password
    environment:
      - SPRING_DATASOURCE_PASSWORD_FILE=/run/secrets/db_password

secrets:
  db_password:
    file: ./db_password.txt
```

#### 3. ヘルスチェック

**本番環境への追加推奨**:
```yaml
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

#### 4. リソース制限

**メモリ・CPU制限**:
```yaml
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

#### 5. ロギング設定

**ログローテーション**:
```yaml
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

### トラブルシューティング

#### イメージサイズが大きい

**確認**:
```bash
docker images | grep backend
docker images | grep frontend
```

**解決**:
- マルチステージビルドを確認
- `.dockerignore` に不要なファイルを追加

#### ビルドが失敗する

**エラー確認**:
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
```

**よくある原因**:
- `package-lock.json` の不整合
- 依存関係のバージョン問題

#### コンテナが起動しない

**ログ確認**:
```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

---

### まとめ

#### docker-compose.prod.yml の特徴

1. **本番用Dockerfileを使用**: 最小化・最適化
2. **ボリュームマウントなし**: イミュータブルなデプロイ
3. **シンプルな設定**: 開発用の機能を削除
4. **環境変数で設定管理**: `.env` ファイル

#### 次の章へ

本番用のDocker設定を学びました。次章では、Next.jsの設定ファイルを詳しく見ていきます。

[→ 第7章: Next.js設定](./07_nextjs_config.md)

---

[← 目次に戻る](./00_index.md)
