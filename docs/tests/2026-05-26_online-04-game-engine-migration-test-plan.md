# 온라인 04 게임 엔진 이전 테스트 계획

작성일: 2026-05-26

## 테스트 대상

```text
server.js
script.js
docs/plans/2026-05-26_online-04-game-engine-migration-plan.md
```

## 테스트 환경

```text
OS: Windows
Node.js: 로컬 node
서버: node server.js, 테스트 시 PORT=4273 임시 실행
브라우저: Codex in-app browser, http://127.0.0.1:4173/
실제 기기 기준 문서 주소: http://100.88.125.81:4173/ + Chrome
```

## 수동/브라우저 테스트 항목

```text
페이지가 로드되는지 확인한다.
모드 선택 화면과 온라인 방 만들기 버튼이 존재하는지 확인한다.
브라우저 콘솔 error 로그가 없는지 확인한다.
```

## 자동 테스트 항목

```text
node --check server.js
node --check script.js
WebSocket 3클라이언트 createRoom/joinRoom/startGame 시나리오
방장이 아닌 참가자의 startGame 거절
3명 미만 startGame 거절
playing 이후 joinRoom 거절
playing 중 leaveRoom 거절
playing 상태에서 기존 playerId/playerToken으로 reconnect 시 playing state와 matchState를 다시 받는지 확인
모든 클라이언트가 동일한 playing state와 matchState를 받는지 확인
matchState에 game, tiles, vertices, edges, harbors, robberTile, devDeck이 포함되는지 확인
tiles 19개, harbors 9개, devDeck 25장 확인
```

## 규칙 검증 항목

```text
서버에서만 초기 보드 랜덤 생성이 일어난다.
클라이언트는 서버 matchState를 hydrate해서 렌더링한다.
state.status와 top-level revision을 유지한다.
대기실 reconnect 경로는 유지한다.
leaveRoom은 대기실 제거 정책으로 유지하고, 게임 중 이탈 정책은 이번 단계에서 구현하지 않는다.
```

## 완료 기준

```text
문법 검사 통과
WebSocket 자동 테스트 통과
playing reconnect 자동 테스트 통과
브라우저 로딩과 콘솔 오류 없음 확인
테스트하지 못한 항목은 최종 보고서에 명시
```
