const { spawn } = require('child_process');
const minimist = require('minimist');
const os = require('os');

const PROCESS_OPTIONS = {
  stdio: 'pipe',
  shell: true,
  detached: true
}

const args = minimist(process.argv.slice(2), {
  string: ["ip_address"]
})

const printHelp = () => {
  console.log("dev-startup usage");
  console.log("");
  console.log("--help                      prints help");
  console.log("--ip_address                ip_address used to start service_agent and frontend");
  console.log("--debug                     start service_agent in debug mode");
}

if(args.help) {
  printHelp();

  return;
}

const guessIp = () => {
  const interfaceInfo = Object.values(os.networkInterfaces())
    .flat()
    .find(i => !i.internal && i.family === 'IPv4')
  ;

  return interfaceInfo ? interfaceInfo.address : null;
}

const ipAddress = args.ip_address ? args.ip_address : guessIp();

if (!ipAddress) {
  throw new Error('please specify ip_address parameter');
}

const createChildProcess = (cwd, envVar, opt) => {
  const childProcess = spawn('npm', ['run', opt], {
    ...PROCESS_OPTIONS,
    cwd,
    env: {
      ...process.env,
      [envVar]: `${ipAddress}:9000`
    },
  });

  childProcess.stdout.pipe(process.stdout);
  childProcess.stderr.pipe(process.stderr);

  return childProcess;
}

const backendAppProcess = createChildProcess(
  process.cwd() + '/service_agent',
  'SERVICE_HOSTPORT',
  args.debug ? 'debug' : 'start'
);
const frontendAppProcess = createChildProcess(
  process.cwd() + '/frontend',
  'REACT_APP_SERVICE_HOSTPORT',
  'start'
);

process.on('SIGINT', () => {
  process.kill(-backendAppProcess.pid);
  process.kill(-frontendAppProcess.pid);
});
