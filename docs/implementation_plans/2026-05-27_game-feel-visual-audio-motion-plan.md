# 게임성 강화를 위한 시각/모션/이미지/아이콘/사운드 계획

작성일: 2026-05-27

## 목적

이 계획은 Katan의 기본 동작 위에 게임성을 강화하는 피드백 계층을 추가하기 위한 것이다. 목표는 화면을 화려하게 만드는 것이 아니라, 플레이어가 행동의 결과를 즉시 이해하고, 턴과 사건의 리듬을 체감하며, 중요한 순간을 놓치지 않게 만드는 것이다.

기준 문장:

```text
모든 시각 효과, 모션, 아이콘, 사운드는 게임 상태 이해와 행동 만족감을 높여야 한다.
```

## 참고 가이드라인

외부 참고 자료는 구현 방향을 정하는 기준으로만 사용하고, 프로젝트의 현재 구조와 접근성 요구에 맞게 축소 적용한다.

- MDN `prefers-reduced-motion`: 운영체제의 모션 감소 설정을 CSS에서 감지해 불필요한 모션을 줄일 수 있다.  
  https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- W3C WCAG 2.2.2 Pause, Stop, Hide: 자동으로 움직이거나 깜빡이는 콘텐츠가 오래 지속되면 사용자가 멈추거나 숨길 수 있어야 한다.  
  https://www.w3.org/WAI/WCAG20/Understanding/pause-stop-hide.html
- Microsoft Xbox Accessibility Guideline 104: 오디오로 전달되는 정보는 청각에 의존하지 않는 방식으로도 이해 가능해야 한다.  
  https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/104
- Microsoft Xbox Accessibility Guidelines overview: 게임 접근성에서 시각/오디오 cue, 모션 설정, 텍스트 표시를 별도 고려 대상으로 다룬다.  
  https://learn.microsoft.com/en-us/gaming/accessibility/guidelines
- MDN Web Audio API: 브라우저에서 효과음과 오디오 그래프를 제어할 수 있지만, 오디오 컨텍스트와 사용자 상호작용 기반 초기화가 필요하다.  
  https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- CSS 3D dice roller 구현 사례: 일반적으로 각 면을 `div`로 만든 뒤 `transform-style: preserve-3d`, `rotateX/Y/Z`, transition/keyframe 또는 `requestAnimationFrame`으로 굴림과 최종 면을 표현한다.  
  https://www.jqueryscript.net/other/animated-3d-dice-roller.html  
  https://uplup.com/docs/dice-roller-documentation
- Seedable dice roll 참고: JavaScript 기본 `Math.random()`은 직접 seed를 지정할 수 없으므로, 재현 가능한 결과가 필요하면 별도 seedable PRNG를 둔다.  
  https://kirbysayshi.com/2012/06/29/seedable-dice-rolls-using-js.html

## 적용 원칙

1. 정보 우선: 효과는 플레이어가 무슨 일이 일어났는지 더 빨리 알게 해야 한다.
2. 짧고 명확하게: 대부분의 모션은 80~300ms 안에서 끝낸다.
3. 반복 금지: 자동 반복, 깜빡임, 긴 흔들림은 기본적으로 사용하지 않는다.
4. 감각 중복: 중요한 사건은 시각, 텍스트, 선택적 사운드 중 최소 2개 채널로 전달한다.
5. 접근성 우선: `prefers-reduced-motion`, 사운드 mute, 효과 강도 설정을 고려한다.
6. 게임 규칙 불변: 애니메이션은 상태를 꾸밀 뿐, 서버/게임 상태의 정답성을 바꾸지 않는다.
7. 온라인 동기화 안전: 효과는 revision/state 변화의 결과로 재생하고, 명령 성공 전 선반영을 최소화한다.
8. 비공개 정보 보호: 효과와 사운드는 viewer가 볼 수 있는 정보만 표현한다.

## 피드백 단계 모델

각 효과는 아래 단계 중 어떤 역할을 하는지 명확히 한다.

| 단계 | 목적 | 예 |
| --- | --- | --- |
| Anticipation | 행동이 시작되었음을 알림 | 주사위 rolling pending, 버튼 press |
| Confirmation | 행동 성공을 확인 | 건설 pop-in, 교환 성공 cue |
| Impact | 중요한 사건의 무게 전달 | 7 경고, 승리 강조 |
| Recovery | 다음 상태로 안정적으로 복귀 | 모달 닫힘, active player 전환 |

모든 효과가 네 단계를 모두 가질 필요는 없다. 다만 중요한 이벤트는 `Confirmation` 또는 `Impact` 없이 조용히 지나가지 않게 한다.

## 설정 위치와 기본값

### UI 위치

- 1차 구현에서는 게임 화면 우측 패널 또는 상단 영역에 `효과 설정` 버튼을 추가한다.
- 설정은 모달로 열고, 게임 중에도 변경 가능하게 한다.
- 설정 모달은 오프라인/온라인 모두 접근 가능해야 한다.
- setup 화면에서도 최소한 사운드/모션 기본값을 확인할 수 있게 하는 것을 후속으로 검토한다.

### 기본값

```text
모션 효과: 자동
사운드 효과: 끄기
효과음 볼륨: 60
내 차례 강조: 기본
중요 이벤트 강조: 켜기
```

`모션 효과`는 3상태로 둔다.

```text
자동: OS의 prefers-reduced-motion 설정을 따른다.
줄이기: OS 설정과 무관하게 축소 모션을 사용한다.
켜기: 짧은 기본 모션을 사용한다. 단, 장시간 반복/깜빡임은 여전히 금지한다.
```

사운드는 기본 꺼짐이다. 사용자가 `효과음 켜기`를 누른 뒤에만 AudioContext를 생성하거나 재개한다.

## 비공개 정보 보호 기준

온라인에서는 애니메이션과 사운드도 private state 정책을 따라야 한다.

| 상황 | viewer에게 허용되는 피드백 | 금지되는 피드백 |
| --- | --- | --- |
| 내가 자원을 받음 | 자원 종류별 chip/count/sound | 해당 없음 |
| 상대가 자원을 받음 | 카드 총량 증가, generic card gain cue | 자원 종류별 아이콘, 자원별 사운드 |
| 도둑 약탈 결과 actor/victim | 실제 약탈 자원 표시와 사운드 | 해당 없음 |
| 도둑 약탈 결과 제3자 | 약탈 발생 generic cue | 약탈 자원 종류 표시/사운드 |
| 개발 카드 구매 | 구매 발생 cue | 구매한 카드 종류 표시 |
| 개발 카드 사용 | 공개된 카드 종류 cue | 비공개 손패 추론 가능 cue |
| 교환 제안 | 제안된 공개 자원 cue | 상대 비공개 보유량 추론 cue |

원칙:

```text
텍스트로 볼 수 없는 정보는 모션/사운드/아이콘으로도 보여주지 않는다.
```

## 이벤트 중복 재생 방지

온라인 state 재수신, reconnect, modal 재동기화로 같은 효과가 반복될 수 있으므로 dedupe key를 사용한다.

권장 key:

```text
roomId + revision + eventType + entityId + detailKey
```

`detailKey`는 같은 revision 안에서 여러 cue가 발생할 수 있는 경우를 구분한다.

예:

```text
resourcesProduced: seatIndex + resourceType 또는 seatIndex + "generic"
build완료d: buildType + targetId
trade완료d: tradeId 또는 requesterId + acceptedPlayerId
robberResult: resultId + viewerRole
pendingStarted: pendingType + actorSeatIndex
```

대표 `eventType`:

```text
turnChanged
diceRolled
resourcesProduced
build완료d
trade완료d
devCardBought
devCardPlayed
robberMoved
robberResult
pendingStarted
winnerDeclared
roomEnded
```

적용 기준:

- 같은 key는 한 세션에서 1회만 재생한다.
- reconnect 직후 받은 과거 state는 기본적으로 효과를 재생하지 않는다.
- 단, 현재 사용자에게 필요한 blocking 안내는 효과 대신 정적 상태로 복구한다.
- localStorage가 아니라 세션 메모리 또는 sessionStorage를 사용한다.

## 효과 분류

| ID | 영역 | 우선순위 | 목표 |
| --- | --- | --- | --- |
| FEEL-001 | 턴/내 차례 모션 | P1 | 내 차례와 현재 진행자를 즉시 인지 |
| FEEL-002 | 주사위/자원 생산 피드백 | P1 | 굴림과 생산 결과를 시각적으로 체감 |
| FEEL-002A | CSS 3D 주사위와 hold-time seed | P1 | 주사위 굴림을 촉각적 입력과 동기화 |
| FEEL-003 | 건설/개발 카드/교환 성공 피드백 | P1 | 행동 성공의 만족감과 결과 이해 강화 |
| FEEL-004 | 도둑/7/pending 긴장감 피드백 | P1 | 강제 행동과 위험 상황을 명확히 전달 |
| FEEL-005 | 아이콘/이미지 언어 정리 | P2 | 자원, 행동, 상태를 텍스트 없이도 스캔 가능하게 보조 |
| FEEL-006 | 사운드 효과 시스템 | P2 | 선택적 효과음으로 행동 리듬 강화 |
| FEEL-007 | 설정/접근성 제어 | P1 | 모션/사운드로 인한 불편을 방지 |
| FEEL-008 | 테스트/품질 기준 | P1 | 효과가 레이아웃과 성능을 깨지 않게 검증 |

## FEEL-001 턴/내 차례 모션

### 현재 문제

- UX 계획에서 현재 진행자와 내 차례 표시가 강화될 예정이지만, 시각적 리듬은 아직 정의되지 않았다.
- 온라인에서는 내 차례가 왔을 때 즉시 눈에 들어오는 변화가 필요하다.

### 개선 방향

- 현재 진행 플레이어 카드에 짧은 강조 모션을 적용한다.
- 내 차례가 되었을 때 상단 상태 배지와 주요 액션 영역에 1회성 pulse를 적용한다.
- 상대 턴은 차분한 active border만 사용하고, 내 차례보다 약하게 표현한다.
- 봇 턴은 자동 진행 중임을 나타내는 짧은 progress shimmer 또는 점진 표시를 사용한다.
- pending actor는 일반 active player보다 강한 `행동 필요` 라벨과 테두리 강조를 적용한다.

### 권장 모션

```text
내 차례 pulse: 180~240ms, 1회
현재 플레이어 카드 active transition: 160ms
pending actor highlight: border/background transition 160ms
봇 진행 shimmer: 1초 이하, 반복 시 reduced-motion에서 정지
```

### 완료 기준

- 턴이 바뀔 때 현재 진행자가 즉시 눈에 들어온다.
- 내 차례 모션은 반복되지 않고 1회만 재생된다.
- `prefers-reduced-motion: reduce`에서는 pulse/shimmer가 제거되거나 즉시 상태 전환으로 대체된다.
- 중복 state 수신으로 같은 턴 전환 모션이 반복되지 않는다.

## FEEL-002 주사위/자원 생산 피드백

### 현재 문제

- 주사위 결과와 자원 생산은 표시되지만, 어떤 타일이 생산했고 어떤 플레이어가 자원을 받았는지 체감이 약할 수 있다.
- 현재 주사위는 숫자 표시 중심이라 실제로 굴렸다는 감각이 약하다.
- 버튼을 누르는 시간과 굴림이 연결되지 않아 플레이어 입력의 손맛이 부족하다.

### 개선 방향

- CSS 3D 주사위 2개를 사용해 실제 굴림처럼 보이는 모션을 적용한다.
- 각 주사위는 6개 면을 가진 CSS cube로 구현하고, 최종 결과에 맞는 final transform을 적용한다.
- 굴림 중에는 seed 기반 중간 회전값, bounce, shadow를 적용해 매번 다른 굴림처럼 보이게 한다.
- 오프라인에서는 버튼을 누른 시간(`pointerdown`~`pointerup`)을 seed entropy에 섞어 주사위 결과와 애니메이션 seed를 계산한다.
- 온라인에서는 버튼 hold duration을 client entropy로 서버에 보내되, 최종 결과는 서버가 서버 entropy와 섞어 결정한다.
- 온라인에서는 명령 전송 후 `rolling pending` 상태만 보여주고, 최종 숫자는 서버 state 수신 이후 표시한다.
- 서버는 최종 dice total과 함께 가능하면 `rollAnimationSeed`를 내려 모든 클라이언트가 같은 결과와 비슷한 모션을 볼 수 있게 한다.
- 최종 합계가 나온 뒤 생산 타일을 짧게 강조한다.
- 내가 자원을 받은 경우에는 자원 종류별 chip fly-in 또는 count bump를 적용한다.
- 상대가 자원을 받은 경우에는 자원 종류를 드러내지 않는 generic card count bump만 적용한다.
- 생산 타일 강조는 공개 보드 정보이므로 허용한다.
- 다만 상대 플레이어 카드나 사운드에서 상대가 받은 자원 종류를 직접 드러내지 않는다.
- 은행 재고 부족 또는 도둑 차단으로 생산되지 않은 경우에는 별도 `차단됨` 시각 cue를 사용한다.
- 7이 나오면 일반 생산과 다른 경고 톤의 피드백을 사용한다.

### 권장 모션

```text
dice roll: 300~500ms, reduced-motion에서는 숫자 즉시 전환
production tile glow: 300ms 이하
resource count bump: 120~180ms
blocked production: muted flash 160ms + 로그/텍스트
```

CSS 3D dice 기준:

```text
scene: perspective 600~900px
dice: transform-style preserve-3d
face: translateZ(size / 2)
roll duration: 500~900ms
settle duration: 120~220ms
reduced-motion: 3D spin 제거, final face fade/scale만 사용
```

### Hold-time seed 기준

버튼 입력:

```text
pointerdown: pressStart = performance.now()
pointerup/cancel: holdMs = clamp(performance.now() - pressStart, 0, 3000)
```

오프라인 seed 후보:

```text
seedMaterial = gameId + turnIndex + activePlayerIndex + holdMs + performance.now() + cryptoRandom
```

온라인 command payload 후보:

```text
{
  name: "rollDice",
  clientHoldMs,
  clientEntropy,
  clientStartedAt
}
```

온라인 서버 seed 후보:

```text
serverSeedMaterial = roomId + revision + activeSeat + clientHoldMs + clientEntropy + crypto.randomBytes()
```

주의:

- hold duration은 게임 감각과 추가 entropy 용도이지, 사용자가 결과를 직접 제어할 수 있는 단독 seed가 아니다.
- 온라인 최종 결과는 서버에서만 확정한다.
- 같은 hold duration을 반복해도 서버 entropy 때문에 결과가 고정되지 않아야 한다.
- 재현 가능한 디버그가 필요하면 test mode에서만 명시적 test seed를 허용한다.

### 완료 기준

- 주사위 결과, 생산 타일, 자원 수령자가 하나의 흐름으로 이해된다.
- 생산 차단과 은행 재고 부족은 성공 생산과 다른 피드백을 가진다.
- 온라인에서는 서버 state 수신 이후 결과 모션이 재생된다.
- 상대 자원 종류가 모션 또는 사운드로 노출되지 않는다.
- 버튼을 짧게/길게 눌렀을 때 animation seed가 달라진다.
- 온라인에서 hold duration은 서버 결과 산출에 섞이지만 클라이언트 단독으로 결과를 확정하지 않는다.
- reduced-motion에서는 3D 회전 없이 최종 주사위 값이 명확히 표시된다.

## FEEL-003 건설/개발 카드/교환 성공 피드백

### 현재 문제

- 도로/마을/도시 건설, 개발 카드 구매, 교환 성공은 게임적으로 중요한 행동이지만 시각적 보상이 약하다.

### 개선 방향

- 도로 건설: edge에 짧은 draw-in 모션 또는 scale/opacity 전환.
- 마을/도시 건설: 건물 아이콘 pop-in.
- 도시 업그레이드: 기존 마을에서 도시로 커지는 전환.
- 개발 카드 구매: 카드 뒷면 flip 또는 slide-in.
- 개발 카드 사용: 카드 종류별 작은 아이콘 cue.
- 교환 성공: 주는 자원과 받는 자원이 교차하는 짧은 swap cue.
- 행동 실패: 흔들림 대신 명확한 error label과 disabled reason을 사용한다. 강한 shake는 피한다.
- 실패 행동은 `규칙상 불가`, `자원 부족`, `네트워크/서버 거절`로 나누어 다른 문구와 cue를 사용한다.
- 승리 시 승자 카드, 점수 영역, 최종 모달을 함께 강조한다.
- 승리 효과는 짧은 축하 cue를 사용하되, reduced-motion에서는 정적 강조만 사용한다.
- 1차 승리 cue는 최종 모달 내부와 승자 카드 주변으로 제한한다.
- viewport 전체 particle/confetti overlay는 모바일 버튼 가림 위험이 있으므로 1차 범위에서 제외한다.

### 완료 기준

- 성공 행동은 로그를 보지 않아도 화면에서 결과가 보인다.
- 실패 행동은 애니메이션보다 이유 표시가 우선한다.
- 건설 모션이 보드 위치나 hit target을 이동시키지 않는다.
- 승리 순간은 사운드 없이도 명확히 인지된다.

## FEEL-004 도둑/7/pending 긴장감 피드백

### 현재 문제

- 도둑 이동, 7 처리, 자원 버리기, 약탈은 긴장감이 큰 핵심 사건이지만 현재는 모달/로그 중심이다.

### 개선 방향

- 7이 나오면 dice panel과 가이드 패널에 짧은 alert 상태를 적용한다.
- 도둑 이동 가능 타일을 명확히 강조하고, 현재 도둑 위치는 별도 스타일로 구분한다.
- 도둑 이동 완료 시 도둑 토큰이 새 위치로 짧게 이동하거나 fade transition한다.
- 자원 버리기 모달은 선택량 progress bar를 사용한다.
- 약탈 대상 선택은 대상 카드 hover/focus 강조와 선택 확정 cue를 사용한다.
- 약탈 결과는 actor/victim에게만 구체적으로 표시하고, 다른 플레이어에게는 비공개 정보가 없는 공개 cue만 표시한다.
- 도둑 관련 사운드는 actor/victim 외 플레이어에게 약탈 자원 종류를 암시하지 않는다.

### 완료 기준

- 7/pending 상태가 일반 턴과 명확히 구분된다.
- 도둑 관련 피드백이 private state 정책을 깨지 않는다.
- reduced-motion에서도 선택 가능/불가능 타일은 색상과 라벨로 구분된다.

## FEEL-005 아이콘/이미지 언어 정리

### 현재 문제

- 자원과 행동은 텍스트 중심이며, 일부 아이콘/시각 요소가 있지만 전체 체계가 문서화되어 있지 않다.

### 개선 방향

- 자원 아이콘을 통일한다.

```text
목재: 나무/통나무
벽돌: 벽돌
양: 양털/양
밀: 이삭
철: 광석
```

- 행동 아이콘을 통일한다.

```text
도로: road
마을: house
도시: buildings
개발 카드: card
교환: swap
주사위: dice
도둑: mask/robber token
```

- 외부 아이콘 라이브러리를 추가하기 전에는 기존 SVG/CSS 기반 표현을 우선한다.
- 라이브러리를 도입한다면 번들 영향이 작은 아이콘 세트만 사용하고, 라이선스를 문서화한다.
- 이미지 자산은 장식 배경보다 실제 상태를 더 잘 보여주는 토큰/카드/자원 표현에 우선 사용한다.

### 자산 위치와 명명 규칙

```text
assets/icons/resource-forest.svg
assets/icons/resource-hill.svg
assets/icons/resource-pasture.svg
assets/icons/resource-field.svg
assets/icons/resource-mountain.svg
assets/icons/action-road.svg
assets/icons/action-settlement.svg
assets/icons/action-city.svg
assets/icons/action-trade.svg
assets/icons/action-dice.svg
assets/icons/status-robber.svg
assets/sounds/turn-bell.mp3
assets/sounds/dice-roll.mp3
assets/sounds/build-success.mp3
assets/sounds/trade-success.mp3
assets/sounds/card-flip.mp3
assets/sounds/robber-alert.mp3
assets/sounds/error-soft.mp3
assets/sounds/win-fanfare.mp3
```

기존 SVG/CSS로 충분히 표현 가능한 아이콘은 새 파일을 만들지 않고 코드 내 요소로 구현한다. 파일 자산을 추가하는 경우 `docs/assets_manifest.md`에 출처, 라이선스, 용도를 기록한다.

### 자산 라이선스 기준

- 직접 제작, CC0, 또는 명시적으로 재배포 가능한 라이선스만 사용한다.
- 출처와 라이선스가 확인되지 않은 이미지/아이콘/사운드 asset은 커밋하지 않는다.
- 외부 asset을 수정한 경우 원본 출처와 수정 내용을 `docs/assets_manifest.md`에 기록한다.

### 완료 기준

- 같은 자원/행동은 모든 UI에서 같은 아이콘 언어를 사용한다.
- 아이콘만으로 의미를 전달하지 않고 텍스트 또는 aria-label을 함께 제공한다.
- 새 아이콘 자산은 출처와 라이선스를 문서화한다.

## FEEL-006 사운드 효과 시스템

### 현재 문제

- 효과음이 없어서 행동 성공, 턴 전환, 경고 상황의 감각적 피드백이 부족하다.
- 사운드는 접근성/브라우저 자동재생 제한/사용자 선호를 고려해야 한다.

### 개선 방향

- 기본값은 사운드 꺼짐이다.
- 사용자가 `효과음 켜기`를 누른 뒤 첫 사용자 상호작용 안에서 오디오를 활성화한다.
- 설정에 `효과음 켜기/끄기`, `볼륨`, `내 차례 알림음`을 둔다.
- Web Audio API 또는 짧은 `<audio>` asset 중 하나를 선택한다.
- 초반에는 생성형 beep보다 짧은 asset 기반 효과음을 권장한다.
- 모든 사운드 cue는 시각/텍스트 cue와 함께 제공한다.
- 사운드는 viewer가 알 수 있는 정보만 표현한다.
- 상대 자원 생산, 상대 약탈 결과, 상대 개발 카드 구매는 generic sound만 사용한다.

### 후보 사운드

```text
내 차례: 짧고 부드러운 bell
주사위: dice roll tick
건설 성공: wood/stone tap
교환 성공: soft swap chime
개발 카드: card flip
7/도둑: 낮은 alert
오류: 매우 짧은 muted knock
승리: 짧은 fanfare
```

### 완료 기준

- 사운드는 사용자 제스처 이후에만 활성화된다.
- 사운드를 꺼도 게임 정보 손실이 없다.
- 볼륨 조절 또는 mute가 가능하다.
- 온라인에서 같은 이벤트가 중복 수신되어도 효과음이 반복 폭발하지 않는다.
- private state로 볼 수 없는 정보가 자원별/카드별 사운드로 노출되지 않는다.

### 구현 분리

- `FEEL-006A`: 사운드 설정, 사용자 gesture 기반 AudioContext/asset loader, mute/volume persistence.
- `FEEL-006B`: 개별 이벤트와 사운드 asset 연결, dedupe, private state 분기.

`FEEL-006A`는 설정/접근성 단계 직후 구현하고, `FEEL-006B`는 주요 시각 cue가 안정된 뒤 구현한다.

## FEEL-007 설정/접근성 제어

### 필수 설정

```text
모션 효과: 자동 / 줄이기 / 켜기
사운드 효과: 끄기 / 켜기
효과음 볼륨: 0~100
내 차례 강조: 기본 / 강하게
중요 이벤트 강조: 켜기 / 끄기
```

### 접근성 기준

- `prefers-reduced-motion: reduce`를 감지해 모션 효과 기본값을 줄인다.
- 색상만으로 상태를 전달하지 않는다.
- 반복 깜빡임과 장시간 자동 애니메이션을 피한다.
- 오디오 정보는 텍스트/시각 cue로 대체 가능해야 한다.
- 설정은 localStorage에 저장하되, 온라인 게임 상태에는 영향을 주지 않는다.
- 설정은 방/플레이어별이 아니라 앱 전역 사용자 선호로 저장한다.
- localStorage key는 `katanFeelSettings`를 사용한다.
- 설정 UI는 키보드로 조작 가능해야 한다.
- 설정 변경은 현재 페이지에서 즉시 반영되어야 한다.

### 완료 기준

- 모션 감소 환경에서 주요 게임 상태를 놓치지 않는다.
- 사운드 mute 상태에서도 내 차례, 7, 교환, 승리 정보를 알 수 있다.
- 설정 변경이 즉시 반영된다.

## 이벤트별 피드백 채널 매핑

| 이벤트 | 텍스트/가이드 | 로그 | 모션/시각 cue | 사운드 | 비고 |
| --- | --- | --- | --- | --- | --- |
| 내 차례 시작 | 필수 | 선택 | 필수 | 선택 | 사운드는 설정 켜짐일 때만 |
| 상대 차례 시작 | 필수 | 선택 | 약한 강조 | 없음 또는 generic | 과한 반복 금지 |
| 봇 턴 | 필수 | 선택 | 진행 중 cue | 없음 또는 generic | shimmer는 reduced-motion에서 제거 |
| 주사위 결과 | 필수 | 필수 | dice/result cue | 선택 | 온라인은 서버 결과 이후 |
| 자원 생산 | 필수 | 필수 | viewer 기준 cue | 선택 | 상대 자원 종류 비공개 |
| 건설 성공 | 선택 | 필수 | 필수 | 선택 | 보드 hit target 변경 금지 |
| 교환 성사 | 필수 | 필수 | 필수 | 선택 | 공개 제안 기준 |
| 개발 카드 구매 | 선택 | 필수 | generic card cue | 선택 | 카드 종류 비공개 |
| 개발 카드 사용 | 필수 | 필수 | 카드 종류 cue | 선택 | 사용 후 공개된 카드만 |
| 7 발생 | 필수 | 필수 | alert cue | 선택 | 반복 경고 금지 |
| 도둑 이동 | 필수 | 필수 | robber cue | 선택 | 약탈 정보 보호 |
| 약탈 결과 | viewer별 | viewer별 | viewer별 | viewer별 | actor/victim과 제3자 분리 |
| 승리 | 필수 | 필수 | 필수 | 선택 | reduced-motion 정적 강조 |
| 서버/연결 오류 | 필수 | 선택 | 상태 배지 | 선택 안 함 | 사운드보다 회복 안내 우선 |

## 공통 모션 토큰

CSS 변수 기준:

```css
--motion-fast: 120ms;
--motion-base: 180ms;
--motion-slow: 300ms;
--motion-emphasis: 500ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-emphasis: cubic-bezier(0.2, 0.8, 0.2, 1);
```

사용 기준:

- hover/focus/active border: `--motion-fast`
- 턴 전환, card bump, count bump: `--motion-base`
- 주사위, 생산 타일, 도둑 강조: `--motion-slow`
- 승리, 7 경고처럼 큰 사건: `--motion-emphasis` 이하
- reduced-motion에서는 duration을 0~80ms로 낮추거나 opacity/색상 전환만 남긴다.

### CSS class 명명 규칙

```text
motion-turn-pulse
motion-resource-bump
motion-card-gain
motion-build-pop
motion-road-draw
motion-alert
motion-robber-move
motion-trade-swap
motion-win-highlight
is-reduced-motion
```

상태 class와 1회성 motion class를 분리한다. 예를 들어 현재 플레이어 상태는 `is-current-turn`, 1회성 강조는 `motion-turn-pulse`로 둔다.

## FEEL-008 테스트/품질 기준

### 자동/정적 검증

- `node --check script.js`
- `node --check server.js`
- 모션 설정 helper 정적 테스트
- 사운드 설정 persistence 정적 테스트
- 이벤트 중복 재생 방지 테스트
- reduced-motion CSS 존재 확인
- private state 이벤트에서 cue/sound 분기 테스트

### 브라우저/수동 검증

- 내 차례 전환 모션
- 주사위 결과와 생산 타일 강조
- 건설 성공 피드백
- 교환 성공/실패 피드백
- 7/pending action 피드백
- 사운드 mute/volume
- `prefers-reduced-motion` emulation
- 시각 회귀 스크린샷 저장 위치:

```text
docs/test_plans/2026-05-27_game-feel-turn-state.png
docs/test_plans/2026-05-27_game-feel-dice-production.png
docs/test_plans/2026-05-27_game-feel-robber-pending.png
docs/test_plans/2026-05-27_game-feel-settings-modal.png
docs/test_plans/2026-05-27_game-feel-mobile.png
```

- 모바일 viewport:

```text
320x568
375x667
390x844
414x896
768x1024
1280x720
1440x900
```

### 성능 기준

- 애니메이션은 `transform`, `opacity` 중심으로 구현한다.
- 보드 전체 reflow를 유발하는 layout animation을 피한다.
- 온라인 state broadcast마다 전체 화면에 큰 모션을 반복하지 않는다.
- 저사양 기기에서 모션을 줄여도 게임 플레이가 동일하게 가능해야 한다.

## 구현 순서

1. FEEL-000 기반 구조와 이벤트 cue 버스
2. FEEL-007 설정/접근성 제어
3. FEEL-006A 사운드 설정/오디오 기반
4. FEEL-001 턴/내 차례 모션
5. FEEL-002 주사위/자원 생산 피드백
6. FEEL-004 도둑/7/pending 긴장감 피드백
7. FEEL-003 건설/개발 카드/교환 성공 피드백
8. FEEL-005 아이콘/이미지 언어 정리
9. FEEL-006B 이벤트별 사운드 연결
10. FEEL-008 전체 회귀와 품질 보강

이 순서를 권장하는 이유는 cue 중복 방지, 설정, 접근성 제어가 먼저 있어야 이후 효과를 안전하게 쌓을 수 있기 때문이다. 각 단계는 완료 시 FEEL-008의 관련 테스트를 즉시 수행하고, 마지막 FEEL-008에서는 전체 회귀만 수행한다.

## 개발 단위 분기

이 계획은 하나의 상위 개발 단위 `game-feel-feedback-system`으로 관리한다. 세부 구현은 아래 문서로 분기한다.

| 개발 단위 | 문서 | 핵심 산출물 |
| --- | --- | --- |
| FEEL-000 | [기반 구조와 이벤트 cue 버스](2026-05-27_game-feel-000-feedback-foundation-plan.md) | cue dispatcher, dedupe key, 설정 모델 초안 |
| FEEL-001 | [턴/내 차례 피드백](2026-05-27_game-feel-001-turn-feedback-plan.md) | 현재 진행자/내 차례 모션 |
| FEEL-002 | [주사위/자원 생산 피드백](2026-05-27_game-feel-002-dice-production-feedback-plan.md) | dice/result/production cue |
| FEEL-003 | [행동 성공/실패/승리 피드백](2026-05-27_game-feel-003-action-result-feedback-plan.md) | build/trade/dev/win cue |
| FEEL-004 | [도둑/7/pending 피드백](2026-05-27_game-feel-004-robber-pending-feedback-plan.md) | robber/pending cue |
| FEEL-005 | [아이콘/이미지 자산 체계](2026-05-27_game-feel-005-icon-asset-system-plan.md) | icon language, asset manifest |
| FEEL-006 | [사운드 효과 시스템](2026-05-27_game-feel-006-sound-system-plan.md) | sound settings, audio loader, event sounds |
| FEEL-007 | [설정/접근성 제어](2026-05-27_game-feel-007-settings-accessibility-plan.md) | settings modal, reduced motion |
| FEEL-008 | [테스트/품질 게이트](2026-05-27_game-feel-008-quality-gate-plan.md) | visual QA, private state, dedupe tests |

## 참고 자료 적용 방식

| 참고 자료 | 적용 위치 | 적용 방식 |
| --- | --- | --- |
| MDN `prefers-reduced-motion` | FEEL-007, 공통 모션 토큰 | OS 모션 감소 설정을 기본값 `자동`에 반영 |
| W3C WCAG Pause, Stop, Hide | FEEL-001~004, FEEL-007 | 장시간/반복/깜빡임 효과 금지, 정지 가능한 설정 제공 |
| Xbox Accessibility Guideline 104 | FEEL-006, 이벤트별 채널 매핑 | 사운드 cue는 항상 시각/텍스트 cue로 대체 가능 |
| Xbox Accessibility Guidelines overview | FEEL-007, FEEL-008 | 모션/오디오/텍스트 접근성 검증 항목 구성 |
| MDN Web Audio API | FEEL-006 | 사용자 gesture 이후 오디오 활성화, mute/volume 제어 |
| CSS 3D dice 구현 사례 | FEEL-002 | CSS cube, final face transform, bounce/settle 모션 설계 |
| Seedable dice roll 참고 | FEEL-002, FEEL-000 | seedable PRNG와 hold-time entropy 설계 |

## 기존 UX 계획과의 관계

이 계획은 [3단계 UX 개선 구체화 계획](2026-05-27_stage-3-ux-improvement-deepening-plan.md)을 대체하지 않는다. UX 계획이 상태와 행동을 명확히 만드는 구조라면, 이 계획은 그 구조 위에 감각적 피드백을 얹는다.

우선 연결:

```text
UX-004 턴 진행 안내 강화 -> FEEL-001 턴/내 차례 모션
UX-002 pending action 안내 -> FEEL-004 도둑/7/pending 피드백
UX-001 교환 UX -> FEEL-003 교환 성공 피드백
UX-003 로그 중요 이벤트 -> FEEL-002/003/004 이벤트 타입 연동
UX-005 모바일 레이아웃 -> FEEL-007 reduced motion 및 작은 화면 검증
```

## 산출물

- 구현 계획: 이 문서
- 테스트 계획: `docs/test_plans/2026-05-27_game-feel-visual-audio-motion-test-plan.md`
- 최종 보고서: `docs/final_reports/2026-05-27_game-feel-visual-audio-motion-final-report.md`
- 필요 시 자산 목록: `docs/assets_manifest.md`

## 범위 밖

- 대형 배경 일러스트 제작
- 전체 보드 렌더러 교체
- 3D 보드 전환
- 긴 배경 음악
- 온라인 음성 채팅
- 강한 화면 흔들림
- 규칙 상태를 바꾸는 애니메이션 선반영
