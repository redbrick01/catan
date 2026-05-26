const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const url = `http://127.0.0.1:${port}/`;
const shouldOpenBrowser = !process.argv.includes("--no-open");

function checkServer() {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });

    request.on("error", () => resolve(false));
    request.setTimeout(800, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs = 8000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await checkServer()) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return false;
}

function openBrowser() {
  const command =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "cmd"
        : "xdg-open";

  const args =
    process.platform === "win32"
      ? ["/c", "start", "", url]
      : [url];

  const opener = spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });

  opener.unref();
}

async function main() {
  if (await checkServer()) {
    console.log(`Katan server is already running: ${url}`);
    if (shouldOpenBrowser) {
      openBrowser();
    }
    return;
  }

  console.log("Starting Katan server...");
  const server = spawn(process.execPath, ["server.js"], {
    cwd: root,
    detached: true,
    env: { ...process.env, PORT: String(port) },
    stdio: "ignore"
  });

  server.unref();

  if (!(await waitForServer())) {
    console.error("Server did not become ready in time.");
    process.exitCode = 1;
    return;
  }

  console.log(`Katan server is ready: ${url}`);
  if (shouldOpenBrowser) {
    openBrowser();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
