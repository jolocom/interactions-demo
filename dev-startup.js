const { spawn } = require('child_process');
const minimist = require('minimist');
const os = require('os');

const PROCESS_OPTIONS = {
  stdio: 'inherit',
  shell: true,
  detached: true
}

let args = minimist(process.argv.slice(2), {
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

const ip_address = args.ip_address ? args.ip_address : guessIp();

if (!ip_address) {
  throw new Error('please specify ip_address parameter');
}

const backend_dir = process.cwd() + "/service_agent";
const frontend_dir = process.cwd() + "/frontend";

const start = (cwd, env_var) => spawn('npm', ['run', 'start'], {
  ...PROCESS_OPTIONS,
  cwd,
  env: {
    ...process.env,
    [env_var]: `${ip_address}:9000`
  },
})

start(backend_dir, 'SERVICE_HOSTPORT');
start(frontend_dir, 'REACT_APP_SERVICE_HOSTPORT');
