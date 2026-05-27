# FEEL-008 테스트/품질 게이트 계획

작성일: 2026-05-27  
상위 계획: `2026-05-27_game-feel-visual-audio-motion-plan.md`

## 목적

게임성 피드백이 레이아웃, 성능, 접근성, 비공개 정보 보호를 깨지 않도록 검증한다.

## 단계별 적용 원칙

각 FEEL 단계 완료 시 이 문서의 관련 검증을 즉시 수행한다. 마지막 FEEL-008 단계에서는 전체 회귀와 스크린샷 정리만 수행한다.

원칙:

- FEEL 단계 구현 직후 해당 단계의 최소 테스트를 실행한다.
- 마지막 FEEL-008에서는 전체 회귀, 브라우저 QA, 산출물 정리, 최종 보고서 작성만 수행한다.
- private state leak, 서버 authoritative rule 훼손, 모바일 필수 버튼 가림, uncaught runtime error는 release blocker이다.
- 현재 repo에는 `npm test`가 없으므로 1차 검증은 `node scripts/...` 직접 실행 패턴을 따른다.

## 자동/정적 검증

- `node --check script.js`
- `node --check server.js`
- settings persistence
- cue dedupe
- private state cue 분기
- reduced-motion CSS 존재
- asset manifest completeness

기본 실행 세트:

```text
node --check script.js
node --check server.js
node scripts/game-feel-cue-dedupe-static-test.js
node scripts/game-feel-settings-static-test.js
node scripts/game-feel-private-cue-static-test.js
```

해당 단계 파일이 아직 없으면 구현 단계에서 생성하거나, 미실행 이유를 최종 보고서에 남긴다.

## 단계별 최소 실행 테스트

| 단계 | 최소 검증 |
| --- | --- |
| FEEL-000 | `node --check`, cue dedupe static, sanitize private payload, reconnect suppression |
| FEEL-001 | turn state static, pending actor class, reduced-motion class 확인, 모바일 current status smoke |
| FEEL-002 | dice seed/static, final face mapping, online authoritative roll smoke, private production cue |
| FEEL-003 | action result static, build target dedupe, dev card private cue, commandRejected mapping |
| FEEL-004 | robber pending static, actor/victim/observer payload, victim 0/1/2+ flow, reconnect static restore |
| FEEL-005 | asset manifest static, accessible name check, private icon leak check, mobile density smoke |
| FEEL-006A | settings persistence, sound off default, no-op wrapper, skip result values |
| FEEL-006B | eventType sound mapping, private/generic sound split, sound dedupe, no replay after sound on |
| FEEL-007 | settings fallback/migration, effective motion, modal priority, keyboard/focus |
| FEEL-008 | full static suite, browser screenshots, final report |

## 수동/브라우저 검증

- 내 차례 전환
- 주사위/생산
- 건설/교환/개발 카드
- 7/도둑/pending
- 설정 모달
- 사운드 mute/volume
- 모바일 viewport

브라우저 QA는 가능한 경우 Playwright 또는 수동 브라우저로 수행한다. 확인 항목:

- console uncaught error 없음.
- 데스크톱과 모바일에서 주요 텍스트/버튼 겹침 없음.
- reduced-motion emulation에서 핵심 정보 손실 없음.
- 사운드 off에서 정보 손실 없음.
- reconnect/hydrate 직후 과거 cue 재생 없음.
- 설정 모달, pending 모달, 승리 모달의 버튼이 viewport 안에 있음.
- 온라인 state 재수신 또는 같은 revision 수신에서 모션/사운드 반복 없음.

Viewport matrix:

```text
320x568
375x667
390x844
414x896
768x1024
1280x720
1440x900
```

## 스크린샷 산출물

```text
docs/test_plans/2026-05-27_game-feel-turn-state.png
docs/test_plans/2026-05-27_game-feel-dice-production.png
docs/test_plans/2026-05-27_game-feel-robber-pending.png
docs/test_plans/2026-05-27_game-feel-settings-modal.png
docs/test_plans/2026-05-27_game-feel-mobile.png
```

권장 추가 산출물:

```text
docs/test_plans/2026-05-27_game-feel-sound-settings.png
docs/test_plans/2026-05-27_game-feel-build-trade.png
docs/test_plans/2026-05-27_game-feel-winner-modal.png
docs/test_plans/2026-05-27_game-feel-reduced-motion.png
docs/test_plans/2026-05-27_game-feel-console.json
```

스크린샷은 “예쁘게 보임”보다 아래 기준을 증명해야 한다.

- 필수 정보가 보인다.
- 버튼이 가려지지 않는다.
- 텍스트가 부모 요소 밖으로 넘치지 않는다.
- reduced-motion에서도 상태를 알 수 있다.

## 품질 게이트

- private state leak 없음.
- reduced-motion에서 핵심 정보 손실 없음.
- 사운드 off에서 정보 손실 없음.
- 같은 cue 중복 재생 없음.
- 모바일에서 모달/버튼 가림 없음.
- transform/opacity 중심으로 구현.

## 릴리스 차단 기준

아래 항목은 발견 시 FEEL 단계 완료로 볼 수 없다.

- 상대 자원 종류, 약탈 자원, 개발 카드 구매 종류, hidden victory point가 cue/sound/icon/log로 노출됨.
- 온라인 주사위 결과가 서버 authoritative 원칙을 우회함.
- reconnect/hydrate 후 과거 sound/motion/modal이 반복 재생됨.
- 같은 cue key로 모션/사운드가 반복 폭발함.
- 사운드 off 상태에서 게임 정보가 사라짐.
- reduced-motion 상태에서 현재 턴/pending/오류/승리 정보를 알 수 없음.
- 설정 localStorage 오류나 sound unlock 실패가 게임 진행을 중단함.
- 모바일 viewport에서 필수 모달 action button이 가려짐.
- console uncaught error가 발생함.
- 보드 hit target이 모션 때문에 이동하거나 클릭 불가능해짐.

## 비공개 상태 체크리스트

```text
[ ] 상대 생산 cue에는 resourceType이 없다.
[ ] 상대 생산 sound는 generic이다.
[ ] robberResult observer payload에는 resource가 null이다.
[ ] robberResult observer sound는 generic이다.
[ ] devCardBought cue/sound/icon은 카드 종류를 노출하지 않는다.
[ ] hidden victory point는 winner 확정 전 노출되지 않는다.
[ ] player trade cue는 공개 offer/request만 사용한다.
[ ] icon/asset도 private state 기준을 따른다.
```

## 사운드 체크리스트

```text
[ ] 기본값은 sound off이다.
[ ] 사용자 gesture 없이 AudioContext/audio 재생을 시도하지 않는다.
[ ] asset이 없어도 playSoundCue가 skipped-no-asset을 반환한다.
[ ] sound off 중 발생한 cue는 sound on 후 소급 재생되지 않는다.
[ ] volume 0/mute 상태가 즉시 반영된다.
[ ] reconnect snapshot에서 sound channel이 실행되지 않는다.
[ ] rapid duplicate cue가 sound 폭발을 만들지 않는다.
```

## 접근성 체크리스트

```text
[ ] 설정 모달은 keyboard로 열고 닫을 수 있다.
[ ] Escape 닫기와 focus return이 동작한다.
[ ] segmented radio/range/toggle에 label과 현재 값이 있다.
[ ] icon-only control은 accessible name이 있다.
[ ] decorative icon은 aria-hidden이다.
[ ] 색상만으로 상태를 전달하지 않는다.
[ ] reduced-motion에서 badge/text/outline이 남는다.
[ ] 사운드 off에서도 텍스트/시각 cue가 있다.
```

## 성능/Layout 체크리스트

```text
[ ] motion 대상은 transform/opacity/filter 중심이다.
[ ] width/height/top/left 기반 layout animation을 피한다.
[ ] online state broadcast마다 전체 화면 motion이 반복되지 않는다.
[ ] 긴 로그가 있어도 panel height가 급격히 튀지 않는다.
[ ] dice/pending/win cue 중 필수 버튼을 가리지 않는다.
[ ] 모바일 320px 폭에서 버튼 텍스트가 잘리지 않는다.
```

## 최종 보고서 기준

- 구현한 FEEL 단계
- 변경 파일
- 추가 asset과 라이선스
- 통과한 테스트
- 수행하지 못한 테스트와 이유
- 남은 후속 작업

권장 최종 보고서 template:

```md
# FEEL 단계 최종 보고서

## 구현 범위
| 단계 | 완료 여부 | 비고 |
| --- | --- | --- |

## 변경 파일
| 파일 | 변경 요약 |
| --- | --- |

## 추가 asset
| 경로 | 출처 | 라이선스 | Manifest 기록 |
| --- | --- | --- | --- |

## 실행 테스트
| 테스트 | 명령/방법 | 결과 |
| --- | --- | --- |

## 브라우저 QA
| 시나리오 | Viewport | 결과 | 산출물 |
| --- | --- | --- | --- |

## 미실행/제외
| 항목 | 이유 | 후속 |
| --- | --- | --- |

## 남은 리스크
| 리스크 | 심각도 | 대응 |
| --- | --- | --- |
```

## 단계별 필수 게이트

| 단계 | 필수 검증 |
| --- | --- |
| FEEL-000 | cue dedupe, reconnect suppression, private payload sanitize |
| FEEL-001 | 내/상대/봇/pending turn state class, 중복 pulse 없음 |
| FEEL-002 | 3D dice final face, server authoritative roll, private production cue |
| FEEL-003 | build/trade/dev/win cue, 실패 원인 문구, 모바일 승리 모달 |
| FEEL-004 | actor/victim/제3자 robber cue 분기, reduced-motion pending cue |
| FEEL-005 | asset manifest, accessible names, license check |
| FEEL-006 | sound off default, user gesture enable, generic/private sound 분기 |
| FEEL-007 | settings persistence, keyboard access, reduced-motion emulation |

## 권장 자동 테스트 파일

```text
scripts/game-feel-cue-dedupe-static-test.js
scripts/game-feel-settings-static-test.js
scripts/game-feel-private-cue-static-test.js
scripts/game-feel-dice-seed-static-test.js
scripts/game-feel-turn-state-static-test.js
scripts/game-feel-action-result-static-test.js
scripts/game-feel-robber-pending-static-test.js
scripts/game-feel-sound-static-test.js
scripts/game-feel-accessibility-static-test.js
scripts/game-feel-asset-manifest-static-test.js
```

각 테스트 파일은 가능하면 DOM 없는 순수 helper 검증을 우선한다. 브라우저가 필요한 검증은 별도 QA 또는 Playwright smoke로 분리한다.

## 수동 QA 체크리스트

```text
[ ] 내 차례가 왔을 때 텍스트와 시각 cue가 모두 보인다.
[ ] reduced-motion에서 3D 회전이 제거되거나 축소된다.
[ ] 사운드 off 상태에서 어떤 정보도 사라지지 않는다.
[ ] 상대 자원 종류가 cue/sound로 드러나지 않는다.
[ ] reconnect 후 과거 이벤트 효과가 다시 재생되지 않는다.
[ ] 모바일에서 설정 모달과 승리 모달 버튼이 가려지지 않는다.
[ ] 설정 모달이 blocking modal을 덮지 않는다.
[ ] 3D dice final face와 텍스트 total이 일치한다.
[ ] build/trade/dev/win cue가 같은 revision에서 반복되지 않는다.
[ ] 7/pending actor와 waiting player가 구분된다.
[ ] sound unlock 실패가 게임을 막지 않는다.
```

## 성능 확인

- Chrome Performance 또는 수동 관찰로 roll/pending/win cue 중 프레임 드랍이 심하지 않은지 확인.
- animation 대상이 layout 속성이 아닌 `transform`, `opacity`, `filter` 위주인지 확인.
- 긴 게임 로그와 동시에 cue가 발생해도 panel height가 급격히 변하지 않는지 확인.
- 보드 hit target 좌표가 모션 전후 동일하게 클릭 가능한지 확인.
- asset 추가 시 파일 크기와 로딩 실패 fallback을 확인.
