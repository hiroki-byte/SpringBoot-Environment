# プロジェクト完全解説教科書 - 目次

このドキュメント群は、本プロジェクトで使用されている技術スタック、設定ファイル、ツールについて、**「完全初心者でも1行単位で意味がわかる」** ように解説した教科書です。

各章は独立したファイルに分割されており、それぞれのトピックに集中して学習できます。

---

## 📚 教科書の構成

### 第1部: Java Backend 開発環境

#### [第1章: Gradle - ビルドツール](./01_java_gradle.md)
**対象ファイル**: 
- `backend/build.gradle`
- `backend/settings.gradle`
- `backend/gradlew`
- `backend/gradle/wrapper/gradle-wrapper.jar`
- `backend/gradle/wrapper/gradle-wrapper.properties`

Gradleの基礎から、プロジェクトで使用しているすべてのプラグイン、依存関係、タスク設定、そしてGradle Wrapperの仕組みまで完全解説。

**学べること**:
- Gradleとは何か、なぜ必要なのか
- `build.gradle` の各セクションの意味（repositories, dependencies, tasks等）
- プラグインの役割（Spring Boot, Checkstyle, PMD, SpotBugs）
- 依存関係のスコープ（implementation, compileOnly等）
- ライブラリの詳細な説明
- **Gradle Wrapperとは何か、なぜ必要なのか**
- **gradlewスクリプトの動作原理**
- **gradle-wrapper.propertiesの各設定項目**
- **Wrapperのライフサイクルとアップグレード方法**

---

#### [第2章: Checkstyle - コードスタイルチェック](./02_java_checkstyle.md)
**対象ファイル**: `backend/config/checkstyle/checkstyle.xml`

Checkstyleの設定ファイルを1行ずつ解説し、各チェックルールが何を検出するのかを詳しく説明。

**学べること**:
- Checkstyleとは何か、なぜコーディング規約が重要なのか
- XMLの基本構造
- 50以上のチェックルールの詳細
- Javadoc、命名規則、インポート、空白、コーディングルールの各カテゴリ
- 違反例と推奨例

---

#### [第3章: PMD - 静的コード解析](./03_java_pmd.md)
**対象ファイル**: `backend/config/pmd/pmd.xml`

PMDのルールセット設定を解説し、各カテゴリのルールが検出するバグパターンを説明。

**学べること**:
- PMDとCheckstyleの違い
- ベストプラクティス、コードスタイル、設計、エラー検出の各カテゴリ
- 具体的なバグパターンの例
- マルチスレッド、パフォーマンス、セキュリティの問題検出

---

### 第2部: Docker - コンテナ化技術

#### [第4章: Docker 基礎と docker-compose](./04_docker_basics.md)
**対象ファイル**: `docker-compose.yml`

Dockerとは何か、コンテナとは何かから始まり、docker-composeでの複数コンテナ管理を完全解説。

**学べること**:
- Dockerとコンテナの基本概念
- docker-composeの役割
- サービス定義（backend, frontend, db）
- ネットワーク設定
- ボリューム（永続化）の仕組み
- 環境変数の渡し方
- ホットリロードの仕組み

---

#### [第5章: 開発用 Dockerfile](./05_docker_dev.md)
**対象ファイル**: `frontend/Dockerfile.dev`, `backend/Dockerfile.dev`

開発環境用のDockerfileを詳細に解説し、各命令の意味と効果を説明。

**学べること**:
- Dockerfileの基本構文
- FROM, RUN, WORKDIR, COPY, EXPOSE, CMD の詳細
- レイヤーキャッシュの仕組みと最適化
- 開発用と本番用の違い
- Debian vs Alpine の選択理由

---

#### [第6章: 本番用 Dockerfile](./06_docker_prod.md)
**対象ファイル**: 
- `frontend/Dockerfile.prod`
- `backend/Dockerfile.prod`
- `docker-compose.prod.yml`

本番環境用のDockerfileを解説し、マルチステージビルドによる最適化を詳しく説明。さらに本番用Docker Compose設定も完全解説。

**学べること**:
- マルチステージビルドとは何か
- イメージサイズの最適化手法
- セキュリティのためのユーザー設定
- Next.js の standalone 出力
- JREとJDKの違いと使い分け
- **docker-compose.prod.ymlと開発用の違い**
- **本番デプロイのベストプラクティス**
- **環境変数管理、ヘルスチェック、リソース制限**

---

### 第3部: Next.js Frontend 開発環境

#### [第7章: Next.js 設定ファイル](./07_nextjs_config.md)
**対象ファイル**: 
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/next.config.mjs`
- `frontend/next-env.d.ts`
- `frontend/tsconfig.json`

Next.jsプロジェクトの設定ファイルを完全解説し、TypeScriptの設定も詳しく説明。

**学べること**:
- package.jsonの構造と各フィールドの意味
- npm scriptsの詳細
- 依存関係と開発依存関係の違い
- **package-lock.jsonの役割とロックファイルの重要性**
- **npm ci vs npm installの違い**
- Next.js設定（next.config.mjs）
- **next-env.d.tsの役割とTypeScript型定義の仕組み**
- **トリプルスラッシュディレクティブの意味**
- TypeScript設定（tsconfig.json）の各オプション
- パスエイリアスの設定と利点

---

#### [第8章: ESLint と Prettier](./08_nextjs_eslint_prettier.md)
**対象ファイル**: `frontend/.eslintrc.json`, `frontend/.prettierrc`

コード品質・フォーマットツールの設定を解説し、ルールの詳細と使い分けを説明。

**学べること**:
- ESLintとPrettierの役割の違い
- ESLintの設定ファイルの構造
- extendsとplugins、rulesの違い
- Prettierとの競合回避方法
- Prettierの各フォーマット設定の意味
- セミコロン、クォート、インデントなどの設定

---

## 📖 読み方のガイド

### 初心者の方
1. 第1章から順番に読むことをお勧めします
2. わからない用語があれば、各章の「定義」セクションを参照してください
3. 実際の設定ファイルを開きながら読むと理解が深まります

### 中級者の方
- 必要な章だけを選んで読むことができます
- 各章は独立していますが、相互参照もあります
- 「なぜこの設定が必要か」に焦点を当てて読むと効果的です

### 上級者の方
- 辞書的な使い方ができます
- プロジェクトの設定変更時のリファレンスとして活用できます
- チームメンバーへの教育資料として使用できます

---

## 🎯 学習のポイント

各章では以下の要素を重視して解説しています：

1. **定義**: 専門用語の明確な定義
2. **役割**: その設定が何のために存在するのか
3. **具体例**: 実際のコード例と使用場面
4. **効果**: 設定した場合としない場合の違い
5. **ベストプラクティス**: 推奨される使い方

---

## 📝 補足資料

### 公式ドキュメント
各ツールの公式ドキュメントへのリンク（各章に記載）

### トラブルシューティング
よくあるエラーと解決方法（各章に記載）

---

それでは、各章で詳しく学んでいきましょう！
