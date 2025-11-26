# 第2章: Checkstyle - コードスタイルチェック

[← 目次に戻る](./00_index.md) | [→ 第3章: PMD](./03_java_pmd.md)

---

## 📋 この章で学ぶこと

- Checkstyleとは何か、なぜ必要なのか
- XMLの基本構造
- `checkstyle.xml` の完全解説
- 50以上のチェックルールの詳細
- 違反例と推奨例
- カスタマイズ方法

---

## 1. Checkstyle とは？

### 定義

**Checkstyle** は、Javaソースコードが定められた「コーディング規約（Coding Standards）」に従っているかを自動的にチェックするツールです。

### コーディング規約とは？

**定義**: プログラムを書く際の「ルール」や「お作法」のことです。

**具体例**:
- インデントは4スペースにする
- 変数名は小文字から始める（`userName`, not `UserName`）
- クラス名は大文字から始める（`UserController`, not `userController`）
- メソッドは150行を超えない

### なぜコーディング規約が必要なのか？

**1. コードの統一性**

規約がない場合:
```java
// 開発者Aのコード
public class userService{
private String Name;
public void getData(){
if(user==null)
{
System.out.println("error");
}
}
}

// 開発者Bのコード
public class UserService {
    private String name;
    
    public void getData() {
        if (user == null) {
            System.out.println("error");
        }
    }
}
```

同じプロジェクトなのに書き方がバラバラだと：
- 読みにくい
- 間違いを見つけにくい
- メンテナンスしにくい

**2. バグの予防**

一部のルールは、バグを防ぐ効果があります：
```java
// 悪い例（バグの原因）
if (count = 0)  // 代入（=）と比較（==）を間違えている
    doSomething();

// 良い例
if (count == 0)
    doSomething();
```

Checkstyleは、このような間違いを事前に検出します。

**3. 可読性の向上**

統一されたスタイルは、コードレビューやデバッグを効率化します。

---

## 2. Checkstyle の動作の仕組み

### チェックの流れ

```
1. Javaソースコード (.java)
        ↓
2. 抽象構文木 (AST) に変換
   Abstract Syntax Tree
   └─ クラス定義
      ├─ フィールド宣言
      ├─ メソッド定義
      │  ├─ パラメータ
      │  └─ ボディ（処理内容）
      └─ ...
        ↓
3. checkstyle.xml のルールと照合
        ↓
4. 違反があれば報告
   build/reports/checkstyle/main.html
```

### 抽象構文木（AST）とは？

**定義**: プログラムの構造をツリー（木）形式で表現したデータです。

**具体例**:

ソースコード:
```java
public void hello(String name) {
    System.out.println("Hello, " + name);
}
```

ASTのイメージ:
```
METHOD_DEF
├─ MODIFIERS (public)
├─ TYPE (void)
├─ IDENT (hello)
├─ PARAMETERS
│  └─ PARAMETER_DEF
│     ├─ TYPE (String)
│     └─ IDENT (name)
└─ SLIST (ブロック)
   └─ EXPR (式文)
      └─ METHOD_CALL
         └─ ...
```

Checkstyleは、このツリー構造を走査（トラバース）して、各ノードがルールに従っているかチェックします。

---

## 3. ファイル: `checkstyle.xml`

### ファイルの役割

**`checkstyle.xml`** は、Checkstyleのチェックルールを定義するXML形式の設定ファイルです。「どんなルールでコードをチェックするか」をすべてここに書きます。

### 対象ファイルの場所

```
backend/
└── config/
    └── checkstyle/
        └── checkstyle.xml  ← このファイル
```

### XMLとは？

**定義**: eXtensible Markup Language の略。データを構造化して記述するための言語です。

**基本構文**:
```xml
<タグ名 属性名="値">
    内容
</タグ名>
```

**HTMLとの違い**:
- HTML: Webページの表示用（タグが決まっている）
- XML: データの記述用（タグを自由に定義できる）

---

## 4. ファイルの完全解説

### ヘッダー部分

```xml
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
          "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
          "https://checkstyle.org/dtds/configuration_1_3.dtd">
```

#### 1行目: `<?xml version="1.0"?>`

**これは何？**  
XML宣言です。このファイルがXML形式であることを宣言しています。

**構文の意味**:
- `<?xml ... ?>`: XMLの特殊な命令（Processing Instruction）
- `version="1.0"`: XMLのバージョン（現在は1.0がほぼ唯一）

#### 2-4行目: `<!DOCTYPE ...>`

**これは何？**  
文書型定義（DTD: Document Type Definition）の参照です。

**役割**:
- このXMLファイルがどんな構造であるべきかを定義した「設計図」を指定する
- Checkstyleの公式サイトにあるDTDファイルを参照している

**`PUBLIC`の意味**:
- 公開されている（誰でもアクセスできる）DTDであることを示す

**DTDのURL**:
- `https://checkstyle.org/dtds/configuration_1_3.dtd`
- このファイルに、「`<module>`タグにはこういう属性が使える」などのルールが書かれている

**これがないとどうなる？**:
- XMLエディタでの自動補完が効かない
- 文法エラーの検出ができない

---

### ルート要素（最上位のモジュール）

```xml
<module name="Checker">
  <property name="severity" value="warning"/>
  <property name="fileExtensions" value="java, properties, xml"/>
```

#### `<module name="Checker">`

**これは何？**  
Checkstyleの最上位モジュールです。すべてのチェック処理の起点となります。

**モジュールとは？**  
Checkstyleでは、チェック機能を「モジュール」という単位で提供しています。モジュールは入れ子にできます。

**Checker モジュールの役割**:
- ファイル全体に対するチェック（ファイルサイズ、文字コードなど）
- 子モジュール（TreeWalker等）の管理

#### `<property name="severity" value="warning"/>`

**これは何？**  
違反が見つかった場合の「重要度レベル」を設定します。

**設定可能な値**:

| 値 | 意味 | 効果 |
|----|------|------|
| `error` | エラー | ビルドを失敗させる |
| `warning` | 警告 | 警告を出すが、ビルドは続行 |
| `info` | 情報 | ログに記録するのみ |
| `ignore` | 無視 | 何もしない |

**この設定の意味**:
- デフォルトで `warning`（警告）レベルに設定
- ビルドは失敗しないが、レポートには記録される

**なぜ `warning` にしている？**:
- 開発初期段階では、細かいスタイル違反でビルドが止まると開発効率が下がる
- 本番リリース前に `error` に変更して、違反をゼロにすることを推奨

各ルールごとに重要度を変えることも可能:
```xml
<module name="TodoComment">
    <property name="severity" value="info"/>  <!-- TODOコメントは情報レベルに -->
</module>
```

#### `<property name="fileExtensions" value="java, properties, xml"/>`

**これは何？**  
チェック対象のファイル拡張子を指定します。

**この設定の意味**:
- `.java` ファイル: Javaソースコード
- `.properties` ファイル: 設定ファイル（`application.properties`等）
- `.xml` ファイル: XML設定ファイル（`pom.xml`等）

**なぜpropertiesやxmlもチェック？**:
- 一部のCheckstyleルール（例: LineLength）は、あらゆるテキストファイルに適用できる
- プロジェクト全体のコーディング規約を統一するため

---

### TreeWalker モジュール

```xml
  <module name="TreeWalker">
```

**これは何？**  
Java特有のチェックを行うための中核モジュールです。

**役割**:
1. Javaソースコードを抽象構文木（AST）に変換
2. AST上のノード（クラス、メソッド、変数等）を走査
3. 各ノードに対してルールを適用

**Checker と TreeWalker の違い**:

```
Checker
├─ ファイル全体のチェック（ファイルサイズ、改行コードなど）
└─ TreeWalker
   └─ Javaコードの構造的なチェック（変数名、メソッド長など）
```

**なぜ分かれている？**:
- ファイルレベルのチェック（構文解析不要）とコードレベルのチェック（構文解析必要）を分離するため
- 効率化とモジュール性の向上

---

## 5. チェックルールの詳細解説

以下、TreeWalkerモジュール内に定義されている50以上のルールを、カテゴリ別に解説します。

---

### カテゴリ1: Javadoc（ドキュメントコメント）

Javadocとは、`/** ... */` 形式で書く、APIドキュメント用のコメントです。

#### `<module name="InvalidJavadocPosition"/>`

**役割**: Javadocが正しい位置に書かれているかチェックします。

**正しい位置**:
```java
/**
 * ユーザー情報を管理するクラス
 */
public class User {  // ← クラス定義の直前
    
    /**
     * ユーザー名を取得
     */
    public String getName() {  // ← メソッド定義の直前
        return name;
    }
}
```

**違反例**:
```java
public class User {
    /**
     * これは間違った位置
     */  
    // ここにコメントを書いても意味がない
    
    public String name;
}
```

**なぜこのルールが必要？**:
- Javadocは専用ツールでHTMLドキュメントに変換される
- 正しい位置にないと、ドキュメント生成時に無視される

#### `<module name="JavadocMethod"/>`

**役割**: すべてのpublicメソッドにJavadocが書かれているかチェックします。

**必須の内容**:
```java
/**
 * ユーザーを検索する
 * 
 * @param id ユーザーID
 * @return 見つかったユーザー
 * @throws UserNotFoundException ユーザーが見つからない場合
 */
public User findById(Long id) throws UserNotFoundException {
    // ...
}
```

**チェック項目**:
- Javadocの存在
- `@param` タグ（すべてのパラメータに対して）
- `@return` タグ（返り値がvoid以外の場合）
- `@throws` タグ（例外をスローする場合）

**違反例**:
```java
// Javadocがない
public User findById(Long id) {
    // ...
}

// @paramが不足
/**
 * ユーザーを検索
 */
public User findById(Long id) {  // idの説明がない
    // ...
}
```

**なぜこのルールが必要？**:
- APIの使い方を明確にする
- IDEでメソッドにカーソルを合わせると、Javadocが表示される
- チーム開発で、他の人がコードを理解しやすくなる

#### `<module name="JavadocType"/>`

**役割**: クラスやインターフェースにJavadocがあるかチェックします。

**必須の内容**:
```java
/**
 * ユーザー情報を管理するクラス
 * 
 * @author 開発者名
 * @version 1.0
 * @since 2024-01-01
 */
public class UserService {
    // ...
}
```

#### `<module name="JavadocVariable"/>`

**役割**: フィールド（変数）にJavadocがあるかチェックします。

**対象**: publicおよびprotectedなフィールド

```java
/**
 * ユーザーの一意な識別子
 */
public Long id;

/**
 * ユーザーの表示名
 */
protected String name;

private String email;  // privateはチェック対象外
```

#### `<module name="JavadocStyle"/>`

**役割**: Javadocの「書き方」が正しいかチェックします。

**チェック項目**:
1. **1文目はピリオドで終わる**
   ```java
   /** ✓ 正しい: ユーザーを取得する. */
   /** ✗ 間違い: ユーザーを取得する */
   ```

2. **HTMLタグが正しく閉じられている**
   ```java
   /** ✓ 正しい: <p>説明</p> */
   /** ✗ 間違い: <p>説明 （閉じタグがない） */
   ```

3. **文法エラーがない**

---

### カテゴリ2: 命名規則（Naming Conventions）

Javaでは、「何の種類の要素か」によって、命名ルールが決まっています。

#### `<module name="ConstantName"/>`

**役割**: 定数の名前が規則に従っているかチェックします。

**定数とは**: `static final` で宣言された変数

**命名規則**: `UPPER_SNAKE_CASE`（すべて大文字、単語をアンダースコアで区切る）

**正しい例**:
```java
public static final int MAX_SIZE = 100;
public static final String DEFAULT_USER_NAME = "Guest";
```

**違反例**:
```java
public static final int maxSize = 100;       // 小文字
public static final String defaultUserName = "Guest";  // キャメルケース
```

**なぜこのルールが必要？**:
- 一目で「これは定数だ」とわかる
- Javaの標準規約（Google Style Guide, Oracle Code Conventions）に準拠

#### `<module name="LocalFinalVariableName"/>`

**役割**: `final` 修飾子が付いたローカル変数の名前をチェックします。

**命名規則**: `camelCase`（先頭小文字、以降は単語の先頭を大文字）

```java
public void process() {
    final String userName = "Alice";  // ✓ 正しい
    final String UserName = "Alice";  // ✗ 間違い（先頭が大文字）
}
```

**なぜfinal付きとそうでないものを区別？**:
- 実は、デフォルト設定では区別しません（どちらもcamelCase）
- カスタマイズで、finalな変数に特別な命名（例: `_userName`）を強制することも可能

#### `<module name="LocalVariableName"/>`

**役割**: ローカル変数（メソッド内の変数）の名前をチェックします。

**命名規則**: `camelCase`

```java
public void calculate() {
    int totalCount = 0;       // ✓
    String userName = "Bob";  // ✓
    
    int TotalCount = 0;       // ✗ （先頭が大文字）
    String user_name = "Bob"; // ✗ （スネークケース）
}
```

#### `<module name="MemberName"/>`

**役割**: クラスのフィールド（メンバー変数）の名前をチェックします。

**命名規則**: `camelCase`

```java
public class User {
    private String userName;   // ✓
    private int totalCount;    // ✓
    
    private String UserName;   // ✗
    private int total_count;   // ✗
}
```

#### `<module name="MethodName"/>`

**役割**: メソッド名をチェックします。

**命名規則**: `camelCase`

```java
public void getUserName() { }     // ✓
public void calculateTotal() { }  // ✓

public void GetUserName() { }     // ✗ （先頭が大文字）
public void get_user_name() { }   // ✗ （スネークケース）
```

**テストメソッドの例外**:
```java
@Test
public void test_when_user_not_found_then_throw_exception() {
    // テストでは、可読性のためスネークケースを許可する場合もある
    // カスタマイズで除外可能
}
```

#### `<module name="PackageName"/>`

**役割**: パッケージ名をチェックします。

**命名規則**: すべて小文字、ドット区切り

```java
package com.example.backend.service;  // ✓
package com.example.backend.Service;  // ✗ （大文字が含まれる）
package com.example.backend_service;  // ✗ （アンダースコア）
```

#### `<module name="ParameterName"/>`

**役割**: メソッドのパラメータ（引数）名をチェックします。

**命名規則**: `camelCase`

```java
public void setUser(String userName, int userId) { }  // ✓
public void setUser(String UserName, int user_id) { } // ✗
```

#### `<module name="StaticVariableName"/>`

**役割**: staticフィールド（クラス変数）の名前をチェックします。

**命名規則**: `camelCase`

```java
private static String defaultName = "Guest";  // ✓
private static String DefaultName = "Guest";  // ✗
```

**注意**: `static final`（定数）は `ConstantName` ルールが適用されるため、ここでは`static`のみが対象です。

#### `<module name="TypeName"/>`

**役割**: クラス、インターフェース、列挙型、レコード、アノテーションの名前をチェックします。

**命名規則**: `PascalCase`（各単語の先頭が大文字）

```java
public class UserService { }        // ✓
public interface DataRepository { } // ✓
public enum Status { }              // ✓

public class userService { }        // ✗ （先頭が小文字）
public interface data_repository { }// ✗ （スネークケース）
```

---

### カテゴリ3: インポート（Imports）

インポート文の書き方に関するルールです。

#### `<module name="AvoidStarImport"/>`

**役割**: ワイルドカードインポート（`*`）を禁止します。

**違反例**:
```java
import java.util.*;  // ✗ すべてのクラスをインポート
```

**推奨**:
```java
import java.util.List;      // ✓ 必要なクラスだけ
import java.util.ArrayList; // ✓
```

**なぜ禁止？**:

1. **名前の衝突**
   ```java
   import java.util.*;
   import java.awt.*;
   
   List list;  // どちらのListか不明確
   ```

2. **使用クラスが不明確**
   - コードを読む人が、どのクラスを使っているのかわからない

3. **コンパイル時間の増加**
   - インポートするクラスが増えると、コンパイルが遅くなる

**例外**: staticインポートは許可される場合もあります
```java
import static org.junit.Assert.*;  // テストではよく使われる
```

#### `<module name="IllegalImport"/>`

**役割**: 禁止されたパッケージからのインポートを検出します。

**デフォルトで禁止されているパッケージ**:
- `sun.*`: Oracleの内部実装（非公開API）
- `com.sun.*`: 同上

**なぜ禁止？**:
- これらのクラスは、Javaのバージョンアップで予告なく変更・削除される
- 移植性（他のJVM実装での動作）が損なわれる

**カスタマイズ例**:
```xml
<module name="IllegalImport">
    <property name="illegalPkgs" value="sun, com.sun, org.apache.commons.lang"/>
    <!-- 古いライブラリの使用を禁止 -->
</module>
```

#### `<module name="RedundantImport"/>`

**役割**: 冗長なインポートを検出します。

**冗長なインポートの例**:

1. **同じパッケージ内のクラス**
   ```java
   package com.example.service;
   
   import com.example.service.UserService;  // ✗ 同じパッケージなのでインポート不要
   
   public class AdminService {
       UserService userService;  // インポートなしで使える
   }
   ```

2. **java.langパッケージ**
   ```java
   import java.lang.String;  // ✗ java.langは自動インポートされる
   ```

3. **重複インポート**
   ```java
   import java.util.List;
   import java.util.List;  // ✗ 重複
   ```

#### `<module name="UnusedImports">`

**役割**: 使われていないインポートを検出します。

```java
import java.util.List;      // 使用
import java.util.ArrayList; // ✗ 使用していない

public class Demo {
    List<String> list;
}
```

**設定オプション**:
```xml
<module name="UnusedImports">
    <property name="processJavadoc" value="false"/>
</module>
```

**`processJavadoc = false` の意味**:
- Javadoc内でのみ参照されているクラスのインポートは、「未使用」として扱わない

例:
```java
import com.example.User;  // コード内では使っていないが...

/**
 * {@link User}を処理する  ← Javadoc内で参照
 */
public class UserProcessor {
    // ...
}
```

この場合、`processJavadoc = false` なら違反にならない。

---

### カテゴリ4: サイズ制限（Size Violations）

コードの「大きさ」に関するルールです。

#### `<module name="MethodLength"/>`

**役割**: メソッドの長さ（行数）が長すぎないかチェックします。

**デフォルト制限**: 150行

**カスタマイズ例**:
```xml
<module name="MethodLength">
    <property name="max" value="100"/>  <!-- 100行に制限 -->
</module>
```

**なぜ制限？**:
- 長すぎるメソッドは、理解・テスト・デバッグが困難
- **単一責任の原則（SRP）**: 1つのメソッドは1つのことだけを行うべき

**リファクタリング例**:

違反コード（200行の長大なメソッド）:
```java
public void processOrder(Order order) {
    // 在庫チェック（50行）
    // 決済処理（50行）
    // 配送手配（50行）
    // メール送信（50行）
}
```

リファクタリング後:
```java
public void processOrder(Order order) {
    checkStock(order);
    processPayment(order);
    arrangeShipping(order);
    sendEmail(order);
}

private void checkStock(Order order) { /* 50行 */ }
private void processPayment(Order order) { /* 50行 */ }
// ...
```

#### `<module name="ParameterNumber"/>`

**役割**: メソッドのパラメータ（引数）の数が多すぎないかチェックします。

**デフォルト制限**: 7個

```java
// ✗ 違反（8個のパラメータ）
public void createUser(
    String firstName,
    String lastName,
    String email,
    int age,
    String address,
    String phone,
    String country,
    String zipCode
) { }
```

**なぜ制限？**:
- パラメータが多いと、呼び出し側で順番を間違えやすい
- メソッドが複雑すぎる可能性

**リファクタリング: パラメータオブジェクトパターン**:
```java
public class UserRequest {
    String firstName;
    String lastName;
    String email;
    // ...
}

public void createUser(UserRequest request) { }  // ✓ パラメータ1つ
```

---

### カテゴリ5: 空白（Whitespace）

インデントや空白の使い方に関するルールです。

#### `<module name="GenericWhitespace"/>`

**役割**: ジェネリクス `<>` の前後の空白をチェックします。

**正しい例**:
```java
List<String> list = new ArrayList<String>();
Map<String, Integer> map = new HashMap<>();
```

**違反例**:
```java
List <String> list;         // ✗ <の前に空白
List< String > list;        // ✗ <>の内側に空白
List<String > list;         // ✗ >の前に空白
```

#### `<module name="MethodParamPad"/>`

**役割**: メソッド名とパラメータリストの開き括弧 `(` の間に空白がないかチェックします。

**正しい例**:
```java
public void hello() { }
public void setName(String name) { }
```

**違反例**:
```java
public void hello () { }       // ✗ 空白がある
public void setName (String name) { }  // ✗
```

#### `<module name="ParenPad"/>`

**役割**: 括弧 `()` の内側に空白がないかチェックします。

**正しい例**:
```java
if (condition) { }
doSomething(a, b);
```

**違反例**:
```java
if ( condition ) { }    // ✗ 内側に空白
doSomething( a, b );    // ✗
```

#### `<module name="WhitespaceAfter"/>`

**役割**: 特定のトークンの後に空白があるかチェックします。

**対象トークン**: `,`, `;`, `typecast`

**正しい例**:
```java
int a, b, c;           // カンマの後に空白
for (int i = 0; i < 10; i++) { }  // セミコロンの後に空白
String s = (String) obj;  // キャストの後に空白
```

**違反例**:
```java
int a,b,c;            // ✗ 空白なし
String s = (String)obj;   // ✗
```

#### `<module name="WhitespaceAround"/>`

**役割**: 演算子や制御構文の前後に空白があるかチェックします。

**対象**: `=`, `+`, `-`, `if`, `for`, `while`, `{` など

**正しい例**:
```java
int a = b + c;
if (condition) { }
while (true) { }
```

**違反例**:
```java
int a=b+c;        // ✗ 空白なし
if(condition){ }  // ✗
```

---

### カテゴリ6: 修飾子（Modifiers）

#### `<module name="ModifierOrder"/>`

**役割**: 修飾子の順序が正しいかチェックします。

**Java Language Specification（JLS）で定められた推奨順序**:
```
public protected private abstract static final transient volatile synchronized native strictfp
```

**正しい例**:
```java
public static final int MAX = 100;
private final String name;
```

**違反例**:
```java
static public final int MAX = 100;  // ✗ 順序が違う
final private String name;          // ✗
```

**なぜ順序が重要？**:
- コードの統一性
- 読みやすさの向上

#### `<module name="RedundantModifier"/>`

**役割**: 冗長な修飾子を検出します。

**冗長な修飾子の例**:

1. **インターフェースのメソッド**
   ```java
   interface MyInterface {
       public abstract void doSomething();  // ✗ publicとabstractは暗黙的
       void doSomething();  // ✓ 省略可能
   }
   ```

2. **インターフェースのフィールド**
   ```java
   interface Constants {
       public static final int MAX = 100;  // ✗ 暗黙的
       int MAX = 100;  // ✓
   }
   ```

3. **finalクラスのメソッド**
   ```java
   public final class Utility {
       public final void doSomething() { }  // ✗ クラスがfinalなので不要
   }
   ```

---

### カテゴリ7: ブロック（Blocks）

#### `<module name="AvoidNestedBlocks"/>`

**役割**: 不要な入れ子ブロックを検出します。

**違反例**:
```java
public void process() {
    int x = 1;
    {  // ✗ 不要なブロック
        int y = 2;
        System.out.println(y);
    }
}
```

**例外（許可される場合）**:
```java
public void process() {
    // switch文内は許可
    switch (type) {
        case 1: {
            int temp = getValue();
            doSomething(temp);
            break;
        }
    }
}
```

#### `<module name="EmptyBlock"/>`

**役割**: 空のブロック `{}` を検出します。

**違反例**:
```java
if (condition) {
    // 何もしない
}

try {
    riskyOperation();
} catch (Exception e) {
    // ✗ 空のcatchブロック（例外を無視している）
}
```

**推奨**:
```java
// 本当に何もしない必要がある場合はコメントを書く
if (condition) {
    // TODO: 後で実装
}

// 例外を無視する正当な理由があるなら明示
try {
    riskyOperation();
} catch (NumberFormatException e) {
    // 数値変換に失敗しても処理を続ける（デフォルト値を使用）
}
```

#### `<module name="LeftCurly"/>`

**役割**: 左波括弧 `{` の位置をチェックします。

**デフォルトスタイル**: `eol`（end of line、行末）

**正しい例**:
```java
if (condition) {  // ← 同じ行
    doSomething();
}

public void method() {  // ← 同じ行
    // ...
}
```

**違反例（nl = new line スタイルの場合）**:
```java
if (condition)
{  // ✗ 次の行（C#スタイル）
    doSomething();
}
```

**カスタマイズ**:
```xml
<module name="LeftCurly">
    <property name="option" value="nl"/>  <!-- 次の行を強制 -->
</module>
```

#### `<module name="NeedBraces"/>`

**役割**: 単一文でも波括弧 `{}` を必須にします。

**違反例**:
```java
if (condition)
    doSomething();  // ✗ 波括弧がない

for (int i = 0; i < 10; i++)
    process(i);  // ✗
```

**正しい例**:
```java
if (condition) {
    doSomething();
}

for (int i = 0; i < 10; i++) {
    process(i);
}
```

**なぜ必須？**:

バグの温床:
```java
if (condition)
    doSomething();
    doAnotherThing();  // ← 常に実行される！（インデントに騙される）
```

波括弧があれば:
```java
if (condition) {
    doSomething();
    doAnotherThing();  // ✓ 意図通り
}
```

#### `<module name="RightCurly"/>`

**役割**: 右波括弧 `}` の位置をチェックします。

**デフォルトスタイル**: `same`（elseやcatchと同じ行）

**正しい例**:
```java
if (condition) {
    doSomething();
} else {  // ← }とelseが同じ行
    doOther();
}

try {
    risky();
} catch (Exception e) {  // ← }とcatchが同じ行
    handle(e);
}
```

---

### カテゴリ8: コーディング（Coding）

#### `<module name="EmptyStatement"/>`

**役割**: 空の文（`;` だけの行）を検出します。

**違反例**:
```java
if (condition);  // ✗ セミコロンが余計
    doSomething();  // ← 常に実行される（バグ）

for (int i = 0; i < 10; i++);  // ✗ 空のループ
    process(i);  // ← ループ外
```

#### `<module name="EqualsHashCode"/>`

**役割**: `equals()` をオーバーライドしたら、`hashCode()` も必ずオーバーライドすることを強制します。

**なぜ必要？**:

Java の契約ルール:
> `equals()` で等しいオブジェクトは、`hashCode()` も同じ値を返さなければならない

**違反例**:
```java
public class User {
    String name;
    
    @Override
    public boolean equals(Object obj) {  // ✗ hashCodeがない
        // ...
    }
    // hashCode()のオーバーライドがない
}
```

**問題**:
```java
Set<User> set = new HashSet<>();
set.add(user1);
set.contains(user1);  // falseになる可能性（hashCodeが違うため）
```

**正しい例**:
```java
@Override
public boolean equals(Object obj) {
    // ...
}

@Override
public int hashCode() {
    return Objects.hash(name);
}
```

#### `<module name="HiddenField"/>`

**役割**: ローカル変数がフィールドを隠していないかチェックします。

**違反例**:
```java
public class User {
    private String name;  // フィールド
    
    public void setName(String name) {  // ✗ パラメータとフィールドが同じ名前
        name = name;  // ← これではフィールドに代入できない！
    }
}
```

**正しい例**:
```java
public void setName(String name) {
    this.name = name;  // ✓ thisで明示
}

// または
public void setName(String newName) {  // ✓ 別の名前
    name = newName;
}
```

**例外（許可される場合）**:
- コンストラクタ
- setterメソッド

```xml
<module name="HiddenField">
    <property name="ignoreConstructorParameter" value="true"/>
    <property name="ignoreSetter" value="true"/>
</module>
```

#### `<module name="MagicNumber"/>`

**役割**: 「マジックナンバー（意味不明な数値リテラル）」を検出します。

**違反例**:
```java
if (age >= 18) {  // ✗ 18は何？
    allowAccess();
}

int timeout = 3600;  // ✗ 3600は何？
```

**正しい例**:
```java
private static final int ADULT_AGE = 18;
if (age >= ADULT_AGE) {
    allowAccess();
}

private static final int ONE_HOUR_SECONDS = 3600;
int timeout = ONE_HOUR_SECONDS;
```

**例外（許可される数値）**:
- `-1, 0, 1, 2`: よく使われる数値
- カスタマイズ可能:
  ```xml
  <module name="MagicNumber">
      <property name="ignoreNumbers" value="-1, 0, 1, 2, 100"/>
  </module>
  ```

#### `<module name="MissingSwitchDefault"/>`

**役割**: `switch` 文に `default` ケースがあるかチェックします。

**違反例**:
```java
switch (status) {
    case ACTIVE:
        activate();
        break;
    case INACTIVE:
        deactivate();
        break;
    // ✗ defaultがない
}
```

**正しい例**:
```java
switch (status) {
    case ACTIVE:
        activate();
        break;
    case INACTIVE:
        deactivate();
        break;
    default:
        throw new IllegalArgumentException("Unknown status: " + status);
}
```

**なぜ必要？**:
- 想定外の値に対する処理漏れを防ぐ
- 将来、列挙型に値が追加されたときの対応

#### `<module name="SimplifyBooleanExpression"/>`

**役割**: 冗長な論理式を検出します。

**違反例**:
```java
if (condition == true) { }  // ✗ == true は不要
if (condition == false) { } // ✗ == false の代わりに ! を使う
if (b == true || !b) { }    // ✗ 常にtrue
```

**正しい例**:
```java
if (condition) { }
if (!condition) { }
```

#### `<module name="SimplifyBooleanReturn"/>`

**役割**: 冗長な boolean の return 文を検出します。

**違反例**:
```java
public boolean isAdult(int age) {
    if (age >= 18) {
        return true;
    } else {
        return false;
    }
}
```

**正しい例**:
```java
public boolean isAdult(int age) {
    return age >= 18;
}
```

---

### カテゴリ9: 設計（Design）

#### `<module name="DesignForExtension"/>`

**役割**: 継承を考慮した設計になっているかチェックします。

**ルール**: オーバーライド可能なメソッド（publicかつnon-final）は、以下のいずれかであるべき：
- `abstract`
- `final`
- 空のメソッド

**理論背景**: 「継承よりコンポジション（Effective Java項目18）」

**カスタマイズ**:
実際には厳しすぎるルールなので、無効化する場合が多い:
```xml
<!-- このルールをコメントアウト -->
<!-- <module name="DesignForExtension"/> -->
```

#### `<module name="FinalClass"/>`

**役割**: インスタンス化できないクラス（privateコンストラクタのみ）は `final` にすべきとチェックします。

**違反例**:
```java
public class StringUtils {  // ✗ finalでない
    private StringUtils() { }  // インスタンス化を禁止
    
    public static String reverse(String s) {
        // ...
    }
}
```

**正しい例**:
```java
public final class StringUtils {  // ✓
    private StringUtils() { }
    
    public static String reverse(String s) {
        // ...
    }
}
```

**なぜfinalにする？**:
- 継承を禁止する（意図しない拡張を防ぐ）
- インスタンス化できないクラスを継承しても意味がない

#### `<module name="HideUtilityClassConstructor"/>`

**役割**: ユーティリティクラス（staticメソッドのみ）のコンストラクタを private にすることを強制します。

**ユーティリティクラスの例**:
```java
// ✗ publicコンストラクタがある（デフォルト）
public class MathUtils {
    public static int add(int a, int b) {
        return a + b;
    }
}

// インスタンス化できてしまう（意味がない）
MathUtils utils = new MathUtils();  // ✗
```

**正しい例**:
```java
public class MathUtils {
    private MathUtils() {  // ✓ privateコンストラクタ
        throw new AssertionError("Utility class");
    }
    
    public static int add(int a, int b) {
        return a + b;
    }
}
```

#### `<module name="InterfaceIsType"/>`

**役割**: インターフェースが「型」として機能しているかチェックします。

**違反例**: 定数だけのインターフェース（アンチパターン）
```java
// ✗ 定数だけのインターフェース
public interface Constants {
    int MAX_SIZE = 100;
    String DEFAULT_NAME = "Guest";
}
```

**なぜダメ？**:
- インターフェースは「契約（何ができるか）」を表すべき
- 定数はクラスやenumで定義すべき

**正しい例**:
```java
public final class Constants {  // ✓ クラスで定義
    private Constants() { }
    
    public static final int MAX_SIZE = 100;
    public static final String DEFAULT_NAME = "Guest";
}
```

#### `<module name="VisibilityModifier"/>`

**役割**: フィールドは原則 private にすべきとチェックします。

**違反例**:
```java
public class User {
    public String name;  // ✗ publicフィールド
}
```

**問題点**:
- カプセル化の破壊
- 外部から直接変更できてしまう
- バリデーションができない

**正しい例**:
```java
public class User {
    private String name;  // ✓
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        this.name = name;
    }
}
```

**例外**: `static final` フィールド（定数）は public でもOK
```java
public static final int MAX_SIZE = 100;  // ✓
```

---

### カテゴリ10: その他（Miscellaneous）

#### `<module name="ArrayTypeStyle"/>`

**役割**: 配列の型宣言スタイルをチェックします。

**Javaスタイル（推奨）**:
```java
String[] names;  // ✓
int[] numbers;   // ✓
```

**Cスタイル（非推奨）**:
```java
String names[];  // ✗
int numbers[];   // ✗
```

**なぜJavaスタイル？**:
- 型の一部として `[]` を書く方が、意味が明確
- Java Language Specificationで推奨されている

#### `<module name="FinalParameters"/>`

**役割**: メソッドのパラメータを `final` にすることを推奨します。

**推奨例**:
```java
public void setName(final String name) {
    this.name = name;
}
```

**なぜfinalにする？**:
- パラメータの再代入を防ぐ
- 意図しない変更を防ぐ
- Effective Java 項目57「ローカル変数のスコープを最小限にする」

**実際の運用**:
- 賛否両論のあるルール
- 冗長になるため、チームで決める

#### `<module name="TodoComment"/>`

**役割**: TODO コメントを検出します。

**検出例**:
```java
// TODO: このメソッドを最適化
public void process() {
    // ...
}
```

**なぜ検出？**:
- TODOを忘れないようにする
- リリース前にTODOがないか確認する

**カスタマイズ**:
```xml
<module name="TodoComment">
    <property name="format" value="(TODO)|(FIXME)"/>
</module>
```

#### `<module name="UpperEll"/>`

**役割**: long型リテラルで `L`（大文字）を使うことを強制します。

**違反例**:
```java
long value = 100l;  // ✗ 小文字のl（数字の1と見間違える）
```

**正しい例**:
```java
long value = 100L;  // ✓ 大文字のL
```

---

## 6. まとめ

### Checkstyleの運用Tips

**1. 段階的な導入**
- 最初は `ignoreFailures = true` で警告のみ
- 重要なルールから徐々に厳格化

**2. カスタマイズ**
- プロジェクトの特性に合わせてルールを調整
- 例: テストコードは一部ルールを緩和

**3. CI/CDへの統合**
- Pull Requestごとに自動チェック
- 違反があればマージをブロック

### 次の章へ

Checkstyleはコードの「見た目」を統一するツールでした。次章のPMDは、コードの「中身（ロジック）」をチェックするツールです。

[→ 第3章: PMD へ進む](./03_java_pmd.md)

---

[← 目次に戻る](./00_index.md)
