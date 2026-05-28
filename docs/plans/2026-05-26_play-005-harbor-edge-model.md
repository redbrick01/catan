# 수정 계획서: PLAY-005 항구 위치 모델 개선

작성일: 2026-05-26  
관련 문제 문서: `docs/issues/2026-05-26_playability-issues.md`  
대상 파일: `script.js`, `styles.css`

## 1. 목적

항구를 특정 꼭짓점 하나가 아니라 해안 모서리와 연결된 두 교차점 기반으로 모델링해 실제 Catan 규칙에 가깝게 만든다.

## 2. 현재 문제

현재 `setupHarbors()`는 외곽 꼭짓점 중 일부를 골라 항구 하나를 배정한다.

현재 구조 예:

```js
{
  vertexId,
  type
}
```

문제:

- 실제 항구는 두 교차점 중 하나에 마을이나 도시가 있으면 사용 가능하다.
- 현재 구조는 한 교차점에만 항구 권한을 부여한다.
- 항구 시각 표시도 어느 두 위치가 연결되는지 명확하지 않다.

## 3. 수정 방향

항구 데이터를 꼭짓점 하나가 아니라 외곽 edge 또는 vertex pair로 표현한다.

권장 구조:

```js
{
  vertexIds: [a, b],
  type
}
```

항구 보유 판정:

- `vertexIds` 중 하나라도 현재 플레이어 소유 건물이라면 항구 보유

## 4. 구조 변경 여부

이 계획은 전체 프로젝트를 갈아엎는 작업은 아니지만, 보드 데이터 구조 일부를 바꾸는 중간 규모 수정이다.

1차 범위:

- 항구 데이터만 `vertexId`에서 `vertexIds`로 확장한다.
- 기존 타일, 꼭짓점, edge 배열은 유지한다.
- 교환 비율 계산과 항구 렌더링만 새 항구 구조를 읽도록 바꾼다.

전체 구조 변경이 필요한 범위:

- 보드 좌표계를 공식 Catan 맵 모델로 전면 재설계한다.
- 항구를 edge, 해안 경로, 바다 타일과 함께 별도 그래프로 모델링한다.
- 확장판 보드나 사용자 보드 편집기를 지원한다.

따라서 이번 계획은 "항구 데이터 마이그레이션"이지 "보드 엔진 전면 교체"가 아니다.

## 5. 구현 계획

1. 외곽 edge를 찾는 함수를 추가한다.
   - 양 끝 꼭짓점이 모두 외곽에 있고, 인접 타일 수가 적은 edge를 후보로 삼는다.
2. 항구 간 거리가 너무 가까워지지 않도록 후보 edge를 간격 있게 선택한다.
3. `setupHarbors()`가 `vertexIds` 배열을 가진 항구 9개를 생성하도록 변경한다.
4. `playerHarbors(playerId)`가 두 꼭짓점 중 하나의 소유자를 검사하도록 수정한다.
5. `drawHarbors()`는 두 꼭짓점의 중간점을 기준으로 항구 토큰을 그린다.
6. 항구 패널과 교환 비율 계산이 새 구조를 사용하도록 확인한다.

## 6. 세부 구현 체크리스트

대상 함수와 데이터:

- `harbors`
- `setupHarbors()`
- `playerHarbors(playerId)`
- `tradeRatioFor(playerId, resourceType)`
- `drawHarbors()`
- `renderCurrentPlayerHarbors()`
- `installTestHelpers()`의 상태 조회 반환값

새 데이터 구조:

```js
{
  id: 0,
  vertexIds: [12, 18],
  type: "generic"
}
```

외곽 edge 후보 조건:

- `edge.a`와 `edge.b`가 모두 존재한다.
- 두 꼭짓점 중 적어도 하나가 외곽 꼭짓점이다.
- 더 엄격한 조건은 두 꼭짓점 모두 외곽 꼭짓점이다.
- edge에 인접한 타일 수가 1개인 경우를 해안 edge로 본다.

해안 edge 판정 권장 방식:

1. 각 edge가 어떤 tile side에서 만들어졌는지 저장되어 있지 않으므로, 현재 구조에서는 `edge.a`, `edge.b`를 동시에 포함하는 tile 수를 계산한다.
2. 두 꼭짓점을 모두 포함하는 tile이 1개면 외곽 edge다.
3. 두 꼭짓점을 모두 포함하는 tile이 2개면 내부 edge다.

예상 헬퍼:

```js
function tilesForEdge(edge) {
  return tiles.filter((tile) => tile.vertexIds.includes(edge.a) && tile.vertexIds.includes(edge.b));
}

function isCoastalEdge(edge) {
  return tilesForEdge(edge).length === 1;
}
```

항구 간격 선택:

- 후보 edge를 보드 중심 기준 각도순으로 정렬한다.
- 9개 항구가 둘레에 퍼지도록 일정 간격으로 선택한다.
- 단순 셔플 후 너무 가까운 후보를 제외하는 방식도 가능하지만, 재현성과 시각 안정성은 각도순 선택이 낫다.

항구 타입 배정:

- 기존 구성 유지: 3:1 네 개, 자원별 2:1 다섯 개
- 타입은 셔플해서 선택된 edge에 배정한다.

시각 표시 기준:

- 항구 선은 두 꼭짓점 중간점에서 바깥 방향으로 뻗는다.
- 바깥 방향은 `midpoint - CENTER` 벡터를 정규화한다.
- 토큰은 보드와 겹치지 않도록 중간점에서 60~70px 바깥에 둔다.
- 두 꼭짓점 모두가 항구와 연결된다는 느낌을 주려면 짧은 dock line을 중간점에 배치한다.

마이그레이션 검색:

- `harbor.vertexId`
- `vertices[harbor.vertexId]`
- `harbor.type`

`harbor.type`은 유지하고, `harbor.vertexId`는 모두 `harbor.vertexIds`로 바꾼다.

## 7. 테스트 시나리오

### TC-001: 항구 데이터 구조 검증

사전 조건:

- 새 게임 시작

기대 결과:

- `harbors.length === 9`
- 모든 항구가 `vertexIds.length === 2`
- 모든 항구의 두 꼭짓점이 실제 edge로 연결되어 있다.
- 모든 항구는 외곽 edge에 연결되어 있다.

### TC-002: 항구 양쪽 꼭짓점 모두 권한 부여

절차:

1. 특정 항구의 첫 번째 꼭짓점에 현재 플레이어 마을을 배치한다.
2. `playerHarbors(player.id)` 결과를 확인한다.
3. 마을을 제거하고 두 번째 꼭짓점에 배치한다.
4. 다시 `playerHarbors(player.id)` 결과를 확인한다.

기대 결과:

- 두 경우 모두 같은 항구가 보유 항구로 판정된다.

### TC-003: 3:1 항구 교환 비율

사전 조건:

- 현재 플레이어가 `generic` 항구의 한쪽 꼭짓점에 건물을 보유

기대 결과:

- `tradeRatioFor(player.id, "forest") === 3`
- 다른 자원도 3이 된다.

### TC-004: 특정 자원 2:1 항구 교환 비율

사전 조건:

- 현재 플레이어가 `forest` 항구의 한쪽 꼭짓점에 건물을 보유

기대 결과:

- `tradeRatioFor(player.id, "forest") === 2`
- `tradeRatioFor(player.id, "hill")`은 다른 항구가 없다면 4다.

### TC-005: 시각 배치 검증

기대 결과:

- 항구 토큰 9개가 모두 보인다.
- 토큰이 숫자 칩, 건물, 도로와 심하게 겹치지 않는다.
- 모바일에서도 토큰이 SVG viewBox 밖으로 잘리지 않는다.

## 8. 완료 기준

- 항구 하나가 두 교차점에 연결되어 표시된다.
- 두 교차점 중 어느 곳에 마을이나 도시를 지어도 항구 교환 비율이 적용된다.
- 3:1 항구와 특정 자원 2:1 항구가 모두 정상 동작한다.
- 항구 9개가 보드 외곽에 배치된다.

## 9. 검증 방법

- `node --check script.js`
- 게임 시작 후 `harbors.length === 9`를 확인한다.
- 각 항구가 `vertexIds` 2개를 가지는지 확인한다.
- 항구의 한쪽 꼭짓점에 건물을 세운 뒤 `tradeRatioFor()` 결과를 확인한다.
- 항구의 다른쪽 꼭짓점에 건물을 세운 경우도 같은 결과인지 확인한다.
- 실제 화면에서 항구 토큰이 보드와 겹치지 않는지 확인한다.

## 10. 위험 요소

- 외곽 edge 선택 로직이 부정확하면 항구가 안쪽에 생기거나 너무 몰릴 수 있다.
- 기존 `harbor.vertexId`를 참조하는 코드가 남으면 런타임 오류가 날 수 있다.
- 항구 표시 좌표가 보드 밖으로 너무 멀리 나가면 모바일에서 잘릴 수 있다.

## 11. 롤백 방법

`harbors` 구조를 기존 `vertexId` 기반으로 되돌리고 `playerHarbors()`, `drawHarbors()`를 원복한다.
