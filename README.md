# Spring Boot + Next.js 開発環境

このプロジェクトは、Java (Spring Boot) バックエンドと Next.js フロントエンド、および PostgreSQL データベースを含む完全な開発環境です。Docker を使用して簡単に立ち上げることができます。

## 前提条件

- Docker Desktop がインストールされ、起動していること

---

## 🐳 起動方法

### DevContainer (推奨)

**統合DevContainer環境**を使用することで、1つのVS Codeウィンドウでフロントエンド・バックエンド・データベースすべてを開発できます。

#### 初回起動手順

1. **クリーンアップ（初回またはトラブル時）**
   ```bash
   docker-compose down -v
   ```

2. **VS Code でプロジェクトルートを開く**

3. **DevContainerに接続**
   - `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
   - または、右下の通知から "Reopen in Container" をクリック

4. **コンテナ起動を待つ**（初回は5-10分）

5. **サービスを手動起動**
   
   **ターミナル1 (Backend - Spring Boot):**
   ```bash
   cd /app
   ./gradlew bootRun
   ```

   **ターミナル2 (Frontend - Next.js):**
   ```bash
   cd /workspace/frontend
   npm run dev
   ```

#### VS Codeターミナルの使い方

- `Ctrl+Shift+P` で新しいターミナルを開く
- 複数のターミナルで各サービスのログを同時に確認可能

#### トラブルシューティング

**コンテナが起動しない場合:**
```bash
docker-compose down -v
docker system prune -a
# VS Codeを閉じて再起動
```

**イメージが古い場合:**
```bash
docker-compose down -v --rmi all
docker-compose build --no-cache
```

**Gradleがエラーの場合:**
```bash
./gradlew clean
./gradlew bootRun
```

---

### Docker Compose（通常起動）

DevContainerを使わず、通常のdocker-composeで起動する場合：

```bash
# 開発環境
docker-compose up --build

# package.json修正時はボリューム再作成
docker-compose up --build -V
```

**注意**: 統合DevContainer対応により、サービスは自動起動しません。手動起動が必要です：

```bash
# Backend起動
docker-compose exec backend ./gradlew bootRun

# Frontend起動
docker-compose exec frontend npm run dev
```

---

### 本番環境 (Production)

本番デプロイ時は、最適化されたビルドを使用：

```bash
docker-compose -f docker-compose.prod.yml up --build
```

初回起動時はビルドに時間がかかる場合があります。

---

## 🌐 アクセスURL

- **フロントエンド**: [http://localhost:3000](http://localhost:3000)
- **バックエンド (Swagger UI)**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **バックエンド (ヘルスチェック)**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

## 📁 プロジェクト構成

- `backend/`: Spring Boot アプリケーション (Gradle)
- `frontend/`: Next.js アプリケーション (TypeScript)
- `docker-compose.yml`: Docker 構成ファイル (開発用)
- `docker-compose.prod.yml`: Docker 構成ファイル (本番用)
- `.devcontainer/`: 統合DevContainer設定

---

## 💻 開発について

- **バックエンド**: `backend/src` 以下のファイルを編集すると、再ビルドが必要になる場合があります
- **フロントエンド**: `frontend/src` 以下のファイルを編集すると、ホットリロードによりブラウザに即座に反映されます

---

## 🗄️ データベース

PostgreSQL がポート `5432` で起動します。
- ユーザー: `user`
- パスワード: `password`
- データベース名: `mydb`

---

## ✅ コード品質ツール

このプロジェクトには、コードの品質を維持するための静的解析ツールが導入されています。

### フロントエンド (ESLint, Prettier)

```bash
# Lintチェック (ESLint)
docker-compose exec frontend npm run lint

# Lint自動修正
docker-compose exec frontend npm run lint:fix

# コードフォーマット (Prettier)
docker-compose exec frontend npm run format
```

### バックエンド (Checkstyle, PMD, SpotBugs)

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