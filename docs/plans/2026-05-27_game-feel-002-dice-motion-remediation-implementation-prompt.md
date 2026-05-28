# FEEL-002 주사위 굴림 모션 수정 구현 프롬프트

작성일: 2026-05-27

아래 프롬프트를 새 구현 작업에 그대로 사용한다.

```text
Catan 프로젝트의 FEEL-002 주사위 굴림 모션 수정 계획을 구현해줘.

반드시 먼저 아래 문서를 읽고 현재 코드와 비교해.
- docs/guides/development-process-guideline.md
- docs/features/development-process.md
- docs/plans/2026-05-27_game-feel-visual-audio-motion-plan.md
- docs/plans/2026-05-27_game-feel-002-dice-production-feedback-plan.md
- docs/reports/2026-05-27_game-feel-002-dice-production-feedback-final-report.md
- docs/plans/2026-05-27_game-feel-002-dice-motion-remediation-plan.md

작업 전 확인:
- 현재 `script.js`의 `renderDice()`, `renderDieCube()`, `rollDice()`, online roll command flow, pointer hold helpers를 먼저 파악해.
- 현재 `styles.css`의 `.die-face`, `.dice-cube`, `.dice-side-*`, `.dice-panel.dice-settled`, `@keyframes dice-settle`, reduced-motion override를 먼저 파악해.
- 현재 `server.js`의 `makeRollAnimationSeed()`, `handleRollDice()`, `lastDice.animationSeed`, `lastDice.rollId` 흐름을 확인해.
- 계획서와 실제 코드가 다르면 구현 전에 계획서를 현실에 맞게 짧게 갱신해.

핵심 문제:
- 현재 3D dice DOM과 final face mapping은 있지만 `animationSeed`/`rollId`가 실제 굴림 motion parameter에 반영되지 않는다.
- `.dice-settled .dice-cube`의 `dice-settle`은 모든 굴림에 같은 고정 transform animation을 적용한다.
- 결과 face transform과 roll/settle transform이 같은 element에 걸려 충돌할 수 있다.
- 정적 테스트가 문자열 존재 여부 중심이라 seed 기반 모션을 검증하지 못한다.

구현 목표:
- 주사위 결과 결정 방식은 바꾸지 않는다. 온라인 결과는 계속 서버 authoritative이어야 한다.
- `animationSeed` 또는 fallback `rollId`를 사용해 deterministic dice motion parameter를 만든다.
- 같은 결과라도 seed가 다르면 굴림 모션 parameter가 달라져야 한다.
- 같은 결과와 같은 seed면 굴림 모션 parameter가 재현되어야 한다.
- 최종 3D face는 `die1`, `die2`, `diceTotal`, fallback text, aria-label과 항상 일치해야 한다.
- reduced-motion에서는 모션은 꺼지고 숫자 정보와 final face는 즉시 유지되어야 한다.

구현 상세:
1. `renderDieCube(element, value, rollKey)`의 DOM 구조를 아래 역할 분리 구조로 바꿔.

   die-face
     dice-motion-shell
       dice-cube
         dice-side-1..6
     die-fallback

   - `dice-cube`는 final face transform만 담당한다.
   - `dice-motion-shell`은 seed 기반 roll/settle animation만 담당한다.

2. `script.js`에 deterministic helper를 추가해.

   권장 helper:
   - `hashStringToUint32(seed)`
   - `seededRange(seed, min, max)`
   - `makeDiceMotionStyle(value, rollKey)`

   `makeDiceMotionStyle()`은 inline style 문자열 또는 style property map으로 아래 CSS custom properties를 설정한다.
   - `--dice-roll-x-start`
   - `--dice-roll-y-start`
   - `--dice-roll-z-start`
   - `--dice-roll-x-mid`
   - `--dice-roll-y-mid`
   - `--dice-roll-pop`
   - `--dice-roll-duration`

   값 범위는 계획서를 따르되, transform/opacity/scale 중심으로 가볍게 유지해.

3. `styles.css`를 수정해.

   - `.dice-motion-shell` 추가
   - `.dice-cube`의 final face mapping 유지
   - roll/settle keyframes는 `.dice-motion-shell`에 적용
   - `.dice-panel.dice-settled .dice-motion-shell` 또는 roll-specific class로 animation 적용
   - 필요하면 `.dice-panel.dice-rolling` 상태를 추가
   - reduced-motion override가 `.dice-motion-shell`, `.dice-cube`, resource bump에 올바르게 적용되도록 갱신

4. 온라인 rolling pending을 정리해.

   - 온라인 roll command 전송 직후에는 최종 숫자를 선표시하지 않는다.
   - 가능하면 `dice-panel.dice-rolling`을 켜고 버튼을 잠근다.
   - 서버 state의 `lastDice`가 도착하면 final face와 settle animation을 표시한다.
   - command error 또는 reconnect hydrate에서는 과거 굴림 모션이 재생되지 않아야 한다.

5. pointer/click 중복 굴림을 확인해.

   - 현재 pointerdown/up은 hold 측정, click은 roll 실행 구조다.
   - 중복 굴림 가능성이 있으면 `commitDiceRoll({ holdMs, inputType })` 같은 단일 진입점으로 정리해.
   - dice panel drag guard는 유지한다. roll button pointer 이벤트가 panel drag로 해석되면 안 된다.

6. 테스트를 강화해.

   `scripts/game-feel-dice-seed-static-test.js`를 단순 문자열 존재 검사에서 다음을 확인하도록 보강해.
   - `renderDieCube()`가 `dice-motion-shell`을 렌더링한다.
   - `animationSeed`/`rollId`가 `makeDiceMotionStyle()` 또는 동등 helper를 거쳐 CSS custom properties로 연결된다.
   - `rollKey`가 단순 `data-render-key`에만 쓰이지 않는다.
   - reduced-motion selector가 dice motion shell을 포함한다.

   가능하면 browser smoke 또는 test helper를 추가해 다음을 확인해.
   - forced roll 1~6의 face/aria/fallback/total 일치
   - 같은 result + 다른 seed의 CSS custom property 차이
   - 같은 result + 같은 seed의 CSS custom property 동일성
   - reduced-motion에서 animation 억제와 숫자 유지

7. 문서 산출물을 갱신해.

   구현 후 아래 문서를 작성하거나 갱신해.
   - docs/tests/2026-05-27_game-feel-002-dice-motion-remediation-test-plan.md
   - docs/reports/2026-05-27_game-feel-002-dice-motion-remediation-final-report.md

   최종 보고서에는 반드시 포함해.
   - 변경 파일
   - 구현 요약
   - seed 기반 motion parameter 설계
   - 온라인 authoritative result 유지 여부
   - reduced-motion 처리
   - 실행한 테스트 명령과 결과
   - 실행하지 못한 브라우저/온라인 QA와 이유
   - 남은 위험

검증 명령:
- node --check script.js
- node --check server.js
- node scripts/game-feel-dice-seed-static-test.js
- node scripts/game-feel-settings-static-test.js
- node scripts/game-feel-turn-state-static-test.js

가능하면 브라우저에서도 확인해.
- http://127.0.0.1:4173/?test=1
- forced roll로 1~6 face mapping 확인
- seed별 CSS variable 차이 확인
- reduced-motion 설정 확인

주의:
- 서버 주사위 결과 결정 방식은 변경하지 마.
- 게임 규칙 상태를 모션 때문에 바꾸지 마.
- 상대 비공개 자원 정보가 cue, sound, animation payload로 노출되면 안 된다.
- 새 라이브러리나 물리 엔진을 도입하지 마.
- 사운드 asset, chip flight, 생산 카드 비행 효과는 이번 범위가 아니다.
- 기존 사용자 변경을 되돌리지 말고, 필요한 범위만 좁게 수정해.

완료 기준:
- `animationSeed` 또는 `rollId`가 실제 CSS motion parameter에 반영된다.
- 같은 결과라도 다른 seed면 모션 parameter가 다르다.
- 같은 결과와 같은 seed면 모션 parameter가 같다.
- final face와 숫자/aria/fallback이 일치한다.
- 온라인에서는 서버 state 전 최종 숫자를 선표시하지 않는다.
- reconnect/hydrate 또는 error에서 과거 roll motion이 재생되지 않는다.
- reduced-motion에서 모션은 꺼지고 정보는 유지된다.
- 자동 테스트가 통과하고, 수동/브라우저 미검증 항목은 최종 보고서에 명확히 남긴다.
```
