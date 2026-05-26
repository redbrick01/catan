# 최종 보고서: PLAY-001 마을 건설 승리 체크 누락

작성일: 2026-05-26  
관련 문제 문서: `docs/known_issues/2026-05-26_playability-issues.md`  
관련 계획서: `docs/implementation_plans/2026-05-26_play-001-settlement-win-check.md`

## 1. 작업 목적

정식 플레이 중 마을 건설로 10점에 도달했을 때 즉시 승리 처리되도록 수정한다.

## 2. 변경 파일

- `script.js`
- `docs/known_issues/2026-05-26_playability-issues.md`
- `docs/final_reports/2026-05-26_play-001-settlement-win-check-final-report.md`

## 3. 수정 내용

`buildSettlement(player, vertexId, setup = false)`에서 마을 건설 성공 후 `updateLongestRoad()` 다음에 `checkWin()`을 호출하도록 했다.

초기 배치 중에는 승리 체크가 필요 없으므로 `setup === false`일 때만 실행한다.

수정 흐름:

```js
updateLongestRoad();
if (!setup) checkWin();
return true;
```

## 4. 검증 결과

통과:

- `node --check script.js`
- `buildSettlement()` 수정 위치 확인
- 초기 배치 보호 조건 `if (!setup)` 확인

수행하지 못한 검증:

- 실제 브라우저에서 9점 상태를 구성한 뒤 마을 건설로 10점 승리하는 클릭 테스트

이유:

- 현재 턴과 보드 상태를 빠르게 만드는 전용 시나리오 테스트는 아직 별도 자동화되어 있지 않다.

## 5. 남은 위험

- `checkWin()`은 아직 `visiblePoints()` 기준이므로, PLAY-003에서 승점 카드 비공개 점수 분리를 구현할 때 `totalPoints()` 기준으로 함께 갱신해야 한다.

## 6. 최종 판단

완료

PLAY-001의 1차 수정 범위인 마을 건설 후 승리 체크 누락을 수정했고, 문법 검증을 통과했다.
