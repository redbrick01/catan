# 테스트 및 검증 계획서: 6단계 UI와 플레이 편의성 개선

작성일: 2026-05-26  
관련 구현 계획서: `docs/plans/2026-05-26_stage-6-ui-play-assists.md`

## 1. 테스트 대상

- 턴 상태 패널
- 현재 플레이어 개발 카드 패널
- 은행 재고 패널
- 비용표 패널
- 보유 항구 패널

## 2. 변경 파일

- `index.html`
- `styles.css`
- `script.js`
- `docs/plans/2026-05-26_stage-6-ui-play-assists.md`

## 3. 테스트 환경

- Node.js 문법 검사
- 정적 검색
- `script.js` VM 로드 기반 렌더링 시나리오 테스트
- 로컬 서버 응답 확인

## 4. 정적 테스트

- `node --check script.js`
- 새 DOM id 확인
  - `turnStagePanel`
  - `devCardPanel`
  - `bankStockPanel`
  - `costReferencePanel`
  - `harborPanel`
- 새 렌더링 함수 확인
  - `renderTurnStage`
  - `renderBankStock`
  - `renderCostReference`
  - `renderCurrentPlayerDevCards`
  - `renderCurrentPlayerHarbors`

## 5. 렌더링 검증

- 게임 상태가 없을 때 패널이 안전하게 렌더링된다.
- 현재 플레이어가 있을 때 턴 상태가 표시된다.
- 은행 재고 수량이 패널에 반영된다.
- 비용표가 도로, 마을, 도시, 개발 카드 비용을 표시한다.
- 개발 카드가 없으면 없음으로 표시된다.
- 개발 카드가 있으면 카드 이름과 수량이 표시된다.
- 보유 항구가 없으면 없음으로 표시된다.
- 보유 항구가 있으면 항구 이름이 표시된다.

## 6. 회귀 테스트

- 기존 `render()` 호출이 오류 없이 끝난다.
- 기존 플레이어 목록 렌더링이 유지된다.
- 기존 은행 교환 비율 라벨 갱신이 유지된다.

## 7. 완료 기준

- JavaScript 문법 오류가 없어야 한다.
- 코드 레벨 렌더링 테스트가 통과해야 한다.
- 로컬 서버가 응답해야 한다.
- 수행하지 못한 실제 브라우저 테스트는 최종 보고서에 기록해야 한다.

