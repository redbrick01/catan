# 최종 보고서: PLAY-005 항구 위치 모델 개선

작성일: 2026-05-26  
관련 문제 문서: `docs/known_issues/2026-05-26_playability-issues.md`  
관련 계획서: `docs/implementation_plans/2026-05-26_play-005-harbor-edge-model.md`

## 1. 작업 목적

항구를 특정 꼭짓점 하나에만 연결하지 않고, 해안 edge의 두 교차점 중 하나에 건물이 있으면 사용할 수 있도록 개선한다.

## 2. 변경 파일

- `script.js`
- `styles.css`
- `docs/known_issues/2026-05-26_playability-issues.md`
- `docs/final_reports/2026-05-26_play-005-harbor-edge-model-final-report.md`

## 3. 수정 내용

항구 데이터 구조를 변경했다.

변경 전:

```js
{
  id,
  vertexId,
  type
}
```

변경 후:

```js
{
  id,
  vertexIds: [edge.a, edge.b],
  type
}
```

추가한 헬퍼:

- `tilesForEdge(edge)`: 해당 edge를 공유하는 타일 목록 반환
- `isCoastalEdge(edge)`: 한 타일에만 연결된 해안 edge 판정
- `edgeMidpoint(edge)`: edge 중간점 계산
- `edgeAngle(edge)`: 보드 중심 기준 edge 각도 계산
- `harborEdgesAreTooClose(edge, other)`: 항구 후보 간 인접 여부 판정

수정한 흐름:

- `setupHarbors()`가 해안 edge를 선택해 항구 9개를 생성한다.
- `playerHarbors(playerId)`는 `vertexIds` 두 곳 중 하나라도 플레이어 건물이 있으면 항구 보유로 판정한다.
- `drawHarbors()`는 두 꼭짓점 중간점 기준으로 항구 토큰과 dock을 그린다.
- SVG에 `.harbor-link` 연결선을 추가해 항구가 두 교차점에 걸쳐 있음을 시각적으로 표시한다.
- `getStateSummary()`가 항구의 `vertexIds` 구조를 반환하도록 확장했다.

## 4. 검증 결과

통과:

- `node --check script.js`
- `harbor.vertexId` 잔여 참조 없음 확인
- 브라우저에서 `http://127.0.0.1:4173/?test=1` 로드
- 새 보드에서 항구 그룹 9개 렌더링 확인
- 항구 토큰 9개 렌더링 확인
- 새 항구 연결선 `.harbor-link` 9개 렌더링 확인
- 브라우저 콘솔 오류 없음 확인

수행하지 못한 검증:

- 실제 특정 항구의 양쪽 교차점에 각각 마을을 배치한 뒤 `tradeRatioFor()`가 동일하게 적용되는지 직접 상태 주입 검증

이유:

- 인앱 브라우저 평가 환경에서 `window.__katanTest` 접근이 되지 않아 항구 교차점 소유 상태를 빠르게 주입하지 못했다.

## 5. 남은 위험

- 항구 위치는 기존 보드 모델 위에서 해안 edge를 추론해 만든다. 공식 보드 좌표 모델을 전면 도입한 것은 아니다.
- 항구 위치는 해안 edge 기준으로 개선되었지만, 공식 카탄 보드의 항구 고정 위치와 완전히 일치한다고 보장하지 않는다.
- 모바일에서 항구 토큰이 겹치거나 잘리는지는 추가 시각 검증이 있으면 더 안전하다.

## 6. 최종 판단

완료

PLAY-005의 1차 수정 범위인 항구의 두 교차점 기반 데이터 구조, 보유 판정, 렌더링 개선을 구현했고 문법 검증과 기본 브라우저 렌더링 검증을 통과했다.
