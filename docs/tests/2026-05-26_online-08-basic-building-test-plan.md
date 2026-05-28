# 온라인 모드 8단계 기본 건설 테스트 계획

작성일: 2026-05-26

## 목적

온라인 `play` phase에서 도로, 마을, 도시 건설이 서버 권위 command로만 확정되는지 검증한다. 클라이언트는 로컬 `buildRoad`, `buildSettlement`, `buildCity`로 직접 상태를 바꾸지 않고, 서버가 비용, 연결, 차례, 주사위, 종료/재접속 대기 상태를 검증한 뒤 viewer별 `matchState`를 broadcast해야 한다.

## 변경 대상

```text
server.js
script.js
scripts/online-08-basic-building-ws-test.js
docs/plans/2026-05-26_online-08-basic-building-plan.md
```

## 자동 테스트

```text
node --check server.js
node --check script.js
node --check scripts/online-08-basic-building-ws-test.js
node scripts/online-08-basic-building-ws-test.js
```

WebSocket 자동 테스트 범위:

```text
1. 3인 방 생성, 참가, 게임 시작, 초기 배치 완료 후 play phase fixture를 만든다.
2. rolled=false 상태에서 buildRoad가 ROLL_REQUIRED로 거절되는지 확인한다.
3. active player가 아닌 참가자의 buildRoad가 NOT_YOUR_TURN으로 거절되는지 확인한다.
4. 유효하지 않은 edgeId가 INVALID_PLACEMENT로 거절되는지 확인한다.
5. 자원 부족 상태의 buildCity가 NOT_ENOUGH_RESOURCES로 거절되는지 확인한다.
6. 현재 차례 플레이어가 주사위를 굴린 뒤 buildRoad에 성공하는지 확인한다.
7. buildRoad 성공 후 상대 viewer state의 edge owner가 동일하게 동기화되는지 확인한다.
8. buildSettlement 성공 후 상대 viewer state의 vertex owner가 동일하게 동기화되는지 확인한다.
9. buildCity 성공 후 city 상태와 공개 승점이 갱신되는지 확인한다.
10. 상대 viewer state에 자원 상세가 노출되지 않고 resourceCount만 보이는지 확인한다.
11. connected=false 참가자가 있으면 build command가 ROOM_NOT_READY로 거절되는지 확인한다.
12. ended 방에서 build command가 ROOM_ENDED로 거절되는지 확인한다.
```

## 브라우저 스모크 테스트

```text
1. http://127.0.0.1:4173/?test=1 로 접속한다.
2. 페이지 title이 "Catan"으로 로드되는지 확인한다.
3. 온라인 UI가 DOM에 존재하는지 확인한다.
4. 브라우저 console error가 없는지 확인한다.
```

## 수동 테스트 필요 항목

```text
1. 실제 Chrome 3개 또는 실제 기기 3개로 온라인 방을 만들고 play phase까지 진행한다.
2. 내 차례 + rolled=true일 때만 도로/마을/도시 버튼이 활성화되는지 확인한다.
3. 보드 클릭 시 온라인에서는 로컬 상태가 먼저 변하지 않고 서버 응답 후 모든 브라우저가 같은 board state를 보는지 확인한다.
4. 상대 마을/도시를 통과하는 road 연결이 UI와 서버에서 거절되는지 실제 보드 상황으로 확인한다.
5. 10점 이상 도달 시 winner가 모든 브라우저에 동일하게 표시되는지 긴 플레이 흐름에서 확인한다.
6. 방 나가기 종료 모달, 재접속 대기 모달과 건설 버튼 비활성화가 함께 깨지지 않는지 확인한다.
7. 오프라인 모드의 기존 건설, 비용 차감, 새 게임 동작이 유지되는지 확인한다.
```

## 통과 기준

```text
buildRoad/buildSettlement/buildCity는 서버 command로만 성공한다.
active player, play phase, rolled=true, winner 없음, pending action 없음 조건을 만족해야 한다.
도로는 비용, 말 수, 점유 여부, 자신의 네트워크 연결, 상대 건물 통과 금지를 검증한다.
마을은 비용, 말 수, 점유 여부, 거리 규칙, 자신의 도로 연결을 검증한다.
도시는 비용, 말 수, 자신의 마을, 이미 도시 아님 조건을 검증한다.
성공 후 bank/player resources/pieces/board state/publicPoints/winner가 서버 state에 반영된다.
viewer별 state에서 본인 자원 상세만 보이고 상대는 resourceCount 중심으로 보인다.
connected=false, ended, left, 인증 실패 상태에서는 command가 거절된다.
오프라인 모드는 기존 로컬 흐름을 유지한다.
```
