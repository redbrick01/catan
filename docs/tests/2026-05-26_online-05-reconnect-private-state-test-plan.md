# 온라인 05 재접속/비공개 상태 테스트 계획

작성일: 2026-05-26

## 테스트 대상

```text
server.js
script.js
docs/plans/2026-05-26_online-05-reconnect-private-state-test-plan.md
```

## 테스트 환경

```text
OS: Windows
Node.js: 로컬 node
자동 테스트 서버: PORT=4275 임시 실행
브라우저 확인 서버: PORT=4276 임시 실행
권장 실제 기기 기준: http://100.88.125.81:4173/ + Chrome
```

## 자동 테스트 항목

```text
node --check server.js
node --check script.js
3클라이언트 createRoom/joinRoom/startGame
각 클라이언트가 동일한 보드/항구/강도 위치를 받는지 확인
각 클라이언트가 서로 다른 viewerSeatIndex를 받는지 확인
matchState.devDeck 배열이 클라이언트 state에 없는지 확인
matchState.devDeckCount가 숫자로 제공되는지 확인
본인 player view에는 resources/dev 상세가 있는지 확인
상대 player view에는 resources/dev 상세가 없고 resourceCount/devCount만 있는지 확인
playing 상태에서 기존 roomId/playerId/playerToken으로 reconnect 시 같은 보드와 같은 private view를 받는지 확인
```

## 브라우저/수동 테스트 항목

```text
온라인 방 만들기
게스트 2명 참가
방장 게임 시작
모든 화면이 새로고침 없이 게임 화면으로 자동 전환되는지 확인
게스트 화면 새로고침 후 localStorage identity 기반으로 playing 상태에 복귀하는지 확인
콘솔 오류가 없는지 확인
```

## 실패/미수행 시 확인할 내용

```text
devDeck 배열이 state에 포함되어 있으면 private state 분리 실패
상대 resources/dev 상세가 보이면 비공개 정보 노출
reconnect 후 lobby 화면으로 돌아가면 playing reconnect UI 흐름 실패
브라우저 자동 입력이 불가능하면 실제 Chrome 수동 검증 대상으로 보고서에 기록
```

## 완료 기준

```text
문법 검사 통과
WebSocket private view 자동 테스트 통과
playing reconnect 자동 테스트 통과
브라우저/기기 검증 수행 여부와 미수행 항목을 최종 보고서에 명시
```
