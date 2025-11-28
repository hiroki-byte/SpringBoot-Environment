# 第1章: Gradle - ビルドツール

[← 目次に戻る](./00_index.md)

---

## 📋 この章で学ぶこと

- Gradleとは何か、なぜ必要なのか
- `settings.gradle` の役割
- `build.gradle` の完全解説
- プラグインシステムの仕組み
- 依存関係管理の詳細
- タスクとビルドライフサイクル

---

## 1. Gradle とは？

### 定義

**Gradle（グレイドル）** は、Javaプロジェクトのビルドプロセスを自動化するビルドツールです。

### ビルドとは？

「ビルド」とは、以下の一連の作業を指します：

1. **コンパイル**: ソースコード（`.java`）を機械語（`.class`）に変換
2. **テスト**: 書いたコードが正しく動くか自動チェック
3. **パッケージング**: 実行可能なファイル（`.jar`）を生成
4. **依存関係解決**: 必要なライブラリを自動ダウンロード

### なぜGradleが必要なのか？

**Gradleがない場合の問題**:
```bash
# すべて手動で実行する必要がある
javac src/main/java/**/*.java -d build/classes
java -cp "lib/*:build/classes" com.example.Main
# ライブラリも手動でダウンロード・配置
```

**Gradleがある場合**:
```bash
./gradlew build  # これだけで全部やってくれる
```

### Gradleの競合ツール

- **Maven**: より古く、XML形式。設定が冗長
- **Ant**: さらに古い。すべて手動設定が必要

Gradleは、これらの良いところを取り入れつつ、より柔軟で高速です。

---

## 2. ファイル: `settings.gradle`

### ファイルの役割

**`settings.gradle`** は、Gradleプロジェクト全体の「名前」と「モジュール構成」を定義するファイルです。

### 対象ファイルの場所
```
backend/
└── settings.gradle  ← このファイル
```

### 完全なファイル内容

```groovy
rootProject.name = 'backend'
```

たった1行ですが、重要な意味があります。

---

### 行ごとの詳細解説

#### 1行目: `rootProject.name = 'backend'`

**構文の分解**:
- **`rootProject`**: Gradleが提供する特殊な変数（プロジェクト全体を指すオブジェクト）
- **`.name`**: プロジェクト名を設定するプロパティ
- **`=`**: 代入演算子
- **`'backend'`**: プロジェクト名を表す文字列リテラル

**この設定の効果**:

1. **JARファイル名に影響**
   ```
   ビルド後のファイル名:
   backend-0.0.1-SNAPSHOT.jar
   ^^^^^^^^
   この部分がプロジェクト名
   ```

2. **IDE（統合開発環境）での表示名**
   - Eclipse, IntelliJ IDEAなどで、このプロジェクトが「backend」として表示される

3. **Gradle Wrapperのタスク一覧**
   ```bash
   ./gradlew tasks
   # 出力に "Project ':backend'" と表示される
   ```

**もし設定しないと？**:
- デフォルトでは、ディレクトリ名（この場合も `backend`）が使われる
- しかし、明示的に設定することで、ディレクトリ名を変更してもプロジェクト名を維持できる

**マルチモジュールプロジェクトの場合**:

もしプロジェクトが複数のモジュールに分かれている場合は、以下のように書きます：

```groovy
rootProject.name = 'my-app'

include 'backend'
include 'frontend'
include 'common'
```

現在のプロジェクトは単一モジュールなので、`include` は不要です。

---

## 3. ファイル: `build.gradle`

### ファイルの役割

**`build.gradle`** は、プロジェクトのビルド設定を記述する中心的なファイルです。「このプロジェクトは何をするのか」「何が必要なのか」をすべてここに書きます。

### 対象ファイルの場所
```
backend/
└── build.gradle  ← このファイル
```

### ファイルの全体構造

`build.gradle` は、以下のセクションで構成されています：

```groovy
plugins { }           // 1. 使用するプラグイン
group = '...'        // 2. プロジェクトのメタデータ
version = '...'
java { }             // 3. Java設定
configurations { }   // 4. 依存関係の構成
repositories { }     // 5. ライブラリのダウンロード元
dependencies { }     // 6. 使用するライブラリ
tasks.named() { }    // 7. タスクのカスタマイズ
checkstyle { }       // 8. ツールの設定
pmd { }
spotbugs { }
```

それでは、各セクションを詳しく見ていきましょう。

---

## 4. セクション1: プラグイン

### 完全なコード

```groovy
plugins {
	id 'java'
	id 'org.springframework.boot' version '3.3.0'
	id 'io.spring.dependency-management' version '1.1.5'
	id 'checkstyle'
	id 'pmd'
	id 'com.github.spotbugs' version '6.0.15'
}
```

### プラグインとは？

**定義**: Gradleの機能を拡張する「アドオン」です。プラグインを追加することで、新しいタスク（実行可能な処理）や設定が使えるようになります。

**比喩**: スマートフォンにアプリをインストールするようなものです。
- 基本的なGradle = スマホ本体（最低限の機能のみ）
- プラグイン = アプリ（特定の機能を追加）

---

### 各プラグインの詳細解説

#### 1. `id 'java'`

**このプラグインは何？**  
Javaプログラムをコンパイル・テスト・パッケージングするための基本プラグインです。

**提供される機能**:

1. **ソースセット（Source Sets）**
   ```
   src/main/java      → メインのJavaコード
   src/main/resources → 設定ファイル（application.yml等）
   src/test/java      → テストコード
   src/test/resources → テスト用設定ファイル
   ```
   この標準的なディレクトリ構造を自動認識します。

2. **タスク（実行可能な処理）**
   - `compileJava`: ソースコードをコンパイル
   - `test`: テストを実行
   - `jar`: JARファイルを生成
   - `clean`: ビルド成果物を削除

3. **依存関係の管理**
   - `implementation`, `testImplementation` などのスコープを提供

**このプラグインがないと？**:
- `.java` ファイルを認識できない
- コンパイルタスクが使えない
- 実質、Javaプロジェクトとして機能しない

**使用例**:
```bash
./gradlew compileJava  # Javaプラグインが提供するタスク
```

---

#### 2. `id 'org.springframework.boot' version '3.3.0'`

**このプラグインは何？**  
Spring Bootアプリケーションを簡単に作成・実行・パッケージングするためのプラグインです。

**Spring Bootとは？**  
Javaで「WebアプリケーションやREST API」を作るための超人気フレームワークです。通常のJavaアプリでは複雑な設定が必要ですが、Spring Bootは「設定より規約」の思想で、最小限の設定でアプリが動きます。

**提供される機能**:

1. **実行可能JAR（Fat JAR / Uber JAR）の作成**
   ```bash
   java -jar backend-0.0.1-SNAPSHOT.jar
   # ↑ これだけで起動できる（通常は複雑なクラスパス設定が必要）
   ```
   
   通常のJARファイルには、自分のコードだけが含まれます。Spring Bootプラグインが作るJARには、**すべての依存ライブラリも含まれています**。だから、どこでも実行できます。

2. **`bootRun` タスク**
   ```bash
   ./gradlew bootRun
   # 開発用サーバーを起動（ホットリロード付き）
   ```

3. **依存バージョンの自動管理**
   - Spring Boot 3.3.0に対応したライブラリのバージョンを自動選択
   - 例: `spring-boot-starter-web` と書くだけで、適切なバージョンが使われる

**バージョン `3.3.0` の意味**:

- **メジャーバージョン 3**: Java 17以降が必須。Jakarta EE 9対応。
- **マイナーバージョン 3**: 新機能追加版
- **パッチバージョン 0**: 初回リリース

**過去のバージョンとの違い**:
- Spring Boot 2.x: Java 8+対応、javax.*パッケージ
- Spring Boot 3.x: Java 17+必須、jakarta.*パッケージ（名前空間が変わった）

**このプラグインがないと？**:
- 手動で全ライブラリのバージョンを指定する必要がある
- 実行可能JARを自分で作る必要がある（非常に複雑）

---

#### 3. `id 'io.spring.dependency-management' version '1.1.5'`

**このプラグインは何？**  
Spring Bootと互換性のある依存ライブラリのバージョンを自動管理するプラグインです。

**なぜ必要なのか？**

Javaのプロジェクトでは、複数のライブラリが互いに依存しています。例：

```
あなたのプロジェクト
  ├─ spring-boot-starter-web (バージョン?)
  │   ├─ spring-core (バージョン?)
  │   ├─ tomcat (バージョン?)
  │   └─ jackson (バージョン?)
  └─ spring-boot-starter-data-jpa (バージョン?)
      ├─ spring-core (バージョン? ← 上と同じバージョンである必要がある!)
      └─ hibernate (バージョン?)
```

**問題点**:
- spring-coreのバージョンが食い違うと、実行時エラーが発生
- 手動で調整するのは非常に困難（"依存関係地獄"と呼ばれる）

**このプラグインの解決方法**:

Spring Bootチームが、「Spring Boot 3.3.0ならこの組み合わせ」という一覧を提供しています。このプラグインがそれを読み込んで、自動でバージョンを調整してくれます。

**具体例**:
```groovy
// バージョンを書かなくても...
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
}

// このプラグインが自動で適切なバージョン（例: 3.3.0）を選んでくれる
```

**このプラグインがないと？**:
- すべての依存関係に手動でバージョンを指定する必要がある
- バージョンの不整合で、原因不明のエラーが頻発する

---

#### 4. `id 'checkstyle'`

**このプラグインは何？**  
コードのスタイル（書き方）をチェックする「Checkstyle」ツールをGradleに統合するプラグインです。

**Checkstyleとは？**  
Javaコードが「コーディング規約」に従っているかを自動でチェックするツールです。

**チェック例**:
- インデントは4スペースか？
- 変数名は`camelCase`で始まっているか？
- 空のブロック `{}` がないか？

**提供される機能**:

1. **`checkstyleMain` タスク**
   ```bash
   ./gradlew checkstyleMain
   # src/main/java のコードをチェック
   ```

2. **`checkstyleTest` タスク**
   ```bash
   ./gradlew checkstyleTest
   # src/test/java のテストコードをチェック
   ```

3. **レポート生成**
   - `build/reports/checkstyle/main.html` にHTMLレポートが生成される
   - ブラウザで開くと、違反箇所が一覧表示される

**設定ファイル**:
- `backend/config/checkstyle/checkstyle.xml` でルールを定義（第2章で詳しく解説）

**このプラグインがないと？**:
- コーディング規約の統一ができない
- 人によって書き方がバラバラになる
- コードレビューで揉める

---

#### 5. `id 'pmd'`

**このプラグインは何？**  
コードの品質をチェックする「PMD」ツールをGradleに統合するプラグインです。

**PMDとは？**  
Checkstyleより高度で、「バグになりやすいコード」や「非効率なコード」を検出するツールです。

**PMD vs Checkstyle**:

| 項目 | Checkstyle | PMD |
|------|------------|-----|
| 焦点 | スタイル（見た目） | ロジック（中身） |
| 検出例 | 「インデントがずれている」 | 「この変数は使われていない」 |
| 重要度 | コードの統一性 | バグの予防 |

**検出例**:
- 使われていない変数 → 無駄なコード
- 空の `catch` ブロック → 例外を握りつぶしている（危険）
- 非効率な文字列結合 → パフォーマンス低下

**提供される機能**:

1. **`pmdMain` / `pmdTest` タスク**
2. **レポート生成**: `build/reports/pmd/main.html`

**このプラグインがないと？**:
- バグになりやすいコードが見逃される
- コードレビューの負担が増える

---

#### 6. `id 'com.github.spotbugs' version '6.0.15'`

**このプラグインは何？**  
バグ検出ツール「SpotBugs」をGradleに統合するプラグインです。

**SpotBugsとは？**  
コードを静的解析（実行せずに分析）して、バグの可能性が高い箇所を検出するツールです。旧名は「FindBugs」（有名なツールでしたが、開発停止。その後継がSpotBugs）。

**検出できるバグの例**:

1. **NullPointerException の可能性**
   ```java
   String name = user.getName();  // userがnullかもしれない
   int length = name.length();    // ← ここでクラッシュする可能性
   ```

2. **リソースリーク**
   ```java
   FileInputStream fis = new FileInputStream("file.txt");
   // fis.close() を忘れている → メモリリーク
   ```

3. **同期化の問題（マルチスレッド）**
   ```java
   private static int counter = 0;  // ← スレッドセーフでない
   ```

**PMDとの違い**:
- PMD: ルールベース（「こういうコードはダメ」というパターンマッチング）
- SpotBugs: データフロー解析（コードの実行フローを追跡してバグを推測）

より高度な解析をするため、SpotBugsの方が精度が高いですが、実行時間も長くなります。

---

## 5. セクション2: プロジェクトのメタデータ

### 完全なコード

```groovy
group = 'com.example'
version = '0.0.1-SNAPSHOT'
```

---

### `group = 'com.example'`

**これは何？**  
プロジェクトの「グループID」です。

**グループIDとは？**  
Javaの世界では、ライブラリを一意に識別するために「座標（coordinates）」が使われます：

```
グループID : アーティファクトID : バージョン
com.example : backend          : 0.0.1-SNAPSHOT
```

**命名規則**:
- 通常は、組織のドメイン名を逆にしたもの
- 例:
  - Google → `com.google`
  - Apache Foundation → `org.apache`
  - 個人プロジェクト → `io.github.ユーザー名`

**この例 `com.example` の意味**:
- `com.example` は「例示用」の予約ドメイン
- 実際のプロジェクトでは、自分の組織名に変更すべき

**効果**:

1. **Javaパッケージ名のベース**
   ```java
   package com.example.backend.controller;
   //      ^^^^^^^^^^^
   //      グループIDがベースになる
   ```

2. **Maven Centralへの公開時の識別子**
   - もしこのライブラリを公開する場合、`com.example:backend:0.0.1` という座標で登録される

---

### `version = '0.0.1-SNAPSHOT'`

**これは何？**  
このプロジェクトのバージョン番号です。

**バージョンの読み方（セマンティックバージョニング）**:

```
0    .    0    .    1     -     SNAPSHOT
^         ^         ^           ^
|         |         |           |
メジャー  マイナー  パッチ      識別子
```

1. **メジャーバージョン (0)**
   - 互換性のない大きな変更があったら上げる
   - `0` は「まだ開発中・不安定」を意味する慣習

2. **マイナーバージョン (0)**
   - 新機能を追加したら上げる（互換性は維持）

3. **パッチバージョン (1)**
   - バグ修正のみなら上げる

4. **SNAPSHOT**
   - 「開発中の不安定版」という意味
   - 正式リリース時は削除する（例: `1.0.0`）

**SNAPSHOTの効果**:

Maven/Gradleのリポジトリでは、SNAPSHOTバージョンは「常に最新版をダウンロードし直す」という挙動になります。正式版は「一度ダウンロードしたらキャッシュを使う」という違いがあります。

**リリース時の流れ**:
```
0.0.1-SNAPSHOT  (開発中)
      ↓
0.0.1           (リリース)
      ↓
0.0.2-SNAPSHOT  (次の開発)
```

---

## 6. セクション3: Java言語バージョン

### 完全なコード

```groovy
java {
	sourceCompatibility = '21'
}
```

---

### `java { ... }`

**これは何？**  
Javaプラグインの詳細設定を記述するブロックです。

---

### `sourceCompatibility = '21'`

**これは何？**  
「このプロジェクトのソースコードは、Java 21の文法で書かれています」という宣言です。

**Javaのバージョンとは？**

Javaは定期的にバージョンアップされ、新機能が追加されます：

| バージョン | リリース年 | 主な新機能 |
|-----------|-----------|-----------|
| Java 8 | 2014 | ラムダ式、Stream API |
| Java 11 | 2018 | `var` 型推論、HTTP Client |
| Java 17 | 2021 | レコード、sealed クラス（LTS版） |
| Java 21 | 2023 | パターンマッチング、バーチャルスレッド（LTS版） |

**LTS（Long Term Support）版**:
- Java 8, 11, 17, 21 が該当
- 長期サポートが約束されているため、本番環境で使われる

**`sourceCompatibility = '21'` の効果**:

1. **新機能が使える**
   ```java
   // Java 21の新機能: レコード（Record）
   public record Task(Long id, String title) {}
   
   // Java 17以前では使えない
   ```

2. **コンパイラの言語レベル設定**
   - Java 21の文法でコンパイルされる
   - Java 20以前の環境では動かない

**targetCompatibility との違い**:

```groovy
java {
    sourceCompatibility = '21'  // ソースコードはJava 21で書く
    targetCompatibility = '17'  // 生成されるバイトコードはJava 17互換
}
```

- **sourceCompatibility**: コードを書くときの文法バージョン
- **targetCompatibility**: 生成される `.class` ファイルのバージョン

通常は両方同じ値にしますが、「新しい文法で書きつつ、古い環境でも動くようにしたい」場合に使い分けます（ただし、新機能は使えません）。

---

## 7. セクション4: 依存関係の構成

### 完全なコード

```groovy
configurations {
	compileOnly {
		extendsFrom annotationProcessor
	}
}
```

---

### `configurations { ... }`

**これは何？**  
依存関係の「グループ（スコープ）」をカスタマイズするセクションです。

**Configuration（構成）とは？**

Gradleでは、依存ライブラリを「いつ必要か」によってグループ分けします：

- **implementation**: 実行時に必要
- **compileOnly**: コンパイル時のみ必要
- **runtimeOnly**: 実行時のみ必要
- **testImplementation**: テスト実行時に必要

これらの「グループ」を「Configuration」と呼びます。

---

### `compileOnly { extendsFrom annotationProcessor }`

**これは何をしている？**

`compileOnly` グループに、`annotationProcessor` グループの内容を含めるという設定です。

**なぜこれが必要？**

Lombok（後述）のようなツールは、以下の2つの役割を持ちます：

1. **アノテーションプロセッサ**: コンパイル時にコードを自動生成
2. **コンパイル時の依存**: 生成されたコードが参照するクラスを提供

この設定により、Lombokを `annotationProcessor` に指定するだけで、`compileOnly` にも自動的に含まれるようになります。

**具体例**:

```groovy
dependencies {
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
}
```

この`configurations`の設定があれば、上記のように2回書く必要がなくなります（ただし、現在のプロジェクトでは明示的に両方書いています。これは明確性のためです）。

---

## 8. セクション5: リポジトリ

### 完全なコード

```groovy
repositories {
	mavenCentral()
}
```

### `repositories { ... }`

**これは何？**  
依存ライブラリをどこからダウンロードするかを指定するセクションです。

### `mavenCentral()`

**Maven Centralとは？**:
- Apache Software Foundationが運営する、世界最大のJavaライブラリリポジトリ
- ほとんどすべてのJavaライブラリがここに公開されている

**URL**: `https://repo maven.apache.org/maven2/`

**他のリポジトリオプション**:

```groovy
repositories {
    mavenCentral()           // Maven Central（推奨）
    google()                 // Google（Androidライブラリ）
    jcenter()                // JCenter（非推奨・終了）
    mavenLocal()             // ローカルのMavenキャッシュ
    maven {
        url 'https://example.com/repo'  // カスタムリポジトリ
    }
}
```

**なぜmaven Central？**:
- 最も安定している
- ダウンロード速度が速い
- セキュリティチェックが厳格

---

## 9. セクション6: 依存関係

### 完全なコード

```groovy
dependencies {
	implementation 'org.springframework.boot:spring-boot-starter-actuator'
	implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
	implementation 'org.springframework.boot:spring-boot-starter-validation'
	implementation 'org.springframework.boot:spring-boot-starter-web'
	implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0'
	compileOnly 'org.projectlombok:lombok'
	runtimeOnly 'org.postgresql:postgresql'
	annotationProcessor 'org.projectlombok:lombok'
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

### 依存関係のスコープ

#### `implementation`

**意味**: コンパイル時と実行時の両方で必要な依存関係

**具体例**:
```groovy
implementation 'org.springframework.boot:spring-boot-starter-web'
```

**このライブラリの役割**:
- Spring MVCフレームワーク
- 組み込みTomcatサーバー
- REST APIの作成に必要なすべての機能

#### 各依存関係の詳細

##### `spring-boot-starter-actuator`

**役割**: アプリケーションの監視と管理

**提供される機能**:
- `/actuator/health`: ヘルスチェックエンドポイント
- `/actuator/metrics`: メトリクス情報
- `/actuator/info`: アプリケーション情報

**使用例**:
```bash
curl http://localhost:8080/actuator/health
# {"status":"UP"}
```

##### `spring-boot-starter-data-jpa`

**役割**: データベースアクセス（JPA/Hibernate）

**JPA（Java Persistence API）とは？**:
- Javaでデータベースを操作するための標準API
- SQLを書かずにデータベース操作ができる

**具体例**:
```java
@Entity
public class User {
    @Id
    @GeneratedValue
    private Long id;
    private String name;
}

// リポジトリ
public interface UserRepository extends JpaRepository<User, Long> {
    // SQLを書かなくても、メソッド名から自動でクエリを生成
    List<User> findByName(String name);
}
```

##### `spring-boot-starter-validation`

**役割**: バリデーション（入力値検証）

**Bean Validationとは？**:
- JavaのバリデーションAPI
- アノテーションで検証ルールを定義

**具体例**:
```java
public class UserRequest {
    @NotBlank(message = "名前は必須です")
    @Size(min = 2, max = 50)
    private String name;
    
    @Email
    private String email;
    
    @Min(0)
    @Max(150)
    private Integer age;
}
```

##### `spring-boot-starter-web`

**役割**: Webアプリケーション・REST API作成

**含まれるもの**:
- Spring MVC
- Tomcat（埋め込みサーバー）
- Jackson（JSON変換）

##### `springdoc-openapi-starter-webmvc-ui:2.5.0`

**役割**: API仕様書の自動生成

**OpenAPI（旧Swagger）とは？**:
- REST APIの仕様を記述する標準フォーマット
- 自動的にAPIドキュメントとUIを生成

**アクセス**:
```
http://localhost:8080/swagger-ui.html
```

#### `compileOnly`

**意味**: コンパイル時のみ必要（実行時には不要）

##### `lombok`

**Lombokとは？**:
コードを自動生成してくれるライブラリ

**例**:
```java
// Lombokなし
public class User {
    private Long id;
    private String name;
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    @Override
    public boolean equals(Object o) { /* 長いコード */ }
    @Override
    public int hashCode() { /* 長いコード */ }
}

// Lombokあり
@Data
public class User {
    private Long id;
    private String name;
}
```

**`@Data` アノテーションが自動生成**:
- getter/setter
- toString()
- equals()/hashCode()

#### `runtimeOnly`

**意味**: 実行時のみ必要（コンパイル時は不要）

##### `postgresql`

**役割**: PostgreSQLのJDBCドライバ

**JDBCドライバとは？**:
- Javaからデータベースに接続するためのライブラリ

**なぜruntimeOnly？**:
- コンパイル時は不要（JPAの抽象化層を使う）
- 実行時にだけPostgreSQLに接続

#### `annotationProcessor`

**意味**: コンパイル時にアノテーションを処理

##### `lombok`（再掲）

`compileOnly` と `annotationProcessor` の両方に指定する理由:
- `annotationProcessor`: コード生成を行う
- `compileOnly`: 生成されたコードが参照するLombokのクラスを提供

#### `testImplementation`

**意味**: テスト実行時のみ必要

##### `spring-boot-starter-test`

**含まれるもの**:
- JUnit 5: テストフレームワーク
- Mockito: モックライブラリ
- AssertJ: アサーションライブラリ
- Spring Test: Spring統合テスト

---

## 10. セクション7: タスク設定

### 完全なコード

```groovy
tasks.named('test') {
	useJUnitPlatform()
}
```

### `tasks.named('test') { ... }`

**これは何？**:
既存のタスク（`test`）の設定をカスタマイズする

### `useJUnitPlatform()`

**役割**: JUnit 5（JUnit Platform）を使用することを宣言

**JUnit 5とは？**:
- 現代的なJavaテストフレームワーク
- 旧版（JUnit 4）より柔軟で強力

---

## 11. セクション8: ツール設定

### Checkstyle設定

```groovy
checkstyle {
	toolVersion = '10.12.0'
	ignoreFailures = true
}
```

#### `toolVersion = '10.12.0'`

使用するCheckstyleのバージョンを指定

#### `ignoreFailures = true`

**意味**: Checkstyle違反があってもビルドを失敗させない

**理由**:
- 開発初期段階では、細かいスタイル違反でビルドが止まると開発効率が下がる
- 本番リリース前に `false` に変更して、違反をゼロにすることを推奨

### PMD設定

```groovy
pmd {
	toolVersion = '6.55.0'
	ignoreFailures = true
}
```

Checkstyleと同様の設定。

### SpotBugs設定

```groovy
spotbugs {
	toolVersion = '4.8.5'
}
```

**`ignoreFailures` がない理由**:
- SpotBugsが検出するのは深刻なバグの可能性
- デフォルトで `ignoreFailures = false`（ビルド失敗）

---

## 12. Gradle Wrapper とは？

### 定義

**Gradle Wrapper** は、プロジェクトに特定のGradleバージョンを「同梱」する仕組みです。

### なぜ必要？

**問題のシナリオ**:
```
開発者A: Gradle 8.7でビルド成功
開発者B: Gradle 7.5でビルド → エラー！
CI/CDサーバー: Gradleがインストールされていない → エラー！
```

**Gradle Wrapperの解決**:
```
./gradlew build
↓
1. 指定されたGradleバージョン（8.7）をダウンロード
2. ダウンロードしたGradleでビルド実行
↓
どの環境でも同じバージョンで動く
```

---

## 13. ファイル: `gradlew` (Linux/Mac) と `gradlew.bat` (Windows)

### ファイルの役割

**Gradle Wrapperの実行スクリプト**です。

### 対象ファイルの場所

```
backend/
├── gradlew       ← Linux/Mac用
└── gradlew.bat   ← Windows用
```

### 使用方法

```bash
# Linux/Mac
./gradlew build

# Windows
gradlew.bat build
```

### スクリプトの動作

1. `gradle/wrapper/gradle-wrapper.properties` を読む
2. 指定されたGradleバージョンが存在するか確認
3. なければダウンロード（`~/.gradle/wrapper/dists/` に保存）
4. ダウンロードしたGradleでビルド実行

### なぜ `.bat` と分かれているのか？

- Linux/Mac: シェルスクリプト（`#!/bin/bash`）
- Windows: バッチファイル（`.bat`）
- OSごとに異なる形式が必要

---

## 14. ファイル: `gradle/wrapper/gradle-wrapper.jar`

### ファイルの役割

**Gradle Wrapperのコアプログラム**（Javaバイトコード）

### 対象ファイルの場所

```
backend/
└── gradle/
    └── wrapper/
        └── gradle-wrapper.jar  ← このファイル
```

### このファイルは何をする？

1. `gradle-wrapper.properties` を読む
2. Gradleをダウンロード
3. Gradleを起動

### なぜバージョン管理に含める？

- `gradlew` スクリプトがこのJARを実行する
- このJARがないと、Wrapperが動かない

### サイズ

約60KB（小さいので、Gitにコミットしても問題ない）

---

## 15. ファイル: `gradle/wrapper/gradle-wrapper.properties`

### ファイルの役割

**Gradle Wrapperの設定ファイル**。どのGradleバージョンを使うかを定義します。

### 対象ファイルの場所

```
backend/
└── gradle/
    └── wrapper/
        └── gradle-wrapper.properties  ← このファイル
```

### 完全なファイル内容

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

---

### 行ごとの詳細解説

#### `distributionBase=GRADLE_USER_HOME`

**`GRADLE_USER_HOME` とは？**:
ユーザーのホームディレクトリ内のGradleキャッシュディレクトリ

**デフォルトパス**:
- Linux/Mac: `~/.gradle`
- Windows: `C:\Users\<ユーザー名>\.gradle`

**この設定の意味**:
Gradleのダウンロード先のベースディレクトリを指定

#### `distributionPath=wrapper/dists`

**意味**:  
`distributionBase` からの相対パス

**実際のダウンロード先**:
```
~/.gradle/wrapper/dists/gradle-8.7-bin/
```

#### `distributionUrl=https\://services.gradle.org/distributions/gradle-8.7-bin.zip`

**最も重要な設定**です。

**構文の分解**:
- `https\://`: `https://`（プロパティファイルでは `:` をエスケープ）
- `services.gradle.org`: Gradle公式サイト
- `/distributions/`: ディストリビューション置き場
- `gradle-8.7-bin.zip`: Gradle 8.7のバイナリ版

**`-bin` vs `-all`**:

| 種類 | 内容 | サイズ | 用途 |
|------|------|--------|------|
| `-bin` | 実行に必要な最小限 | 約100MB | 通常のビルド |
| `-all` | ソースコード・ドキュメント込み | 約300MB | IDE統合・開発 |

**バージョンの変更方法**:
```properties
# Gradle 8.10に変更したい場合
distributionUrl=https\://services.gradle.org/distributions/gradle-8.10-bin.zip
```

#### `networkTimeout=10000`

**意味**: ネットワークタイムアウト（ミリ秒）

`10000` = 10秒

**効果**:
- Gradleのダウンロードが10秒以内に開始されない場合、エラー
- 低速なネットワークでは、この値を増やすことができる

#### `validateDistributionUrl=true`

**意味**: ダウンロードURLの検証を有効化

**セキュリティ機能**:
- ダウンロードしたZIPファイルのチェックサムを検証
- 改ざんされていないことを確認

**`false` にすると？**:
- セキュリティリスク（非推奨）
- カスタムリポジトリを使う場合のみ

#### `zipStoreBase=GRADLE_USER_HOME`

**意味**: ダウンロードしたZIPファイルの保存先ベース

通常は `distributionBase` と同じ。

#### `zipStorePath=wrapper/dists`

**意味**: ZIPファイルの保存パス（相対）

`distributionPath` と同じ。

---

## 16. Gradle Wrapperのライフサイクル

### 初回実行時

```bash
./gradlew build
```

**処理の流れ**:

1. `gradle-wrapper.properties` を読む
2. `~/.gradle/wrapper/dists/` を確認
3. Gradle 8.7がない → ダウンロード
4. ZIPを展開
5. Gradle 8.7で `build` タスクを実行

**ダウンロード例**:
```
Downloading https://services.gradle.org/distributions/gradle-8.7-bin.zip
..........10%..........20%..........30%..........40%..........50%..........60%..........70%..........80%..........90%..........100%
Unzipping ~/.gradle/wrapper/dists/gradle-8.7-bin/xyz123/gradle-8.7-bin.zip to ~/.gradle/wrapper/dists/gradle-8.7-bin/xyz123
```

### 2回目以降

```bash
./gradlew build
```

**処理の流れ**:

1. `gradle-wrapper.properties` を読む
2. `~/.gradle/wrapper/dists/` を確認
3. Gradle 8.7が存在 → そのまま使用
4. Gradle 8.7で `build` タスクを実行

ダウンロードは不要（高速）。

---

## 17. Gradle Wrapper のアップグレード

### 方法1: `wrapper` タスク

```bash
./gradlew wrapper --gradle-version 8.10
```

**効果**:
- `gradle-wrapper.properties` の `distributionUrl` を更新
- `gradle-wrapper.jar` を最新に更新

### 方法2: 手動編集

```properties
# gradle-wrapper.properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.10-bin.zip
```

変更後、次回の `./gradlew` 実行時に新しいバージョンがダウンロードされる。

---

## 18. まとめ

### Gradleのコンポーネント

| ファイル | 役割 |
|---------|------|
| `build.gradle` | ビルド設定（プラグイン、依存関係等） |
| `settings.gradle` | プロジェクト名・モジュール構成 |
| `gradlew` / `gradlew.bat` | Wrapper実行スクリプト |
| `gradle-wrapper.jar` | Wrapperのコアプログラム |
| `gradle-wrapper.properties` | Wrapperの設定（バージョン等） |

### Gradle Wrapperの利点

1. **バージョンの統一**: チーム全員が同じGradleバージョンを使用
2. **環境構築不要**: Gradleをインストールしなくても動く
3. **再現性**: CI/CDでも同じバージョンで実行
4. **簡単なアップグレード**: 設定ファイルを変更するだけ

---

[← 目次に戻る](./00_index.md) | [→ 第2章: Checkstyle](./02_java_checkstyle.md)
