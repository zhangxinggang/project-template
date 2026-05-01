const fs = require('fs');
const path = require('path');

const SOURCE_ROOT = path.resolve(__dirname, '..');
const DIST_ROOT = path.join(SOURCE_ROOT, 'dist');

const IGNORE_DIR_NAMES = new Set(['node_modules', 'dist', '.git', '.cursor', 'logs', 'doc']);

const CODE_EXTENSIONS = new Set(['.ts', '.js']);

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function shouldSkipDir(dirName) {
  return IGNORE_DIR_NAMES.has(dirName);
}

function shouldCopyFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  return !CODE_EXTENSIONS.has(ext);
}

function copyAssetsRecursive(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(currentDir, entry.name);
    const relativePath = path.relative(SOURCE_ROOT, sourcePath);
    const distPath = path.join(DIST_ROOT, relativePath);

    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) {
        continue;
      }
      copyAssetsRecursive(sourcePath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!shouldCopyFile(entry.name)) {
      continue;
    }

    ensureDirSync(path.dirname(distPath));
    fs.copyFileSync(sourcePath, distPath);
  }
}

function main() {
  ensureDirSync(DIST_ROOT);
  copyAssetsRecursive(SOURCE_ROOT);
  console.info('[build] non-js/ts assets copied to dist');
}

main();
