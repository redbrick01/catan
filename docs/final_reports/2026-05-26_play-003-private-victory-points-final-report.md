# 최종 보고서: PLAY-003 승점 카드 비공개 처리

작성일: 2026-05-26  
관련 문제 문서: `docs/known_issues/2026-05-26_playability-issues.md`  
관련 계획서: `docs/implementation_plans/2026-05-26_play-003-private-victory-points.md`

## 1. 작업 목적

승점 개발 카드가 상대 플레이어의 점수 표시로 공개되지 않도록 하고, 승리 판정은 승점 카드를 포함한 실제 점수를 사용하도록 수정한다.

## 2. 변경 파일

- `script.js`
- `styles.css`
- `docs/known_issues/2026-05-26_playability-issues.md`
- `docs/final_reports/2026-05-26_play-003-private-victory-points-final-report.md`

## 3. 수정 내용

점수 계산을 다음 함수로 분리했다.

- `publicPoints(player)`: 마을, 도시, 최장 교역로, 최대 기사력만 계산
- `hiddenVictoryPoints(player)`: 승점 개발 카드 수 계산
- `totalPoints(player)`: 공개 점수와 숨은 승점 합산
- `visiblePoints(player)`: 기존 호출 호환을 위한 공개 점수 별칭

승리 판정:

- `checkWin()`이 `totalPoints(player) >= 10`을 사용하도록 변경했다.

UI 표시:

- 현재 플레이어 좌석과 플레이어 목록은 실제 점수를 보여주며, 숨은 승점이 있으면 `숨은 N` 보조 문구를 표시한다.
- 상대 플레이어 좌석과 플레이어 목록은 공개 점수만 표시한다.

테스트 헬퍼:

- `getStateSummary()`가 `points`, `publicPoints`, `hiddenPoints`, `totalPoints`를 함께 반환하도록 확장했다.
- 기존 `points`는 공개 점수 기준으로 유지했다.

## 4. 검증 결과

통과:

- `node --check script.js`
- `visiblePoints()`가 공개 점수 별칭으로만 남은 것 확인
- `checkWin()`이 `totalPoints()`를 사용하는 것 확인
- 브라우저에서 `http://127.0.0.1:4173/?test=1` 로드 확인
- 새 게임 시작 후 기본 점수 배지 렌더링 확인

수행하지 못한 검증:

- 브라우저에서 테스트 헬퍼로 승점 카드 상태를 주입해 현재 플레이어와 상대 플레이어 점수 표시 차이를 직접 확인하는 검증

이유:

- 인앱 브라우저의 평가 환경에서 `window.__katanTest`가 접근되지 않아 상태 주입 검증을 수행하지 못했다.

## 5. 남은 위험

- 현재 구조는 단일 로컬 화면 기준의 표시 정책 개선이다. 보안적 의미의 비밀 정보 보호나 플레이어별 별도 화면은 구현하지 않았다.
- 현재 플레이어가 보는 실제 점수는 같은 화면을 함께 보는 핫시트 환경에서는 다른 사람에게도 보일 수 있다.
- 테스트 헬퍼 접근 문제는 후속 자동화 작업에서 별도로 정리하는 것이 좋다.

## 6. 최종 판단

완료

PLAY-003의 1차 수정 범위인 공개 점수와 실제 점수 분리, 승리 판정 기준 수정, 상대 점수 표시 비공개 처리를 구현했고 문법 검증과 기본 브라우저 렌더링 검증을 통과했다.
