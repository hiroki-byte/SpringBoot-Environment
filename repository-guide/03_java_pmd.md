# 第3章: PMD - 静的コード解析

[← 目次に戻る](./00_index.md) | [← 第2章: Checkstyle](./02_java_checkstyle.md) | [→ 第4章: Docker基礎](./04_docker_basics.md)

---

## 📋 この章で学ぶこと

- PMDとは何か、Checkstyleとの違い
- 静的コード解析の仕組み
- `pmd.xml` の完全解説
- 7つのルールカテゴリの詳細
- 具体的なバグパターンの例
- パフォーマンス問題の検出

---

## 1. PMD とは？

### 定義

**PMD** は、Javaソースコードを静的に解析し、バグにつながりやすいコードパターンや、コードの品質問題を検出するツールです。

**PMDの名前の由来**: 公式には「何の略でもない」とされています。過去には "Programming Mistake Detector" などの説もありましたが、現在は固有名詞として扱われています。

### 静的解析とは？

**定義**: プログラムを実行せずに、ソースコードを分析することです。

**動的解析との違い**:

| 種類 | タイミング | 方法 | 例 |
|------|-----------|------|-----|
| 静的解析 | コンパイル前・実行前 | コードを読む | PMD, Checkstyle, SpotBugs |
| 動的解析 | 実行中 | プログラムを動かす | デバッガ、プロファイラ |

**静的解析の利点**:
- バグを実行前に発見できる
- すべてのコードパスをチェックできる（テストでカバーできない部分も）
- 自動化が容易（CI/CDに組み込める）

**静的解析の限界**:
- 実行時にしかわからない問題（実際の入力値による挙動）は検出できない
- 誤検知（False Positive）が発生することがある

---

## 2. PMD vs Checkstyle vs SpotBugs

これらのツールは、それぞれ異なる焦点を持っています。

### 比較表

| ツール | 焦点 | 検出内容 | 分析方法 |
|--------|------|----------|----------|
| **Checkstyle** | コードスタイル | インデント、命名規則、空白 | トークン解析 + AST |
| **PMD** | コード品質 | 複雑度、非効率、潜在バグ | AST + ルールマッチング |
| **SpotBugs** | バグ検出 | NullPointer、リソースリーク | バイトコード解析 + データフロー |

### 具体例で比較

**Checkstyleが検出**:
```java
public void hello(){  // ✗ メソッド名と()の間に空白がない
    int x=1;  // ✗ =の前後に空白がない
}
```

**PMDが検出**:
```java
public void process(List<String> list) {
    for (int i = 0; i < list.size(); i++) {  // ✗ 非効率（毎回size()を呼ぶ）
        System.out.println(list.get(i));
    }
}
```

**SpotBugsが検出**:
```java
public String getName(User user) {
    return user.getName();  // ✗ userがnullの可能性（NullPointerException）
}
```

### なぜ3つとも使う？

それぞれが補完的な役割を果たします：
- Checkstyle: コードの見た目を統一
- PMD: コードの中身（ロジック）を改善
- SpotBugs: 深刻なバグを検出

---

## 3. PMDの動作の仕組み

### 分析の流れ

```
1. Javaソースコード
        ↓
2. 字句解析（Lexical Analysis）
   トークン（単語）に分解
   例: public, void, hello, (, ), {, ...
        ↓
3. 構文解析（Parsing）
   抽象構文木（AST）に変換
        ↓
4. ルールセットの適用
   各ルールがASTを走査
        ↓
5. 違反の報告
   build/reports/pmd/main.html
```

### ASTベースの解析

PMDは、Checkstyleと同様にAST（抽象構文木）を使いますが、より複雑な解析を行います。

**例: 複雑度の計算**

```java
public void complex(int x) {
    if (x > 0) {          // +1
        if (x < 10) {     // +1
            doA();
        } else {          // +1
            doB();
        }
    } else if (x < -10) { // +1
        doC();
    }
    // サイクロマティック複雑度 = 4
}
```

PMDは、AST上でif, else, for, while, case, catch, &&, || などを数えて複雑度を計算します。

---

## 4. ファイル: `pmd.xml`

### ファイルの役割

**`pmd.xml`** は、PMDのチェックルールセットを定義するXMLファイルです。

このプロジェクトでは、PMDが提供する既製のルールセットを参照する形式を採用しています。

### 対象ファイルの場所

```
backend/
└── config/
    └── pmd/
        └── pmd.xml  ← このファイル
```

### 完全なファイル内容

```xml
<?xml version="1.0"?>
<ruleset name="Custom Rules"
    xmlns="http://pmd.sourceforge.net/ruleset/2.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://pmd.sourceforge.net/ruleset/2.0.0 https://pmd.sourceforge.io/ruleset_2_0_0.xsd">

    <description>
        My custom rules
    </description>

    <rule ref="category/java/bestpractices.xml" />
    <rule ref="category/java/codestyle.xml" />
    <rule ref="category/java/design.xml" />
    <rule ref="category/java/errorprone.xml" />
    <rule ref="category/java/multithreading.xml" />
    <rule ref="category/java/performance.xml" />
    <rule ref="category/java/security.xml" />

</ruleset>
```

---

## 5. ファイルの完全解説

### ヘッダー部分

```xml
<?xml version="1.0"?>
```

**役割**: XML宣言です。このファイルがXML形式であることを示します。

---

```xml
<ruleset name="Custom Rules"
    xmlns="http://pmd.sourceforge.net/ruleset/2.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://pmd.sourceforge.net/ruleset/2.0.0 https://pmd.sourceforge.io/ruleset_2_0_0.xsd">
```

#### `<ruleset name="Custom Rules">`

**役割**: PMDのルールセット（ルールの集まり）を定義するルート要素です。

**`name="Custom Rules"` の意味**:
- このルールセットの名前
- レポートに表示される
- わかりやすい名前に変更可能（例: "Spring Boot Project Rules"）

#### `xmlns` 属性

**xmlns とは？**: XML Namespace（XML名前空間）の略です。

**役割**:
- XMLの要素がどの仕様に従っているかを明示
- 異なるXML形式が混在しても、区別できるようにする

**`xmlns="http://pmd.sourceforge.net/ruleset/2.0.0"` の意味**:
- デフォルトの名前空間を設定
- このURL自体にアクセスするわけではない（識別子として使っているだけ）

#### `xmlns:xsi` 属性

**xsi とは？**: XML Schema Instance の略です。

**`xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"` の意味**:
- `xsi:` というプレフィックスで始まる属性を使えるようにする
- W3C（World Wide Web Consortium）が定義した標準的な名前空間

#### `xsi:schemaLocation` 属性

**役割**: XMLスキーマ（XMLの構造定義）の場所を指定します。

**`xsi:schemaLocation="... https://pmd.sourceforge.io/ruleset_2_0_0.xsd"` の意味**:
- このXMLファイルの構造定義（XSD: XML Schema Definition）がどこにあるかを示す
- XMLエディタがこのXSDを参照して、自動補完や文法チェックを行う

---

### 説明部分

```xml
    <description>
        My custom rules
    </description>
```

**役割**: このルールセットの説明です。

**推奨される記述例**:
```xml
<description>
    PMD rules for Spring Boot backend project.
    Includes best practices, code style, design, error-prone,
    multithreading, performance, and security checks.
</description>
```

---

### ルールの参照

```xml
    <rule ref="category/java/bestpractices.xml" />
    <rule ref="category/java/codestyle.xml" />
    <rule ref="category/java/design.xml" />
    <rule ref="category/java/errorprone.xml" />
    <rule ref="category/java/multithreading.xml" />
    <rule ref="category/java/performance.xml" />
    <rule ref="category/java/security.xml" />
```

#### `<rule ref="..." />` とは？

**役割**: 外部のルールセットファイルを参照（インポート）します。

**パスの意味**:
- `category/java/`: PMDが提供する標準ルールセットのディレクトリ
- `bestpractices.xml`: ベストプラクティスに関するルール集

**PMD内部での実際のパス**:
```
pmd-java-x.x.x.jar
└── category/
    └── java/
        ├── bestpractices.xml
        ├── codestyle.xml
        ├── design.xml
        └── ...
```

これらのファイルは、PMDのJARファイル内に含まれています。

---

## 6. ルールカテゴリの詳細解説

以下、7つのカテゴリについて、代表的なルールを詳しく解説します。

---

### カテゴリ1: Best Practices（ベストプラクティス）

**`category/java/bestpractices.xml`**

このカテゴリには、経験則として「こう書いた方が良い」とされるルールが含まれています。

#### 主要なルール

##### 1. UnusedLocalVariable（使われていないローカル変数）

**検出例**:
```java
public void process() {
    int count = 0;     // ✗ この変数は使われていない
    String result = ""; // ✗
    
    doSomething();
}
```

**なぜダメ？**:
- コードが読みにくくなる
- 無駄なメモリ使用
- 「使うつもりだったのに忘れた」可能性（バグの兆候）

**修正**:
```java
public void process() {
    // 使わない変数は削除
    doSomething();
}
```

##### 2. UnusedPrivateMethod（使われていないprivateメソッド）

**検出例**:
```java
public class UserService {
    public void register(User user) {
        saveUser(user);
    }
    
    private void saveUser(User user) {
        // ...
    }
    
    private void validateUser(User user) {  // ✗ どこからも呼ばれていない
        // ...
    }
}
```

**なぜダメ？**:
- デッドコード（死んだコード）の可能性
- リファクタリングで削除し忘れた可能性
- メンテナンスコストの増加

##### 3. UnusedPrivateField（使われていないprivateフィールド）

**検出例**:
```java
public class Calculator {
    private static final double PI = 3.14159;  // ✓ 使用
    private static final double E = 2.71828;   // ✗ 使用していない
    
    public double circleArea(double radius) {
        return PI * radius * radius;
    }
}
```

##### 4. UnusedFormalParameter（使われていないメソッドパラメータ）

**検出例**:
```java
public void process(String name, int age) {
    System.out.println("Processing: " + name);
    // ageを使っていない
}
```

**いつ検出される？**:
- privateメソッドのパラメータが未使用の場合

**なぜpublicメソッドは対象外？**:
- インターフェースの実装やオーバーライドでは、使わないパラメータがあっても問題ないため

**修正方法**:

1. 不要なら削除:
```java
public void process(String name) {
    System.out.println("Processing: " + name);
}
```

2. どうしても必要なら、名前を `ignored` などにする:
```java
private void process(String name, @SuppressWarnings("unused") int ignoredAge) {
    System.out.println("Processing: " + name);
}
```

##### 5. PreserveStackTrace（スタックトレースの保持）

**検出例（バグパターン）**:
```java
try {
    riskyOperation();
} catch (Exception e) {
    // ✗ 元の例外情報を捨てている
    throw new RuntimeException("Operation failed");
}
```

**何が問題？**:
- 元のエラーの原因（スタックトレース）が失われる
- デバッグが困難になる

**正しい例**:
```java
try {
    riskyOperation();
} catch (Exception e) {
    // ✓ 元の例外をcauseとして渡す
    throw new RuntimeException("Operation failed", e);
}
```

**スタックトレースの比較**:

悪い例の出力:
```
RuntimeException: Operation failed
    at Service.process(Service.java:42)
    ...
// どこで何が起きたのかわからない
```

良い例の出力:
```
RuntimeException: Operation failed
    at Service.process(Service.java:42)
    ...
Caused by: IOException: File not found: data.txt
    at FileReader.<init>(FileReader.java:72)
    ...
// 根本原因がわかる！
```

##### 6. AvoidReassigningParameters（パラメータの再代入を避ける）

**検出例**:
```java
public void setName(String name) {
    name = name.trim();  // ✗ パラメータを再代入している
    this.name = name;
}
```

**なぜダメ？**:
- 元の値が失われる（デバッグ時に混乱）
- コードが読みにくくなる

**推奨**:
```java
public void setName(String name) {
    String trimmedName = name.trim();  // ✓ 新しい変数を使う
    this.name = trimmedName;
}
```

##### 7. GuardLogStatement（ログ出力の保護）

**検出例**:
```java
// ✗ 常に文字列結合が実行される
logger.debug("User: " + user.getName() + ", Age: " + user.getAge());
```

**問題点**:
- DEBUGレベルが無効でも、文字列結合が実行される（無駄な処理）

**推奨**:
```java
// ✓ DEBUGレベルが有効な場合のみ文字列結合
if (logger.isDebugEnabled()) {
    logger.debug("User: " + user.getName() + ", Age: " + user.getAge());
}

// または、プレースホルダーを使う（SLF4J）
logger.debug("User: {}, Age: {}", user.getName(), user.getAge());
```

---

### カテゴリ2: Code Style（コードスタイル）

**`category/java/codestyle.xml`**

Checkstyleと一部重複しますが、PMDはより論理的なスタイルに焦点を当てています。

#### 主要なルール

##### 1. UnnecessaryLocalBeforeReturn（returnの直前の無駄な変数）

**検出例**:
```java
public String getName() {
    String result = user.getName();  // ✗ 無駄な変数
    return result;
}
```

**推奨**:
```java
public String getName() {
    return user.getName();  // ✓ 直接return
}
```

**例外（許可される場合）**:
```java
public int calculate(int a, int b) {
    int result = complexCalculation(a, b);
    // デバッグポイントとして役立つ
    return result;
}
```

##### 2. ShortVariable（短すぎる変数名）

**検出例**:
```java
int i;   // ✗ 1文字（ループ変数以外）
int ab;  // ✗ 2文字
```

**デフォルト制限**: 3文字以上

**推奨**:
```java
int count;      // ✓ 3文字以上
int userAge;    // ✓ わかりやすい名前
```

**例外**: ループ変数の `i`, `j`, `k` は許可される場合が多い

##### 3. LongVariable（長すぎる変数名）

**検出例**:
```java
String thisIsAVeryLongVariableNameThatIsHardToRead;  // ✗ 長すぎる
```

**デフォルト制限**: 17文字以下（カスタマイズ可能）

##### 4. UselessParentheses（無駄な括弧）

**検出例**:
```java
if ((condition)) { }  // ✗ 二重括弧
int x = (5);          // ✗ 不要な括弧
return (value);       // ✗
```

**推奨**:
```java
if (condition) { }
int x = 5;
return value;
```

##### 5. UnnecessaryModifier（不要な修飾子）

**検出例**:
```java
public interface MyInterface {
    public void doSomething();  // ✗ publicは暗黙的
}

public final class FinalClass {
    public final void method() { }  // ✗ finalクラスなので不要
}
```

---

### カテゴリ3: Design（設計）

**`category/java/design.xml`**

コードの設計品質に関するルールです。

#### 主要なルール

##### 1. CyclomaticComplexity（サイクロマティック複雑度）

**定義**: メソッドの複雑さを数値化したもの。分岐（if, for, while等）の数+1で計算されます。

**検出例**:
```java
public void complex(int x) {
    if (x > 0) {          // +1
        if (x < 10) {     // +1
            doA();
        } else {          // +1
            doB();
        }
    } else if (x < -10) { // +1
        doC();
    } else {              // +1
        doD();
    }
    // 複雑度 = 5
}
```

**デフォルト閾値**: 10

**なぜダメ？**:
- 複雑なメソッドはテストが困難
- バグが入り込みやすい
- 理解しにくい

**リファクタリング**:
```java
public void process(int x) {
    if (x > 10) {
        processLarge(x);
    } else if (x > 0) {
        processSmall(x);
    } else if (x < -10) {
        processNegativeLarge(x);
    } else {
        processNegativeSmall(x);
    }
}

private void processLarge(int x) { doA(); }
private void processSmall(int x) { doB(); }
// ...
```

##### 2. TooManyFields（フィールドが多すぎる）

**検出例**:
```java
public class User {
    private String firstName;
    private String lastName;
    private String email;
    private int age;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String country;
    private String phone;
    private String mobile;
    // ... 15個以上のフィールド
}
```

**デフォルト閾値**: 15個

**なぜダメ？**:
- クラスが複数の責任を持っている可能性（単一責任の原則違反）

**リファクタリング**:
```java
public class User {
    private String firstName;
    private String lastName;
    private String email;
    private int age;
    private Address address;  // 別クラスに分離
    private ContactInfo contact;  // 別クラスに分離
}

public class Address {
    private String street;
    private String city;
    private String state;
    private String zipCode;
    private String country;
}
```

##### 3. TooManyMethods（メソッドが多すぎる）

**デフォルト閾値**: 10個

**検出時の対処**: クラスを分割する

##### 4. ExcessivePublicCount（publicメンバーが多すぎる）

**デフォルト閾値**: 45個

**なぜダメ？**:
- カプセル化の破壊
- クラスのインターフェースが大きすぎる

##### 5. GodClass（神クラス）

**定義**: あらゆる機能を持つ巨大なクラス

**検出基準**: 複数の指標の組み合わせ
- 高い複雑度
- 多くのフィールド
- 多くのメソッド
- 低い凝集度

**なぜダメ？**:
- テスト困難
- 変更によるバグの混入
- チーム開発での競合

---

### カテゴリ4: Error Prone（エラーを起こしやすい）

**`category/java/errorprone.xml`**

バグになりやすいコードパターンを検出します。

#### 主要なルール

##### 1. EmptyCatchBlock（空のcatchブロック）

**検出例**:
```java
try {
    riskyOperation();
} catch (Exception e) {
    // ✗ 何もしていない（例外を無視）
}
```

**なぜ危険？**:
- エラーが発生しても気づかない
- デバッグが困難

**正しい例**:
```java
try {
    riskyOperation();
} catch (Exception e) {
    logger.error("Failed to perform risky operation", e);
    // または、ビジネスロジックとして無視する正当な理由を書く
}
```

##### 2. EmptyIfStmt（空のif文）

**検出例**:
```java
if (condition) {
    // 何もしない
}
```

**推測される原因**:
- 実装し忘れ
- デバッグ中に削除し忘れ

##### 3. AssignmentInOperand（条件式内での代入）

**検出例**:
```java
if (x = 5) {  // ✗ 代入（==の間違い？）
    doSomething();
}
```

**バグの可能性**:
```java
// 意図: x == 5 かチェック
// 実際: x に 5 を代入し、常にtrue
```

**Javaでは**:
- 上記は実際にはコンパイルエラー（boolean以外）
- しかし、以下は許可される:
  ```java
  if (flag = isValid()) {  // ✗ 読みにくい
      doSomething();
  }
  ```

**推奨**:
```java
flag = isValid();
if (flag) {
    doSomething();
}
```

##### 4. CloseResource（リソースのクローズ忘れ）

**検出例**:
```java
public void readFile() throws IOException {
    FileInputStream fis = new FileInputStream("file.txt");  // ✗ closeしていない
    // ...
}
```

**問題**:
- リソースリーク（メモリやファイルハンドルが解放されない）

**推奨: try-with-resources**:
```java
public void readFile() throws IOException {
    try (FileInputStream fis = new FileInputStream("file.txt")) {
        // 自動的にcloseされる
    }
}
```

##### 5. CompareObjectsWithEquals（==でのオブジェクト比較）

**検出例**:
```java
String a = "hello";
String b = new String("hello");

if (a == b) {  // ✗ 参照の比較（false）
    doSomething();
}
```

**正しい例**:
```java
if (a.equals(b)) {  // ✓ 内容の比較（true）
    doSomething();
}
```

##### 6. NullAssignment（nullの代入）

**検出例**:
```java
String name = null;  // ✗ 初期値がnull
if (condition) {
    name = getValue();
}
return name;  // NullPointerExceptionの可能性
```

**推奨**:
```java
String name = "";  // デフォルト値を設定
if (condition) {
    name = getValue();
}
return name;
```

---

### カテゴリ5: Multithreading（マルチスレッド）

**`category/java/multithreading.xml`**

並行処理に関する問題を検出します。

#### 主要なルール

##### 1. AvoidSynchronizedAtMethodLevel（メソッドレベルの同期を避ける）

**検出例**:
```java
public synchronized void process() {  // ✗ メソッド全体をロック
    doA();
    doB();  // ← この部分だけ同期が必要では？
    doC();
}
```

**推奨**:
```java
public void process() {
    doA();
    synchronized(this) {  // ✓ 必要な部分だけロック
        doB();
    }
    doC();
}
```

**理由**:
- ロックの粒度を細かくする
- パフォーマンス向上

##### 2. AvoidThreadGroup（ThreadGroupを避ける）

**理由**: ThreadGroupは非推奨（deprecated）になる可能性が高い

**推奨**: ExecutorServiceを使う

##### 3. DoNotUseThreads（Threadsの直接使用を避ける）

**非推奨**:
```java
new Thread(() -> {
    doWork();
}).start();
```

**推奨**:
```java
ExecutorService executor = Executors.newFixedThreadPool(10);
executor.submit(() -> doWork());
```

---

### カテゴリ6: Performance（パフォーマンス）

**`category/java/performance.xml`**

パフォーマンス上の問題を検出します。

#### 主要なルール

##### 1. AppendCharacterWithChar（文字列結合の非効率）

**非効率**:
```java
String s = "";
s += "a";  // ✗ 文字列として結合
```

**推奨**:
```java
String s = "";
s += 'a';  // ✓ 文字として結合（高速）
```

##### 2. ConsecutiveLiteralAppends（連続した文字列結合）

**非効率**:
```java
String s = "";
s += "Hello";
s += " ";
s += "World";  // ✗ 毎回新しいStringオブジェクトを生成
```

**推奨**:
```java
StringBuilder sb = new StringBuilder();
sb.append("Hello");
sb.append(" ");
sb.append("World");
String s = sb.toString();
```

**または**:
```java
String s = "Hello" + " " + "World";  // コンパイラが最適化
```

##### 3. InefficientEmptyStringCheck（空文字列チェックの非効率）

**非効率**:
```java
if (str.trim().length() == 0) {  // ✗ trim()で新しいStringを生成
}
```

**推奨**:
```java
if (str.trim().isEmpty()) {  // ✓ 同じだが、意図が明確
// または
if (str.isBlank()) {  // ✓ Java 11以降
}
```

##### 4. AvoidInstantiatingObjectsInLoops（ループ内でのオブジェクト生成）

**非効率**:
```java
for (int i = 0; i < 1000; i++) {
    Object obj = new Object();  // ✗ 毎回new
    process(obj);
}
```

**推奨**:
```java
Object obj = new Object();  // ✓ ループ外で生成
for (int i = 0; i < 1000; i++) {
    process(obj);
}
```

---

### カテゴリ7: Security（セキュリティ）

**`category/java/security.xml`**

セキュリティ上の脆弱性を検出します。

#### 主要なルール

##### 1. HardCodedCryptoKey（ハードコードされた暗号鍵）

**検出例**:
```java
String key = "MySecretKey123";  // ✗ ソースコードに鍵を書くのは危険
```

**推奨**:
```java
String key = System.getenv("CRYPTO_KEY");  // 環境変数から取得
```

##### 2. InsecureCryptoIv（安全でない初期化ベクトル）

**セキュリティリスク**: 暗号化の安全性が損なわれる

**推奨**: SecureRandomを使う

---

## 7. カスタマイズ例

### 特定のルールを除外

```xml
<rule ref="category/java/codestyle.xml">
    <exclude name="ShortVariable"/>  <!-- 短い変数名を許可 -->
</rule>
```

### ルールの閾値を変更

```xml
<rule ref="category/java/design.xml/CyclomaticComplexity">
    <properties>
        <property name="methodReportLevel" value="15"/>  <!-- デフォルト10→15に -->
    </properties>
</rule>
```

### 独自ルールの追加

```xml
<rule name="AvoidPrintStackTrace" 
      language="java"
      message="Avoid printStackTrace(); use a logger"
      class="net.sourceforge.pmd.lang.rule.XPathRule">
    <priority>3</priority>
    <properties>
        <property name="xpath">
            <value>//PrimaryExpression[ends-with(Name/@Image, 'printStackTrace')]</value>
        </property>
    </properties>
</rule>
```

---

## 8. まとめ

### PMDの7つのカテゴリ

1. **Best Practices**: 経験則に基づく推奨事項
2. **Code Style**: 論理的なコードスタイル
3. **Design**: 設計品質（複雑度、クラスサイズ等）
4. **Error Prone**: バグになりやすいパターン
5. **Multithreading**: 並行処理の問題
6. **Performance**: パフォーマンス問題
7. **Security**: セキュリティ脆弱性

### Checkstyle vs PMD まとめ

- **Checkstyle**: 見た目の統一
- **PMD**: 中身の品質向上

両方を併用することで、高品質なコードを維持できます。

---

[← 目次に戻る](./00_index.md) | [→ 第4章: Docker基礎](./04_docker_basics.md)
