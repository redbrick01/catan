# Catan 설치 및 실행 가이드

Catan은 브라우저에서 실행되는 보드게임입니다. 이 문서는 실제 플레이어가 게임을 설치하고 실행하는 방법만 안내합니다.

## 필요 조건

- Node.js
- npm

실행 스크립트는 게임에 필요한 패키지를 자동으로 확인하고, 없으면 설치합니다.
단, Node.js와 npm 자체는 먼저 설치되어 있어야 합니다.

설치 여부는 터미널에서 확인할 수 있습니다.

```bash
node -v
npm -v
```

## 가장 쉬운 실행

프로젝트 폴더에서 운영체제에 맞는 실행 파일을 엽니다.

macOS:

```text
start-catan.command
```

Windows:

```text
start-catan.cmd
```

실행하면 필요한 패키지를 확인한 뒤 서버를 시작합니다. 패키지가 없으면 자동으로 `npm install`을 실행합니다.
처음 실행할 때는 설치 때문에 잠시 멈춘 것처럼 보일 수 있지만, 설치 로그가 이어서 표시되면 정상입니다.

서버가 준비되면 아래 안내가 표시됩니다.

```text
게임 종료 및 서버를 중지하려면 Ctrl+C를 입력하세요.
```

이 창을 닫거나 `Ctrl+C`를 입력하면 실행 중인 서버를 종료할 수 있습니다.

## 터미널에서 실행

프로젝트 폴더에서 아래 명령을 사용합니다.

서버를 터미널에 계속 띄워두고 실행:

```bash
npm start
```

브라우저까지 자동으로 열기:

```bash
npm run open
```

`npm start`는 서버가 터미널 안에서 계속 실행되므로 `Ctrl+C`로 종료합니다.
`npm run open`은 서버를 백그라운드로 실행하고 브라우저를 연 뒤 명령을 끝냅니다.

## 접속 주소

같은 컴퓨터에서 접속:

```text
http://127.0.0.1:4173/
```

같은 Wi-Fi 또는 LAN에 있는 다른 기기에서 접속할 때는 서버 실행 시 표시되는 네트워크 URL을 사용합니다.

```text
http://<서버 컴퓨터 IP>:4173/
```

예:

```text
http://192.168.0.10:4173/
```

## 게임 시작

1. 브라우저에서 접속합니다.
2. 오프라인 또는 온라인 모드를 선택합니다.
3. 온라인 모드는 방을 만들고 표시되는 참가 링크를 다른 플레이어에게 공유합니다.
4. 인원이 부족하면 로비에서 봇을 추가할 수 있습니다.

## 종료

`start-catan.command`, `start-catan.cmd`, `npm start`로 실행했다면 실행 중인 터미널 창에서 아래 키를 입력합니다.

```text
Ctrl+C
```

`npm run open`으로 백그라운드 실행했다면 아래 명령으로 서버를 종료합니다.

```bash
node stop-catan.js
```

Windows에서는 종료 파일을 직접 실행할 수도 있습니다.

```text
stop-catan.cmd
```

## 문제 해결

포트가 이미 사용 중이면 기존 서버가 실행 중일 수 있습니다. `node stop-catan.js`로 종료한 뒤 다시 실행합니다.

브라우저에서 접속이 안 되면 아래를 확인합니다.

- 서버 실행 창에 오류가 없는지
- Node.js와 npm이 설치되어 있는지
- 같은 네트워크에 연결되어 있는지
- 방화벽이 `4173` 포트를 막고 있지 않은지
- 네트워크 URL의 IP 주소가 현재 서버 컴퓨터 IP와 같은지

패키지 설치가 실패하면 인터넷 연결을 확인한 뒤 다시 실행합니다.

## 라이선스

이 프로젝트의 코드와 문서는 [MIT License](LICENSE)에 따라 배포됩니다.

이 프로젝트는 교육 목적의 비공식 팬 제작 프로젝트이며, 공식 Catan 관련 법인과 제휴하거나 승인받은 프로젝트가 아닙니다. 자세한 상표 및 비공식 고지는 [LICENSE](LICENSE)를 확인하세요.

---

# Catan Installation and Run Guide

Catan is a browser-based board game. This document explains only how players can install and run the game.

## Requirements

- Node.js
- npm

The launch scripts automatically check for required packages and install them if they are missing.
Node.js and npm themselves must be installed first.

You can check them in a terminal:

```bash
node -v
npm -v
```

## Easiest Start

Open the launcher for your operating system from the project folder.

macOS:

```text
start-catan.command
```

Windows:

```text
start-catan.cmd
```

The launcher checks required packages and starts the server. If packages are missing, it runs `npm install` automatically.
The first launch may look paused for a moment while dependencies install; this is normal if installation logs continue to appear.

When the server is ready, this message appears:

```text
게임 종료 및 서버를 중지하려면 Ctrl+C를 입력하세요.
```

Close the window or press `Ctrl+C` to stop the running server.

## Run From Terminal

From the project folder, use one of these commands.

Keep the server running in the terminal:

```bash
npm start
```

Start the server and open the browser automatically:

```bash
npm run open
```

`npm start` keeps the server running in the terminal, so stop it with `Ctrl+C`.
`npm run open` starts the server in the background, opens the browser, and then finishes the command.

## Connection URLs

On the same computer:

```text
http://127.0.0.1:4173/
```

From another device on the same Wi-Fi or LAN, use the network URL shown when the server starts.

```text
http://<server-computer-ip>:4173/
```

Example:

```text
http://192.168.0.10:4173/
```

## Start Playing

1. Open the game in a browser.
2. Choose offline or online mode.
3. In online mode, create a room and share the displayed join link with other players.
4. If there are not enough players, add bots from the lobby.
5. Use the language selector in the top-right corner to switch between Korean and English.

## Stop The Server

If you started with `start-catan.command`, `start-catan.cmd`, or `npm start`, press this in the running terminal:

```text
Ctrl+C
```

If you started in the background with `npm run open`, stop the server with:

```bash
node stop-catan.js
```

On Windows, you can also run the stop file directly.

```text
stop-catan.cmd
```

## Troubleshooting

If the port is already in use, an existing server may still be running. Stop it with `node stop-catan.js`, then start again.

If the browser cannot connect, check:

- Whether the server window shows an error
- Whether Node.js and npm are installed
- Whether the devices are on the same network
- Whether a firewall is blocking port `4173`
- Whether the network URL IP address matches the current server computer IP

If package installation fails, check your internet connection and try again.

## License

The code and documentation in this project are distributed under the [MIT License](LICENSE).

This is an unofficial fan-made project for educational purposes. It is not affiliated with or endorsed by official Catan-related entities. See [LICENSE](LICENSE) for trademark and unofficial-use notices.
