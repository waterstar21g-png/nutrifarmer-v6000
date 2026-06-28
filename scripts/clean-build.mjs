#!/usr/bin/env node
/**
 * .next 캐시 삭제 후 production build (Windows nft.json ENOENT 대응)
 * Usage: npm run build:clean
 */
import { existsSync, rmSync } from 'fs';
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function removeDir(rel) {
  const abs = join(root, rel);
  if (existsSync(abs)) {
    rmSync(abs, { recursive: true, force: true });
    console.log(`Removed ${rel}/`);
  }
}

removeDir('.next');
removeDir('node_modules/.cache');

console.log('\nStarting production build...\n');

const result = spawnSync('npm run build', {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
