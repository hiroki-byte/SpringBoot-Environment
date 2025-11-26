# Spring Boot + Next.js 開発環境

このプロジェクトは、Java (Spring Boot) バックエンドと Next.js フロントエンド、および PostgreSQL データベースを含む完全な開発環境です。Docker を使用して簡単に立ち上げることができます。

## 前提条件

- Docker Desktop がインストールされ、起動していること。

## 起動方法

### 開発環境 (Development)

開発時は、ホットリロードが有効な構成で起動します。

```bash
docker-compose up --build
```
※ package.jsonの修正をした場合は、以下のコマンドを実行してください。

```bash
docker-compose up --build -V
```

または、VS Code の **Dev Containers** 機能を使用することで、コンテナ内で直接開発を行うことができます。
- **Frontend**: `frontend` フォルダを開き、"Reopen in Container" を実行。
- **Backend**: `backend` フォルダを開き、"Reopen in Container" を実行。

### 本番環境 (Production)

本番デプロイ時は、最適化されたビルドを使用する以下のコマンドを実行してください。

```bash
docker-compose -f docker-compose.prod.yml up --build
```

初回起動時はビルドに時間がかかる場合があります。
以下のURLにアクセスして動作を確認してください。

- **フロントエンド**: [http://localhost:3000](http://localhost:3000)
- **バックエンド (Swagger UI)**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **バックエンド (ヘルスチェック)**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

## プロジェクト構成

- `backend/`: Spring Boot アプリケーション (Gradle)
- `frontend/`: Next.js アプリケーション (TypeScript)
- `docker-compose.yml`: Docker 構成ファイル (開発用)
- `docker-compose.prod.yml`: Docker 構成ファイル (本番用)

## 開発について

- **バックエンド**: `backend/src` 以下のファイルを編集すると、再ビルドが必要になる場合があります（ホットリロード設定はIDEに依存します）。
- **フロントエンド**: `frontend/src` 以下のファイルを編集すると、ホットリロードによりブラウザに即座に反映されます。

## データベース

PostgreSQL がポート `5432` で起動します。
- ユーザー: `user`
- パスワード: `password`
- データベース名: `mydb`

## コード品質ツール

このプロジェクトには、コードの品質を維持するための静的解析ツールが導入されています。

### フロントエンド (ESLint, Prettier)

Dockerコンテナ内で以下のコマンドを実行することで、コードのチェックとフォーマットを行えます。

```bash
# Lintチェック (ESLint)
docker-compose exec frontend npm run lint

# Lint自動修正
docker-compose exec frontend npm run lint:fix

# コードフォーマット (Prettier)
docker-compose exec frontend npm run format
```

### バックエンド (Checkstyle, PMD, SpotBugs)

Gradleタスクを使用してチェックを実行します。

```bash
# 全てのチェックを実行
docker-compose exec backend ./gradlew check

# 個別のツールを実行する場合
docker-compose exec backend ./gradlew checkstyleMain
docker-compose exec backend ./gradlew pmdMain
docker-compose exec backend ./gradlew spotbugsMain
```

> [!NOTE]
> バックエンドのビルド設定 (`build.gradle`) では、開発の利便性を考慮して `ignoreFailures = true` が設定されており、Lintエラーがあってもビルドは成功します。