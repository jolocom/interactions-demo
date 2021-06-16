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

const startProcess = (cwd, envVar) => spawn('npm', ['run', 'start'], {
  ...PROCESS_OPTIONS,
  cwd,
  env: {
    ...process.env,
    [envVar]: `${ipAddress}:9000`
  },
})

const backendAppProcess = startProcess(process.cwd() + '/service_agent', 'SERVICE_HOSTPORT');

backendAppProcess.stdout.pipe(process.stdout);
backendAppProcess.stderr.pipe(process.stderr);

const frontendAppProcess = startProcess(process.cwd() + '/frontend', 'REACT_APP_SERVICE_HOSTPORT');

frontendAppProcess.stdout.pipe(process.stdout);
frontendAppProcess.stderr.pipe(process.stderr);

process.on('SIGINT', () => {
  process.kill(-backendAppProcess.pid);
  process.kill(-frontendAppProcess.pid);
});
