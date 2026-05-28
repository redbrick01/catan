const { execFile } = require("child_process");

const port = Number(process.env.PORT || 4173);

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

function parseListeningPids(netstatOutput) {
  const pids = new Set();

  for (const line of netstatOutput.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || !/\bLISTENING\b/i.test(trimmed)) continue;

    const parts = trimmed.split(/\s+/);
    const localAddress = parts[1] || "";
    const localPort = Number(localAddress.match(/:(\d+)$/)?.[1]);
    if (localPort !== port) continue;

    const pid = Number(parts[parts.length - 1]);
    if (Number.isInteger(pid) && pid > 0) pids.add(pid);
  }

  return [...pids];
}

async function findListeningPids() {
  if (process.platform === "win32") {
    const netstatOutput = await run("netstat", ["-ano", "-p", "tcp"]);
    return parseListeningPids(netstatOutput);
  }

  let output = "";
  try {
    output = await run("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"]);
  } catch (error) {
    if (!error.stdout && !error.stderr) return [];
    throw error;
  }

  return output
    .split(/\r?\n/)
    .map((line) => Number(line.trim()))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
}

async function stopProcess(pid) {
  if (process.platform === "win32") {
    await run("taskkill", ["/PID", String(pid), "/T", "/F"]);
    return;
  }

  await run("kill", ["-TERM", String(pid)]);
}

async function main() {
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    console.error(`Invalid PORT: ${process.env.PORT}`);
    process.exitCode = 1;
    return;
  }

  const pids = await findListeningPids();

  if (!pids.length) {
    console.log(`Catan server is not running on port ${port}.`);
    return;
  }

  for (const pid of pids) {
    await stopProcess(pid);
    console.log(`Stopped Catan server on port ${port} (PID ${pid}).`);
  }
}

main().catch((error) => {
  console.error(error.stderr || error.message || error);
  process.exitCode = 1;
});
