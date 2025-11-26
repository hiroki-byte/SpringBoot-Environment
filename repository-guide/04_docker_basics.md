# 第4章: Docker基礎と docker-compose

[← 目次に戻る](./00_index.md) | [← 第3章: PMD](./03_java_pmd.md) | [→ 第5章: 開発用Dockerfile](./05_docker_dev.md)

---

## 📋 この章で学ぶこと

- Dockerとは何か、なぜ必要なのか
- コンテナと仮想マシンの違い
- Docker Composeの役割
- `docker-compose.yml` の完全解説
- サービス、ネットワーク、ボリュームの詳細
- 環境変数の渡し方
- ホットリロードの仕組み

---

## 1. Docker とは？

### 定義

**Docker** は、アプリケーションとその実行環境（OS、ライブラリ、設定ファイル等）を「コンテナ」という軽量な仮想環境にパッケージ化するプラットフォームです。

### 比喩で理解する

**Dockerは「輸送用コンテナ」に似ています**:

- **物理的なコンテナ**: 中身（商品）が何であれ、標準サイズの箱に入れれば、船・トラック・列車で運べる
- **Dockerコンテナ**: アプリが何であれ、Dockerコンテナに入れれば、どのPC・サーバーでも動く

### なぜDockerが必要なのか？

#### 問題1: 「俺の環境では動くのに…」

**シナリオ**:
```
開発者A（Windows）: 「アプリ完成しました！」
開発者B（Mac）: 「動かないんですけど…」
本番サーバー（Linux）: 「エラーで起動しません」
```

**原因**:
- OSの違い
- インストールされているライブラリのバージョンの違い
- 環境変数の違い

**Dockerでの解決**:
```
docker-compose up
↓
すべての環境で同じコンテナが起動
↓
どこでも同じように動く
```

#### 問題2: セットアップの煩雑さ

**Dockerなしの場合**:
```bash
# 新メンバーがプロジェクトに参加
1. Node.js 20のインストール
2. Java 21のインストール
3. PostgreSQL 15のインストール
4. 環境変数の設定
5. データベースの初期化
6. ...（数時間かかる）
```

**Dockerありの場合**:
```bash
docker-compose up
# これだけ（数分で完了）
```

---

## 2. コンテナとは？

### 定義

**コンテナ** は、アプリケーションとその依存関係を隔離された環境で動かすための軽量な仮想化技術です。

### 仮想マシン（VM）との違い

#### 仮想マシン（VM）

```
┌─────────────────────────┐
│  ホストOS (Windows)      │
│  ┌───────────────────┐  │
│  │ ハイパーバイザー   │  │
│  │ ┌───────────────┐ │  │
│  │ │ ゲストOS(Linux)│ │  │ ← OSまるごと仮想化
│  │ │ ┌───────────┐ │ │  │
│  │ │ │   アプリ   │ │ │  │
│  │ │ └───────────┘ │ │  │
│  │ └───────────────┘ │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

#### Docker コンテナ

```
┌─────────────────────────┐
│  ホストOS (Windows)      │
│  ┌───────────────────┐  │
│  │ Docker Engine     │  │
│  │ ┌─────┐ ┌─────┐  │  │
│  │ │アプリ│ │アプリ│  │  │ ← アプリだけ隔離
│  │ │ライブ│ │ライブ│  │  │
│  │ │ラリ │ │ラリ │  │  │
│  │ └─────┘ └─────┘  │  │
│  └───────────────────┘  │
│  （ホストOSのカーネルを共有）│
└─────────────────────────┘
```

#### 比較表

| 項目 | 仮想マシン（VM） | Docker コンテナ |
|------|-----------------|----------------|
| 起動時間 | 数分 | 数秒 |
| サイズ | GB単位 | MB単位 |
| リソース消費 | 大きい | 小さい |
| 隔離レベル | 完全（OSレベル） | プロセスレベル |
| 移植性 | 低い | 高い |

---

## 3. Dockerの主要概念

### Dockerイメージ

**定義**: コンテナを作るための「設計図」または「テンプレート」です。

**比喩**: クラス（設計図）とインスタンス（実体）の関係
- Dockerイメージ = クラス定義
- コンテナ = インスタンス

**例**:
```
node:20-bookworm イメージ
    ↓ docker run
コンテナ1, コンテナ2, コンテナ3...（複数作成可能）
```

### Dockerfile

**定義**: Dockerイメージの作り方を記述したファイルです。

**例**:
```dockerfile
FROM node:20-bookworm
RUN apt-get update
COPY package.json .
RUN npm install
...
```

### コンテナ

**定義**: Dockerイメージから起動した、実行中のプロセスです。

**特徴**:
- 他のコンテナから隔離されている
- 削除すると、中のデータも消える（ボリュームを使わない場合）

---

## 4. Docker Compose とは？

### 定義

**Docker Compose** は、複数のDockerコンテナを定義・管理するツールです。1つの設定ファイル（`docker-compose.yml`）で、複数のコンテナを一括操作できます。

### なぜ必要？

**シナリオ**: Webアプリケーション
- フロントエンド（Node.js）
- バックエンド（Java）
- データベース（PostgreSQL）

**Docker Composeなし**:
```bash
docker run -d --name db postgres:15
docker run -d --name backend --link db java-app
docker run -d --name frontend --link backend node-app
# 起動順序やネットワーク設定が煩雑
```

**Docker Composeあり**:
```bash
docker-compose up
# すべて自動で起動、ネットワークも自動構成
```

---

## 5. ファイル: `docker-compose.yml`

### ファイルの役割

**`docker-compose.yml`** は、Docker Composeの設定ファイルです。複数のコンテナ（サービス）、ネットワーク、ボリュームを定義します。

### 対象ファイルの場所

```
プロジェクトルート/
└── docker-compose.yml  ← このファイル
```

### YAMLとは？

**YAML**: "YAML Ain't Markup Language" の再帰的頭字語。データを人間が読みやすい形式で記述する言語です。

**基本ルール**:
1. **インデント（字下げ）で階層を表現**（スペース2つまたは4つ、タブは使用不可）
2. **キー: 値** の形式
3. **リスト**: `-` で始まる

**例**:
```yaml
person:        # オブジェクト
  name: Alice  # 文字列
  age: 30      # 数値
  skills:      # リスト
    - Java
    - Python
```

---

## 6. ファイルの完全解説

### 全体構造

```yaml
services:     # サービス（コンテナ）の定義
  backend:    # バックエンドサービス
    ...
  frontend:   # フロントエンドサービス
    ...
  db:         # データベースサービス
    ...

networks:     # ネットワークの定義
  app-network:
    ...

volumes:      # ボリューム（永続化ストレージ）の定義
  db-data:
  gradle-cache:
```

---

### セクション1: サービス定義（Backend）

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/${POSTGRES_DB}
      - SPRING_DATASOURCE_USERNAME=${SPRING_DATASOURCE_USERNAME}
      - SPRING_DATASOURCE_PASSWORD=${SPRING_DATASOURCE_PASSWORD}
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - gradle-cache:/root/.gradle
      - .:/workspace:cached
    networks:
      - app-network
```

#### `services:`

**役割**: 起動するコンテナのリストを定義します。

**サービスとは？**: Docker Composeにおける「コンテナの設計図」です。

#### `backend:`

**役割**: サービス名を定義します。

**重要**: この名前は、ネットワーク上のホスト名としても使われます。

**例**:
```java
// backendコンテナから、dbコンテナに接続
String url = "jdbc:postgresql://db:5432/mydb";
//                              ^^
//                              サービス名がホスト名になる
```

#### `build:`

**役割**: Dockerイメージをビルド（構築）する設定です。

**`build` vs `image`**:
- `build`: Dockerfileからイメージをビルドする
- `image`: 既存のイメージ（Docker Hubなど）を使う

##### `context: ./backend`

**定義**: ビルドコンテキスト（ビルドの作業ディレクトリ）を指定します。

**ビルドコンテキストとは？**:
- Dockerfileの `COPY` や `ADD` コマンドが参照できるファイルの範囲
- この例では、`./backend` フォルダ以下のファイルがコピー可能

**なぜ必要？**:
```dockerfile
# Dockerfile内で
COPY package.json ./
# ↑ これは、contextで指定したディレクトリからの相対パス
```

##### `dockerfile: Dockerfile.dev`

**定義**: 使用するDockerfileの名前を指定します。

**デフォルト**: `Dockerfile`（名前を省略した場合）

**なぜ `.dev`？**:
- 開発用と本番用で異なる設定を使うため
- 開発用: ホットリロード、デバッグツール
- 本番用: 最小限の構成、セキュリティ強化

#### `ports:`

**役割**: ポートフォワーディング（ポートマッピング）を設定します。

##### `- "8080:8080"`

**書式**: `"ホストのポート:コンテナのポート"`

**意味**:
```
ホスト（自分のPC）の8080番ポート
    ↓ 転送
コンテナの8080番ポート
```

**効果**:
```
ブラウザで http://localhost:8080 にアクセス
    ↓
コンテナ内のSpring Bootアプリ（8080番）に届く
```

**複数ポートの例**:
```yaml
ports:
  - "8080:8080"   # HTTP
  - "8443:8443"   # HTTPS
```

**ポート番号を変える例**:
```yaml
ports:
  - "9000:8080"  # ホストの9000番 → コンテナの8080番
```
→ `http://localhost:9000` でアクセス可能

#### `environment:`

**役割**: コンテナ内で使える環境変数を設定します。

**環境変数とは？**:
- OSやアプリケーションに設定を渡すための仕組み
- コードを変更せずに、動作を変更できる

##### `- SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/${POSTGRES_DB}`

**構文**:
```yaml
- 変数名=値
```

**`SPRING_DATASOURCE_URL` の意味**:
- Spring Bootアプリケーションがデータベースに接続するためのURL

**URLの構造**:
```
jdbc:postgresql://db:5432/${POSTGRES_DB}
^^^^             ^^ ^^^^  ^^^^^^^^^^^^^^
│                │  │     │
│                │  │     データベース名（変数）
│                │  ポート番号
│                ホスト名（dbサービス）
プロトコル
```

**`${POSTGRES_DB}` とは？**:
- 環境変数の参照
- `.env` ファイルまたはシステムの環境変数から値を読み込む

**`.env` ファイルの例**:
```
POSTGRES_DB=mydb
POSTGRES_USER=admin
POSTGRES_PASSWORD=secret123
```

**展開後**:
```
jdbc:postgresql://db:5432/mydb
```

##### `- SPRING_DATASOURCE_USERNAME=${SPRING_DATASOURCE_USERNAME}`

**パターン**: 同じ名前の環境変数を、コンテナ内でも使う

**意味**:
```
ホストの環境変数 SPRING_DATASOURCE_USERNAME
    ↓ 渡す
コンテナ内の環境変数 SPRING_DATASOURCE_USERNAME
```

#### `depends_on:`

**役割**: サービスの起動順序を制御します。

##### `- db`

**意味**: `backend` を起動する前に、`db` を先に起動する

**起動の流れ**:
```
1. db サービスを起動
2. db が起動完了（コンテナが立ち上がった）
3. backend サービスを起動
```

**重要な注意点**:
- `depends_on` は「起動順序」を制御するだけ
- 「dbが完全に準備完了（接続可能な状態）」まで待つわけではない

**問題のシナリオ**:
```
1. dbコンテナ起動
2. PostgreSQLの初期化中...（10秒かかる）
3. backendコンテナ起動
4. backend「dbに接続できない！」 ← まだPostgreSQLが準備中
```

**解決策**:
- アプリ側でリトライロジックを実装
- または、wait-for-itスクリプトを使う

#### `volumes:`

**役割**: ホストとコンテナの間でファイルを共有します。

##### `- ./backend:/app`

**書式**: `ホストのパス:コンテナのパス`

**意味**:
```
ホストの ./backend フォルダ
    ↕ 双方向同期
コンテナの /app フォルダ
```

**効果**:
1. **ホット側でファイルを編集**
   ```
   backend/src/main/java/Main.java を編集
   ```

2. **即座にコンテナ内に反映**
   ```
   コンテナ内の /app/src/main/java/Main.java が更新される
   ```

3. **Gradleの `bootRun` が変更を検知**
   ```
   アプリが自動的に再起動（ホットリロード）
   ```

**これがホットリロードの仕組みです！**

##### `- gradle-cache:/root/.gradle`

**書式**: `ボリューム名:コンテナのパス`

**意味**:
```
gradle-cache という名前付きボリューム
    ↕ マウント
コンテナの /root/.gradle フォルダ
```

**`/root/.gradle` とは？**:
- Gradleがダウンロードしたライブラリを保存するキャッシュディレクトリ

**なぜ名前付きボリューム？**:
1. **永続化**: コンテナを削除してもデータが残る
2. **高速化**: 次回起動時、ライブラリを再ダウンロードしなくて済む

**シナリオ**:
```
1回目: docker-compose up
  → ライブラリをダウンロード（5分）
  → gradle-cache に保存

コンテナ削除: docker-compose down

2回目: docker-compose up
  → キャッシュから読み込み（数秒）
```

##### `- .:/workspace:cached`

**書式**: `ホストのパス:コンテナのパス:オプション`

**意味**:
```
ホストのプロジェクトルート (.)
    ↕ 双方向同期
コンテナの /workspace フォルダ
    ※ :cached オプション付き
```

**なぜ必要？: DevContainer統合**

このプロジェクトでは、**統合DevContainer環境**を使用しています。

**統合DevContainerとは？**:
- 1つのVS Codeウィンドウでフロントエンド・バックエンド・データベースすべてを開発
- VS Codeがコンテナに接続して、コンテナ内で直接開発

**workspaceマウントの役割**:
```
DevContainerの設定(.devcontainer/devcontainer.json):
{
  "workspaceFolder": "/workspace"  ← VS Codeがこのパスを開く
}

VS Codeがコンテナに接続
    ↓
/workspace でプロジェクト全体にアクセス
    ↓
backend/ も frontend/ も見える
```

**`:cached` オプションとは？**:
- Dockerのパフォーマンス最適化
- ホスト → コンテナの同期を優先（読み込み重視）
- Windows/macOSのDocker環境で特に効果的

**なぜ `/app` と `/workspace` の両方？**:
```
/app          ← サービス固有のコード（backend/のみ）
/workspace    ← プロジェクト全体（DevContainer用）
```

これにより、各サービスのコンテナは専用のコードだけを `/app` で使い、DevContainerはプロジェクト全体を `/workspace` で管理できます。

#### `command:`（削除済み）

**以前の設定**:
```yaml
command: ./gradlew bootRun
```

**現在の設定**: なし（削除）

**なぜ削除？**:

**DevContainerとの競合**:
- DevContainerは独自の `entrypoint` を設定
- `command` があると競合してコンテナが停止する
- DevContainer接続後は手動でサービスを起動する方式に変更

**手動起動の利点**:
1. **柔軟性**: 必要なサービスだけ起動できる
2. **デバッグのしやすさ**: ログが分離される
3. **メモリ節約**: 使わないサービスは起動しない

**起動方法（DevContainer内）**:
```bash
# Backend起動
cd /app
./gradlew bootRun

# Frontend起動（別ターミナル）
cd /workspace/frontend
npm run dev
```

**通常のdocker-compose使用時**:
```bash
# コンテナは起動するが、サービスは自動起動しない
docker-compose up

# 手動起動が必要
docker-compose exec backend ./gradlew bootRun
docker-compose exec frontend npm run dev
```

#### `networks:`

**役割**: このサービスが参加するネットワークを指定します。

##### `- app-network`

**意味**: `app-network` という名前のネットワークに参加

**ネットワークの役割**:
- 同じネットワーク内のコンテナは、サービス名で通信できる
- 異なるネットワークのコンテナは、通信できない（隔離）

**通信の例**:
```java
// backendコンテナから
String url = "http://frontend:3000/api";  // ← サービス名で通信
```

---

### セクション2: サービス定義（Frontend）

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - WATCHPACK_POLLING=true
    networks:
      - app-network
```

**basicな項目はbackendと同じなので、特殊な部分のみ解説します。**

#### `- /app/node_modules`（匿名ボリューム）

**これは何？**: 匿名ボリューム（名前なしボリューム）

**書式**: `コンテナのパスのみ`（ホスト側のパスがない）

**意味**:
```
コンテナの /app/node_modules
    ↓
Docker管理の領域に保存（ホストとは共有しない）
```

**なぜこれが必要？**

**問題のシナリオ**:
```yaml
volumes:
  - ./frontend:/app  # ホストの frontend を /app にマウント
```

この場合:
```
ホストの ./frontend/node_modules（Windows/Mac用のバイナリ）
    ↓ マウント
コンテナの /app/node_modules
    ↓ 実行
エラー！ Linuxで動かないバイナリ
```

**解決策**:
```yaml
volumes:
  - ./frontend:/app
  - /app/node_modules  # ← これでコンテナ内のnode_modulesを「保護」
```

**動作**:
```
./frontend/* は全部マウント
    ただし、
/app/node_modules だけは除外（コンテナ独自のものを使う）
```

**ボリュームの優先順位**:
- より具体的なパスが優先される
- `/app/node_modules` > `/app`

#### `- WATCHPACK_POLLING=true`

**これは何？**: Next.jsの設定用環境変数

**役割**: ファイル変更の検知方法を「ポーリング」モードに変更

**ポーリングとは？**:
- 定期的にファイルを監視（例: 0.5秒ごとにチェック）

**なぜ必要？**:

**理想**: ファイルシステムの通知機能（inotify）を使う
```
ファイルを編集
    ↓ OSが通知
即座に反映
```

**現実**: Windows/macOSのDockerでは、inotifyが正しく動作しない

**ポーリングで解決**:
```
┌→ ファイルをチェック（変更あり？）
│      ↓ なし
│  0.5秒待つ
│      ↓
└──────┘
（変更があれば再ビルド）
```

**デメリット**: CPU使用率がわずかに上がる

---

### セクション3: サービス定義（Database）

```yaml
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - app-network
```

#### `image: postgres:15-alpine`

**`image` とは？**: 既存のDockerイメージを使う（ビルドしない）

**`postgres:15-alpine` の意味**:
- `postgres`: PostgreSQLの公式イメージ
- `15`: PostgreSQLのバージョン15
- `alpine`: Alpine Linuxベース（軽量版）

**どこから取得？**:
- Docker Hub（https://hub.docker.com/_/postgres）
- 初回実行時に自動ダウンロード

#### PostgreSQLの環境変数

##### `POSTGRES_DB`

**役割**: 初期化時に作成するデータベース名

**例**: `POSTGRES_DB=myapp` なら、`myapp` という名前のDBが作られる

##### `POSTGRES_USER`

**役割**: スーパーユーザーの名前

**デフォルト**: `postgres`

##### `POSTGRES_PASSWORD`

**役割**: スーパーユーザーのパスワード

**重要**: これを設定しないと、PostgreSQLは起動しません

#### `- db-data:/var/lib/postgresql/data`

**`/var/lib/postgresql/data` とは？**:
- PostgreSQLがデータベースファイルを保存するディレクトリ

**なぜボリュームが必要？**:

**ボリュームなしの場合**:
```
docker-compose up
→ データを保存
docker-compose down（コンテナ削除）
→ データが消える！
```

**ボリュームありの場合**:
```
docker-compose up
→ データを db-data ボリュームに保存
docker-compose down
→ コンテナは削除されるが、ボリュームは残る
docker-compose up（再起動）
→ データが復元される
```

---

### セクション4: ネットワーク定義

```yaml
networks:
  app-network:
    driver: bridge
```

#### `networks:`（ルートレベル）

**役割**: 使用するネットワークを定義します。

#### `app-network:`

**役割**: `app-network` という名前のネットワークを作成

#### `driver: bridge`

**ドライバーとは？**: ネットワークの種類

**`bridge` ドライバー**:
- 同一ホスト内のコンテナ同士を接続する
- 最も一般的なネットワークタイプ

**他のドライバー**:
- `host`: ホストのネットワークをそのまま使う
- `overlay`: 複数ホスト間でコンテナを接続（Docker Swarm）
- `none`: ネットワークなし

**bridgeネットワークの動作**:
```
┌─────────────────────────┐
│  app-network (bridge)   │
│  ┌─────────────────┐    │
│  │  frontend:3000  │    │
│  └─────────────────┘    │
│  ┌─────────────────┐    │
│  │  backend:8080   │◄───┼── サービス名で通信可能
│  └─────────────────┘    │
│  ┌─────────────────┐    │
│  │  db:5432        │    │
│  └─────────────────    │
└─────────────────────────┘
```

---

### セクション5: ボリューム定義

```yaml
volumes:
  db-data:
  gradle-cache:
```

#### `volumes:`（ルートレベル）

**役割**: 名前付きボリュームを宣言します。

#### `db-data:` と `gradle-cache:`

**意味**: これらのボリュームを作成（詳細設定なし）

**詳細設定がない場合**:
- Dockerがデフォルトの場所に作成
- Linux: `/var/lib/docker/volumes/`
- Windows/Mac: Docker Desktopの仮想環境内

**ボリュームの確認方法**:
```bash
docker volume ls
# 出力例:
# DRIVER    VOLUME NAME
# local     springboot-environment_db-data
# local     springboot-environment_gradle-cache
```

**ボリュームの削除**:
```bash
docker-compose down -v  # -v オプションでボリュームも削除
```

---

## 7. よくあるコマンド

### 起動・停止

```bash
# すべてのサービスを起動（バックグラウンド）
docker-compose up -d

# ログを表示しながら起動
docker-compose up

# 特定のサービスだけ起動
docker-compose up backend

# 停止（コンテナは削除される）
docker-compose down

# 停止＋ボリューム削除
docker-compose down -v

# 停止＋イメージ削除
docker-compose down --rmi all
```

### ログ確認

```bash
# すべてのログ
docker-compose logs

# 特定のサービスのログ
docker-compose logs backend

# リアルタイムでログを追跡
docker-compose logs -f

# 最新100行
docker-compose logs --tail=100
```

### ビルド

```bash
# イメージを再ビルド
docker-compose build

# キャッシュを使わずビルド
docker-compose build --no-cache

# ビルドして起動
docker-compose up --build
```

### コンテナ内でコマンド実行

```bash
# コンテナ内でコマンドを実行
docker-compose exec backend bash

# 一度だけコマンドを実行
docker-compose run --rm backend ls -la
```

---

## 8. トラブルシューティング

### ポートが既に使われている

**エラー**:
```
Error: bind: address already in use
```

**原因**: ホストの8080番ポートが既に使われている

**解決策1**: 使っているプロセスを停止
```bash
# Windowsの場合
netstat -ano | findstr :8080
taskkill /PID <プロセスID> /F
```

**解決策2**: ポート番号を変更
```yaml
ports:
  - "8081:8080"  # ホスト側を8081に変更
```

### ボリュームの権限エラー

**エラー**: Permission denied

**解決策**:
```yaml
# Dockerfileでユーザーを指定
USER node
```

### ネットワークエラー

**エラー**: Could not connect to database

**確認事項**:
1. dbサービスが起動しているか
2. depends_onが設定されているか
3. ネットワーク名が一致しているか

---

## 9. まとめ

### Docker Composeの利点

1. **環境の統一**: 開発・本番で同じ環境
2. **簡単なセットアップ**: `docker-compose up` 一発
3. **隔離**: 各サービスが独立
4. **スケーラビリティ**: サービスを簡単に追加

### 次の章へ

この章では、docker-composeの設定を学びました。次章では、各サービスのDockerfileを詳しく見ていきます。

[→ 第5章: 開発用Dockerfile](./05_docker_dev.md)

---

[← 目次に戻る](./00_index.md)
