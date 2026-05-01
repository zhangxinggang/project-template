const path = require('path');
const ChildProcess = require('child_process');
const Chalk = require('chalk');

/** 使用包内 TypeScript，避免依赖全局 tsc（Windows 下常见找不到命令） */
function compile(_mainSourceDir) {
  const electronRoot = path.join(__dirname, '..');
  const tsconfigPath = path.join(electronRoot, 'src', 'tsconfig.json');
  return new Promise((resolve, reject) => {
    const tscProcess = ChildProcess.exec(`pnpm exec tsc -p "${tsconfigPath}"`, {
      cwd: electronRoot,
    });

    tscProcess.stdout.on('data', (data) =>
      process.stdout.write(Chalk.yellowBright(`[tsc] `) + Chalk.white(data.toString())),
    );
    tscProcess.stderr.on('data', (data) =>
      process.stderr.write(Chalk.yellowBright(`[tsc] `) + Chalk.white(data.toString())),
    );

    tscProcess.on('exit', (exitCode) => {
      if (exitCode > 0) {
        reject(exitCode);
      } else {
        resolve();
      }
    });
  });
}

module.exports = compile;
