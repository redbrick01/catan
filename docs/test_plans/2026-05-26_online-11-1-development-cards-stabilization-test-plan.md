# 온라인 11-1단계 개발 카드 보강 테스트 계획

작성일: 2026-05-26

## 목적

11-1단계 개발 카드 안정화 변경이 온라인 서버 권위 흐름, 개발 카드 비공개 정보 보호, `roadBuilding` pending 종료 정책, 무료 도로 기반 `longestRoad`/승리 판정에 맞게 동작하는지 확인한다.

## 자동 테스트

### 문법 검사

```text
node --check server.js
node --check script.js
node --check scripts/online-11-development-cards-ws-test.js
```

### WebSocket 기능 테스트

```text
node scripts/online-11-development-cards-ws-test.js
node scripts/online-10-player-trade-ws-test.js
```

검증 항목:

- `devDeck`은 클라이언트에 노출되지 않고 `devDeckCount`만 공개된다.
- 본인에게만 개발 카드 상세와 `hiddenVictoryPoints`가 보인다.
- 상대에게는 `devCount`만 보이고 개발 카드 상세/숨은 점수는 보이지 않는다.
- 승점 카드는 사용할 수 없고 숨은 점수로 winner 판정에 반영된다.
- 승리 후 `winnerSummary.victoryDevCount`와 승자 player view의 `victoryDevCount`만 공개된다.
- `roadBuilding` 사용 직후 합법 무료 도로가 없으면 카드 사용은 성공하고 `pendingFreeRoads/freeRoadOwnerSeat`는 남지 않는다.
- `placeFreeRoad` 후 더 놓을 수 있는 합법 무료 도로가 없으면 pending이 자동 종료된다.
- 무료 도로는 비용을 차감하지 않고 도로 말만 차감한다.
- 무료 도로 배치가 `longestRoad`를 갱신한다.
- 무료 도로로 `longestRoad` 2점을 얻어 10점 이상이 되면 winner가 설정된다.
- `knight`는 11-1 범위에서 기사 수/최대 기사단만 처리하며 강도 이동/약탈 pending을 만들지 않는다.
- 10단계 플레이어 교환 WebSocket 회귀 테스트가 통과한다.

## 수동 테스트

실제 브라우저 3개 또는 기기 3대로 다음 항목을 확인한다.

- 온라인 방 생성 후 3인 게임을 play phase까지 진행한다.
- `roadBuilding` 카드 사용 후 무료 도로를 배치했을 때 모든 브라우저에서 같은 도로/최장 교역로 상태가 보인다.
- 더 놓을 무료 도로가 없을 때 UI가 `roadBuilding` 상태에 갇히지 않는다.
- 승점 카드로 승리한 경우 게임 종료 안내에 숨은 승점 카드 개수가 표시된다.
- 게임 진행 중에는 상대 개발 카드 상세와 상대 숨은 승점이 표시되지 않는다.
- 오프라인 개발 카드 기존 흐름이 유지된다.

## 제외 범위

- 기사 카드의 강도 이동/약탈
- 주사위 7 discard/pending action 통합
- `roadBuilding` pending을 12단계 `pendingAction` 구조로 이전
