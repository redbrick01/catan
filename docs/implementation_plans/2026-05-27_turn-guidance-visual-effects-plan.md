# 턴 안내 시각 효과 개선 계획서

작성일: 2026-05-27

## 목적

현재 턴 안내는 `내 차례입니다`, `내가 행동할 차례입니다`, `봇 진행 중` 같은 텍스트를 중심으로 전달된다. 다음 UX 개선에서는 텍스트 설명을 줄이고, 플레이어가 화면을 훑는 순간 현재 진행자와 행동 필요 여부를 알아볼 수 있도록 시각 효과 중심으로 전환한다.

핵심 방향:

```text
긴 안내 문장보다, 보드/플레이어 카드/액션 영역의 빛·테두리·움직임으로 현재 상태를 알린다.
```

참고한 UX 패턴:

- 복잡한 보드게임 UI에서는 플레이어가 집중해야 하는 영역에 class를 붙여 highlight하는 방식이 널리 쓰인다.
- active/inactive 상태는 전체 화면을 강하게 덮기보다, 현재 진행 영역을 밝히고 조작 불가 영역은 조용히 낮추는 편이 안전하다.
- 모바일에서는 플레이어 카드가 화면 밖에 있을 수 있으므로 상단 상태 또는 보드 주변에서도 현재 진행 상태가 보여야 한다.

## 적용 원칙

1. 규칙과 서버 command 검증은 바꾸지 않는다.
2. 기존 `currentTurnUxState()`의 상태 계산을 그대로 사용한다.
3. 시각 강조 우선순위는 다음 순서를 따른다.

```text
방 종료/연결 끊김 같은 blocking 상태
> pendingActors/actingPlayer
> activePlayer
> 일반 대기 상태
```

4. 색상만으로 상태를 구분하지 않고 라벨, 아이콘, 테두리, 움직임을 함께 사용한다.
5. 과한 애니메이션은 피하고, 900ms~1400ms 정도의 부드러운 pulse 중심으로 둔다.
6. `prefers-reduced-motion: reduce` 환경에서는 반복 애니메이션을 끈다.
7. 모바일에서는 현재 진행 상태가 상단 또는 보드 근처에서 즉시 보여야 한다.
8. 전체 화면을 강하게 어둡게 하지 않는다. 보드 관찰이 필요한 게임이므로, dimming은 조작 불가 액션 영역이나 대기자 카드에만 약하게 적용한다.
9. 1차 구현은 얇게 들어간다. 카드 spotlight, 현재 행동 버튼 glow, pending marker를 먼저 구현하고, 보드 halo와 로그 flash는 과하지 않은지 확인한 뒤 확장한다.

## 상태와 시각 효과 매핑

| UX 상태 | DOM hook | 시각 효과 | reduced-motion fallback |
| --- | --- | --- | --- |
| `blocking` | `.app[data-focus-state="blocking"]`, `.dice-panel[data-turn-state="blocking"]` | 붉은 warning ring, 액션 영역 조용히 dim | 정적 붉은 테두리만 유지 |
| `action-needed` | `.is-pending-actor`, `.dice-panel[data-turn-state="action-needed"]` | pending actor 카드 green ring, 작은 dot pulse | dot은 정적 표시 |
| `my-turn` | `.is-my-turn`, `.dice-panel[data-turn-state="my-turn"]` | 내 카드 brightness +5~8%, primary action glow | 정적 ring과 버튼 테두리 |
| `bot-turn` | `.is-bot-turn`, `.dice-panel[data-turn-state="bot-turn"]` | 봇 카드 낮은 강도 pulse 또는 진행 dot 3개 | 정적 `봇 진행 중` 라벨 |
| `waiting` | `.is-waiting-turn` | 대기 카드 opacity 약간 낮춤, 현재 진행자만 spotlight | 애니메이션 없음 |
| `active-turn` | `.is-current-turn` | 현재 진행자 카드 gold ring | 정적 ring |

구현 시 `currentTurnUxState()`에서 계산한 `kind`, `currentFocusPlayer`, `viewerPlayer`, `pendingActors`를 기준으로 위 hook을 부여한다.

## 데이터 전달 계획

- `.app` 또는 `.tabletop`에 `data-focus-state="{kind}"`를 부여한다.
- `.board-area`에 `--focus-player-color`를 설정한다.
  - 값은 `currentFocusPlayer.color`.
  - focus player가 없거나 blocking 상태이면 warning/default 색을 사용한다.
- `.dice-panel`은 기존 `data-turn-state`를 유지한다.
- player card와 seat는 기존 class를 유지한다.
  - `is-current-turn`
  - `is-my-turn`
  - `is-pending-actor`
  - `is-bot-turn`
  - `is-waiting-turn`
- 액션 버튼은 1차 구현에서 `data-primary-action="true"` 또는 `.is-primary-action` 중 하나로 표시한다.

## 구현 범위

### 1. 현재 진행자 카드 spotlight

대상:

- `.seat.is-current-turn`
- `.player-row.is-current-turn`
- `.player-row.is-my-turn`
- `.player-row.is-pending-actor`
- `.player-row.is-bot-turn`

계획:

- 현재 진행자 카드에 얇은 glow ring을 추가한다.
- 내 차례는 카드를 약간 밝게 하고 gold + green 혼합 ring을 사용한다.
- pending actor는 green ring과 작은 dot pulse를 사용한다.
- 봇 진행 중은 강한 shimmer 대신 낮은 강도 pulse 또는 점 3개 진행 표시로 사람 턴과 구분한다.
- 대기자는 opacity를 약간 낮추되 읽기 어렵게 만들지 않는다.

완료 기준:

- 텍스트를 읽지 않아도 현재 진행자 카드가 눈에 먼저 들어온다.
- pending actor가 active player보다 우선 강조된다.
- 봇 턴은 사람 턴과 시각적으로 구분된다.
- 색상 없이도 라벨/dot/ring 형태로 구분된다.

### 2. 보드 주변 진행 halo

대상:

- `.board-area`
- `.board-wrap`
- current focus player 색상 custom property

계획:

- `currentFocusPlayer`의 색을 CSS variable로 내려 `board-area` 주변에 얕은 halo를 표시한다.
- 내 차례 또는 내가 pending actor일 때 halo 강도를 조금 높인다.
- blocking 상태에서는 붉은 warning ring으로 대체한다.
- 전체 화면 dimming 대신 보드 주변 halo를 사용한다.
- 모바일에서는 halo 강도를 데스크톱보다 낮춰 보드 가독성을 해치지 않는다.

완료 기준:

- 모바일에서 플레이어 카드가 화면 밖에 있어도 현재 진행 상태를 보드 주변에서 확인할 수 있다.
- blocking 상태는 일반 턴 강조보다 먼저 보인다.
- 보드의 타일/도로/말 가독성을 해치지 않는다.

### 3. 액션 버튼 availability glow

대상:

- 주사위 버튼
- 건설/교환/개발 카드 버튼
- 턴 넘기기 버튼

계획:

- 지금 누를 수 있는 primary action에만 짧은 glow를 준다.
- 1차 primary action 기준:
  - 주사위를 굴리기 전: 주사위 버튼
  - 굴린 뒤 행동 가능: 턴 넘기기 버튼은 약하게, 선택된 건설/교환 버튼은 활성 테두리
  - pending 입력 중: 일반 액션 버튼 glow 없음
- pending action 중에는 모달 입력이 우선이므로 일반 액션 버튼 glow를 끈다.
- disabled 버튼은 현재처럼 reason/title을 유지하되 시각적으로 더 조용하게 둔다.

완료 기준:

- 내 차례에 다음으로 누를 가능성이 높은 버튼이 한눈에 보인다.
- pending 모달과 액션 버튼이 서로 다른 행동을 유도하지 않는다.
- 여러 버튼이 동시에 과하게 빛나지 않는다.

### 4. Pending actor marker

대상:

- 카드 버리기 대상자
- 도둑 이동 actor
- 약탈 대상 선택 actor

계획:

- pending actor의 카드에 `행동 필요` 라벨을 유지하되, 라벨 왼쪽에 작은 dot pulse를 추가한다.
- 여러 명이 discard 대상이면 가능한 범위에서 대상자 모두에게 marker를 표시한다.
- 단, 현재 public `pendingActionView`가 모든 discard 대상자의 seat 목록을 내려주지 않는 경우에는 1차에서 viewer 대상 여부와 남은 인원 수만 표시한다.
- 모든 discard 대상자 카드 표시가 꼭 필요하면 서버 public view 확장을 별도 작은 작업으로 분리한다.
- viewer가 pending actor이면 상단 dice panel에도 같은 pulse를 표시한다.

완료 기준:

- 7이 나왔을 때 대기 안내 모달 없이도 누가 행동해야 하는지 보인다.
- 내가 버릴 차례일 때만 카드 버리기 입력 모달이 뜬다.
- public state에 불필요한 비공개 정보가 추가되지 않는다.

### 5. 로그와 턴 전환 micro animation

대상:

- 새 로그 항목
- 턴이 바뀐 순간의 현재 진행자 카드

계획:

- 새 중요 로그는 1회 highlight flash 후 일반 강조 상태로 돌아간다.
- 턴 전환 시 새 `currentFocusPlayer` 카드에 짧은 pop-in 효과를 준다.
- 로그 필터 UI는 별도 후속으로 둔다.
- flash는 `background-color`와 `border-color` 중심으로 구현한다.
- `transform`, `height`, `padding`을 애니메이션하지 않는다.

완료 기준:

- 턴 전환과 중요 이벤트가 시각적으로 감지된다.
- 로그가 과하게 흔들리거나 레이아웃을 밀지 않는다.

## 1차 구현 권장 범위

이번 계획을 바로 구현할 때는 다음 순서로 제한한다.

1. 현재 진행자 카드 spotlight
2. 내 차례 또는 pending actor의 dice panel pulse
3. primary action button glow
4. `prefers-reduced-motion` fallback

다음 항목은 효과가 과해질 수 있으므로 1차 구현 후 화면을 보고 결정한다.

- 보드 halo
- 로그 flash
- 봇 shimmer
- 전체 화면 dimming

## 현재 즉시 반영한 정리

- 가이드 패널은 다시 한 문장 중심으로 축소한다.
- 7이 나왔을 때 내가 discard 대상자가 아니면 별도 대기 안내 모달을 띄우지 않는다.
- 실제로 카드를 버려야 하는 사람에게만 카드 버리기 선택 모달을 띄운다.
- pending action 모달의 장황한 `상황/해야 할 일/선택 조건/완료 후` 안내 블록은 제거한다.

## 제외 범위

- 게임 규칙 변경
- 서버 pending 처리 변경
- 새로운 봇 전략
- 로그 필터 UI 완성
- 대규모 보드 애니메이션 재작성

## 검증 계획

정적 검증:

```powershell
node --check script.js
node --check server.js
node --check scripts\stage-3-ux-improvement-static-test.js
node scripts\stage-3-ux-improvement-static-test.js
```

회귀 검증:

```powershell
node scripts\online-12-robber-seven-pending-ws-test.js
node scripts\bot-09-stabilization-regression-test.js
```

수동 확인:

- 7이 나왔을 때 discard 대상자가 아닌 viewer에게 대기 안내 모달이 뜨지 않는지 확인
- discard 대상자에게는 카드 버리기 선택 모달이 정상 표시되는지 확인
- 가이드 패널이 한 문장 중심으로 보이는지 확인
- 현재 진행자 카드 강조가 텍스트 없이도 구분되는지 확인
- `prefers-reduced-motion`에서 반복 애니메이션이 꺼지는지 확인
- 내 차례가 아닐 때 전체 화면이 과하게 어두워지지 않는지 확인
- active player 카드와 상단 상태가 같은 플레이어를 가리키는지 확인
- pending actor가 active player보다 우선 강조되는지 확인
- 320px/375px/780px에서 horizontal overflow가 없는지 확인

## 후속 작업

- 현재 계획의 visual effect를 CSS 중심으로 구현한다.
- `currentTurnUxState()`에서 board/player/action 영역에 필요한 data attribute를 더 정리한다.
- 모바일 320px/375px/780px screenshot으로 halo와 sticky 상태 표시가 과하지 않은지 확인한다.
