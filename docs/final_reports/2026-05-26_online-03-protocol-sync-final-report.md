# 온라인 03 프로토콜/동기화 최종 보고서

작성일: 2026-05-26

## 관련 문서

```text
catan_implementation_process_guideline.md
docs/implementation_plans/2026-05-26_online-00-mvp-roadmap.md
docs/implementation_plans/2026-05-26_online-03-protocol-sync-plan.md
docs/final_reports/2026-05-26_online-01-server-lan-room-final-report.md
docs/final_reports/2026-05-26_online-02-ui-lobby-final-report.md
docs/test_plans/2026-05-26_online-device-connection-test-result.md
docs/test_plans/2026-05-26_online-03-protocol-sync-test-plan.md
```

## 변경 파일 목록

```text
server.js
script.js
docs/implementation_plans/2026-05-26_online-03-protocol-sync-plan.md
docs/test_plans/2026-05-26_online-03-protocol-sync-test-plan.md
docs/final_reports/2026-05-26_online-03-protocol-sync-final-report.md
```

## 구현 요약

```text
서버 요청 입구를 type: "command" + payload.name 기준으로 정리했다.
legacy type: "createRoom" 같은 직접 요청은 BAD_MESSAGE 오류로 거부한다.
서버 error 응답에 top-level code/message와 error.code/error.message를 함께 포함하도록 정리했다.
state 메시지는 type, roomId, revision, state 형식을 유지한다.
클라이언트는 state.status와 top-level revision 기준으로 최신 상태만 반영한다.
클라이언트 pending request에 8초 timeout과 정리 로직을 추가했다.
클라이언트 오류 표시를 서버 code 기반 사용자 문구로 정리했다.
leaveRoom 정책은 "방에서 제거"로 유지했다.
localStorage 기반 identity 저장/삭제 함수를 추가했다.
reconnect command를 서버와 클라이언트에 최소 구현했다.
reconnect 성공 시 같은 playerId/playerToken으로 대기실에 복귀한다.
```

## 범위 준수

```text
게임 시작은 구현하지 않았다.
초기 배치는 구현하지 않았다.
주사위는 구현하지 않았다.
게임 엔진 서버 이전은 구현하지 않았다.
```

## 실제 접속 기준 반영

```text
실제 기기 접속 기준은 docs/test_plans/2026-05-26_online-device-connection-test-result.md를 따른다.
접속 주소: http://100.88.125.81:4173/
권장 브라우저: Chrome
MacBook과 iPhone Chrome에서 접속 및 방 참가 성공이 문서화되어 있다.
iPhone Safari와 192.168.0.2 주소는 후속 확인 대상으로 남긴다.
```

## 테스트 결과

통과:

```text
node --check server.js
node --check script.js
WebSocket command createRoom 성공 확인
legacy type=createRoom 요청 BAD_MESSAGE 거부 확인
joinRoom 실패 시 top-level code/message 및 nested error 확인
joinRoom 성공 후 state.status = "lobby" 및 top-level revision 확인
guest 연결 끊김 후 reconnect 성공 확인
reconnect 후 같은 playerId로 state 수신 확인
leaveRoom 후 남은 클라이언트 state에서 참가자 제거 확인
script.js에서 클라이언트 요청 생성 지점이 payload.name 기반 하나로 통일되어 있음을 확인
```

## 수행하지 못한 항목

```text
Codex 인앱 브라우저 자동 입력이 가상 클립보드 오류로 닉네임 입력을 수행하지 못해 브라우저 기반 localStorage/reconnect UI 검증은 완료하지 못했다.
대신 localStorage 접근을 try/catch로 방어하고, reconnect 서버/클라이언트 코드 경로와 WebSocket 프로토콜을 자동 테스트했다.
이번 턴에서 실제 http://100.88.125.81:4173/ + Chrome 재검증은 수행하지 않았고, 기존 실제 기기 테스트 결과 문서를 기준으로 반영했다.
```

## 남은 위험

```text
localStorage identity는 같은 브라우저/같은 origin 기준이며, 다른 브라우저나 시크릿 창에서는 복구되지 않는다.
reconnect는 lobby 상태 복귀까지만 지원한다.
게임 상태 비공개 정보 필터링은 아직 없다.
게임 시작 이후 reconnect와 private state는 후속 단계에서 다시 검증해야 한다.
```

## 후속 작업

```text
Chrome에서 http://100.88.125.81:4173/ 기준으로 localStorage reconnect UI를 수동 재검증한다.
온라인 04 단계에서 게임 엔진 서버 이전을 시작한다.
온라인 05 단계에서 reconnect, private state, 비공개 정보 노출 방지를 더 엄격히 테스트한다.
```

## 최종 판단

부분 완료

## 리뷰 피드백 반영 결과

```text
server.js의 [upgrade], [ws:open], [ws:close] 진단 로그를 DEBUG_ONLINE=1 조건부 로그로 변경했다.
roomCreated/roomJoined/reconnected ack는 requestId가 pendingRequests에 남아 있을 때만 상태에 반영하도록 변경했다.
timeout 이후 늦게 도착한 ack는 무시한다.
state broadcast는 requestId와 무관하게 top-level revision 기준으로 계속 처리한다.
대기실 leaveRoom 정책은 "방에서 제거"로 유지하고, 게임 중 이탈 정책은 후속 단계에서 별도로 다루기로 문서화했다.
reconnect 추가 이후 http://100.88.125.81:4173/ + Chrome 실제 재검증 필요 항목을 유지했다.
```

## 리뷰 피드백 반영 테스트 결과

통과:

```text
node --check server.js
node --check script.js
DEBUG_ONLINE 미설정 시 [upgrade], [ws:open], [ws:close] 로그 미출력 확인
DEBUG_ONLINE=1 설정 시 WebSocket 진단 로그 출력 확인
WebSocket createRoom/joinRoom/reconnect 회귀 테스트
state broadcast revision 처리 경로 유지 확인
```

## 리뷰 피드백 및 후속 보완 권고

작성일: 2026-05-26

### 긍정적 평가

```text
프로토콜 정리 방향이 적절하다.
서버가 legacy 직접 type 요청을 막고 type: "command" + payload.name 형식을 기준으로 처리하도록 정리했다.
error 응답에 top-level code/message와 nested error.code/error.message를 함께 제공한 점은 클라이언트 처리와 디버깅에 도움이 된다.
클라이언트 pending request timeout을 추가해 무한 대기 위험을 줄였다.
localStorage identity 저장과 reconnect 최소 구현은 이후 온라인 단계의 기반으로 의미가 있다.
브라우저 localStorage/reconnect UI 검증을 완료하지 못한 점을 보고서에 명확히 기록했다.
```

### 보완이 필요한 점

```text
server.js에 WebSocket 진단 로그가 남아 있다.
[upgrade], [ws:open], [ws:close] 로그는 접속 문제 디버깅에는 유용하지만, 계속 켜 두면 서버 콘솔이 불필요하게 시끄러워질 수 있다.
다음 단계 전에 제거하거나 DEBUG_ONLINE=1 같은 환경변수 조건부 로그로 바꾸는 것이 좋다.
```

```text
localStorage/reconnect는 코드 경로는 생겼지만 실제 브라우저 수동 검증이 미완료다.
4단계로 넘어가기 전 또는 4단계 초반에 Chrome에서 "방 만들기 -> 새로고침 -> 자동 복귀" 흐름을 반드시 확인해야 한다.
```

```text
sendOnlineCommand timeout 이후 늦은 응답이 도착하는 경우 상태 적용 순서가 애매해질 수 있다.
현재 handleOnlineMessage는 roomCreated/roomJoined/reconnected 메시지를 받으면 pending 존재 여부를 확인하기 전에 상태를 먼저 반영한다.
드문 경우지만 UI에는 timeout 오류가 표시된 뒤 상태가 뒤늦게 반영되는 상황이 생길 수 있다.
필요하면 requestId가 pending에 남아 있는 응답만 resolve/상태 적용할지 정책을 정해야 한다.
```

```text
leaveRoom = 방에서 제거 정책은 대기실 기준으로는 명확하다.
하지만 게임 시작 이후에도 같은 정책을 적용하면 seatIndex, 턴, 자원, 건설물 상태가 깨질 수 있다.
게임 중 이탈은 "연결 끊김으로 유지" 또는 "AI/대리 진행/게임 중단" 같은 별도 정책이 필요하다.
```

```text
이번 단계에서는 http://100.88.125.81:4173/ + Chrome 실제 기기 재검증을 수행하지 않았다.
기존 실제 기기 테스트 결과를 참조한 것은 적절하지만, reconnect가 추가된 이후에는 다시 한 번 실기기 검증이 필요하다.
```

### 다음 단계 전 권장 조치

```text
1. server.js의 WebSocket 진단 로그를 제거하거나 DEBUG_ONLINE 환경변수 조건부로 변경한다.
2. Chrome에서 localStorage reconnect 흐름을 수동 검증한다.
3. timeout 이후 늦은 응답 처리 정책을 정한다.
4. 대기실 leaveRoom 정책과 게임 중 이탈 정책을 분리해서 문서화한다.
5. reconnect 추가 이후 실제 기기에서 http://100.88.125.81:4173/ + Chrome 접속/방 복귀를 재검증한다.
```

### 판단 보강

```text
3단계는 대기실 프로토콜 기준으로는 다음 단계로 넘어갈 수 있는 수준이다.
다만 reconnect, leaveRoom, revision 정책은 게임 상태가 들어오는 4단계부터 더 중요해진다.
따라서 현재 구현은 "대기실 기준 부분 완료, 게임 중 정책은 후속 재검토 필요"로 보는 것이 적절하다.
```
