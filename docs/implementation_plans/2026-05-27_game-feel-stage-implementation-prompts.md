# 게임성 피드백 단계별 구현 프롬프트

작성일: 2026-05-27

## 목적

이 문서는 `game-feel-feedback-system` 개발 단위를 단계별로 구현할 때 사용할 개별 구현 프롬프트를 정리한다. 각 프롬프트는 독립적으로 실행 가능해야 하며, 반드시 프로젝트 개발 프로세스 가이드라인을 따른다.

공통 필수 준수 문서:

```text
catan_implementation_process_guideline.md
docs/features/development-process.md
docs/implementation_plans/2026-05-27_game-feel-visual-audio-motion-plan.md
docs/implementation_plans/2026-05-27_game-feel-008-quality-gate-plan.md
```

공통 필수 원칙:

```text
1. 구현 전에 관련 계획서를 읽고, 현실과 다르면 먼저 계획서를 갱신한다.
2. 구현 범위는 해당 단계 계획서 안으로 제한한다.
3. 구현 후 반드시 테스트 계획서를 작성하거나 갱신한다.
4. 테스트를 수행하고, 수행하지 못한 항목은 이유와 남은 위험을 기록한다.
5. 최종 보고서를 docs/final_reports/에 작성한다.
6. private state, reduced-motion, sound mute, dedupe, reconnect/hydrate 영향을 검토한다.
7. 오프라인 모드와 온라인 모드 회귀 영향을 확인한다.
```

## FEEL-000 구현 프롬프트

```text
카탄 프로젝트의 FEEL-000 기반 구조와 이벤트 Cue 버스를 구현해줘.

반드시 먼저 아래 문서를 읽고 준수해.
- catan_implementation_process_guideline.md
- docs/features/development-process.md
- docs/implementation_plans/2026-05-27_game-feel-visual-audio-motion-plan.md
- docs/implementation_plans/2026-05-27_game-feel-000-feedback-foundation-plan.md
- docs/implementation_plans/2026-05-27_game-feel-008-quality-gate-plan.md

작업 전 확인:
- 현재 script.js, server.js, index.html, styles.css의 구조를 먼저 파악해.
- 기존 온라인/오프라인 상태 흐름과 render 흐름을 깨지 않게 해.
- 계획서와 실제 코드가 다르면 구현 전에 FEEL-000 계획서를 먼저 갱신해.

구현 목표:
- cue 객체 모델, eventType, channel, visibility, dedupe key 기준을 구현해.
- dispatchGameCue 또는 동등한 cue dispatch 진입점을 만든다.
- playedCueKeys 기반 중복 재생 방지를 구현한다.
- reconnect/hydrate 직후 과거 이벤트가 다시 재생되지 않도록 suppression 기준을 둔다.
- visual, sound, log, toast 등 channel을 확장 가능한 형태로 분리한다.
- private/public cue visibility를 판단할 수 있는 최소 구조를 만든다.
- 이후 FEEL-001~006이 같은 cue bus를 사용할 수 있게 작게 설계한다.

주의:
- 이 단계에서는 화려한 개별 애니메이션을 구현하지 말고 기반 구조만 만든다.
- 게임 규칙 상태를 cue 재생을 위해 바꾸지 않는다.
- 온라인에서는 서버 state/revision 기준 중복 재생을 고려한다.

검증:
- node --check script.js
- node --check server.js
- 가능하면 cue dedupe와 hydrate suppression helper 단위 테스트를 추가한다.
- 브라우저에서 오프라인 게임 시작, 온라인 로비/게임 진입이 깨지지 않는지 확인한다.

문서 산출물:
- docs/test_plans/2026-05-27_game-feel-000-feedback-foundation-test-plan.md
- docs/final_reports/2026-05-27_game-feel-000-feedback-foundation-final-report.md

최종 보고서에는 변경 파일, 구현 요약, 실행 테스트, 미실행 테스트, 남은 위험, 후속 단계를 반드시 기록해.
```

## FEEL-007 구현 프롬프트

```text
카탄 프로젝트의 FEEL-007 설정/접근성 제어를 구현해줘.

반드시 먼저 아래 문서를 읽고 준수해.
- catan_implementation_process_guideline.md
- docs/features/development-process.md
- docs/implementation_plans/2026-05-27_game-feel-visual-audio-motion-plan.md
- docs/implementation_plans/2026-05-27_game-feel-007-settings-accessibility-plan.md
- docs/implementation_plans/2026-05-27_game-feel-008-quality-gate-plan.md

작업 전 확인:
- FEEL-000 cue bus가 구현되어 있다면 그 구조와 충돌하지 않게 연결해.
- 설정 UI를 추가할 위치를 기존 게임 화면 레이아웃 안에서 확인해.
- 계획서와 실제 코드가 다르면 구현 전에 FEEL-007 계획서를 먼저 갱신해.

구현 목표:
- DEFAULT_FEEL_SETTINGS와 effective settings 계산 함수를 구현한다.
- localStorage key는 katanFeelSettings를 사용한다.
- 모션 효과: 자동 / 줄이기 / 켜기 설정을 구현한다.
- 사운드 효과: 끄기 / 켜기, 효과음 볼륨 0~100, 내 차례 강조, 중요 이벤트 강조 설정을 구현한다.
- prefers-reduced-motion을 자동 모드에 반영한다.
- 설정 모달 또는 패널을 키보드로 열고 닫고 조작할 수 있게 한다.
- 설정 변경이 즉시 DOM 상태 class 또는 dataset으로 반영되게 한다.
- sound enable 실패 시 사용자에게 복구 가능한 안내를 제공한다.

주의:
- 설정은 사용자 선호이며 온라인 게임 상태에 포함하지 않는다.
- 색상만으로 상태를 전달하지 않는다.
- 반복 깜빡임, 장시간 자동 애니메이션, 강한 화면 흔들림을 기본값으로 두지 않는다.
- 사운드는 기본 꺼짐이어야 한다.

검증:
- node --check script.js
- node --check server.js
- 설정 저장/로드/effective settings 계산을 테스트한다.
- prefers-reduced-motion 환경에서 motion이 줄어드는지 확인한다.
- 키보드 focus trap, ESC 닫기, 모바일 화면을 수동 확인한다.

문서 산출물:
- docs/test_plans/2026-05-27_game-feel-007-settings-accessibility-test-plan.md
- docs/final_reports/2026-05-27_game-feel-007-settings-accessibility-final-report.md

최종 보고서에는 접근성 검증 결과와 미검증 항목을 반드시 기록해.
```

## FEEL-006A 구현 프롬프트

```text
카탄 프로젝트의 FEEL-006A 사운드 설정/오디오 기반을 구현해줘.

반드시 먼저 아래 문서를 읽고 준수해.
- catan_implementation_process_guideline.md
- docs/features/development-process.md
- docs/implementation_plans/2026-05-27_game-feel-visual-audio-motion-plan.md
- docs/implementation_plans/2026-05-27_game-feel-006-sound-system-plan.md
- docs/implementation_plans/2026-05-27_game-feel-007-settings-accessibility-plan.md
- docs/implementation_plans/2026-05-27_game-feel-008-quality-gate-plan.md

작업 전 확인:
- FEEL-007 설정 구조가 없다면 먼저 최소 설정 구조를 계획서에 맞게 정리하거나 FEEL-007 선행 필요를 최종 보고서에 명시해.
- 사운드 asset을 추가할 경우 라이선스와 출처를 확인할 수 있는지 먼저 판단해.
- 계획서와 실제 코드가 다르면 구현 전에 FEEL-006 계획서를 갱신해.

구현 목표:
- 사용자 gesture 이후에만 AudioContext 또는 audio asset playback이 활성화되게 한다.
- mute, volume, enable/disable 상태를 설정과 연결한다.
- playSoundCue 또는 동등한 사운드 재생 진입점을 만든다.
- 사운드 재생 실패, 브라우저 자동재생 차단, asset load 실패를 조용히 복구 가능한 상태로 처리한다.
- 이 단계에서는 이벤트별 사운드 매핑을 최소화하고, 사운드 기반만 안정화한다.

주의:
- 사운드는 기본 꺼짐이다.
- 사운드를 꺼도 게임 정보 손실이 없어야 한다.
- private state로 볼 수 없는 정보가 사운드로 노출되면 안 된다.
- 외부 asset을 추가하면 docs/assets_manifest.md에 출처, 라이선스, 용도를 기록한다.

검증:
- node --check script.js
- node --check server.js
- mute/volume/enable 상태 persistence를 테스트한다.
- 사용자 gesture 전에는 사운드가 재생되지 않는지 확인한다.
- 사운드 enable 실패 UI를 확인한다.

문서 산출물:
- docs/test_plans/2026-05-27_game-feel-006a-sound-foundation-test-plan.md
- docs/final_reports/2026-05-27_game-feel-006a-sound-foundation-final-report.md

최종 보고서에는 사운드 asset 추가 여부, 라이선스 기록 여부, 미검증 브라우저 제약을 반드시 기록해.
```

## FEEL-001 구현 프롬프트

```text
카탄 프로젝트의 FEEL-001 턴/내 차례 피드백을 구현해줘.

반드시 먼저 아래 문서를 읽고 준수해.
- catan_implementation_process_guideline.md
- docs/features/development-process.md
- docs/implementation_plans/2026-05-27_game-feel-visual-audio-motion-plan.md
- docs/implementation_plans/2026-05-27_game-feel-001-turn-feedback-plan.md
- docs/implementation_plans/2026-05-27_game-feel-000-feedback-foundation-plan.md
- docs/implementation_plans/2026-05-27_game-feel-007-settings-accessibility-plan.md
- docs/implementation_plans/2026-05-27_game-feel-008-quality-gate-plan.md

작업 전 확인:
- 현재 active player, setup player, pending actor, bot turn을 계산하는 위치를 먼저 파악해.
- FEEL-000/FEEL-007 구현 여부를 확인하고, 없으면 최소 호환 방식으로 계획서에 반영해.
- 계획서와 실제 코드가 다르면 구현 전에 FEEL-001 계획서를 먼저 갱신해.

구현 목표:
- currentFocusPlayer 계산 기준을 구현한다.
- 현재 진행자, 내 차례, 상대 차례, pending actor, bot turn을 시각적으로 구분한다.
- 내 차례 시작 시 1회성 pulse 또는 강조 cue를 재생한다.
- 상대 차례는 약한 active 상태만 표시한다.
- pending actor는 일반 active player보다 강한 행동 필요 상태로 표시한다.
- bot turn은 자동 진행 중임을 짧고 차분하게 표시한다.
- reduced-motion에서는 pulse/shimmer를 제거하거나 정적 강조로 대체한다.
- 중복 state 수신으로 같은 턴 전환 cue가 반복되지 않도록 dedupe를 적용한다.

주의:
- 현재 진행자 표시가 게임 규칙 상태를 바꾸면 안 된다.
- 모바일에서 상단 안내, 플레이어 카드, 액션 영역이 서로 겹치지 않아야 한다.
- 색상만으로 내 차례를 전달하지 말고 문구/aria 속성을 함께 고려한다.

검증:
- node --check script.js
- node --check server.js
- 오프라인 3~4인 턴 전환 수동 확인
- 온라인 2클라이언트 턴 전환 수동 확인
- pending action 상태에서 actor 표시 확인
- reduced-motion 설정에서 모션 축소 확인

문서 산출물:
- docs/test_plans/2026-05-27_game-feel-001-turn-feedback-test-plan.md
- docs/final_reports/2026-05-27_game-feel-001-turn-feedback-final-report.md

최종 보고서에는 내 차례 인지 개선, pending actor 표시, 모바일 확인 결과를 반드시 기록해.
```

## FEEL-002 구현 프롬프트

```text
카탄 프로젝트의 FEEL-002 주사위/자원 생산 피드백을 구현해줘.

반드시 먼저 아래 문서를 읽고 준수해.
- catan_implementation_process_guideline.md
- docs/features/development-process.md
- docs/implementation_plans/2026-05-27_game-feel-visual-audio-motion-plan.md
- docs/implementation_plans/2026-05-27_game-feel-002-dice-production-feedback-plan.md
- docs/implementation_plans/2026-05-27_game-feel-000-feedback-foundation-plan.md
- docs/implementation_plans/2026-05-27_game-feel-007-settings-accessibility-plan.md
- docs/implementation_plans/2026-05-27_game-feel-008-quality-gate-plan.md

작업 전 확인:
- 현재 rollDice, 온라인 rollDice command, 서버 dice 확정 위치, resource distribution 로직을 먼저 파악해.
- 주사위 결과의 정답성은 서버/게임 로직이 갖고, 애니메이션은 표현 계층으로만 붙여.
- 계획서와 실제 코드가 다르면 구현 전에 FEEL-002 계획서를 먼저 갱신해.

구현 목표:
- CSS 3D dice 2개를 추가하고 최종 결과 face mapping을 구현한다.
- pointerdown부터 pointerup/cancel까지의 holdMs를 계산한다.
- 오프라인에서는 holdMs와 추가 entropy를 animation seed 또는 dice seed에 반영하되 테스트 재현성을 해치지 않게 한다.
- 온라인에서는 clientHoldMs/clientEntropy를 command payload에 포함하되 최종 결과는 서버가 확정한다.
- 서버는 가능하면 rollAnimationSeed를 state/event에 포함해 모든 클라이언트가 같은 결과 cue를 볼 수 있게 한다.
- rolling pending 상태와 서버 결과 수신 후 settle 상태를 분리한다.
- 생산 타일 glow, 내 자원 count bump, 상대 generic card count bump를 구현한다.
- 도둑 차단, 은행 재고 부족, 7 결과는 일반 생산과 다른 cue를 사용한다.
- private state 기준에 따라 상대 자원 종류를 모션/사운드/아이콘으로 노출하지 않는다.

주의:
- hold duration은 조작감과 entropy 보조용이지, 사용자가 결과를 직접 제어하는 단독 seed가 아니다.
- 온라인 최종 주사위 결과를 클라이언트가 확정하면 안 된다.
- reduced-motion에서는 3D spin 없이 최종 숫자와 생산 결과가 명확히 보여야 한다.

검증:
- node --check script.js
- node --check server.js
- 오프라인 주사위 굴림과 생산 cue 수동 확인
- 온라인 2클라이언트에서 서버 결과 이후 dice settle 확인
- 짧게/길게 누를 때 animation seed 변화 확인
- 상대 자원 종류가 노출되지 않는지 확인
- forced dice 또는 테스트 hook이 있으면 7/생산/차단 케이스를 검증한다.

문서 산출물:
- docs/test_plans/2026-05-27_game-feel-002-dice-production-feedback-test-plan.md
- docs/final_reports/2026-05-27_game-feel-002-dice-production-feedback-final-report.md

최종 보고서에는 hold-time seed 처리, 서버 권위 유지 여부, private state 검증 결과를 반드시 기록해.
```

## FEEL-004 구현 프롬프트

```text
카탄 프로젝트의 FEEL-004 도둑/7/Pending 피드백을 구현해줘.

반드시 먼저 아래 문서를 읽고 준수해.
- catan_implementation_process_guideline.md
- docs/features/development-process.md
- docs/implementation_plans/2026-05-27_game-feel-visual-audio-motion-plan.md
- docs/implementation_plans/2026-05-27_game-feel-004-robber-pending-feedback-plan.md
- docs/implementation_plans/2026-05-27_game-feel-000-feedback-foundation-plan.md
- docs/implementation_plans/2026-05-27_game-feel-007-settings-accessibility-plan.md
- docs/implementation_plans/2026-05-27_game-feel-008-quality-gate-plan.md

작업 전 확인:
- 현재 7 처리, discard pending, robber move, victim selection, pending action view 구조를 먼저 파악해.
- 온라인 private view와 오프라인 전체 state 차이를 확인해.
- 계획서와 실제 코드가 다르면 구현 전에 FEEL-004 계획서를 먼저 갱신해.

구현 목표:
- 7 발생 시 dice panel과 안내 영역에 짧은 alert cue를 적용한다.
- discard, robber move, victim selection pending 상태를 명확히 구분한다.
- pending actor와 non-actor가 서로 다른 안내를 보도록 pendingActionView role matrix를 적용한다.
- 도둑 이동 가능 타일과 현재 도둑 위치를 명확히 구분한다.
- 도둑 이동 완료 cue와 약탈 결과 cue를 구현한다.
- actor/victim에게만 구체 결과를 보여주고, 제3자에게는 generic cue만 보여준다.
- victim picker는 hover뿐 아니라 keyboard focus에서도 명확해야 한다.
- reconnect/hydrate 시 과거 도둑 cue가 반복 재생되지 않고 현재 blocking 상태만 복구되어야 한다.

주의:
- 약탈 자원 종류, 상대 손패 등 private state가 cue로 새면 안 된다.
- pending 상태에서 일반 액션을 유도하는 문구를 보여주면 안 된다.
- reduced-motion에서는 이동 모션 대신 정적 위치 변경과 라벨 강조를 사용한다.

검증:
- node --check script.js
- node --check server.js
- forced dice 7 또는 수동 상태 조작으로 discard/robber/victim 흐름 확인
- actor, victim, 제3자 view에서 문구와 cue 차이 확인
- 온라인 재접속 후 cue 중복 재생 여부 확인
- 모바일에서 pending 모달/패널이 주요 버튼을 가리지 않는지 확인

문서 산출물:
- docs/test_plans/2026-05-27_game-feel-004-robber-pending-feedback-test-plan.md
- docs/final_reports/2026-05-27_game-feel-004-robber-pending-feedback-final-report.md

최종 보고서에는 pending 유형별 검증 결과, private state 검증, reconnect 처리 결과를 반드시 기록해.
```

## FEEL-003 구현 프롬프트

```text
카탄 프로젝트의 FEEL-003 행동 성공/실패/승리 피드백을 구현해줘.

반드시 먼저 아래 문서를 읽고 준수해.
- catan_implementation_process_guideline.md
- docs/features/development-process.md
- docs/implementation_plans/2026-05-27_game-feel-visual-audio-motion-plan.md
- docs/implementation_plans/2026-05-27_game-feel-003-action-result-feedback-plan.md
- docs/implementation_plans/2026-05-27_game-feel-000-feedback-foundation-plan.md
- docs/implementation_plans/2026-05-27_game-feel-007-settings-accessibility-plan.md
- docs/implementation_plans/2026-05-27_game-feel-008-quality-gate-plan.md

작업 전 확인:
- build road/settlement/city, buy/play development card, bank/harbor/player trade, win detection 흐름을 먼저 파악해.
- 성공/실패 감지를 서버 command 결과, local action 결과, state diff 중 어디에서 할지 계획서 기준으로 결정해.
- 계획서와 실제 코드가 다르면 구현 전에 FEEL-003 계획서를 먼저 갱신해.

구현 목표:
- 도로 건설, 마을/도시 건설, 도시 업그레이드 성공 cue를 구현한다.
- 개발 카드 구매는 카드 종류를 노출하지 않는 generic cue로 처리한다.
- 공개된 개발 카드 사용은 카드 종류별 cue를 허용한다.
- 교환 성공은 공개 제안 기준으로 swap cue를 구현한다.
- 행동 실패는 규칙상 불가, 자원 부족, 네트워크/서버 거절로 그룹화해 명확한 문구와 cue를 제공한다.
- 승리 시 승자 카드, 점수 영역, 최종 모달을 함께 강조한다.
- viewport 전체 particle/confetti overlay는 1차 범위에서 제외한다.
- 모든 cue는 dedupe key를 사용해 중복 state 수신에 안전해야 한다.

주의:
- 실패 행동은 강한 shake보다 이유 표시가 우선이다.
- 건설 모션이 보드 좌표나 hit target을 이동시키면 안 된다.
- 개발 카드 private state를 절대 노출하지 않는다.
- reduced-motion에서는 pop/flip/swap을 정적 강조로 대체한다.

검증:
- node --check script.js
- node --check server.js
- 건설 성공/실패 수동 확인
- 개발 카드 구매/사용 private state 확인
- 교환 성공/거절/서버 실패 문구 확인
- 승리 cue 확인
- 모바일에서 cue가 버튼과 로그를 가리지 않는지 확인

문서 산출물:
- docs/test_plans/2026-05-27_game-feel-003-action-result-feedback-test-plan.md
- docs/final_reports/2026-05-27_game-feel-003-action-result-feedback-final-report.md

최종 보고서에는 성공/실패 그룹별 검증, 승리 cue, private state 검증 결과를 반드시 기록해.
```

## FEEL-005 구현 프롬프트

```text
카탄 프로젝트의 FEEL-005 아이콘/이미지 자산 체계를 구현해줘.

반드시 먼저 아래 문서를 읽고 준수해.
- catan_implementation_process_guideline.md
- docs/features/development-process.md
- docs/implementation_plans/2026-05-27_game-feel-visual-audio-motion-plan.md
- docs/implementation_plans/2026-05-27_game-feel-005-icon-asset-system-plan.md
- docs/implementation_plans/2026-05-27_game-feel-008-quality-gate-plan.md

작업 전 확인:
- 현재 HTML/CSS/JS에서 자원, 행동, 상태를 어떻게 표시하는지 전수 확인해.
- 새 외부 아이콘 라이브러리 또는 asset이 정말 필요한지 먼저 판단해.
- 계획서와 실제 코드가 다르면 구현 전에 FEEL-005 계획서를 먼저 갱신해.

구현 목표:
- resource, action, status token taxonomy를 코드와 문서에 맞게 적용한다.
- 같은 자원/행동/상태가 UI마다 같은 아이콘 언어를 사용하게 정리한다.
- 아이콘만으로 의미를 전달하지 않고 text, title, aria-label, visually hidden label 중 적절한 보조 정보를 제공한다.
- private state에 따라 상대 자원 종류나 개발 카드 종류를 아이콘으로 노출하지 않는다.
- 모바일 밀도에서 아이콘과 텍스트가 겹치지 않도록 크기와 간격을 조정한다.
- 새 asset을 추가하는 경우 assets/icons 또는 assets/sounds 경로 규칙을 지키고 docs/assets_manifest.md를 작성/갱신한다.

주의:
- 출처와 라이선스가 불명확한 외부 asset은 추가하지 않는다.
- 장식용 이미지보다 상태 이해를 돕는 토큰/카드/자원 표현을 우선한다.
- 전체 UI 리디자인으로 범위를 넓히지 않는다.

검증:
- node --check script.js
- node --check server.js
- 주요 화면에서 아이콘 token 적용 일관성 확인
- aria-label/title 등 접근성 보조 정보 확인
- 모바일 viewport에서 겹침 여부 확인
- 추가 asset이 있다면 docs/assets_manifest.md에 출처/라이선스/용도가 기록되었는지 확인

문서 산출물:
- docs/test_plans/2026-05-27_game-feel-005-icon-asset-system-test-plan.md
- docs/final_reports/2026-05-27_game-feel-005-icon-asset-system-final-report.md
- 필요 시 docs/assets_manifest.md

최종 보고서에는 asset 추가 여부, 라이선스 검토, private state 아이콘 검증 결과를 반드시 기록해.
```

## FEEL-006B 구현 프롬프트

```text
카탄 프로젝트의 FEEL-006B 이벤트별 사운드 연결을 구현해줘.

반드시 먼저 아래 문서를 읽고 준수해.
- catan_implementation_process_guideline.md
- docs/features/development-process.md
- docs/implementation_plans/2026-05-27_game-feel-visual-audio-motion-plan.md
- docs/implementation_plans/2026-05-27_game-feel-006-sound-system-plan.md
- docs/implementation_plans/2026-05-27_game-feel-000-feedback-foundation-plan.md
- docs/implementation_plans/2026-05-27_game-feel-007-settings-accessibility-plan.md
- docs/implementation_plans/2026-05-27_game-feel-008-quality-gate-plan.md

작업 전 확인:
- FEEL-006A 사운드 기반과 FEEL-000 cue bus가 구현되어 있는지 확인해.
- 각 eventType의 private state 분기와 dedupe key를 먼저 점검해.
- 계획서와 실제 코드가 다르면 구현 전에 FEEL-006 계획서를 먼저 갱신해.

구현 목표:
- 내 차례, 주사위, 건설 성공, 교환 성공, 개발 카드 공개 사용, 7/도둑, 오류, 승리 사운드를 eventType에 연결한다.
- 사운드 cue는 반드시 설정의 soundEnabled, volume, importantEventHighlight 등을 따른다.
- 같은 event key가 중복 수신되어도 사운드가 반복 폭발하지 않게 한다.
- reconnect/hydrate 직후 과거 이벤트 사운드는 재생하지 않는다.
- 상대 자원 생산, 상대 약탈 결과, 상대 개발 카드 구매는 generic sound만 사용한다.
- 사운드가 없는 환경에서도 텍스트/시각 cue가 동일한 정보를 제공해야 한다.

주의:
- 사운드로 private state를 암시하면 안 된다.
- 사운드 asset을 새로 추가하면 docs/assets_manifest.md에 출처와 라이선스를 기록한다.
- 볼륨 기본값과 mute 상태를 사용자가 예측 가능하게 유지한다.

검증:
- node --check script.js
- node --check server.js
- sound off 상태에서 정보 손실 없음 확인
- sound on 상태에서 eventType별 사운드 1회 재생 확인
- reconnect/hydrate 후 사운드 미재생 확인
- private state 사운드 분기 확인

문서 산출물:
- docs/test_plans/2026-05-27_game-feel-006b-event-sound-test-plan.md
- docs/final_reports/2026-05-27_game-feel-006b-event-sound-final-report.md
- 필요 시 docs/assets_manifest.md 갱신

최종 보고서에는 eventType별 연결 목록, 중복 방지 검증, private state 검증 결과를 반드시 기록해.
```

## FEEL-008 구현 프롬프트

```text
카탄 프로젝트의 FEEL-008 테스트/품질 게이트를 수행하고 필요한 보강을 구현해줘.

반드시 먼저 아래 문서를 읽고 준수해.
- catan_implementation_process_guideline.md
- docs/features/development-process.md
- docs/implementation_plans/2026-05-27_game-feel-visual-audio-motion-plan.md
- docs/implementation_plans/2026-05-27_game-feel-008-quality-gate-plan.md
- FEEL-000~007의 구현 계획서, 테스트 계획서, 최종 보고서

작업 전 확인:
- FEEL-000~007이 어느 범위까지 구현되었는지 문서와 코드 양쪽에서 확인해.
- 각 단계 최종 보고서의 미실행 테스트와 남은 위험을 먼저 모아.
- 계획서와 실제 구현이 다르면 FEEL-008 또는 해당 단계 계획서를 먼저 갱신해.

구현 목표:
- FEEL-000~007 전체의 정적/자동/수동 품질 게이트를 수행한다.
- 누락된 dedupe, private state, reduced-motion, sound mute, reconnect/hydrate 처리를 보강한다.
- 필요한 최소 자동 테스트 또는 helper 테스트를 추가한다.
- 모바일 viewport와 데스크톱 viewport에서 레이아웃 겹침을 확인한다.
- 브라우저 콘솔 오류, 서버 콘솔 오류, 성능/layout 위험을 확인한다.
- 스크린샷 산출물이 필요하면 docs/test_plans/ 경로에 저장하고 테스트 계획서에서 연결한다.
- release blocker가 있으면 구현 완료가 아니라 부분 완료/보류로 판단한다.

주의:
- FEEL-008은 전체 리디자인 단계가 아니라 품질 게이트와 결함 보강 단계다.
- 범위 밖의 새 기능을 추가하지 않는다.
- 테스트하지 못한 항목은 숨기지 말고 이유, 남은 위험, 후속 검증 방법을 기록한다.

검증:
- node --check script.js
- node --check server.js
- 프로젝트에 존재하는 자동 테스트 실행
- 오프라인 게임 핵심 흐름 수동 확인
- 온라인 2클라이언트 핵심 흐름 수동 확인
- reduced-motion, sound off/on, mobile viewport, reconnect/hydrate, private state 체크리스트 확인

문서 산출물:
- docs/test_plans/2026-05-27_game-feel-008-quality-gate-test-plan.md
- docs/final_reports/2026-05-27_game-feel-008-quality-gate-final-report.md
- 필요 시 docs/known_issues/에 남은 문제 기록

최종 보고서에는 전체 단계별 품질 게이트 통과 여부, release blocker 여부, 미실행 테스트, 후속 권장 작업을 반드시 기록해.
```

## 권장 실행 순서

```text
1. FEEL-000 기반 구조와 이벤트 Cue 버스
2. FEEL-007 설정/접근성 제어
3. FEEL-006A 사운드 설정/오디오 기반
4. FEEL-001 턴/내 차례 피드백
5. FEEL-002 주사위/자원 생산 피드백
6. FEEL-004 도둑/7/Pending 피드백
7. FEEL-003 행동 성공/실패/승리 피드백
8. FEEL-005 아이콘/이미지 자산 체계
9. FEEL-006B 이벤트별 사운드 연결
10. FEEL-008 테스트/품질 게이트
```

각 단계는 독립 프롬프트로 실행하되, 선행 단계 산출물이 존재하면 반드시 읽고 이어서 작업한다.
