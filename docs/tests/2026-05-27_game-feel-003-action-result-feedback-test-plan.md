# FEEL-003 행동 결과 피드백 테스트 계획

작성일: 2026-05-27

## 범위

비공개 상태를 노출하거나 게임 규칙을 바꾸지 않고 행동 성공, 행동 실패, 교환, 개발 카드, 승리 피드백 cue를 검증한다.

## 변경 파일

- `script.js`
- `styles.css`
- `scripts/game-feel-action-result-static-test.js`
- `docs/plans/2026-05-27_game-feel-003-action-result-feedback-plan.md`
- `docs/tests/2026-05-27_game-feel-003-action-result-feedback-test-plan.md`
- `docs/reports/2026-05-27_game-feel-003-action-result-feedback-final-report.md`

## 자동 점검

| 점검 | 목적 |
| --- | --- |
| `node --check script.js` | 클라이언트 문법을 검증한다. |
| `node --check server.js` | 서버 문법을 검증한다. |
| 기존 game-feel 정적 테스트 | 이전 FEEL 단계가 계속 통과하는지 검증한다. |
| `node scripts/game-feel-action-result-static-test.js` | FEEL-003 cue helper, state-delta 연결, private 개발 카드 sanitizer, motion class, rejection grouping, 모션 감소 hook을 검증한다. |

## 수동/브라우저 점검

- 오프라인에서 도로/마을/도시를 건설하고 target당 명확한 성공 cue가 한 번만 발생하며 보드 hit target이 밀리지 않는지 확인한다.
- 두 클라이언트에서 온라인 건설을 반복하고 권위 state delta 이후에만 cue가 나타나는지 확인한다.
- 개발 카드를 구매하고 cue가 generic이며 카드 종류를 노출하지 않는지 확인한다.
- 공개 개발 카드를 사용하고 public/generic 카드 label만 사용되는지 확인한다.
- 완료 bank trade and player trade; verify trade cues are distinct.
- 로컬 validation 실패와 서버 command rejection을 발생시켜 reason group text/cue가 명확한지 확인한다.
- 게임에서 승리하고 winner seat/final modal 강조가 보이며 모바일에서 안전한지 확인한다.
- 모션 감소를 켜고 action result cue가 정적 outline/text 강조로 유지되는지 확인한다.

## 브라우저 제약

Browser QA remains blocked by the local URL `ERR_BLOCKED_BY_CLIENT` limitation and missing Playwright package. This is documented as remaining risk.

## 완료 기준

- 자동 정적 점검 통과.
- 성공 cue는 확정된 mutation/state delta 이후 emit된다.
- command rejection cue는 사전 disabled 이유와 분리된다.
- 특히 개발 카드 구매 종류와 숨은 승점 상세 등 비공개 상태가 보호된다.
