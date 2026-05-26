# Bot 05 7/강도/pending action 처리 최종 보고서

작성일: 2026-05-26

## 1. 관련 문서

- `docs/implementation_plans/2026-05-26_bot-02-turn-runner-plan.md`
- `docs/implementation_plans/2026-05-26_bot-04-basic-actions-plan.md`
- `docs/implementation_plans/2026-05-26_bot-05-robber-seven-pending-plan.md`
- `catan_bot_development_process_guideline.md`
- `catan_playbot_reference_guideline.md`

## 2. 목표

7이 나오거나 기사 카드 등으로 강도 흐름이 시작됐을 때, 봇이 필요한 pending 응답을 자동 처리해 게임이 멈추지 않게 한다.

지원 pending 응답:

- `discardForSeven`
- `moveRobber`
- `chooseRobberVictim`

봇은 사람 pending을 대신 처리하지 않고, 모든 응답은 기존 사람 command와 같은 서버 검증 경로를 통과한다.

## 3. 변경 파일

- `server.js`

UI 변경은 bot-05 범위에서 추가하지 않았다. 기존 pending modal/view는 state broadcast에 따라 갱신된다.

## 4. 구현 요약

### 4.1 Pending 우선 처리

bot runner는 일반 턴 행동보다 pending action을 먼저 확인한다.

`detectBotPendingAction(room, botPlayer)`는 현재 pending 상태를 다음 정보로 분류한다.

```text
kind: none | discardForSeven | moveRobber | chooseRobberVictim | wait
role: actor | discarder | waiting
pendingId
seatIndex
needed
victimSeatIndexes
reason
```

처리 우선순위:

1. 봇이 discard 대상이면 `discardForSeven`
2. discard pending이 남아 있으면 robber move 금지
3. 봇이 robber move actor이면 `moveRobber`
4. 최신 state에서 봇이 victim choice actor이고 후보가 2명 이상이면 `chooseRobberVictim`
5. pending이 봇과 관련 없으면 대기

### 4.2 Pending Signature

중복 실행을 막기 위해 pending signature를 둔다.

```text
discardForSeven: pendingId + seatIndex + needed
moveRobber: pendingId + actorSeatIndex + fromTileId
chooseRobberVictim: pendingId + actorSeatIndex + tileId + victimSeatIndexes.join(",")
```

runner 내부 상태:

- `completedPendingSignatures`
- `failedPendingSignatures`

정책:

- 성공한 signature는 같은 pending에서 재실행하지 않는다.
- validation 실패 signature는 fallback 1회만 허용한다.
- fallback도 실패하면 일반 행동이나 `endTurn`으로 넘어가지 않고 대기한다.
- 같은 signature가 2회 실패하면 runner는 해당 pending을 더 진행하지 않는다.

실패 진단:

- pending command 실패 시 command 이름과 서버 에러 메시지를 `console.warn`으로 남긴다.
- discard 자원 선택 불가, robber tile 후보 없음 같은 후보 없음 상태도 `console.warn`으로 남긴다.
- `completedPendingSignatures`와 `failedPendingSignatures`는 room runner 내부 상태로 유지된다. 현재는 room lifecycle 동안 누적되며, 장시간 게임에서 오래된 signature cleanup이 필요한지는 후속 안정화 항목으로 남긴다.

### 4.3 discardForSeven

`chooseBotDiscardResources(matchState, seatIndex, needed)`를 추가했다.

조건:

- `pendingAction.type === "discardForSeven"`
- `pendingAction.discards`에 봇 `seatIndex` entry 존재
- `entry.discarded === false`
- `entry.needed >= 1`
- 봇 현재 자원 총량이 `entry.needed` 이상

선택 기준:

- 정확히 `needed` 수량만 버림
- 보유량 초과 금지
- 음수/소수/알 수 없는 자원 금지
- 가장 많이 가진 자원부터 버림
- 기본 목표 가중치 기반으로 중요한 자원 보존
- 도시/개발 카드 쪽 가치가 높은 `field`, `mountain` 보존 가중
- 정착지/도로에 필요한 `forest`, `hill`, `pasture`, `field` 보존 가중
- deterministic tie-break

현재 구현은 매 discard 시점에 동적으로 “이번 턴의 확정 목표”를 계산한다기보다, 도시/정착지/도로/개발 카드의 기본 비용 중요도를 반영한 고정 preserve 가중치로 버릴 자원을 고른다.

discard command 성공 후 기존 discard state를 재사용하지 않고 최신 state를 다시 읽는다. 마지막 discard 대상이었다면 서버가 `moveRobber` pending으로 전환할 수 있기 때문이다.

### 4.4 moveRobber

`scoreRobberTileForBot`와 `chooseBotRobberTile`을 추가했다.

조건:

- 모든 discard 대상자 완료
- `pendingAction.type === "moveRobber"`
- `pendingAction.actorSeatIndex === bot.seatIndex`
- 선택 tile 존재
- 선택 tile이 현재 robberTile과 다름

평가 기준:

- 내 건물이 붙은 타일 감점
- 상대 건물이 붙은 타일 가산
- 6/8 타일 가산
- 현재 1등 또는 나보다 앞선 플레이어의 타일 가산
- desert/no production 감점
- current robberTile 제외

사용 정보:

- 타일 번호/자원/강도 위치
- 타일 인접 vertex owner/city
- 공개 점수
- 공개 기사 수
- 공개 건물 수
- 상대 `resourceCount`

서버 내부 구현에서는 상대 플레이어 객체의 resources를 읽어 총량을 계산하지만, 자원 종류별 구성은 점수화에 사용하지 않는다. 사용되는 값은 공개 정보인 `resourceCount`와 동치인 총 보유 장수다.

사용하지 않는 정보:

- 상대의 정확한 손패 자원 종류
- 상대의 숨은 개발 카드 종류
- 훔칠 자원을 미리 아는 정보
- 서버 내부 random 결과

fallback:

- 현재 robberTile이 아닌 합법 타일 중 가장 낮은 tileId

### 4.5 chooseRobberVictim

`chooseBotRobberVictim`을 추가했다.

moveRobber와 victim 선택은 분리 실행된다. moveRobber 성공 후 최신 state를 다시 읽고 별도 runner step에서 판단한다.

victim command를 보내지 않는 경우:

- 피해자 후보 0명
- 피해자 후보 1명
- `pendingAction.type`이 `chooseRobberVictim`이 아님
- `actorSeatIndex`가 봇이 아님

피해자 0명/1명은 서버 자동 처리 경로를 따른다.

victim command를 보내는 조건:

- `pendingAction.type === "chooseRobberVictim"`
- `pendingAction.actorSeatIndex === bot.seatIndex`
- victim 후보 2명 이상
- selected `victimSeatIndex`가 `pendingAction.victimSeatIndexes`에 포함
- victim `resourceCount > 0`

선택 기준:

- 현재 점수가 가장 높은 플레이어
- 봇보다 앞선 플레이어
- `resourceCount`가 가장 많은 플레이어
- 기사 수/최장 교역로 등 공개 보너스 경쟁자
- 동점이면 낮은 `seatIndex`

상대의 정확한 자원 종류는 사용하지 않는다.

## 5. Command 실행 경로

봇 pending 응답은 모두 `runBotCommand`를 통해 기존 command handler로 실행된다.

사용 command:

- `discardForSeven`
- `moveRobber`
- `chooseRobberVictim`

따라서 다음 검증은 사람 command와 같은 경로를 통과한다.

- pendingAction type
- actor/discarder 권한
- discard 수량
- robber same tile 금지
- victim 후보 검증
- pending 종료/전환
- `lastRobberResult` privacy view

## 6. 제외 범위 준수

bot-05에서는 다음을 구현하지 않았다.

- 기사 카드 사용 시점 판단
- 개발 카드 사용 구현
- 고급 강도 전략
- 상대 손패 정밀 추정
- 사람 pending 대리 처리
- 플레이어 거래 응답
- UI/로그 고도화
- MCTS/RL

기사 카드 사용 시점은 bot-06 범위로 남겼고, bot-05는 기사로 이미 생성된 robber pending 흐름만 처리한다.

## 7. 공정성 및 비공개 정보

봇 판단은 공개 상태와 봇 자신의 손패만 사용한다.

전역 로그/상대 view에 노출하지 않는 정보:

- 훔친 자원 종류
- 봇 판단 점수/후보 목록
- 상대 정확한 자원 종류
- 상대 숨은 개발 카드 종류

`makeRobberResultView`는 actor와 victim에게만 훔친 자원 종류를 보여주고, 다른 viewer에게는 `resource: null`을 반환한다.

## 8. 안정성 설계 반영

### 8.1 discard 완료 전 robber move 금지

`detectBotPendingAction`은 discard pending이 남아 있으면 `moveRobber`를 실행하지 않는다.

### 8.2 최신 state 기준 분리 실행

moveRobber 후 victim 선택은 같은 오래된 state로 이어 붙이지 않는다. 성공 후 broadcast/revision을 거친 최신 state의 `pendingAction`을 기준으로 별도 runner step에서 판단한다.

### 8.3 실패 확산 방지

pending command 실패 후 bot-04 일반 행동이나 `endTurn` fallback으로 넘어가지 않는다.

### 8.4 public state 보호

다음 내부 정보는 public state에 노출하지 않는다.

- `completedPendingSignatures`
- `failedPendingSignatures`
- pending evaluation score
- candidate list
- runner timer/runId

## 9. 검증 결과

bot-09 안정화 단계에서 bot-05 게이트를 다시 검증했다.

통과한 명령:

```powershell
node --check server.js
node --check script.js
Get-ChildItem -Path scripts -Filter *.js | ForEach-Object { node --check $_.FullName }
node scripts\online-12-robber-seven-pending-ws-test.js
node scripts\bot-09-stabilization-regression-test.js
```

기존 WebSocket 회귀에서 확인:

- forced dice 7로 discard pending 생성
- 잘못된 discard 수량 거절
- discard 완료 후 `moveRobber` pending 전환
- pending 중 `endTurn` 거절
- current robberTile과 같은 tile 이동 거절
- 피해자 0명: `NO_VICTIM` 결과
- 피해자 1명: victim command 없이 자동 steal/종료
- 피해자 2명 이상: `chooseRobberVictim` pending 생성 및 command 처리
- actor/victim 외 viewer에게 훔친 resource 미노출
- knight로 시작된 robber flow에서 `moveRobber` pending 처리 가능

bot-09 통합 테스트에서 확인:

- 봇 `discardForSeven` 자동 처리
- pending/dev privacy gate 통과
- public state에 pending signature/internal runner state 미노출
- 서버 fatal-looking stderr 없음

구체적인 bot-09 확인 근거:

- `testPendingAndDevCards()`에서 봇 seat 1에 forest 8장을 주고, 사람이 `rollDice({ testTotal: 7 })`을 실행해 `discardForSeven` pending을 만든다.
- `waitFor(..., "bot discard for seven")`가 `pendingActionView.type !== "discardForSeven"`이 될 때까지 기다린다.
- discard pending이 남아 있으면 `bot discardForSeven was left unresolved`로 실패 처리한다.
- `assertNoPublicLeak(host.state, "state after bot pending action")`로 pending signature/internal runner state가 public state에 노출되지 않는지 확인한다.

직접 검증되지 않은 항목:

- 봇이 robber actor인 `moveRobber` 자동 실행을 별도 fixture로 직접 assert하지는 않았다.
- 봇이 robber actor이고 피해자 후보가 2명 이상인 상황에서 `chooseRobberVictim`을 자동 실행하는 bot-05 전용 assertion은 아직 없다.
- 실패 signature가 2회 누적된 뒤 일반 행동/`endTurn`으로 넘어가지 않는지를 command count로 직접 세는 테스트는 아직 없다.
- 피해자 0명/1명/2명 이상 흐름과 privacy는 기존 `online-12-robber-seven-pending-ws-test.js`에서 사람 actor command 기준으로 강하게 검증했다.

## 10. 비공개 정보 점검

노출 금지 항목:

- 훔친 자원 종류를 허용되지 않은 viewer에게 노출
- 상대의 정확한 손패 자원 종류
- 상대의 숨은 개발 카드 종류
- 봇 평가 점수
- pending candidate list
- `completedPendingSignatures`
- `failedPendingSignatures`

결과: `online-12`와 bot-09 public state smoke에서 노출 없음.

## 11. 남은 위험

- 강도 타일/피해자 선택은 기본 heuristic 수준이다.
- 봇 actor의 `moveRobber`/`chooseRobberVictim` 자동 실행을 직접 검증하는 bot-05 전용 fixture는 아직 없다.
- 실패 signature 2회 누적 후 일반 행동/`endTurn`으로 번지지 않는지 command count로 세는 테스트는 아직 없다.
- `completedPendingSignatures`/`failedPendingSignatures`는 room lifecycle 동안 누적되며, 장시간 게임에서 cleanup이 필요한지는 후속 검토 대상이다.
- 여러 봇과 사람이 동시에 discard 대상인 복합 상황은 WebSocket fixture로 핵심 흐름을 확인했지만, 장시간 랜덤 게임 soak test는 수행하지 않았다.
- 브라우저 pending modal의 모든 조합 시각 검증은 bot-09에서 자동화 제한으로 부분 수행이다.

## 12. 최종 판정

완료.

bot-05의 핵심 계약인 “봇이 `discardForSeven`, `moveRobber`, `chooseRobberVictim` pending을 기존 command 검증 경로로 처리하고, 피해자 0/1명 자동 경로와 비공개 정보 정책을 지키며, pending 실패가 일반 턴 행동으로 번지지 않게 한다”는 구현 및 통합 회귀 검증을 통과했다.

## 13. 피드백 반영 내역

이전 보고서 피드백을 다음처럼 반영했다.

- discard 자원 보존 설명을 “현재 목표 동적 판단”이 아니라 “기본 목표 가중치 기반 preserve map”으로 정정했다.
- robber tile 평가에서 상대 자원 종류가 아니라 공개 `resourceCount`와 동치인 총량만 사용한다는 점을 공정성 섹션에 명시했다.
- pending 실패 시 `console.warn` 진단, 2회 실패 후 대기, signature set/map 누적과 cleanup 후속 검토를 안정성 섹션과 남은 위험에 반영했다.
- bot-09의 `testPendingAndDevCards()`가 직접 확인한 것은 봇 `discardForSeven` 자동 처리임을 검증 섹션에 구체적으로 연결했다.
- 봇 actor `moveRobber`/`chooseRobberVictim` 자동 실행과 실패 signature command count 검증은 아직 직접 fixture가 없다는 점을 명시했다.
