# 봇 03 초기 배치 계획

작성일: 2026-05-26

## 목적

봇이 setup1/setup2 단계에서 정착지와 도로를 자동으로 배치하게 한다. 초기 배치는 봇 실력에 가장 큰 영향을 주는 부분이므로, 기본 봇이라도 완전 랜덤이 아니라 간단한 평가 함수를 사용한다.

## 범위

포함:

```text
합법 정착지 후보 탐색
정착지 후보 점수화
두 번째 정착지의 자원 보완 평가
초기 도로 후보 선택
setup1/setup2 pending 없는 자동 진행
setup 정착지 배치 후 해당 정착지에 연결된 도로 배치
setup2 두 번째 정착지의 초기 자원 지급 회귀 확인
setup1 정방향/setup2 역방향 순서 회귀 확인
```

제외:

```text
장기 최장 교역로 계획
상대 초기 배치 예측
고급 항구 전략
오프라인 봇 초기 배치
```

## 평가 기준

평가 함수는 어디까지나 후보 선택에만 사용한다. 최종 배치는 기존 서버 command 검증을 반드시 통과해야 한다.

### 정착지 후보

```text
숫자 생산 확률
자원 다양성
나무/벽돌/밀/양 초반 가치
밀/광석 중후반 가치
항구 가치
첫 정착지와의 자원 보완
주변 확장 가능성
강도가 있는 사막 또는 생산 없는 타일 감점
```

숫자 가중치 예시:

```text
6/8: 높음
5/9: 중상
4/10: 중간
3/11: 낮음
2/12: 매우 낮음
사막: 0
```

권장 숫자 가중치:

```text
2/12: 1
3/11: 2
4/10: 3
5/9: 4
6/8: 5
```

자원 가중치는 첫 번째와 두 번째 정착지에서 다르게 적용한다.

```text
첫 정착지: 나무/벽돌/밀/양을 균형 있게 선호
두 번째 정착지: 첫 정착지에 없는 자원과 광석/밀 보완을 선호
```

### 두 번째 정착지 보정

```text
첫 정착지에서 없는 자원을 얻으면 가산점
첫 정착지와 같은 자원만 반복하면 감점
초기 자원 지급을 고려해 밀/양/나무/벽돌 조합을 선호
```

### 도로 후보

```text
방금 지은 정착지와 연결된 합법 도로
다음 좋은 정착지 후보로 향하는 방향
막다른 외곽 방향은 감점
판단 실패 시 첫 번째 합법 도로 선택
```

초기 도로는 반드시 방금 배치한 정착지와 연결되어야 한다. 봇의 기존 다른 정착지나 도로와 연결되어 있다는 이유만으로 선택하면 안 된다.

## setup phase 실행 모델

setup phase에서는 정착지와 도로가 한 묶음처럼 진행된다.

```text
1. 현재 setup actor가 봇인지 확인한다.
2. 아직 이 setup turn에서 정착지를 놓지 않았다면 buildInitialSettlement를 실행한다.
3. 방금 놓은 settlementVertexId를 서버 matchState의 setup progress field에 기억한다.
4. 해당 vertex와 연결된 합법 도로만 후보로 삼는다.
5. buildInitialRoad를 실행한다.
6. 기존 서버 setup 진행 로직이 다음 setup actor로 넘긴다.
```

이 단계에서 새 pending action을 만들지 않는다. 정착지 command와 도로 command 사이에 서버 state가 broadcast되더라도, 다음 runner 예약이 같은 봇의 "도로 필요 상태"를 인식할 수 있어야 한다.

runner local state만으로 방금 정착지를 추적하지 않는다. timer 취소, revision 변경, 서버 상태 broadcast 이후에도 도로 step을 복구할 수 있도록 matchState에 다음과 같은 서버 내부 field를 둔다.

```js
matchState.game.setupPlacement = {
  seatIndex: 2,
  settlementVertexId: 17,
  phase: "setup1" // setup1 | setup2
};
```

이 값은 public state에 그대로 노출할 필요는 없다. 도로 배치가 성공하면 즉시 clear한다.

## setup 순서 검증

기존 서버 setup 진행 로직을 유지한다.

```text
setup1: seatIndex 0 -> 1 -> 2 -> 3
setup2: seatIndex 3 -> 2 -> 1 -> 0
```

플레이어 수가 3명인 경우에도 같은 원칙을 적용한다.

```text
setup1: 0 -> 1 -> 2
setup2: 2 -> 1 -> 0
```

봇은 setupIndex를 직접 바꾸지 않는다. 정착지/도로 command가 성공한 뒤 기존 서버 로직이 setupIndex와 phase를 이동해야 한다.

## 구현 순서

```text
1. getLegalSettlementVertices(matchState, seatIndex, setup) 추가
2. scoreSettlementVertex(matchState, seatIndex, vertexId, setupPhase) 추가
3. chooseBotSettlement(matchState, seatIndex) 추가
4. getLegalSetupRoads(matchState, settlementVertexId) 추가
5. scoreSetupRoad(matchState, seatIndex, edgeId, settlementVertexId) 추가
6. chooseBotSetupRoad(matchState, seatIndex, settlementVertexId) 추가
7. 봇 actor가 setup phase일 때 정착지 필요 상태와 도로 필요 상태를 구분
8. buildSettlement 후 setupPlacement에 settlementVertexId를 보존
9. settlementVertexId에 연결된 도로만 후보로 buildRoad 실행
10. buildRoad 성공 후 setupPlacement를 clear
11. setup1/setup2 순서가 기존 로직과 동일한지 회귀 확인
```

## 수정 대상 파일

```text
server.js
- 합법 정착지/도로 후보 helper
- 봇 초기 배치 평가 함수
- runner의 setup phase 처리
- setup turn에서 방금 놓은 정착지 추적 방식: setupPlacement
- setup2 초기 자원 지급 회귀 점검
- setup1/setup2 순서 회귀 점검

scripts/
- 초기 배치 자동 진행 WebSocket 테스트
```

## 상세 구현 체크리스트

```text
[ ] canBuildInitialSettlement와 동일한 규칙을 재사용한다.
[ ] canBuildInitialRoad와 동일한 규칙을 재사용한다.
[ ] 정착지 선택 후 같은 runner tick 또는 다음 예약 step에서 도로 후보를 계산한다.
[ ] 방금 놓은 settlementVertexId는 runner local state가 아니라 matchState setupPlacement에 저장한다.
[ ] 도로 후보는 방금 놓은 settlementVertexId와 연결된 edge로 제한한다.
[ ] buildRoad 성공 후 setupPlacement를 clear한다.
[ ] setupPlacement가 남아 있는데 actor/phase가 달라지면 오류 로그를 남기고 안전하게 중단한다.
[ ] setup2 정착지 id를 저장해 초기 자원 지급이 정상 처리되는지 확인한다.
[ ] setup1/setup2 순서는 기존 서버 로직이 담당하고 봇이 직접 setupIndex를 변경하지 않는다.
[ ] buildSettlement 성공 후 buildRoad가 실패하면 같은 vertex 기준으로 다른 합법 도로를 1회 재시도한다.
[ ] buildRoad가 모두 실패하면 runner를 멈추고 서버 로그에 이유를 남긴다.
[ ] 후보가 없으면 오류를 던지지 말고 합법 fallback 또는 room 종료 정책을 따른다.
[ ] 평가 함수는 public state가 아니라 서버 matchState를 기준으로 하되 비공개 정보는 사용하지 않는다.
[ ] harbor 점수는 기존 harbor edge/vertex 모델을 기준으로 계산하고, 없으면 0점 처리한다.
[ ] setupPlacement는 public state에 노출하지 않는다.
```

## 점수 계산 기준

```text
settlementScore =
  숫자 생산 확률 합
  + 자원 다양성 보너스
  + 단계별 자원 가중치
  + 항구 보너스
  + 확장 가능성 보너스
  + setup2 보완 자원 보너스
  - 중복 자원 과다 감점
  - 생산 없는 타일 감점
```

도로 점수:

```text
roadScore =
  연결된 반대쪽 vertex의 향후 정착지 가능성
  + 주변 타일 생산 기대값
  + 항구 방향 보너스
  - 이미 막힌 방향 감점
  - 보드 외곽 막다른 방향 감점
```

동점 처리:

```text
상위 후보 2~3개 중 deterministic 선택
NODE_ENV=test에서는 항상 같은 후보 선택
일반 모드에서도 완전 랜덤보다 안정적인 tie-break 사용
```

권장 tie-break:

```text
score 높은 순
동점이면 생산 숫자 가중치 합 높은 순
동점이면 자원 다양성 높은 순
동점이면 vertexId 낮은 순
```

## 검증 계획

자동:

```text
봇이 setup1에서 정착지와 도로를 배치한다.
봇이 setup2에서 정착지와 도로를 배치한다.
거리 규칙을 위반하지 않는다.
도로는 방금 지은 정착지와 연결된다.
setup2 두 번째 정착지에서 초기 자원을 받는다.
초기 배치가 끝나면 play phase로 진입한다.
정착지 command 성공 후 도로 command 실패 시 fallback 도로를 시도한다.
setup1은 정방향, setup2는 역방향으로 진행된다.
정착지 command 후 revision이 바뀌어도 setupPlacement로 도로 step을 복구한다.
도로 배치 후 setupPlacement가 clear된다.
```

수동:

```text
사람 1 + 봇 2 게임을 시작한다.
봇이 차례에 맞춰 초기 배치를 진행한다.
모든 브라우저에서 건설물이 같은 위치에 보인다.
봇의 두 번째 정착지 이후 자원 수가 서버/클라이언트 view에서 일관된다.
```

## 위험 요소

```text
합법 후보가 없을 때 runner가 멈출 수 있다.
정착지와 도로 사이의 연결 정보를 잘못 잡을 수 있다.
setup2에서 초기 자원 지급과 충돌할 수 있다.
정착지 command 후 broadcast/revision 변경 때문에 도로 step이 취소될 수 있다.
항구 점수 계산이 실제 harbor 모델과 어긋나 잘못된 위치를 선호할 수 있다.
setupPlacement가 public state에 노출될 수 있다.
setupPlacement가 clear되지 않아 다음 setup actor의 도로 후보가 잘못 계산될 수 있다.
봇이 setupIndex를 직접 바꾸면 기존 정방향/역방향 규칙이 깨질 수 있다.
```

## 롤백/복구 방법

```text
평가 함수가 문제를 만들면 합법 후보 첫 번째 선택 fallback으로 축소한다.
초기 배치 runner 연결만 끄면 bot-02의 일반 턴 runner는 유지할 수 있다.
setupPlacement 방식이 문제를 만들면 정착지와 도로를 같은 runner step에서만 처리하는 임시 fallback으로 축소하되, revision/broadcast 안정성 위험을 known issue로 기록한다.
```

## 테스트 산출물

```text
docs/tests/2026-05-26_bot-03-initial-placement-test-plan.md
docs/reports/2026-05-26_bot-03-initial-placement-final-report.md
```

## 완료 기준

```text
봇 포함 게임이 setup1/setup2를 자동으로 통과한다.
봇 초기 배치가 규칙을 위반하지 않는다.
봇 초기 도로는 항상 방금 지은 정착지와 연결된다.
setup2 초기 자원 지급이 정상 동작한다.
setup1/setup2 순서가 기존 규칙과 동일하다.
setupPlacement는 도로 배치 후 clear되고 public state에 노출되지 않는다.
봇 배치 결과가 모든 클라이언트에 동기화된다.
```
