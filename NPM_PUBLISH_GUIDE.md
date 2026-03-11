# Publishing @amplecapitalglobal/editor to npm

## npm Account Details

- **Registry:** https://www.npmjs.com/
- **Username:** amplegroupglobal
- **Email:** official@amplegroupglobal.com
- **Signup:** https://www.npmjs.com/signup

---

## Prerequisites

1. **Node.js** (v18+) and **pnpm** installed
2. npm account verified (check email for verification link)
3. If using a scoped package (`@amplecapitalglobal/editor`), ensure the npm organization `amplecapitalglobal` exists

---

## Step-by-Step Publishing Guide

### 1. Login to npm

```bash
npm login
```

Enter your username, password, and email when prompted. If 2FA is enabled, you'll also need your OTP code.

### 2. Verify Login

```bash
npm whoami
```

Should output: `amplegroupglobal`

### 3. Create the npm Organization (first time only)

Since the package is scoped under `@amplecapitalglobal`, create the org at:
https://www.npmjs.com/org/create

- Organization name: `amplecapitalglobal`

### 4. Build the Package

```bash
pnpm build
```

### 5. Verify Package Contents

Preview what will be published:

```bash
npm pack --dry-run
```

Ensure only these files are included:
- `dist/` (compiled output)
- `README.md`
- `LICENSE`
- `package.json`

### 6. Publish

For scoped packages, use `--access public` to make it publicly available:

```bash
npm publish --access public
```

### 7. Verify Publication

Visit: https://www.npmjs.com/package/@amplecapitalglobal/editor

---

## Updating and Republishing

### Bump Version

```bash
# Patch (1.0.8 -> 1.0.9) - bug fixes
npm version patch

# Minor (1.0.8 -> 1.1.0) - new features
npm version minor

# Major (1.0.8 -> 2.0.0) - breaking changes
npm version major
```

### Build and Publish

```bash
pnpm build
npm publish --access public
```

---

## Installation (for consumers)

```bash
# npm
npm install @amplecapitalglobal/editor

# pnpm
pnpm add @amplecapitalglobal/editor

# yarn
yarn add @amplecapitalglobal/editor
```

### Usage

```tsx
import { AmgEditor } from "@amplecapitalglobal/editor";
import "@amplecapitalglobal/editor/styles";

function App() {
  return <AmgEditor />;
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `403 Forbidden` | Ensure org exists and you have publish access |
| `402 Payment Required` | Add `--access public` for scoped packages |
| `E409 Conflict` | Version already exists — bump version first |
| `ENEEDAUTH` | Run `npm login` again |
| `npm ERR! code EOTP` | Enable/enter 2FA one-time password |

---

## Useful Commands

```bash
# Check published versions
npm view @amplecapitalglobal/editor versions

# Unpublish a version (within 72 hours only)
npm unpublish @amplecapitalglobal/editor@1.0.8

# Deprecate a version
npm deprecate @amplecapitalglobal/editor@1.0.8 "Use latest version"

# Transfer ownership
npm owner add <username> @amplecapitalglobal/editor
```
