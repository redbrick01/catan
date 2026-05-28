# Stage 3 UX 개선 테스트 계획

작성일: 2026-05-27

## 목표

`docs/plans/2026-05-27_stage-3-ux-improvement-deepening-plan.md` 기준으로 턴 진행 안내, pending action 안내, 플레이어 교환 UX, 연결/재접속 오류 안내, 모바일 레이아웃, 로그 강조가 기존 온라인/봇 흐름을 깨지 않는지 확인한다.

## 자동 검증

```powershell
node --check script.js
node --check server.js
node --check scripts\stage-3-ux-improvement-static-test.js
node scripts\stage-3-ux-improvement-static-test.js
node scripts\online-10-player-trade-ws-test.js
node scripts\online-12-robber-seven-pending-ws-test.js
node scripts\bot-08-ui-logging-regression-test.js
node scripts\bot-09-stabilization-regression-test.js
```

## 정적 UI 검증 항목

- `currentTurnUxState`가 `activePlayer`, `actingPlayer`, `pendingActors`, `viewerPlayer`, `currentFocusPlayer` 개념을 분리한다.
- 온라인 내 턴 문구는 `내 차례입니다`, pending actor 문구는 `내가 행동할 차례입니다`를 사용한다.
- pending action 모달에는 `상황`, `해야 할 일`, `선택 조건`, `완료 후` 구조가 있다.
- 플레이어 교환 작성 모달은 모든 상대 대상 제안과 보유량 초과/동일 자원 교차 선택 차단을 표시한다.
- 연결/재접속 오류에는 다음 행동 안내가 포함된다.
- 로그 항목에는 타입 class와 중요 이벤트 강조 class가 붙는다.
- 턴 시각 효과 marker가 존재한다.
  - `data-focus-state`
  - `--focus-player-color`
  - `data-primary-action`
  - `prefers-reduced-motion`
  - `is-current-turn`, `is-my-turn`, `is-pending-actor`, `is-bot-turn`, `is-waiting-turn`

## 수동/브라우저 확인 계획

- 1280x720 브라우저 smoke: 로비 생성, 봇 추가, 게임 시작 화면, 상단 현재 진행 상태, 플레이어 카드 상태 라벨 확인
- pending action smoke: 7/도둑/약탈 대상 선택 모달이 가이드 패널과 모순되지 않는지 확인
- 플레이어 교환 smoke: 모든 상대 대상 문구와 상대별 응답 상태 확인
- 턴 시각 효과 smoke: 내 차례 카드와 dice panel이 과하지 않게 강조되는지 확인
- 대기 상태 smoke: 내 차례가 아닐 때 전체 화면이 과하게 어두워지지 않는지 확인
- reduced motion smoke: `prefers-reduced-motion`에서 pulse/glow 반복 애니메이션이 꺼지는지 확인
- 모바일 후보 viewport: 320x568, 375x667, 390x844, 414x896, 768x1024

## 완료 기준

- 자동 검증 통과
- 상단 상태, 가이드 패널, 플레이어 카드가 같은 진행자를 가리킴
- blocking 상태가 pending/active turn보다 우선 표시됨
- pending action 모달이 1차 안내를 맡고 가이드 패널은 같은 상황을 짧게 요약함
- 플레이어 교환은 1차 범위인 모든 상대 제안과 상대별 응답 상태를 명확히 표시함
- 로그 중요 이벤트가 시각적으로 구분됨
- 현재 진행자 카드 spotlight, dice panel pulse, primary action glow가 상태 우선순위에 맞게 표시됨

## 미수행 가능 항목

- 실제 다중 브라우저/기기 수동 검증
- 모든 모바일 viewport screenshot 저장
- 로그 필터 UI 구현 검증

로그 필터 UI는 이번 구현에서 구조 안정화 후 후속으로 분리할 수 있다.
