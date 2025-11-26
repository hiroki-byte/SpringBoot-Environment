# 第5章: 開発用 Dockerfile

[← 目次に戻る](./00_index.md) | [← 第4章: Docker基礎](./04_docker_basics.md) | [→ 第6章: 本番用Dockerfile](./06_docker_prod.md)

---

## 📋 この章で学ぶこと

- Dockerfileとは何か
- Dockerfile命令の詳細
- 開発用Dockerfileの設計思想
- レイヤーキャッシュの仕組み
- Frontend と Backend の Dockerfile 解説

---

## 1. Dockerfile とは？

### 定義

**Dockerfile** は、Dockerイメージをどのように構築するかを記述したテキストファイルです。「材料」と「手順」を書いたレシピのようなものです。

### 比喩で理解する

**料理のレシピ**に例えると：

```
レシピ（Dockerfile）
├─ 材料: 小麦粉、卵、砂糖... (FROM node:20-bookworm)
├─ 手順1: ボウルに材料を入れる (COPY package.json)
├─ 手順2: 混ぜる (RUN npm install)
├─ 手順3: 焼く (CMD npm run dev)
└─ → 完成品（Dockerイメージ）
```

### Dockerfileからイメージへの流れ

```
Dockerfile
    ↓ docker build
Dockerイメージ
    ↓ docker run
実行中のコンテナ
```

---

## 2. Dockerfileの基本構文

### 命令の形式

```dockerfile
命令 引数
```

**例**:
```dockerfile
FROM node:20-bookworm
RUN apt-get update
COPY package.json ./
```

### 主要な命令一覧

| 命令 | 役割 | 例 |
|------|------|-----|
| `FROM` | ベースイメージを指定 | `FROM node:20` |
| `RUN` | コマンドを実行 | `RUN npm install` |
| `COPY` | ファイルをコピー | `COPY . .` |
| `ADD` | ファイルを追加（圧縮解凍可） | `ADD archive.tar.gz /app` |
| `WORKDIR` | 作業ディレクトリを設定 | `WORKDIR /app` |
| `ENV` | 環境変数を設定 | `ENV NODE_ENV=production` |
| `EXPOSE` | ポートを公開 | `EXPOSE 3000` |
| `CMD` | デフォルトコマンド | `CMD ["npm", "start"]` |
| `ENTRYPOINT` | エントリーポイント | `ENTRYPOINT ["node"]` |

---

## 3. レイヤーとキャッシュ

### Dockerイメージの構造

Dockerイメージは「レイヤー」という層の積み重ねでできています。

```
┌────────────────────┐
│ CMD ["npm", "run", "dev"]  │ ← レイヤー5
├────────────────────┤
│ COPY . .           │ ← レイヤー4
├────────────────────┤
│ RUN npm install    │ ← レイヤー3
├────────────────────┤
│ COPY package.json  │ ← レイヤー2
├────────────────────┤
│ FROM node:20       │ ← レイヤー1（ベース）
└────────────────────┘
```

### レイヤーキャッシュの仕組み

**Dockerは、各レイヤーをキャッシュします。**

**1回目のビルド**:
```dockerfile
FROM node:20-bookworm        # ダウンロード（30秒）
RUN apt-get update           # 実行（10秒）
COPY package.json ./         # コピー（1秒）
RUN npm install              # 実行（5分）
COPY . .                     # コピー（2秒）
CMD ["npm", "run", "dev"]    # 記録（瞬時）
# 合計: 約5分40秒
```

**2回目のビルド（コード変更のみ）**:
```dockerfile
FROM node:20-bookworm        # キャッシュ使用 ✓
RUN apt-get update           # キャッシュ使用 ✓
COPY package.json ./         # キャッシュ使用 ✓（package.json は変更なし）
RUN npm install              # キャッシュ使用 ✓
COPY . .                     # 再実行（コードが変更されたため）
CMD ["npm", "run", "dev"]    # 再記録
# 合計: 約2秒
```

### キャッシュが無効になる条件

1. **命令が変更された**
   ```dockerfile
   RUN npm install  →  RUN npm ci  # 変更されたので再実行
   ```

2. **コピー元のファイルが変更された**
   ```dockerfile
   COPY package.json ./  # package.jsonが変更されたら再実行
   ```

3. **前のレイヤーが再実行された**
   ```dockerfile
   COPY package.json ./  # 変更
   RUN npm install       # 前が変わったので、これも再実行
   COPY . .              # これも再実行（連鎖）
   ```

### 最適な順序

**悪い例**:
```dockerfile
COPY . .           # すべてのファイルをコピー
RUN npm install    # コードを1行変えても、ここから再実行
```

**良い例**:
```dockerfile
COPY package.json ./  # 依存関係の定義だけ先にコピー
RUN npm install       # package.jsonが変わらない限りキャッシュ有効
COPY . .              # コード変更時はここだけ再実行
```

---

## 4. ファイル: `frontend/Dockerfile.dev`

### ファイルの役割

フロントエンド（Next.js）の開発環境用Dockerイメージを構築するファイルです。

### 完全なファイル内容

```dockerfile
FROM node:20-bookworm

RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Keep container running for DevContainer
CMD ["sleep", "infinity"]
```

---

### 行ごとの詳細解説

#### 1行目: `FROM node:20-bookworm`

**構文**: `FROM <イメージ名>:<タグ>`

**`FROM` とは？**:
Dockerfileの最初の命令で、ベースとなるイメージを指定します。

**`node:20-bookworm` の意味**:
- **`node`**: Node.js公式イメージ
- **`20`**: Node.jsのバージョン20（LTS版）
- **`bookworm`**: Debian 12のコードネーム

**Debianとは？**:
- Linuxディストリビューションの一つ
- 安定性が高い
- `glibc`（標準Cライブラリ）を使用

**なぜ `bookworm` を選んだ？**:

このプロジェクトでは、以前は `node:20-alpine` を使っていましたが、以下の問題がありました：

1. **VS Code Dev Containerとの互換性問題**
   - Alpine Linuxは `musl libc` を使用
   - VS Code Serverは `glibc` を前提としている
   - 互換性レイヤー（gcompat等）でも完全には解決できなかった

2. **npmパッケージのバイナリ問題**
   - `sharp`、`bcrypt`、`canvas` などのネイティブモジュールがAlpine用のバイナリを提供していない場合がある

**Debianのデメリット**: イメージサイズが大きい
- Alpine: 約50MB
- Debian: 約150MB

しかし、開発環境では容量より互換性を優先。

#### 2行目: 空行

**役割**: 可読性のための空行（省略可能）

#### 3行目: `RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*`

**`RUN` とは？**:
イメージのビルド時にコマンドを実行します。

**構文の分解**:

##### `apt-get update`

**役割**: Debianのパッケージリストを更新

**なぜ必要？**:
- ベースイメージのパッケージリストが古い可能性がある
- 最新のパッケージをインストールするため

##### `&&`

**役割**: コマンドを連結（前のコマンドが成功したら次を実行）

**なぜ `&&` で繋ぐ？**:

別々に書いた場合:
```dockerfile
RUN apt-get update
RUN apt-get install -y git curl
RUN rm -rf /var/lib/apt/lists/*
```
→ 3つのレイヤーが作られる（イメージサイズ増加）

`&&` で繋いだ場合:
```dockerfile
RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*
```
→ 1つのレイヤー（イメージサイズ削減）

##### `apt-get install -y git curl`

**役割**: `git` と `curl` をインストール

**`-y` オプション**:
- "Do you want to continue? [Y/n]" という確認を自動で `Y` にする
- インタラクティブな入力を避けるため

**なぜ `git` が必要？**:
- VS Code Dev Containerがgitを使用
- 一部のnpmパッケージがgitリポジトリから直接インストールされる場合がある

**なぜ `curl` が必要？**:
- ヘルスチェックやデバッグに使用
- 一部のインストールスクリプトが必要とする

##### `rm -rf /var/lib/apt/lists/*`

**役割**: パッケージリストのキャッシュを削除

**`/var/lib/apt/lists/` とは？**:
- `apt-get update` でダウンロードされたパッケージリストの保存場所

**なぜ削除？**:
- イメージサイズの削減
- インストール後は不要（コンテナ内で再度 `apt-get update` することは稀）

**効果**: 約20-30MBの削減

#### 4行目: 空行

#### 5行目: `WORKDIR /app`

**`WORKDIR` とは？**:
作業ディレクトリ（カレントディレクトリ）を設定します。

**効果**:
- 以降の `RUN`, `COPY`, `CMD` などはこのディレクトリで実行される
- ディレクトリが存在しない場合は自動作成される

**`WORKDIR /app` の意味**:
```
コンテナ内の /app ディレクトリに移動
（なければ作成）
```

**これがないとどうなる？**:
```dockerfile
# WORKDIRなし
COPY package.json ./  # どこにコピーされる？ → /(ルート)
RUN npm install       # どこで実行される？ → /(ルート)
```

**複数回設定可能**:
```dockerfile
WORKDIR /app
WORKDIR subdir  # → /app/subdir
WORKDIR /other  # → /other（絶対パス）
```

#### 6行目: 空行

#### 7行目: `COPY package*.json ./`

**`COPY` とは？**:
ホストのファイルをコンテナ内にコピーします。

**構文**: `COPY <ホストのパス> <コンテナのパス>`

**`package*.json` の意味**:
- `*` はワイルドカード（任意の文字列）
- `package.json` と `package-lock.json` の両方にマッチ

**`./` の意味**:
- カレントディレクトリ（`WORKDIR` で設定した `/app`）

**結果**:
```
ホストの ./frontend/package.json
    → コンテナの /app/package.json

ホストの ./frontend/package-lock.json
    → コンテナの /app/package-lock.json
```

**なぜ `COPY . .` より先にこれを実行？**:

**レイヤーキャッシュの最適化**:

```dockerfile
# 悪い例
COPY . .           # すべてのファイルをコピー
RUN npm install    # コードを1行変えても再実行

# 良い例
COPY package*.json ./  # 依存関係だけ先にコピー
RUN npm install        # package.jsonが変わらない限りキャッシュ有効
COPY . .               # コード変更時はここだけ再実行
```

**シナリオ**:
1. `src/app/page.tsx` を編集（package.jsonは変更なし）
2. 再ビルド
3. `COPY package*.json ./` → キャッシュ使用
4. `RUN npm install` → キャッシュ使用（5分の処理をスキップ！）
5. `COPY . .` → 再実行（数秒）

#### 8行目: 空行

#### 9行目: `RUN npm install`

**役割**: `package.json` に記載された依存パッケージをインストール

**実行内容**:
1. `package-lock.json` を読む
2. 指定されたバージョンのパッケージをダウンロード
3. `node_modules` フォルダに保存

**`npm install` vs `npm ci`**:

| コマンド | 特徴 | 用途 |
|---------|------|------|
| `npm install` | `package-lock.json` がなければ生成 | 開発環境 |
| `npm ci` | `package-lock.json` 必須、厳密 | CI/CD、本番 |

開発環境では `npm install` を使用（柔軟性のため）。

#### 10行目: 空行

#### 11行目: `COPY . .`

**役割**: ホストのすべてのファイルをコンテナにコピー

**`COPY . .` の意味**:
- 1つ目の `.`: ホストのカレントディレクトリ（`docker-compose.yml` の `context` で指定した `./frontend`）
- 2つ目の `.`: コンテナのカレントディレクトリ（`WORKDIR` で指定した `/app`）

**結果**:
```
ホストの ./frontend/src → コンテナの /app/src
ホストの ./frontend/public → コンテナの /app/public
ホストの ./frontend/next.config.mjs → コンテナの /app/next.config.mjs
...
```

**.dockerignoreファイル**:

コピーから除外したいファイルは `.dockerignore` に記述:
```
node_modules
.next
.git
*.log
```

**なぜ `node_modules` を除外？**:
- ホストの `node_modules` はOS依存のバイナリを含む可能性
- コンテナ内で `npm install` して作り直す方が安全

#### 12行目: 空行

#### 13行目: `EXPOSE 3000`

**`EXPOSE` とは？**:
コンテナが使用するポートを「宣言」します。

**重要**: これだけでは外部からアクセスできません

**役割**:
1. **ドキュメント**: 「このコンテナは3000番ポートを使います」と明示
2. **`docker-compose.yml` との連携**: `ports` 設定のヒントになる

**実際にポートを公開するには**:
```yaml
# docker-compose.yml
services:
  frontend:
    ports:
      - "3000:3000"  # これが必要
```

**複数ポートの例**:
```dockerfile
EXPOSE 3000
EXPOSE 9229  # Node.jsデバッグポート
```

#### 14行目: 空行

#### 15行目: `# Keep container running for DevContainer`

**役割**: コメント行（説明）

#### 16行目: `CMD ["sleep", "infinity"]`

**`CMD` とは？**:
コンテナ起動時に実行するデフォルトコマンドを指定します。

**`sleep infinity` とは？**:
- `sleep`: 指定した時間待機するコマンド
- `infinity`: 無限に待機（永遠に終わらない）

**なぜ `sleep infinity`？**:

**DevContainer統合のため**

このプロジェクトでは、統合DevContainer環境を使用します：

**問題シナリオ（以前の設定）**:
```dockerfile
CMD ["npm", "run", "dev"]
```

DevContainerは独自の `entrypoint` を設定するため：
```
1. コンテナ起動
2. DevContainerが entrypoint をオーバーライド
3. 元の CMD と競合
4. コンテナが停止 ❌
```

**解決策**:
```dockerfile
CMD ["sleep", "infinity"]
```

**動作**:
```
1. コンテナ起動
2. sleep infinity が実行される → コンテナは起動し続ける ✅
3. DevContainerが接続
4. 手動でサービスを起動
```

**手動起動の方法（DevContainer内）**:
```bash
cd /workspace/frontend
npm run dev
```

**2つの書式**:

1. **exec形式（推奨・使用中）**: `CMD ["executable", "param1", "param2"]`
2. **shell形式**: `CMD executable param1 param2`

**なぜexec形式が推奨？**:

**shell形式の場合**:
```dockerfile
CMD sleep infinity
```
→ `/bin/sh -c "sleep infinity"` として実行される

**問題点**:
- シグナル（Ctrl+C等）がsleepプロセスに直接届かない
- シェルが間に入るため、停止が遅い

**exec形式の場合**:
```dockerfile
CMD ["sleep", "infinity"]
```
→ sleepが直接実行される

**利点**:
- シグナルが正しく伝わる
- 起動が速い
- よりクリーン

**なぜ `sleep infinity` は負荷をかけない？**:

`sleep` コマンドは：
- CPU使用率: ほぼ0%
- メモリ使用量: 約1MB
- ただ待機するだけ（何も処理しない）

業界標準のベストプラクティスです（Kubernetes、VS Code公式ドキュメントでも推奨）。

**代替案**:
```dockerfile
CMD ["tail", "-f", "/dev/null"]  # こちらも可能だが冗長
```

**`CMD` と `ENTRYPOINT` の違い**:

```dockerfile
# CMD: コンテナ起動時のデフォルトコマンド（上書き可能）
CMD ["sleep", "infinity"]

# 実行
docker run my-image          → sleep infinity
docker run my-image bash     → bash（上書きされた）

# ENTRYPOINT: 必ず実行されるコマンド
ENTRYPOINT ["npm", "run"]
CMD ["dev"]

# 実行
docker run my-image          → npm run dev
docker run my-image test     → npm run test（CMDだけ上書き）
```

**開発環境での実際の使用**:

1. **docker-compose up で起動**
   - コンテナが `sleep infinity` で待機状態に

2. **DevContainerに接続**
   - VS Codeがコンテナ内に入る

3. **ターミナルでサービスを手動起動**
   ```bash
   npm run dev
   ```

4. **開発作業**
   - コード編集 → ホットリロード

5. **終了**
   - `Ctrl+C` でサービス停止
   - コンテナは `sleep infinity` で待機し続ける

---

## 5. ファイル: `backend/Dockerfile.dev`

### ファイルの役割

バックエンド（Spring Boot）の開発環境用Dockerイメージを構築するファイルです。

### 完全なファイル内容

```dockerfile
FROM eclipse-temurin:21-jdk

RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Keep container running for DevContainer
CMD ["sleep", "infinity"]
```

---

### 行ごとの詳細解説

#### 1行目: `FROM eclipse-temurin:21-jdk`

**`eclipse-temurin` とは？**:
- Eclipse財団が提供するOpenJDKのディストリビューション
- 旧名: AdoptOpenJDK
- 無料で商用利用可能

**`21-jdk` の意味**:
- `21`: Java 21
- `jdk`: Java Development Kit（開発用、コンパイラ込み）

**JDK vs JRE**:

| 種類 | 内容 | 用途 | サイズ |
|------|------|------|--------|
| JDK | JRE + コンパイラ + デバッグツール | 開発 | 大きい |
| JRE | Java実行環境のみ | 本番 | 小さい |

開発環境では、Gradleがコンパイルを行うため、JDKが必要。

**ベースOS**:
- `eclipse-temurin:21-jdk` のデフォルトはUbuntu（Debianベース）
- Alpineバージョン（`eclipse-temurin:21-jdk-alpine`）もある

#### 2行目: 空行

#### 3行目: `RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*`

frontendと同じ理由で、`git` と `curl` をインストール。

**Javaプロジェクトで git が必要な理由**:
- 一部のGradleプラグインがgitを使用
- バージョン情報の取得（ビルド情報に埋め込む）
- VS Code Dev Container

#### 4行目: 空行

#### 5行目: `WORKDIR /app`

作業ディレクトリを `/app` に設定。

#### 6行目: 空行

#### 7行目: `# Keep container running for DevContainer`

**役割**: コメント行（次の行の説明）

#### 8行目: `CMD ["sleep", "infinity"]`

**役割**: コンテナを起動し続けるためのコマンド

**frontend と同じ理由**:
- DevContainer統合のため
- `sleep infinity` でコンテナを待機状態に
- DevContainer接続後、手動でサービスを起動

**手動起動の方法（DevContainer内）**:
```bash
cd /app
./gradlew bootRun
```

**`./gradlew` とは？**:
- Gradle Wrapper（グレイドル ラッパー）
- Gradleをプロジェクトと一緒に配布する仕組み

**なぜ `COPY` がない？**:

`docker-compose.yml` でボリュームマウントしているため:
```yaml
volumes:
  - ./backend:/app  # ホストのコードをマウント
  - .:/workspace:cached  # DevContainer用
```

ビルド時ではなく、起動時にコードが利用可能になる。

**開発環境の特徴**:
- コードをイメージに焼き込まない
- ボリュームマウントで常に最新のコードを使う
- 柔軟性が高い
- DevContainer接続と手動起動を前提

---

## 6. 開発用 vs 本番用の違い

### 開発用Dockerfileの特徴

1. **ベースイメージが大きい**
   - JDK（開発用）
   - Debian（互換性優先）

2. **デバッグツールを含む**
   - git, curl

3. **ホットリロードを前提**
   - `npm run dev`
   - `./gradlew bootRun`

4. **ボリュームマウントを前提**
   - コードをイメージに含めない

### 本番用Dockerfileの特徴

1. **ベースイメージが小さい**
   - JRE（実行用）
   - slim版

2. **最小限の構成**
   - 不要なツールは含めない

3. **最適化されたビルド**
   - マルチステージビルド
   - 依存関係のみをコピー

4. **イミュータブル（不変）**
   - コードをイメージに焼き込む

---

## 7. まとめ

### Dockerfile開発用の設計思想

- **互換性優先**: Debian を使用
- **開発効率**: ホットリロード
- **レイヤーキャッシュ**: package.jsonを先にコピー
- **デバッグのしやすさ**: git, curl を含める

### 次の章へ

この章では開発用Dockerfileを学びました。次章では、本番環境用のDockerfileを詳しく見ていきます。

[→ 第6章: 本番用Dockerfile](./06_docker_prod.md)

---

[← 目次に戻る](./00_index.md)
