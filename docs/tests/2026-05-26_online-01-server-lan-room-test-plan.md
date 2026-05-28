# 온라인 01 서버/LAN/방 테스트 계획

작성일: 2026-05-26

## 테스트 대상

온라인 모드 1단계 서버/LAN/방 최소 구현.

관련 구현 계획:

```text
docs/plans/2026-05-26_online-01-server-lan-room-plan.md
```

변경 파일:

```text
server.js
package.json
package-lock.json
docs/plans/2026-05-26_online-01-server-lan-room-plan.md
```

## 테스트 환경

```text
OS: Windows
Runtime: Node.js
Server port: 4173
WebSocket package: ws
```

## 수동 테스트 항목

```text
1. npm start 실행 시 서버가 0.0.0.0으로 listen한다.
2. 콘솔에 Local URL이 출력된다.
3. 콘솔에 Network URL 후보가 출력되거나 LAN IPv4가 없다는 안내가 출력된다.
4. 같은 네트워크의 다른 기기에서 Network URL로 접속할 수 있다.
5. 방장 브라우저와 참가자 브라우저가 같은 참가자 목록을 본다.
```

## 자동 테스트 항목

```text
1. node --check server.js로 문법 오류가 없는지 확인한다.
2. 서버를 테스트 프로세스로 실행한다.
3. HTTP GET / 요청이 200과 index.html HTML을 반환하는지 확인한다.
4. WebSocket 클라이언트 A가 createRoom을 보내 roomCreated를 받는지 확인한다.
5. roomCreated 응답에 shareUrls와 state.status = "lobby"가 있는지 확인한다.
6. WebSocket 클라이언트 B가 joinRoom을 보내 roomJoined를 받는지 확인한다.
7. 두 클라이언트가 최종 state 메시지에서 같은 roomId, status, 2명 참가자 목록을 받는지 확인한다.
```

## 리뷰 피드백 반영 테스트 항목

```text
1. type: "command", payload.name: "createRoom" 형식으로 방 생성이 되는지 확인한다.
2. type: "command", payload.name: "joinRoom" 형식으로 방 참가가 되는지 확인한다.
3. 기존 type: "createRoom" / type: "joinRoom" 형식도 1단계 호환으로 유지되는지 확인한다.
4. state 메시지에 top-level revision이 포함되는지 확인한다.
5. roomCreated 직후 방장에게 별도 state 메시지가 중복 전송되지 않는지 확인한다.
```

## 브라우저 검증 항목

이번 단계에서는 UI 대기실을 구현하지 않으므로 브라우저 상호작용 검증은 정적 페이지 로딩 확인으로 제한한다.

```text
1. http://127.0.0.1:4173/ 이 열린다.
2. 기존 오프라인 화면이 깨지지 않고 렌더링된다.
3. 콘솔 오류가 새 서버 변경으로 발생하지 않는다.
```

## 규칙 검증 항목

```text
1. 서버가 lobby 상태를 권위 있게 전송한다.
2. 클라이언트가 게임 시작, 초기 배치, 주사위 명령을 사용할 수 있는 서버 API를 이번 단계에서 제공하지 않는다.
3. playerToken은 해당 플레이어의 create/join 응답에만 포함되고 broadcast state에는 포함되지 않는다.
```

## 실패 시 확인할 로그 또는 상태

```text
서버 시작 로그
WebSocket error 응답
HTTP 상태 코드
roomCreated / roomJoined / state 메시지 본문
```

## 완료 기준

```text
문법 검사가 통과한다.
자동 HTTP/WebSocket 검증이 통과한다.
Local/Network URL 출력이 확인된다.
이번 단계 제외 범위가 구현되지 않았음을 확인한다.
리뷰 피드백 반영 테스트가 통과한다.
```
