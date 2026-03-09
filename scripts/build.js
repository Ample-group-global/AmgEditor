import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const distDir = path.resolve('dist');
const publicDir = path.resolve('dist/public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

async function build() {
    try {

        const tailwindCmd = process.platform === 'win32' ? 'npx.cmd tailwindcss' : 'npx tailwindcss';
        execSync(`${tailwindCmd} -i client/src/index.css -o dist/public/style.css --minify`, { stdio: 'inherit' });

        await esbuild.build({
            entryPoints: ['client/src/main.tsx'],
            bundle: true,
            minify: true,
            sourcemap: true,
            outfile: 'dist/public/index.js',
            loader: {
                '.tsx': 'tsx',
                '.ts': 'ts',
            },
            alias: {
                '@': path.resolve('client/src'),
            },
            jsx: 'automatic',
            define: {
                'process.env.NODE_ENV': '"production"',
            },
        });

        fs.copyFileSync('client/index.html', 'dist/public/index.html');

        // 4. Build Server
        await esbuild.build({
            entryPoints: ['server/index.ts'],
            bundle: true,
            platform: 'node',
            format: 'esm',
            outfile: 'dist/index.js',
            packages: 'external',
        });

        // 5. Build Library (ESM and CJS)
        console.log('📚 Building Library...');
        const cssContent = fs.readFileSync('dist/public/style.css', 'utf8').replace(/\\/g, '\\\\').replace(/`/g, '\\`');
        const cssInjection = `"use client";
(function() {
  if (typeof document !== 'undefined') {
    const styleId = 'ample-editor-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = \`${cssContent}\`;
      document.head.appendChild(style);
    }
  }
})();
`;

        // Library ESM
        await esbuild.build({
            entryPoints: ['client/src/index.ts'],
            bundle: true,
            minify: true,
            sourcemap: true,
            format: 'esm',
            outfile: 'dist/index.mjs',
            packages: 'external',
            jsx: 'automatic',
            alias: {
                '@': path.resolve('client/src'),
            },
            banner: {
                js: cssInjection,
            },
        });

        // Library CJS
        await esbuild.build({
            entryPoints: ['client/src/index.ts'],
            bundle: true,
            minify: true,
            sourcemap: true,
            format: 'cjs',
            outfile: 'dist/index.cjs',
            packages: 'external',
            jsx: 'automatic',
            alias: {
                '@': path.resolve('client/src'),
            },
            banner: {
                js: cssInjection,
            },
        });

        // 6. Generate TypeScript Declarations
        console.log('📝 Generating Type Declarations...');
        const tscCmd = process.platform === 'win32' ? 'npx.cmd tsc' : 'npx tsc';
        execSync(`${tscCmd} -p tsconfig.lib.json`, { stdio: 'inherit' });

        console.log('✅ Build completed successfully!');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

build();
