# 온라인 04 게임 엔진 이전 최종 보고서

작성일: 2026-05-26

## 관련 문서

```text
catan_implementation_process_guideline.md
docs/implementation_plans/2026-05-26_online-00-mvp-roadmap.md
docs/implementation_plans/2026-05-26_online-04-game-engine-migration-plan.md
docs/final_reports/2026-05-26_online-03-protocol-sync-final-report.md
docs/test_plans/2026-05-26_online-04-game-engine-migration-test-plan.md
```

## 리뷰 피드백 반영 결과

작성일: 2026-05-26

반영:

```text
hydrateMatchState()의 Object.assign(game, matchState.game) 경로를 resetGameStateFromMatch(matchState)로 분리했다.
서버 matchState에 없는 이전 game 필드가 클라이언트에 남지 않도록 game의 주요 필드를 명시적으로 초기화한다.
playing 상태 reconnect 후 reconnectOnlineRoom()이 무조건 onlineLobbyView를 다시 보여주는 문제를 수정했다.
reconnect 결과 state.status가 playing이면 hydrateMatchState()가 만든 게임 화면을 유지한다.
```

추가 테스트 결과:

```text
node --check server.js
node --check script.js
playing 상태에서 참가자 소켓 종료 후 기존 roomId/playerId/playerToken으로 reconnect
reconnect 응답 state.status = "playing" 확인
reconnect 응답에 matchState 포함 확인
reconnect 후 받은 matchState가 startGame 당시 matchState와 동일한지 확인
```

추가 WebSocket 테스트 주요 결과:

```json
{
  "statusAfterReconnect": "playing",
  "hasMatchAfterReconnect": true,
  "sameAfterReconnect": true,
  "revision": 6
}
```

문서화 유지 항목:

```text
matchState.devDeck 전체 노출은 5단계 private state 필터링에서 제거/필터링해야 한다.
서버/클라이언트 보드 생성 로직 중복은 후속 공용 엔진화 과제로 유지한다.
실제 3개 브라우저 또는 3개 기기 수동 검증은 여전히 후속 확인 대상으로 남긴다.
```

## 변경 파일 목록

```text
server.js
script.js
docs/implementation_plans/2026-05-26_online-04-game-engine-migration-plan.md
docs/test_plans/2026-05-26_online-04-game-engine-migration-test-plan.md
docs/final_reports/2026-05-26_online-04-game-engine-migration-final-report.md
docs/test_plans/2026-05-26_online-04-browser-load.png
```

## 구현 요약

```text
server.js에 startGame command를 추가했다.
방장만 게임을 시작할 수 있게 검증했다.
3명 이상, 모든 참가자 연결 상태에서만 시작되게 검증했다.
서버에서 초기 matchState를 생성한다.
matchState에 game, tiles, vertices, edges, harbors, robberTile, devDeck을 포함했다.
보드 지형, 숫자 토큰, 항구, 강도 위치, 개발 카드 덱은 서버에서만 랜덤 생성된다.
room.status를 lobby에서 playing으로 전환하고 state.status와 top-level revision 형식을 유지했다.
클라이언트는 playing state의 matchState를 기존 렌더 전역 상태로 hydrate한다.
방장이 게임 시작을 누르면 모든 참가자가 대기실에서 게임 화면으로 이동한다.
온라인 playing 상태에서는 초기 배치, 주사위, 턴 종료, 건설 등 아직 구현하지 않은 로컬 게임 액션을 차단했다.
```

## 3단계 피드백 반영

```text
server.js의 WebSocket 진단 로그는 DEBUG_ONLINE=1 조건부 상태를 유지했다.
대기실 reconnect command와 localStorage identity 경로는 유지했다.
leaveRoom은 대기실에서는 방에서 제거로 유지했다.
게임 중 leaveRoom은 INVALID_ACTION으로 거절하며, 게임 중 이탈 정책은 후속 과제로 남겼다.
```

## 테스트 결과

통과:

```text
node --check server.js
node --check script.js
WebSocket 3클라이언트 createRoom/joinRoom/startGame 시나리오
3명 미만 startGame -> ROOM_NOT_READY 확인
참가자 startGame -> NOT_HOST 확인
방장 startGame -> status playing 확인
모든 클라이언트 sameBoard = true 확인
matchState shapeOk = true 확인
playing 이후 joinRoom -> ROOM_NOT_JOINABLE 확인
playing 중 leaveRoom -> INVALID_ACTION 확인
브라우저 로딩 확인
브라우저 console error 없음 확인
```

WebSocket 자동 테스트 주요 결과:

```json
{
  "roomNotReady": true,
  "notHost": true,
  "sameBoard": true,
  "shapeOk": true,
  "joinRejected": true,
  "leaveRejected": true,
  "players": 3,
  "revision": 4,
  "devDeck": 25
}
```

브라우저 확인 결과:

```json
{
  "title": "카탄",
  "startVisible": true,
  "onlineButtonCount": 1,
  "errors": []
}
```

## 수행하지 못한 항목

```text
http://100.88.125.81:4173/ + Chrome 실제 다기기 수동 검증은 이번 실행 환경에서 수행하지 못했다.
온라인 UI에서 실제 닉네임 입력 후 3개 브라우저로 게임 시작 버튼을 누르는 전체 수동 흐름은 수행하지 못했다.
대신 WebSocket 3클라이언트 자동 테스트로 서버 동기화와 거절 정책을 검증했고, 브라우저 단일 로딩과 콘솔 오류 없음을 확인했다.
```

## 남은 위험

```text
게임 중 reconnect/private state 필터링은 5단계 검증 대상이다.
게임 중 이탈 정책은 아직 확정되지 않았다.
온라인 playing 화면은 렌더링만 지원하며 초기 배치, 주사위, 턴 종료, 건설 명령은 아직 서버 command로 구현되지 않았다.
현재 matchState에는 devDeck 전체가 포함되므로 비공개 상태 필터링 전까지는 테스트/MVP 동기화 용도로만 봐야 한다.
```

## 후속 작업

```text
5단계에서 reconnect와 private state 필터링을 검증한다.
초기 배치 command를 서버 권위 방식으로 구현한다.
게임 중 이탈/재접속 정책을 별도 문서로 확정한다.
실제 기기에서 http://100.88.125.81:4173/ + Chrome 기준으로 3인 이상 게임 시작 수동 검증을 수행한다.
```

## 최종 판단

부분 완료

## 리뷰 피드백 및 후속 보완 권고

작성일: 2026-05-26

### 긍정적 평가

```text
4단계 범위였던 startGame command와 서버 matchState 생성은 구현되었다.
방장 권한, 3명 이상, 모든 참가자 연결 상태 검증을 추가한 점은 적절하다.
서버에서 game, tiles, vertices, edges, harbors, robberTile, devDeck을 포함한 초기 matchState를 생성하는 구조는 다음 단계 기반으로 의미가 있다.
WebSocket 3클라이언트 자동 테스트에서 sameBoard=true, shapeOk=true를 확인한 점은 서버 상태 동기화 검증으로 유효하다.
3단계 피드백이었던 WebSocket 진단 로그를 DEBUG_ONLINE=1 조건부로 바꾼 점도 적절하다.
게임 중 leaveRoom을 막고 후속 정책으로 남긴 점은 현재 단계에서 안전한 선택이다.
```

### 추가 확인 사항

```text
참여자 화면이 대기실에 남아 있는 것처럼 보였으나, 브라우저 새로고침 후 정상적으로 playing 화면에 접속되는 것을 확인했다.
따라서 해당 현상은 4단계 구현 버그로 확정하지 않고, 브라우저 캐시 또는 이전 세션 상태로 인한 일시적 표시 문제로 기록한다.
```

주의:

```text
온라인 기능을 확인할 때는 기존 탭/캐시/이전 WebSocket 세션이 남아 있을 수 있다.
실제 기기 테스트 전에는 새로고침 또는 새 탭으로 최신 script.js를 로드한 뒤 확인하는 것이 좋다.
```

### 추가 보완이 필요한 점

```text
실제 브라우저 3개 또는 실제 기기 3개로 "대기실 -> 게임 시작 -> 같은 보드 표시" 수동 검증이 아직 충분하지 않다.
자동 WebSocket 테스트는 서버 state 동기화 검증으로 의미가 있지만, 실제 UI 전환 검증을 대체하지 못한다.
```

```text
matchState에 devDeck 전체가 포함되어 있다.
현재는 MVP 동기화 확인용으로 허용했지만, private state 적용 전까지는 모든 클라이언트가 개발 카드 덱 순서를 볼 수 있는 위험이 있다.
5단계 private state 또는 그 이전에 반드시 제거/필터링해야 한다.
```

```text
hydrateMatchState()는 Object.assign(game, matchState.game) 방식으로 동작한다.
기존 game 객체에 오래된 필드가 남을 수 있으므로, 장기적으로는 resetGameStateFromMatch() 같은 명시적 서버 상태 반영 함수로 정리하는 것이 좋다.
```

```text
서버의 보드 생성 로직과 클라이언트 기존 보드 생성 로직이 중복될 가능성이 있다.
오프라인/온라인 보드 규칙이 갈라지지 않도록 추후 공용 엔진화가 필요하다.
```

### 후속 재검증 기준

```text
1. 방장 포함 3개 브라우저 또는 기기로 대기실에 입장한다.
2. 방장이 게임 시작을 누른다.
3. 방장 화면이 게임 화면으로 이동한다.
4. 모든 참가자 화면도 자동으로 게임 화면으로 이동한다.
5. 모든 참가자 화면에서 같은 지형, 숫자 토큰, 항구, 강도 위치가 표시된다.
6. 브라우저 콘솔 오류가 없다.
```

### 판단 보강

```text
현재 4단계는 "서버 기준 startGame/matchState 생성 및 브라우저 새로고침 후 playing 화면 접속 확인" 상태다.
참여자 화면 전환 문제는 재현 가능한 4단계 버그로 확정하지 않는다.
다만 실제 브라우저/기기 3개에서 새로고침 없이 자동 전환되는지에 대한 수동 검증은 후속 확인 대상으로 남긴다.
```
