#! /usr/bin/env node
const { program } = require('commander');
const { version } = require('../package.json');

let lastTrace = '';
let compilingIndex = 1;

const webpack = require('webpack');
const path = require('path');
const { existsSync } = require('fs');
const customConfig = path.resolve(process.cwd(), './webpack.config.js');
const config = existsSync(customConfig) ? require(customConfig) : require('../webpack.config');

const buildModes = ['ssg', 'spa', 'ssr']

function getCompiler(options) {
  const configs = config.map((env) => env(null, options))
  return webpack(configs)
}

function logCompiling(showCompiling) {
  if (!showCompiling) return;
  console.log(" ⚙️  Compiling changes...");
}

function logTrace(stats, showCompiling) {
  if (stats.hasErrors()) {
    const response = stats.toJson('errors-only', { colors: true })
    const error = response.errors[0] || response.children[0].errors[0];
    const { moduleName: file, message } = error
    const [loader, ...trace] = message.split('\n');
    if (loader.indexOf('/nullstack/loaders') === -1) trace.unshift(loader)
    const currentTrace = trace.join(' ');
    if (lastTrace === currentTrace) return;
    lastTrace = currentTrace;
    logCompiling(showCompiling);
    console.log(` 💥️ There is an error preventing compilation in \x1b[31m${file}\x1b[0m`);
    for (const line of trace) {
      console.log('\x1b[31m%s\x1b[0m', '    ' + line.trim());
    }
    console.log();
    compilingIndex = 0;
    return
  }
  compilingIndex++;
  if (compilingIndex % 2 === 0) {
    logCompiling(showCompiling);
    compilingIndex = 0;
  }
  lastTrace = '';
}

function start({ input, port, env, output, mode = 'ssr' }) {
  const environment = 'development';
  const compiler = getCompiler({ environment, input });
  if (port) {
    process.env['NULLSTACK_SERVER_PORT'] = port;
  }
  if (env) {
    process.env['NULLSTACK_ENVIRONMENT_NAME'] = env;
  }
  console.log(` 🚀️ Starting your application in ${environment} mode...`);
  console.log();
  compiler.watch({}, (error, stats) => {
    logTrace(stats, true)
    if (!stats.hasErrors() && mode !== 'ssr') {
      require(`../builders/${mode}`)({ output, environment });
    };
  });
}

function build({ input, output, cache, env, mode = 'ssr' }) {
  const environment = 'production';
  const compiler = getCompiler({ environment, input, cache });
  if (env) {
    process.env['NULLSTACK_ENVIRONMENT_NAME'] = env;
  }
  console.log(` 🚀️ Building your application in ${mode} mode...`);
  compiler.run((error, stats) => {
    logTrace(stats, false);
    if (stats.hasErrors()) process.exit(1);
    require(`../builders/${mode}`)({ output, cache, environment });
  });
}

program
  .command('start')
  .alias('s')
  .description('Start application in development environment')
  .addOption(new program.Option('-m, --mode <mode>', 'Build production bundles').choices(buildModes))
  .option('-p, --port <port>', 'Port number to run the server')
  .option('-i, --input <input>', 'Path to project that will be started')
  .option('-o, --output <output>', 'Path to build output folder')
  .option('-e, --env <name>', 'Name of the environment file that should be loaded')
  .helpOption('-h, --help', 'Learn more about this command')
  .action(start)

program
  .command('build')
  .alias('b')
  .description('Build application for production environment')
  .addOption(new program.Option('-m, --mode <mode>', 'Build production bundles').choices(buildModes))
  .option('-i, --input <input>', 'Path to project that will be built')
  .option('-o, --output <output>', 'Path to build output folder')
  .option('-c, --cache', 'Cache build results in .production folder')
  .option('-e, --env <name>', 'Name of the environment file that should be loaded')
  .helpOption('-h, --help', 'Learn more about this command')
  .action(build)

program
  .name("nullstack")
  .addHelpCommand(false)
  .helpOption('-h, --help', 'Learn more about a specific command')
  .version(version, '-v, --version', 'Nullstack version being used')
  .parse(process.argv);