const path = require('path');
const chalk = require('chalk');
const fs = require('fs');
const prepare = require('./prepare');
const tsConfig = require('../src/tsconfig.json');

const outDir = tsConfig.compilerOptions.outDir;

function buildMain() {
  return prepare();
}

fs.rmSync(path.join(__dirname, outDir), {
  recursive: true,
  force: true,
});

console.log(chalk.blueBright('Transpiling...'));

buildMain().then(() => {
  console.log(
    chalk.greenBright('successfully transpiled! (ready to be built with electron-builder)'),
  );
});
