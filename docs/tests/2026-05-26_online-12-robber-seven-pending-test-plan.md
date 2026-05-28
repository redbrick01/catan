# 온라인 12단계 7/강도/pending action 테스트 계획

작성일: 2026-05-26

## 목적

온라인 play phase에서 주사위 7, 카드 버리기, 강도 이동, 피해자 선택, 무작위 약탈, 기사 카드 강도 흐름이 서버 권위 `pendingAction` 기준으로 동작하는지 검증한다. 기존 `pendingFreeRoads/freeRoadOwnerSeat` roadBuilding 흐름과 10단계 플레이어 교환 흐름이 깨지지 않는지도 확인한다.

## 자동 테스트

### 문법 검사

```text
node --check server.js
node --check script.js
node --check scripts/online-12-robber-seven-pending-ws-test.js
node --check scripts/online-11-development-cards-ws-test.js
```

### WebSocket 테스트

```text
node scripts/online-12-robber-seven-pending-ws-test.js
node scripts/online-11-development-cards-ws-test.js
node scripts/online-10-player-trade-ws-test.js
```

검증 항목:

- 주사위 7에서 8장 이상 보유 플레이어만 `discardForSeven` 대상이 된다.
- `needed = floor(resourceCount / 2)`로 계산된다.
- discard 대상이 아닌 플레이어의 `discardForSeven`은 거절된다.
- discard 수량이 정확하지 않으면 거절된다.
- 모든 discard 완료 후 `moveRobber` pending으로 전환된다.
- pending 중 `endTurn` 등 진행 command가 차단된다.
- 현재 강도 위치로 `moveRobber`를 시도하면 거절된다.
- 피해자 후보가 없으면 `NO_VICTIM` 결과를 기록하고 pending이 종료된다.
- 피해자 후보가 1명이면 서버가 카드 단위 pool 기준으로 자동 무작위 약탈한다.
- 피해자 후보가 2명 이상이면 actor view에만 victim 목록이 표시되고 `chooseRobberVictim`이 필요하다.
- `chooseRobberVictim`은 `victimSeatIndex` 기준으로 처리된다.
- 약탈 결과 resource는 actor/victim에게만 보이고 others에게는 `null`로 전달된다.
- 내부 raw `pendingAction`은 클라이언트 view에 노출하지 않고 `pendingActionView`만 사용한다.
- 강도 위치 타일은 이후 주사위 생산에서 제외된다.
- 기사 카드는 discard 없이 `moveRobber` pending으로 진입한다.
- 기존 11단계 개발 카드 및 10단계 플레이어 교환 회귀 테스트가 통과한다.

## 수동 테스트

실제 브라우저 3개 또는 기기 3대로 다음 항목을 확인한다.

- 주사위 7 후 discard 대상자에게만 카드 버리기 모달이 표시된다.
- discard 대상자가 아닌 유저에게는 대기 모달이 표시된다.
- discard 완료 후 active player에게 강도 이동 UI가 표시된다.
- 현재 강도 위치가 아닌 타일만 이동 대상으로 동작한다.
- 피해자 2명 이상일 때 actor에게만 피해자 선택 모달이 표시된다.
- 약탈 결과 모달이 actor/victim/others별로 resource 공개 범위를 지킨다.
- `lastRobberResult.id` 기준으로 새로고침/재접속 후 같은 결과 모달이 반복 표시되지 않는다.
- pending actor가 새로고침 후 reconnect하면 같은 pending UI가 복구된다.
- pending 중 다른 플레이어가 disconnect하면 5-2 재접속 대기 모달이 우선 표시된다.
- leaveRoom 시 방 종료 정책이 기존 5-2와 동일하게 유지된다.
- roadBuilding 무료 도로 pending은 12단계 pendingAction과 섞이지 않는다.

## 제외 범위

- 강도 이동 추천
- 고급 애니메이션
- 채팅/타이머
- roadBuilding pending을 `pendingAction`으로 통합하는 작업
