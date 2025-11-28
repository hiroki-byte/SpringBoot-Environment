# 第8章: ESLint と Prettier

[← 目次に戻る](./00_index.md) | [← 第7章: Next.js設定](./07_nextjs_config.md)

---

## 📋 この章で学ぶこと

- ESLintとPrettierの役割の違い
- `.eslintrc.json` の完全解説
- `.prettierrc` の完全解説
- ESLintとPrettierの統合方法
- コード品質とフォーマットのベストプラクティス

---

## 1. ESLint と Prettier の違い

### 役割の比較

| ツール | 焦点 | 検出内容 | 例 |
|--------|------|----------|-----|
| **ESLint** | コードの品質 | バグ、ベストプラクティス違反 | 未使用変数、`console.log` の使用 |
| **Prettier** | コードの見た目 | フォーマット | インデント、行の長さ、クォート |

### 具体例

**ESLintが検出**:
```javascript
const userName = 'Alice';  // ✗ 使われていない変数
console.log('Debug');      // ✗ console.logの使用
```

**Prettierが修正**:
```javascript
// 修正前
function  hello(  name  ){
return"Hello, "+name
}

// 修正後
function hello(name) {
  return 'Hello, ' + name;
}
```

### なぜ両方必要？

- **ESLint**: バグを防ぐ、ベストプラクティスを強制
- **Prettier**: 見た目を統一、コードレビューの負担軽減

---

## 2. ファイル: `frontend/.eslintrc.json`

### ファイルの役割

**`.eslintrc.json`** は、ESLintの設定ファイルです。どんなルールでコードをチェックするかを定義します。

### 完全なファイル内容

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error",
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error"]
      }
    ]
  }
}
```

---

### フィールドの詳細解説

#### `"extends": ["next/core-web-vitals", "prettier"]`

**`extends` とは？**:
既存の設定セット（ルール集）を継承する機能

**利点**:
- 一から設定を書かなくて済む
- ベストプラクティスを簡単に適用

**配列の順序が重要**:
```json
["next/core-web-vitals", "prettier"]
```
→ 後ろのものが前のものを上書き

##### `"next/core-web-vitals"`

**提供元**: `eslint-config-next` パッケージ

**Core Web Vitalsとは？**:
Googleが定義した、Webパフォーマンスの重要指標
- LCP (Largest Contentful Paint): 最大コンテンツの描画
- FID (First Input Delay): 最初の入力遅延
- CLS (Cumulative Layout Shift): レイアウトのずれ

**含まれるルール**:

1. **`@next/next/no-img-element`**
   ```javascript
   // ✗ <img> タグの使用
   <img src="/logo.png" alt="Logo" />
   
   // ✓ Next.jsのImageコンポーネント
   <Image src="/logo.png" alt="Logo" width={100} height={100} />
   ```
   **理由**: Next.jsのImageは自動で画像を最適化（WebP変換、遅延読み込み等）

2. **`@next/next/no-html-link-for-pages`**
   ```javascript
   // ✗ <a> タグでの内部リンク
   <a href="/about">About</a>
   
   // ✓ Next.jsのLinkコンポーネント
   <Link href="/about">About</Link>
   ```
   **理由**: Linkコンポーネントはクライアントサイドルーティング（高速）

3. **React Hooks のルール**
   ```javascript
   // ✗ 条件付きフックの呼び出し
   if (condition) {
     useState(0);
   }
   
   // ✓ トップレベルでのみ呼び出し
   const [state, setState] = useState(0);
   if (condition) {
     setState(1);
   }
   ```

##### `"prettier"`

**提供元**: `eslint-config-prettier` パッケージ

**役割**: ESLintとPrettierの競合を解消

**問題のシナリオ**:
```javascript
// ESLintのルール: セミコロン必須
const name = 'Alice';

// Prettierの設定: セミコロンなし
const name = 'Alice'
```
→ 両方が動くとエラーの応酬

**解決方法**:
`eslint-config-prettier` がESLintのフォーマット関連ルールを無効化

**無効化されるルール例**:
- `quotes`: クォートの種類
- `semi`: セミコロンの有無
- `indent`: インデント

→ これらはPrettierに任せる

#### `"plugins": ["prettier"]`

**`plugins` とは？**:
追加のルールセットを有効化するための機能

**`extends` との違い**:

| `extends` | `plugins` |
|-----------|-----------|
| 設定をそのまま継承 | ルールを利用可能にするだけ |
| ルールが自動で有効化 | 手動で `rules` に書く必要 |

**`prettier` プラグイン**:
`eslint-plugin-prettier` パッケージが提供

**効果**: Prettierをルール内で使えるようになる
```json
"rules": {
  "prettier/prettier": "error"  // ← これが使える
}
```

#### `"rules": { ... }`

**`rules` とは？**:
個別のルールを設定するセクション

**ルールのレベル**:
- `"off"` または `0`: 無効
- `"warn"` または `1`: 警告（ビルドは成功）
- `"error"` または `2`: エラー（ビルド失敗）

##### `"prettier/prettier": "error"`

**意味**: Prettierのフォーマットルールに違反したらエラー

**動作**:
```javascript
// Prettierの設定: シングルクォート

// コード
const name = "Alice";  // ✗ ダブルクォート

// ESLint実行
// Error: Replace `"Alice"` with `'Alice'` (prettier/prettier)
```

**自動修正**:
```bash
npm run lint -- --fix  # Prettierのルールに従って自動修正
```

##### `"no-console": ["warn", { "allow": ["warn", "error"] }]`

**`no-console` ルールとは？**:
`console` メソッドの使用を制限

**レベル**: `"warn"`（警告）

**オプション**: `{ "allow": ["warn", "error"] }`

**意味**:
- `console.log()`: ✗ 警告
- `console.debug()`: ✗ 警告
- `console.warn()`: ✓ 許可
- `console.error()`: ✓ 許可

**理由**:
- `console.log` はデバッグ用、本番コードに残すべきでない
- `console.warn` / `console.error` は重要なログなので許可

**違反例と推奨**:
```javascript
// ✗ 違反
console.log('User logged in');

// ✓ 推奨（開発時のみ）
if (process.env.NODE_ENV === 'development') {
  console.log('User logged in');
}

// ✓ 推奨（エラーログは常にOK）
console.error('Failed to fetch data');
```

---

## 3. ファイル: `frontend/.prettierrc`

### ファイルの役割

**`.prettierrc`** は、Prettierの設定ファイルです。コードのフォーマットルールを定義します。

### 完全なファイル内容

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

### オプションの詳細解説

#### `"semi": true`

**役割**: 文末にセミコロン（`;`）を付けるか

**`true` の場合**:
```javascript
const name = 'Alice';  // ← セミコロンあり
const age = 30;
```

**`false` の場合**:
```javascript
const name = 'Alice'  // ← セミコロンなし
const age = 30
```

**どちらが良い？**:
- JavaScriptではセミコロンは省略可能だが...
- ASI（Automatic Semicolon Insertion）の落とし穴がある

**ASIの問題例**:
```javascript
// セミコロンなし
return
  'Hello'  // ← return; 'Hello' と解釈される（意図と異なる）

// セミコロンあり
return;
  'Hello';  // エラーが明確
```

**推奨**: `true`（安全側）

#### `"singleQuote": true`

**役割**: 文字列をシングルクォート（`'`）で囲むか

**`true` の場合**:
```javascript
const name = 'Alice';
const message = 'Hello, world!';
```

**`false` の場合**:
```javascript
const name = "Alice";
const message = "Hello, world!";
```

**どちらが良い？**:
- JavaScriptでは両方OK
- 統一することが重要

**例外**: JSX内では常にダブルクォート
```jsx
<div className="container">  {/* ← ダブルクォート（HTML慣習） */}
  <p>{'Hello'}</p>  {/* ← 中身はシングル */}
</div>
```

#### `"tabWidth": 2`

**役割**: インデントの幅（スペース数）

**`2` の場合**:
```javascript
function hello() {
··return 'Hello';
}
```

**`4` の場合**:
```javascript
function hello() {
····return 'Hello';
}
```

**どちらが良い？**:
- JavaScript/TypeScript: 2スペースが一般的
- Python: 4スペースが一般的
- 重要なのはプロジェクト内で統一すること

#### `"trailingComma": "es5"`

**役割**: 末尾のカンマ（Trailing Comma）をどこに付けるか

**値の選択肢**:

##### `"none"`: 末尾カンマなし
```javascript
const obj = {
  name: 'Alice',
  age: 30  // ← カンマなし
};
```

##### `"es5"`: ES5で有効な場所のみ
```javascript
const obj = {
  name: 'Alice',
  age: 30,  // ← オブジェクトと配列はOK
};

function hello(
  name,
  age,  // ✗ 関数パラメータはNG（ES5で不可）
) {}
```

##### `"all"`: すべての場所
```javascript
function hello(
  name,
  age,  // ← 関数パラメータもOK（ES2017以降）
) {}
```

**推奨**: `"es5"`（互換性と利便性のバランス）

**末尾カンマの利点**:

1. **Gitの差分が見やすい**
   ```diff
   const obj = {
     name: 'Alice',
   -  age: 30
   +  age: 30,
   +  city: 'Tokyo'
   };
   ```
   末尾カンマがないと、`age: 30` 行も変更として表示される

2. **要素の追加/削除が楽**
   ```javascript
   const items = [
     'apple',
     'banana',  // ← これを削除してもエラーにならない
   ];
   ```

#### `"printWidth": 100`

**役割**: 1行の最大文字数

**`100` の場合**:
```javascript
// 100文字以内なら1行
const message = 'This is a long message that fits within 100 characters so it stays on one line';

// 100文字を超えたら自動改行
const veryLongMessage =
  'This is an extremely long message that exceeds 100 characters so Prettier will automatically break it into multiple lines for better readability';
```

**一般的な値**:
- `80`: 伝統的（昔の端末の制限）
- `100`: 現代的なバランス
- `120`: 広いモニター向け

**このプロジェクトで100を選んだ理由**:
- 80は狭すぎる（現代のIDEでは不便）
- 120は広すぎる（コードレビュー時に横スクロールが必要）
- 100はちょうど良いバランス

---

## 4. ESLintとPrettierの統合

### 統合の仕組み

```
コードを書く
    ↓
Prettier で自動フォーマット
    ↓
ESLint でコード品質をチェック
    ↓
問題があれば警告/エラー
```

### npm scripts での統合

```json
"scripts": {
  "lint": "next lint",           // ESLint実行（Prettierも含む）
  "lint:fix": "next lint --fix", // 自動修正
  "format": "prettier --write ."  // Prettierのみ実行
}
```

### IDEでの統合

**VS Code設定例** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

**効果**:
1. ファイル保存時、Prettierで自動フォーマット
2. ESLintの自動修正可能なエラーを自動修正

---

## 5. よくあるルールのカスタマイズ例

### ESLintルールの追加

```json
{
  "rules": {
    "no-console": "warn",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prefer-const": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**`no-unused-vars`**:
- 使われていない変数を検出
- `argsIgnorePattern`: `_` で始まる引数は無視

**`prefer-const`**:
- 再代入しない変数は `const` を使うことを強制

**`@typescript-eslint/no-explicit-any`**:
- `any` 型の使用を警告

### Prettierオプションの追加

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**`arrowParens`**:
```javascript
// "always"
const greet = (name) => `Hello, ${name}`;

// "avoid"
const greet = name => `Hello, ${name}`;
```

**`endOfLine`**:
- `"lf"`: Linux/Mac形式（`\n`）
- `"crlf"`: Windows形式（`\r\n`）
- `"auto"`: OSに応じて自動

---

## 6. トラブルシューティング

### ESLintとPrettierが競合する

**症状**:
```
Error: Delete `␍` (prettier/prettier)
Error: Expected linebreaks to be 'LF' but found 'CRLF' (linebreak-style)
```

**原因**: ESLintのフォーマットルールとPrettierが競合

**解決**: `eslint-config-prettier` を `extends` に追加
```json
{
  "extends": ["next/core-web-vitals", "prettier"]
}
```

### Windows改行コード問題

**症状**: Windowsで編集したファイルがLinuxでエラー

**解決1**: Prettierで統一
```json
{
  "endOfLine": "lf"
}
```

**解決2**: Gitで自動変換
```bash
git config --global core.autocrlf true
```

---

## 7. まとめ

### ESLint vs Prettier

| 項目 | ESLint | Prettier |
|------|--------|----------|
| 目的 | コード品質 | コード見た目 |
| 検出 | バグ、ベストプラクティス | フォーマット |
| 自動修正 | 一部可能 | 全自動 |
| 設定 | ルールごとに詳細設定 | シンプルなオプション |

### ベストプラクティス

1. **Prettierを先に実行**: フォーマットを統一
2. **ESLintでコード品質をチェック**: バグを防ぐ
3. **IDEに統合**: 保存時に自動実行
4. **CI/CDで強制**: Pull Request時にチェック

### 教科書の完走おめでとうございます！

全8章を通じて、プロジェクトの設定ファイルをすべて学びました。これで、各ツールが「なぜそこにあるのか」「何をしているのか」を理解できたはずです。

---

[← 目次に戻る](./00_index.md)
