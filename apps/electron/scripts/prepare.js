const path = require('path');
const ChildProcess = require('child_process');
const Chalk = require('chalk');
const nativeFolder = 'business/database/native';
const fs = require('fs');
const compileTs = require('./tsc');
const programPath = path.join(__dirname, '..', 'src', 'main');
const tsConfig = require('../src/tsconfig.json');

const outDir = tsConfig.compilerOptions.outDir;

function copy(pathStr) {
  fs.cpSync(path.join(programPath, pathStr), path.join(__dirname, outDir, pathStr), {
    recursive: true,
  });
}

/** 先编译 workspace 包，避免 Node 以 strip-only 方式直接执行 .ts 里的 import/export = */
function buildMomoServer() {
  const repoRoot = path.join(__dirname, '..', '..', '..');
  return new Promise((resolve, reject) => {
    const child = ChildProcess.exec('pnpm --filter @momo/server run build', {
      cwd: repoRoot,
    });
    child.stdout.on('data', (data) =>
      process.stdout.write(Chalk.cyanBright('[@momo/server] ') + Chalk.white(data.toString())),
    );
    child.stderr.on('data', (data) =>
      process.stderr.write(Chalk.cyanBright('[@momo/server] ') + Chalk.white(data.toString())),
    );
    child.on('exit', (exitCode) => {
      if (exitCode > 0) {
        reject(new Error('@momo/server build failed'));
      } else {
        resolve();
      }
    });
  });
}

module.exports = function () {
  return new Promise((resolve, reject) => {
    buildMomoServer()
      .then(() => compileTs(programPath))
      .then(() => {
        try {
          copy('../' + nativeFolder);
        } catch (e) {}
        resolve(1);
      })
      .catch(reject);
  });
};
