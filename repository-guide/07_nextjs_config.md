# 第7章: Next.js 設定ファイル

[← 目次に戻る](./00_index.md) | [← 第6章: 本番用Dockerfile](./06_docker_prod.md) | [→ 第8章: ESLint & Prettier](./08_nextjs_eslint_prettier.md)

---

## 📋 この章で学ぶこと

- package.json の構造と各フィールドの意味
- npm scripts の詳細
- Next.js設定（next.config.mjs）
- TypeScript設定（tsconfig.json）
- パスエイリアスの設定

---

## 1. ファイル: `frontend/package.json`

### ファイルの役割

**`package.json`** は、Node.jsプロジェクトのメタデータと依存関係を管理するファイルです。プロジェクトの「設計図」です。

### 完全なファイル内容

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write ."
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.3",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "prettier": "^3.2.5",
    "typescript": "^5"
  }
}
```

---

### フィールドの詳細解説

#### `"name": "frontend"`

**役割**: プロジェクト名を指定

**命名規則**:
- 小文字のみ
- スペース不可（ハイフンやアンダースコアはOK）
- 214文字以内

**使用例**:
```bash
npm install  # "Installing frontend..."
```

#### `"version": "0.1.0"`

**役割**: プロジェクトのバージョン番号

**セマンティックバージョニング**:
```
0.1.0
^ ^ ^
| | パッチバージョン（バグ修正）
| マイナーバージョン（機能追加、互換性あり）
メジャーバージョン（破壊的変更）
```

**`0.x.x` の意味**: 初期開発段階（API未確定）

#### `"private": true`

**役割**: このパッケージをnpmレジストリに公開しないことを保証

**効果**:
```bash
npm publish  # エラー: このパッケージはprivateです
```

**なぜ必要？**:
- 誤って社内プロジェクトを公開してしまうのを防ぐ
- セキュリティ対策

---

### scripts セクション

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write ."
  },
```

**scriptsとは？**:
コマンドのエイリアス（ショートカット）を定義するセクションです。

#### `"dev": "next dev"`

**実行方法**: `npm run dev`

**実際に実行されるコマンド**: `next dev`

**`next dev` の役割**:
- Next.jsの開発サーバーを起動
- ポート3000でリッスン
- ホットリロード有効（ファイル変更を自動検知）
- Fast Refresh（コンポーネントの状態を保持したまま再読み込み）

**開発サーバーの機能**:
- TypeScriptの自動コンパイル
- エラーオーバーレイ（画面にエラーを表示）
- 自動ページ生成

#### `"build": "next build"`

**実行方法**: `npm run build`

**`next build` の役割**:
本番用にアプリケーションをビルド

**処理内容**:
1. TypeScriptをJavaScriptにコンパイル
2. ページの最適化（コード分割、ツリーシェイキング）
3. 静的ファイルの生成
4. 画像の最適化
5. CSS / JavaScriptの圧縮

**生成される出力**:
```
.next/
├── static/          # 静的アセット（CSS、JS）
├── server/          # サーバーサイドコード
└── standalone/      # 実行用の最小ファイル（output: 'standalone' の場合）
```

**ビルド時の最適化**:
- Dead Code Elimination（使われていないコードの削除）
- Minification（コードの圧縮）
- Code Splitting（ページごとに分割）

#### `"start": "next start"`

**実行方法**: `npm start`

**`next start` の役割**:
ビルド済みのアプリケーションを本番モードで起動

**前提**: 事前に `npm run build` を実行している必要がある

**使用例**:
```bash
npm run build   # ビルド
npm start       # 本番モードで起動
```

**`dev` vs `start`**:

| コマンド | モード | ホットリロード | 速度 | 用途 |
|---------|--------|---------------|------|------|
| `npm run dev` | 開発 | あり | 遅い | 開発中 |
| `npm start` | 本番 | なし | 速い | 本番確認 |

#### `"lint": "next lint"`

**実行方法**: `npm run lint`

**`next lint` の役割**:
ESLintを使ってコードをチェック

**チェック内容**:
- 構文エラー
- コーディング規約違反
- Next.js特有のベストプラクティス

**出力例**:
```
✖ 3 problems (3 errors, 0 warnings)
  3 errors and 0 warnings potentially fixable with the `--fix` option.
```

#### `"lint:fix": "next lint --fix"`

**実行方法**: `npm run lint:fix`

**`--fix` オプション**:
自動修正可能なエラーを自動的に修正

**修正例**:
- 不要な空白の削除
- セミコロンの追加/削除
- インデントの修正

**自動修正できないエラー**:
- 未使用変数（削除すべきか判断できない）
- ロジックエラー

#### `"format": "prettier --write ."`

**実行方法**: `npm run format`

**`prettier --write .` の役割**:
すべてのファイルをPrettierでフォーマット

**`--write` オプション**: ファイルを直接書き換える

**`.` の意味**: カレントディレクトリ以下のすべてのファイル

**対象ファイル**:
- `.prettierrc` で設定
- デフォルト: `.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.md`, `.css` 等

---

### dependencies セクション

```json
  "dependencies": {
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18"
  },
```

**dependenciesとは？**:
アプリケーションの実行に必要なパッケージ（本番環境でも必要）

#### `"next": "14.2.3"`

**バージョン指定**: `14.2.3` に固定

**固定バージョンの意味**:
- `npm install` で常に `14.2.3` がインストールされる
- 予期しないバージョン変更を防ぐ

#### `"react": "^18"`

**`^` の意味**: キャレット（caret）記法

**バージョン範囲**: `^18` = `>=18.0.0 <19.0.0`

**具体例**:
- `18.0.0` ✓
- `18.2.0` ✓
- `18.9.9` ✓
- `19.0.0` ✗

**なぜキャレット？**:
- マイナー・パッチバージョンの更新は互換性があるため
- セキュリティパッチを自動で適用

**他のバージョン記法**:

| 記法 | 意味 | 例 | 範囲 |
|------|------|-----|------|
| `^1.2.3` | メジャー固定 | `^1.2.3` | `>=1.2.3 <2.0.0` |
| `~1.2.3` | マイナー固定 | `~1.2.3` | `>=1.2.3 <1.3.0` |
| `1.2.3` | 完全固定 | `1.2.3` | `1.2.3` のみ |
| `*` | 最新 | `*` | 任意のバージョン |

---

### devDependencies セクション

```json
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.3",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "prettier": "^3.2.5",
    "typescript": "^5"
  }
```

**devDependenciesとは？**:
開発時のみ必要なパッケージ（本番環境では不要）

**本番ビルドへの影響**:
```bash
npm install              # dependencies + devDependencies
npm install --production # dependencies のみ
```

#### TypeScript型定義

##### `"@types/node": "^20"`

**役割**: Node.jsのAPIの型定義

**例**:
```typescript
import { readFile } from 'fs';  // ← Node.jsのAPI
// @types/node のおかげで、型が利用可能
```

##### `"@types/react": "^18"`

**役割**: ReactのAPIの型定義

**例**:
```typescript
import { useState } from 'react';
const [count, setCount] = useState(0);  // ← 型推論が効く
```

#### ESLint関連

##### `"eslint": "^8"`

**役割**: ESLint本体

**ESLintとは？**:
JavaScriptの静的解析ツール（コードの問題を検出）

##### `"eslint-config-next": "14.2.3"`

**役割**: Next.js公式のESLint設定

**含まれるルール**:
- React Hooks のルール
- Next.js特有のベストプラクティス
- アクセシビリティのチェック

##### `"eslint-config-prettier": "^9.1.0"`

**役割**: ESLintとPrettierの競合を解消

**問題**:
ESLintとPrettierの両方がフォーマットをチェックすると、矛盾が発生

**解決**:
ESLintのフォーマット関連ルールを無効化（Prettierに任せる）

##### `"eslint-plugin-prettier": "^5.1.3"`

**役割**: PrettierをESLintのルールとして実行

**効果**:
```bash
npm run lint  # Prettierのチェックも実行される
```

#### フォーマッター

##### `"prettier": "^3.2.5"`

**役割**: コードフォーマッター本体

**Prettierとは？**:
コードの見た目を自動で統一するツール

#### TypeScript

##### `"typescript": "^5"`

**役割**: TypeScriptコンパイラ

**TypeScriptとは？**:
JavaScriptに型を追加した言語

---

## 2. ファイル: `frontend/next.config.mjs`

### ファイルの役割

**`next.config.mjs`** は、Next.jsの動作をカスタマイズする設定ファイルです。

### 完全なファイル内容

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

---

### 詳細解説

#### `/** @type {import('next').NextConfig} */`

**これは何？**: JSDoc型アノテーション

**役割**: TypeScriptを使わなくても、型のヒントを提供

**効果**:
- IDEで自動補完が効く
- 設定ミスを防ぐ

**なくても動く**: コメントなので、実行には影響しない

#### `const nextConfig = { ... }`

**設定オブジェクト**: Next.jsの設定を定義

#### `output: 'standalone'`

**これが最も重要な設定です。**

**`standalone` とは？**:
Next.jsのビルド出力モードの一つ

**効果**:
ビルド時に、実行に必要な最小限のファイルだけを `.next/standalone/` に出力

**通常モードとの違い**:

**通常モード**:
```
npm run build
  ↓
.next/
├── server/
├── static/
└── ...

実行:
node_modules/ が必要（300MB）
```

**standaloneモード**:
```
npm run build
  ↓
.next/standalone/
├── server.js
├── node_modules/ （必要な部分のみ）
└── ...

実行:
node_modules/ から必要なファイルだけコピー（30MB）
```

**本番Dockerfileとの連携**:
```dockerfile
# Dockerfile.prod
COPY --from=builder /app/.next/standalone ./
CMD ["node", "server.js"]
```

**利点**:
- Dockerイメージサイズが劇的に小さくなる
- 起動時間が速くなる
- セキュリティ向上（不要なファイルを含まない）

#### 他の設定例

```javascript
const nextConfig = {
  output: 'standalone',
  
  // 環境変数
  env: {
    API_URL: process.env.API_URL,
  },
  
  // 画像の最適化
  images: {
    domains: ['example.com'],
  },
  
  // リダイレクト
  async redirects() {
    return [
      {
        source: '/old-page',
        destination: '/new-page',
        permanent: true,
      },
    ];
  },
};
```

---

## 3. ファイル: `frontend/tsconfig.json`

### ファイルの役割

**`tsconfig.json`** は、TypeScriptコンパイラの設定ファイルです。

### 完全なファイル内容

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### compilerOptions の詳細

#### `"lib": ["dom", "dom.iterable", "esnext"]`

**役割**: 使用可能なJavaScript APIを指定

**`dom`**: ブラウザのDOM API
```typescript
document.getElementById('app');  // ← これが使える
```

**`dom.iterable`**: DOMコレクションの反復処理
```typescript
for (const element of document.querySelectorAll('div')) { }
```

**`esnext`**: 最新のECMAScript機能

#### `"allowJs": true`

**役割**: `.js` ファイルもコンパイル対象にする

**効果**: `.ts` と `.js` を混在できる（段階的な移行が可能）

#### `"skipLibCheck": true`

**役割**: `node_modules` 内の型定義ファイル（`.d.ts`）のチェックをスキップ

**理由**: コンパイル時間の短縮（外部ライブラリのエラーは無視）

#### `"strict": true`

**役割**: 厳格な型チェックを有効化

**含まれるオプション**:
- `strictNullChecks`: null/undefinedの厳密チェック
- `strictFunctionTypes`: 関数の型を厳密にチェック
- `noImplicitAny`: 暗黙の `any` を禁止

**効果**:
```typescript
// strict: true の場合
function greet(name: string) {  // 型が必須
  return `Hello, ${name}`;
}

// strict: false の場合
function greet(name) {  // 型なしでもOK（anyとして扱われる）
  return `Hello, ${name}`;
}
```

#### `"noEmit": true`

**役割**: JavaScriptファイルを出力しない

**なぜ？**: Next.jsが独自のビルドプロセスを持っているため

**TypeScriptの役割**: 型チェックのみ（コンパイルはNext.jsがやる）

#### `"esModuleInterop": true`

**役割**: CommonJSモジュールのインポートを簡単にする

**効果**:
```typescript
// esModuleInterop: true
import React from 'react';  // ✓ シンプル

// esModuleInterop: false
import * as React from 'react';  // 冗長
```

#### `"module": "esnext"`

**役割**: 出力するモジュール形式を指定

**`esnext`**: 最新のESモジュール形式（`import`/`export`）

#### `"moduleResolution": "bundler"`

**役割**: モジュールの解決方法を指定

**`bundler`**: バンドラー（Webpack、Vite等）を前提とした解決

**効果**: パッケージの`exports`フィールドを使用

#### `"resolveJsonModule": true`

**役割**: JSONファイルを直接インポート可能にする

**例**:
```typescript
import config from './config.json';
console.log(config.apiUrl);
```

#### `"isolatedModules": true`

**役割**: 各ファイルを独立したモジュールとして扱う

**制約**: `const enum` や `namespace` が使えない

**理由**: Babelなど、他のトランスパイラとの互換性

#### `"jsx": "preserve"`

**役割**: JSX構文の処理方法を指定

**`preserve`**: JSXをそのまま保持（Next.jsが処理）

**他の選択肢**:
- `react`: `React.createElement` に変換
- `react-jsx`: 新しいJSX Transform

#### `"incremental": true`

**役割**: インクリメンタルコンパイルを有効化

**効果**: 前回のコンパイル情報をキャッシュ → 再コンパイルが高速化

#### `"plugins": [{"name": "next"}]`

**役割**: Next.js用のTypeScriptプラグインを有効化

**効果**: Next.js特有の型サポート（`app/`ディレクトリ等）

#### `"paths": {"@/*": ["./src/*"]}`

**役割**: パスエイリアス（ショートカット）を定義

**効果**:
```typescript
// パスエイリアスなし
import Button from '../../../components/Button';

// パスエイリアスあり
import Button from '@/components/Button';
```

**利点**:
- 相対パスの煩雑さを解消
- ファイル移動時にインポートパスを変更しなくて済む

---

### include / exclude

#### `"include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]`

**役割**: コンパイル対象のファイルを指定

**`**/*.ts`**: すべての `.ts` ファイル

**`**/*.tsx`**: すべての `.tsx` ファイル（JSX含む）

#### `"exclude": ["node_modules"]`

**役割**: コンパイル対象から除外

**`node_modules`**: 外部ライブラリは除外

---

## 4. ファイル: `frontend/package-lock.json`

### ファイルの役割

**`package-lock.json`** は、Node.jsプロジェクトの依存関係の正確なバージョンを記録するロックファイルです。

### 対象ファイルの場所

```
frontend/
└── package-lock.json  ← このファイル
```

### なぜ必要？

#### 問題のシナリオ

**package.jsonだけの場合**:
```json
{
  "dependencies": {
    "react": "^18"
  }
}
```

**開発者Aの環境** (2024年1月):
```
npm install
→ react 18.2.0 がインストールされる
```

**開発者Bの環境** (2024年6月):
```
npm install
→ react 18.3.0 がインストールされる（新しいバージョンが出た）
```

**結果**: 同じ `package.json` なのに、異なるバージョンがインストールされる！

#### package-lock.jsonの解決

```json
{
  "name": "frontend",
  "lockfileVersion": 3,
  "dependencies": {
    "react": {
      "version": "18.2.0",
      "resolved": "https://registry.npmjs.org/react/-/react-18.2.0.tgz",
      "integrity": "sha512-..."
    }
  }
}
```

**効果**:
- 全員が **必ず** `18.2.0` をインストール
- 再現性の保証

---

### ファイルの構造

**サイズ**: 通常数千行〜数万行（大きなプロジェクトでは10万行以上）

**主要フィールド**:

#### 1. メタデータ

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "lockfileVersion": 3
}
```

**`lockfileVersion`**: ロックファイルの形式バージョン
- バージョン1: npm 5-6
- バージョン2: npm 7+（後方互換性あり）
- バージョン3: npm 7+（最新フォーマット）

#### 2. packages セクション

```json
{
  "packages": {
    "": {
      "name": "frontend",
      "version": "0.1.0",
      "dependencies": {
        "next": "14.2.3",
        "react": "^18"
      }
    },
    "node_modules/react": {
      "version": "18.2.0",
      "resolved": "https://registry.npmjs.org/react/-/react-18.2.0.tgz",
      "integrity": "sha512-...",
      "engines": {
        "node": ">=0.10.0"
      }
    }
  }
}
```

##### フィールドの意味

**`version`**: インストールされる正確なバージョン

**`resolved`**: ダウンロード元のURL

**`integrity`**: ファイルの整合性チェック（SHA-512ハッシュ）
- ダウンロードしたファイルが改ざんされていないか検証
- セキュリティ対策

#### 3. dependencies ツリー (lockfileVersion 1-2)

```json
{
  "dependencies": {
    "react": {
      "version": "18.2.0",
      "resolved": "...",
      "integrity": "...",
      "requires": {
        "loose-envify": "^1.1.0"
      }
    },
    "loose-envify": {
      "version": "1.4.0",
      "resolved": "...",
      "requires": {
        "js-tokens": "^3.0.0 || ^4.0.0"
      }
    }
  }
}
```

**依存関係の連鎖**:
```
react 18.2.0
  └─ loose-envify 1.4.0
      └─ js-tokens 4.0.8
```

---

### 操作方法

#### 生成

```bash
npm install
```

**効果**:
- `package.json` を読む
- 依存関係を解決
- `package-lock.json` を自動生成/更新

#### 更新

```bash
# 特定のパッケージを更新
npm update react

# すべてを最新に更新
npm update
```

**重要**: `package-lock.json` も自動更新される

#### 再インストール（厳密）

```bash
npm ci
```

**`npm ci` とは？**: Clean Install

**`npm install` との違い**:

| コマンド | 挙動 | 用途 |
|---------|------|------|
| `npm install` | `package-lock.json` を生成/更新 | 開発環境 |
| `npm ci` | `package-lock.json` を厳密に再現 | CI/CD、本番 |

**`npm ci` の動作**:
1. `node_modules` フォルダを完全削除
2. `package-lock.json` から厳密にインストール
3. `package.json` と不整合があればエラー

---

### よくあるトラブル

#### トラブル1: マージコンフリクト

**シナリオ**:
```
開発者A: パッケージXを追加 → Git push
開発者B: パッケージYを追加 → Git push
→ package-lock.json でコンフリクト
```

**解決方法**:
```bash
# コンフリクトマーカーを削除してから
npm install
# package-lock.jsonが自動修復される
git add package-lock.json
git commit
```

#### トラブル2: ロックファイルの不整合

**エラー**:
```
npm ERR! The package-lock.json file is out of sync with package.json
```

**解決**:
```bash
# 方法1: 再生成
rm package-lock.json
npm install

# 方法2: npm の修復機能を使う
npm install --package-lock-only
```

---

### ベストプラクティス

#### 1. バージョン管理に含める

**必ずGitにコミット**:
```bash
git add package-lock.json
git commit -m "Update dependencies"
```

**理由**:
- チーム全員が同じバージョンを使用
- 本番環境との再現性

#### 2. 手動編集しない

**ダメ**: `package-lock.json` を直接編集

**正しい**: `npm install` や `npm update` で自動更新

#### 3. CI/CDでは `npm ci` を使う

**推奨**:
```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: npm ci
```

**理由**: 再現性の保証

---

## 5. ファイル: `frontend/next-env.d.ts`

### ファイルの役割

**`next-env.d.ts`** は、Next.jsの型定義を参照するTypeScript宣言ファイルです。

### 対象ファイルの場所

```
frontend/
└── next-env.d.ts  ← このファイル
```

### 完全なファイル内容

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
```

---

### 行ごとの詳細解説

#### `/// <reference types="next" />`

**トリプルスラッシュディレクティブ**:
TypeScriptの特殊な構文で、型定義を参照します。

**構文**: `/// <reference types="パッケージ名" />`

**この行の意味**:
- `next` パッケージの型定義を読み込む
- Next.jsのAPIに対して型補完が効くようになる

**具体例**:
```typescript
import { NextPage } from 'next';  // ← 型が利用可能
import Image from 'next/image';   // ← 型が利用可能
```

**なぜ必要？**:
- TypeScriptはデフォルトでは `node_modules/@types/` 配下の型定義しか読まない
- `next` パッケージ自体に型定義があるが、明示的に参照する必要がある

#### `/// <reference types="next/image-types/global" />`

**役割**: Next.jsの画像最適化機能の型定義を読み込む

**提供される型**:
```typescript
// next-env.d.tsのおかげで、これらが使える
import type { StaticImageData } from 'next/image';

// 画像インポートの型
import logo from './logo.png';
// logoの型: StaticImageData
```

**Next.jsの画像インポート**:
```typescript
import myImage from './photo.jpg';

// myImageは以下の情報を持つ
// {
//   src: string,
//   width: number,
//   height: number,
//   blurDataURL?: string
// }
```

#### コメント: `// NOTE: This file should not be edited`

**重要な警告**: このファイルは編集してはいけません

**理由**:
1. **自動生成ファイル**: Next.jsが起動時に自動生成/更新する
2. **手動編集は上書きされる**: `next dev` や `next build` で再生成される

#### コメント: 参照URL

```
see https://nextjs.org/docs/basic-features/typescript for more information.
```

Next.jsの公式TypeScriptドキュメントへのリンク。

---

### このファイルの生成タイミング

#### 1. 初回プロジェクト作成時

```bash
npx create-next-app@latest
# next-env.d.ts が自動生成される
```

#### 2. Next.js起動時

```bash
npm run dev
# 起動時にnext-env.d.tsをチェック・更新
```

**ログ例**:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
info  - automatically enabled Fast Refresh for 1 custom loader
event - compiled client and server successfully in 2.3s
```

---

### なぜ `.d.ts` 拡張子？

**`.d.ts` とは？**: Declaration File（型宣言ファイル）

**役割**:
- 型情報のみを提供（実装コードはない）
- JavaScriptライブラリにTypeScriptの型を付ける

**構造**:
```typescript
// 通常のTypeScriptファイル (.ts)
export function hello(name: string): string {
  return `Hello, ${name}`;  // ← 実装がある
}

// 型宣言ファイル (.d.ts)
export function hello(name: string): string;  // ← 型だけ
```

---

### tsconfig.jsonとの関係

**`tsconfig.json` の `include` フィールド**:
```json
{
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

**`next-env.d.ts` が明示的に含まれている**:
- TypeScriptコンパイラがこのファイルを必ず読み込む
- Next.jsの型定義が常に利用可能になる

---

### バージョン管理

#### Gitに含めるべき？

**推奨**: `.gitignore` に含める

**.gitignoreの例**:
```
# Next.js generated files
.next/
next-env.d.ts  # ← これを追加
```

**理由**:
- 自動生成ファイル
- Next.jsのバージョンによって内容が変わる可能性
- チームメンバーそれぞれが生成すれば良い

**ただし、含めても問題ない**:
- ファイルサイズが小さい（数行のみ）
- 頻繁に変更されるわけではない

---

### トラブルシューティング

#### エラー: 型が見つからない

**症状**:
```typescript
import { NextPage } from 'next';  // エラー: 'next' module not found
```

**解決方法1**: next-env.d.tsを再生成
```bash
rm next-env.d.ts
npm run dev  # 自動再生成される
```

**解決方法2**: TypeScriptサーバーを再起動
```
VS Code: Cmd/Ctrl + Shift + P
→ "TypeScript: Restart TS Server"
```

#### ファイルが生成されない

**原因**: TypeScriptが有効になっていない

**解決**:
```bash
# TypeScriptをインストール
npm install --save-dev typescript @types/react @types/node

# 開発サーバーを起動
npm run dev
# next-env.d.ts が自動生成される
```

---

## 6. まとめ

### Next.js設定の要点

1. **package.json**: 依存関係とスクリプトの管理
2. **package-lock.json**: 依存関係の厳密なバージョン管理（再現性）
3. **next.config.mjs**: `output: 'standalone'` で本番最適化
4. **next-env.d.ts**: Next.jsの型定義参照（自動生成、編集不要）
5. **tsconfig.json**: TypeScriptの厳格な型チェック、パスエイリアス

### ファイル管理のベストプラクティス

| ファイル | Git管理 | 編集 |
|----------|---------|------|
| `package.json` | ✓ 必須 | ✓ 手動 |
| `package-lock.json` | ✓ 推奨 | ✗ 自動のみ |
| `next.config.mjs` | ✓ 必須 | ✓ 手動 |
| `next-env.d.ts` | △ 任意 | ✗ 編集禁止 |
| `tsconfig.json` | ✓ 必須 | ✓ 手動 |

### 次の章へ

この章ではNext.jsの設定ファイルを学びました。最終章では、ESLintとPrettierの設定を詳しく見ていきます。

[→ 第8章: ESLint & Prettier](./08_nextjs_eslint_prettier.md)

---

[← 目次に戻る](./00_index.md)
