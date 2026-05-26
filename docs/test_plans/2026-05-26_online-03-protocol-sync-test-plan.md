# 온라인 03 프로토콜/동기화 테스트 계획

작성일: 2026-05-26

## 테스트 대상

온라인 모드 3단계 프로토콜/동기화 구조 정리.

관련 구현 계획:

```text
docs/implementation_plans/2026-05-26_online-03-protocol-sync-plan.md
docs/final_reports/2026-05-26_online-01-server-lan-room-final-report.md
docs/final_reports/2026-05-26_online-02-ui-lobby-final-report.md
docs/test_plans/2026-05-26_online-device-connection-test-result.md
```

변경 파일:

```text
server.js
script.js
docs/implementation_plans/2026-05-26_online-03-protocol-sync-plan.md
```

## 테스트 환경

```text
OS: Windows
Runtime: Node.js
자동 테스트 포트: 4188
실제 접속 기준: http://100.88.125.81:4173/
권장 브라우저: Chrome
```

## 자동 테스트 항목

```text
1. node --check server.js
2. node --check script.js
3. type: "command" + payload.name 형식 createRoom 성공 확인
4. legacy type: "createRoom" 요청이 BAD_MESSAGE로 거부되는지 확인
5. joinRoom 실패 시 error 응답에 top-level code/message가 있는지 확인
6. joinRoom 성공 후 state.status = "lobby" 및 top-level revision 확인
7. leaveRoom이 참가자를 방에서 제거하는지 확인
8. reconnect가 같은 playerId/playerToken으로 기존 자리에 복귀하는지 확인
9. reconnect 후 중복 state가 와도 최신 revision 기준으로 처리 가능한지 확인
```

## 브라우저/클라이언트 테스트 항목

```text
1. 방 생성 후 localStorage에 roomId/playerId/playerToken/playerName이 저장되는지 확인한다.
2. 같은 ?room= URL로 재진입 시 reconnect가 자동으로 시도되는지 확인한다.
3. reconnect 성공 후 대기실이 표시되고 내 정보가 유지되는지 확인한다.
4. 방 참가 실패 오류가 사용자 문구로 표시되는지 확인한다.
5. requestId pending request timeout이 무한 대기하지 않는지 확인한다.
```

## 실제 기기 접속 기준 반영

```text
docs/test_plans/2026-05-26_online-device-connection-test-result.md에 따라 실제 접속 기준은 http://100.88.125.81:4173/ + Chrome이다.
이번 자동 테스트는 로컬 포트에서 수행하지만 최종 보고서에는 실제 접속 기준을 명시한다.
```

## 범위 제외 확인

```text
게임 시작은 구현하지 않는다.
초기 배치는 구현하지 않는다.
주사위는 구현하지 않는다.
게임 엔진 서버 이전은 구현하지 않는다.
```

## 리뷰 피드백 반영 테스트 항목

```text
1. DEBUG_ONLINE 미설정 시 [upgrade], [ws:open], [ws:close] 진단 로그가 출력되지 않는지 확인한다.
2. DEBUG_ONLINE=1 설정 시 WebSocket 진단 로그가 출력되는지 확인한다.
3. roomCreated/roomJoined/reconnected ack는 pending request가 남아 있을 때만 상태를 반영하도록 코드 경로를 확인한다.
4. timeout 이후 늦은 ack는 상태에 반영하지 않는 정책을 문서화한다.
5. state broadcast는 requestId 없이 revision 기준으로 계속 처리되는지 확인한다.
6. 대기실 leaveRoom은 방에서 제거, 게임 중 이탈은 후속 정책으로 분리되어 있는지 확인한다.
```

## 완료 기준

```text
정적 검사가 통과한다.
서버가 command 형식만 정상 명령으로 처리한다.
error 응답 형식이 top-level code/message를 포함한다.
클라이언트가 최신 revision만 반영한다.
localStorage identity 저장 및 reconnect 최소 흐름이 동작한다.
leaveRoom 정책이 방에서 제거로 유지된다.
리뷰 피드백 반영 테스트가 통과한다.
```
