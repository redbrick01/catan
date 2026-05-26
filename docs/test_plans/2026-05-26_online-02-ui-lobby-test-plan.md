# 온라인 02 UI/대기실 테스트 계획

작성일: 2026-05-26

## 테스트 대상

온라인 모드 2단계 UI 대기실 구현.

관련 구현 계획:

```text
docs/implementation_plans/2026-05-26_online-02-ui-lobby-plan.md
docs/final_reports/2026-05-26_online-01-server-lan-room-final-report.md
```

변경 파일:

```text
index.html
script.js
styles.css
docs/implementation_plans/2026-05-26_online-02-ui-lobby-plan.md
```

## 테스트 환경

```text
OS: Windows
Runtime: Node.js
Server: node server.js
Browser: Codex in-app browser
Test port: PORT=4186
```

## 자동 테스트 항목

```text
1. node --check server.js
2. node --check script.js
3. HTTP GET / 가 200을 반환하는지 확인한다.
4. WebSocket createRoom/joinRoom 서버 경로가 1단계와 동일하게 동작하는지 확인한다.
```

## 브라우저 검증 항목

```text
1. 첫 화면에 오프라인 게임, 온라인 방 만들기, 온라인 방 참가하기 버튼이 보인다.
2. 오프라인 게임 선택 후 기존 플레이어 수/이름 입력 화면이 보인다.
3. 오프라인 게임 시작 시 기존 게임 화면으로 진입한다.
4. 온라인 방 만들기에서 닉네임 입력 후 대기실로 이동한다.
5. 대기실에 방 코드, 공유 URL, 복사 버튼, 참가자 목록, 방장/나/연결 상태가 표시된다.
6. ?room=방코드 URL로 접속하면 참가 화면으로 자동 진입하고 방 코드가 채워진다.
7. 두 번째 브라우저 컨텍스트에서 참가 후 양쪽 대기실 참가자 목록이 2명으로 동기화된다.
8. 연결되지 않는 서버 포트에서 방 만들기 시 접속 실패 안내가 표시된다.
```

## 규칙/범위 검증 항목

```text
1. 클라이언트는 type: "command" + payload.name 형식으로 createRoom/joinRoom을 보낸다.
2. 클라이언트는 top-level revision을 수신해 onlineSession.revision에 반영한다.
3. 게임 시작, 초기 배치, 주사위, 게임 엔진 서버 이전을 구현하지 않는다.
4. 기존 오프라인 모드는 플레이어 입력과 게임 시작이 유지된다.
```

## 리뷰 피드백 반영 테스트 항목

```text
1. leaveRoom command가 playerId/playerToken 인증 후 참가자를 방에서 제거하는지 확인한다.
2. 참가자가 나가면 남은 클라이언트의 참가자 목록에서 제거되는지 확인한다.
3. 방장이 나가면 남은 첫 참가자가 hostPlayerId가 되는지 확인한다.
4. 마지막 참가자가 나가면 방이 삭제되어 이후 joinRoom이 room_not_found를 반환하는지 확인한다.
5. 대기실 게임 시작 버튼이 disabled이고 future-button 스타일을 가지는지 확인한다.
```

## 실패 시 확인할 로그 또는 상태

```text
브라우저 콘솔 오류
서버 stdout/stderr
online-status 문구
roomCreated / roomJoined / state 메시지
```

## 완료 기준

```text
정적 검사가 통과한다.
온라인 방 만들기와 참가 UI가 서버와 연결된다.
두 클라이언트 대기실 목록이 동기화된다.
오프라인 게임 시작이 기존처럼 동작한다.
이번 단계 제외 범위가 구현되지 않았음을 확인한다.
리뷰 피드백 반영 테스트가 통과한다.
```
