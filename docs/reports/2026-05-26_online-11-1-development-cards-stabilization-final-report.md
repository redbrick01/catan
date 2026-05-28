# 온라인 11-1단계 개발 카드 보강 최종 보고서

작성일: 2026-05-26

## 구현 요약

11단계 개발 카드 기능의 안정화 피드백을 반영했다. `roadBuilding` 카드가 더 이상 무료 도로 pending에 갇히지 않도록 보강했고, 무료 도로 배치가 일반 도로 건설과 같은 `longestRoad`/winner 갱신 경로를 타도록 확인했다. 승점 카드로 승리한 경우에는 전체 개발 카드 상세를 공개하지 않고 승리 요약에 숨은 승점 카드 개수만 표시하도록 정리했다.

## 주요 변경

### 서버

- `makeWinnerSummary(matchState)`를 추가해 winner 결정 후 `winnerSummary.victoryDevCount`만 공개한다.
- 승리한 플레이어 view에는 `victoryDevCount`만 추가로 노출하고, `dev` 상세와 `hiddenVictoryPoints`는 기존 viewer-private 정책을 유지한다.
- `roadBuilding` 사용 직후 합법 무료 도로 위치가 없으면 카드 사용은 성공 처리하되 `pendingFreeRoads = 0`, `freeRoadOwnerSeat = null` 상태로 종료된다.
- `placeFreeRoad` 후 남은 합법 무료 도로 위치가 없거나 도로 말이 없으면 pending을 자동 종료한다.
- 일반 `buildRoad`와 `placeFreeRoad` 모두 `longestRoad` 갱신 helper를 호출하는 경로를 유지한다.
- 무료 도로로 `longestRoad`를 획득하고 10점 이상이 되면 winner가 설정된다.
- 기사 카드의 강도 이동/약탈 pending은 구현하지 않았고 12단계 범위로 유지했다.
- `roadBuilding` pending은 12단계 `pendingAction` 구조로 통합하지 않고 기존 `pendingFreeRoads/freeRoadOwnerSeat` 모델을 유지했다.

### 클라이언트

- 온라인 match hydrate 시 `game.winnerSummary`를 저장한다.
- 게임 종료 안내 문구에 `winnerSummary.victoryDevCount` 또는 승자 view의 `victoryDevCount`를 사용해 `숨은 승점 카드 N장 포함` 문구를 표시한다.
- 게임 진행 중 상대 개발 카드 상세와 상대 숨은 승점은 계속 표시하지 않는다.

### 테스트

- `scripts/online-11-development-cards-ws-test.js`를 보강했다.
- `roadBuilding` 사용 직후 합법 무료 도로가 없는 경우 pending 없이 종료되는지 검증했다.
- 무료 도로가 `longestRoad`를 갱신하고 winner까지 설정할 수 있는지 검증했다.
- 승점 카드로 winner가 정해진 뒤 `winnerSummary.victoryDevCount`가 공개되고 상대 개발 카드 상세는 노출되지 않는지 검증했다.
- 10단계 플레이어 교환 WebSocket 회귀 테스트를 실행했다.

## 테스트 결과

통과:

```text
node --check server.js
node --check script.js
node --check scripts/online-11-development-cards-ws-test.js
node scripts/online-11-development-cards-ws-test.js
node scripts/online-10-player-trade-ws-test.js
```

확인된 핵심 항목:

- `roadBuilding` no-legal-road pending 자동 종료
- `placeFreeRoad` 후 dead pending 자동 종료
- 무료 도로 비용 미차감 및 도로 말 차감
- 무료 도로 기반 `longestRoad` 갱신
- 무료 도로 기반 winner 설정
- 승점 카드 기반 winner 설정
- 승리 요약의 `victoryDevCount` 공개
- 상대 개발 카드 상세/상대 숨은 승점 미노출
- 기사 카드 강도 이동/약탈 pending 미생성
- 10단계 플레이어 교환 흐름 회귀 통과

## 수동 테스트 필요

이번 작업에서는 실제 브라우저 3개/실기기 LAN 수동 테스트는 수행하지 않았다. 다음 항목은 수동 확인이 필요하다.

- 온라인 3인 play phase에서 `roadBuilding` 무료 도로 배치 후 모든 브라우저가 동일한 도로/최장 교역로 상태를 보는지
- 더 놓을 무료 도로가 없을 때 UI가 `roadBuilding` 상태에 갇히지 않는지
- 승점 카드 승리 시 종료 안내 문구가 실제 화면에서 자연스럽게 표시되는지
- 게임 진행 중 상대 개발 카드 상세와 상대 숨은 승점이 화면에 나타나지 않는지
- 오프라인 개발 카드 기존 UX가 실제 브라우저에서 유지되는지

## 후속 과제

- 12단계에서 기사 카드의 강도 이동/약탈과 주사위 7 pending action을 별도 정책으로 구현한다.
- 12단계 pendingAction 도입 시 `roadBuilding`의 기존 `pendingFreeRoads/freeRoadOwnerSeat`와 충돌하지 않도록 통합 정책을 별도 검토한다.
