process.env.NODE_ENV = 'development';

const ChildProcess = require('child_process');
const path = require('path');
const chalk = require('chalk');
const chokidar = require('chokidar');
const Electron = require('electron');
const { EOL } = require('os');
const tsConfig = require('../src/tsconfig.json');
const prepare = require('./prepare');

let viteServer = null;
let electronProcess = null;
let electronProcessLocker = false;
let rendererPort = 0;

const outDir = tsConfig.compilerOptions.outDir;
const programPath = path.join(__dirname, '..', 'src', 'main');
async function startElectron() {
  if (electronProcess) {
    // single instance lock
    return;
  }
  try {
    await prepare();
  } catch {
    console.log(
      chalk.redBright('Could not start Electron because of the above typescript error(s).'),
    );
    electronProcessLocker = false;
    return;
  }

  const args = [path.join(__dirname, `${outDir}/main/index.js`), rendererPort];
  electronProcess = ChildProcess.spawn(Electron, args);
  electronProcessLocker = false;

  electronProcess.stdout.on('data', (data) => {
    if (data == EOL) {
      return;
    }
    process.stdout.write(chalk.blueBright(`[electron] `) + chalk.white(data.toString()));
  });
  electronProcess.stderr.on('data', (data) =>
    process.stderr.write(chalk.blueBright(`[electron] `) + chalk.white(data.toString())),
  );
  electronProcess.on('exit', () => stop());
}

function restartElectron() {
  if (electronProcess) {
    electronProcess.removeAllListeners('exit');
    electronProcess.kill();
    electronProcess = null;
  }

  if (!electronProcessLocker) {
    electronProcessLocker = true;
    startElectron();
  }
}

function stop() {
  viteServer?.close();
  process.exit();
}

async function start() {
  console.log(`${chalk.greenBright('=======================================')}`);
  console.log(`${chalk.greenBright('Starting Electron + Vite Dev Server...')}`);
  console.log(`${chalk.greenBright('=======================================')}`);
  startElectron();
  chokidar
    .watch(programPath, {
      cwd: programPath,
    })
    .on('change', (path) => {
      console.log(chalk.blueBright(`[electron] `) + `Change in ${path}. reloading... 🚀`);
      restartElectron();
    });
}
start();
