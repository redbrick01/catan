const http = require("http");
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const url = `http://127.0.0.1:${port}/`;
const shouldOpenBrowser = !process.argv.includes("--no-open");
const shouldRunForeground = process.argv.includes("--foreground");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function commandExists(command, args = ["--version"]) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "ignore"
  });
  return result.status === 0;
}

function readPackageJson() {
  const packagePath = path.join(root, "package.json");
  return JSON.parse(fs.readFileSync(packagePath, "utf8"));
}

function dependencyInstalled(name) {
  return fs.existsSync(path.join(root, "node_modules", name, "package.json"));
}

function dependenciesInstalled() {
  const manifest = readPackageJson();
  const dependencies = Object.keys(manifest.dependencies || {});
  return dependencies.every(dependencyInstalled);
}

function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit"
    });

    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
  });
}

async function installDependenciesIfNeeded() {
  console.log("필요 패키지를 확인하는 중입니다...");

  if (dependenciesInstalled()) {
    console.log("필요 패키지가 이미 준비되어 있습니다.");
    return true;
  }

  if (!commandExists(npmCommand)) {
    console.error("npm을 찾을 수 없습니다. Node.js와 npm을 설치한 뒤 다시 실행하세요.");
    return false;
  }

  console.log("필요 패키지가 없어 자동 설치를 시작합니다.");
  console.log("처음 실행이라면 잠시 걸릴 수 있습니다. 설치 로그가 이어서 표시됩니다.");
  const installed = await runCommand(npmCommand, ["install", "--no-audit", "--no-fund"]);

  if (!installed) {
    console.error("패키지 자동 설치에 실패했습니다.");
    return false;
  }

  if (!dependenciesInstalled()) {
    console.error("설치 후에도 필요한 패키지를 확인하지 못했습니다.");
    return false;
  }

  console.log("패키지 설치가 완료되었습니다.");
  return true;
}

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
  if (!(await installDependenciesIfNeeded())) {
    process.exitCode = 1;
    return;
  }

  if (await checkServer()) {
    console.log(`Catan server is already running: ${url}`);
    if (shouldOpenBrowser) {
      openBrowser();
    }
    return;
  }

  console.log("Starting Catan server...");
  const server = spawn(process.execPath, ["server.js"], shouldRunForeground
    ? {
        cwd: root,
        env: { ...process.env, PORT: String(port) },
        stdio: "inherit"
      }
    : {
        cwd: root,
        detached: true,
        env: { ...process.env, PORT: String(port) },
        stdio: "ignore"
      });

  if (!shouldRunForeground) {
    server.unref();
  }

  if (!(await waitForServer())) {
    console.error("Server did not become ready in time.");
    if (!shouldRunForeground) {
      server.kill();
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Catan server is ready: ${url}`);
  if (shouldOpenBrowser) {
    openBrowser();
  }

  if (shouldRunForeground) {
    console.log("게임 종료 및 서버를 중지하려면 Ctrl+C를 입력하세요.");
    server.on("exit", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      process.exitCode = code || 0;
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
