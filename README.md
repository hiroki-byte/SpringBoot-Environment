# Spring Boot + Next.js 開発環境

このプロジェクトは、Java (Spring Boot) バックエンドと Next.js フロントエンド、および PostgreSQL データベースを含む完全な開発環境です。Docker を使用して簡単に立ち上げることができます。

## 前提条件

- Docker Desktop がインストールされ、起動していること。

## 起動方法

1. リポジトリをクローンします（またはダウンロードします）。
2. プロジェクトのルートディレクトリで以下のコマンドを実行します。

```bash
docker-compose up --build
```

3. 初回起動時はビルドに時間がかかる場合があります。
4. 以下のURLにアクセスして動作を確認してください。

- **フロントエンド**: [http://localhost:3000](http://localhost:3000)
- **バックエンド (Swagger UI)**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **バックエンド (ヘルスチェック)**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

## プロジェクト構成

- `backend/`: Spring Boot アプリケーション (Gradle)
- `frontend/`: Next.js アプリケーション (TypeScript)
- `docker-compose.yml`: Docker 構成ファイル

## 開発について

- **バックエンド**: `backend/src` 以下のファイルを編集すると、再ビルドが必要になる場合があります（ホットリロード設定はIDEに依存します）。
- **フロントエンド**: `frontend/src` 以下のファイルを編集すると、ホットリロードによりブラウザに即座に反映されます。

## データベース

PostgreSQL がポート `5432` で起動します。
- ユーザー: `user`
- パスワード: `password`
- データベース名: `mydb`