# 최종 보고서: PLAY-002 최대 기사력 승리 체크 누락

작성일: 2026-05-26  
관련 문제 문서: `docs/issues/2026-05-26_playability-issues.md`  
관련 계획서: `docs/plans/2026-05-26_play-002-largest-army-win-check.md`

## 1. 작업 목적

기사 카드 사용으로 최대 기사력 보너스를 얻고 10점에 도달했을 때 즉시 승리 처리되도록 수정한다.

## 2. 변경 파일

- `script.js`
- `docs/issues/2026-05-26_playability-issues.md`
- `docs/reports/2026-05-26_play-002-largest-army-win-check-final-report.md`

## 3. 수정 내용

`playKnight(cardId)`에서 `updateLargestArmy()` 후 `checkWin()`을 호출하도록 했다.

승리한 경우에는 이미 게임이 종료되므로 도둑 이동 강제 상태를 유지하지 않고 `selectedAction`을 기본 상태로 정리한다.

수정 흐름:

```js
updateLargestArmy();
checkWin();
if (game.winner !== null) {
  selectedAction = "road";
  game.pendingRobberVictims = [];
  addLog(`${player.name}: 기사 사용.`);
} else {
  addLog(`${player.name}: 기사 사용. 도둑을 옮기세요.`);
}
```

## 4. 검증 결과

통과:

- `node --check script.js`
- `playKnight()` 수정 위치 확인
- 승리 시 도둑 이동 안내를 출력하지 않는 분기 확인
- 승리하지 않은 기사 사용은 기존처럼 도둑 이동 안내를 유지하는 분기 확인

수행하지 못한 검증:

- 실제 브라우저에서 8점 또는 9점 상태와 기사 2장 사용 상태를 구성한 뒤 기사 카드로 최대 기사력 승리하는 클릭 테스트

이유:

- 특정 기사 수, 개발 카드, 점수 상태를 빠르게 만드는 전용 시나리오 테스트는 아직 별도 자동화되어 있지 않다.

## 5. 남은 위험

- `checkWin()`은 아직 `visiblePoints()` 기준이다. PLAY-003에서 공개 점수와 실제 점수를 분리할 때 이 판정 기준을 다시 조정해야 한다.
- 승리 로그와 기사 사용 로그의 순서는 현재 `최대 기사력`, `승리`, `기사 사용` 순서가 될 수 있다. 기능상 문제는 없지만 로그 UX는 후속으로 다듬을 수 있다.

## 6. 최종 판단

완료

PLAY-002의 1차 수정 범위인 최대 기사력 획득 후 승리 체크 누락을 수정했고, 문법 검증을 통과했다.
