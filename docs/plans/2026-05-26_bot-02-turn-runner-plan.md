# 봇 02 턴 실행기 계획

작성일: 2026-05-26

## 목적

현재 행동해야 하는 플레이어가 봇일 때 서버가 자동으로 봇 행동을 실행하는 기반을 만든다. 이 단계의 핵심은 봇 판단의 똑똑함이 아니라 중복 실행과 멈춤을 막는 안정적인 runner다.

## 관련 문서

```text
docs/plans/2026-05-26_bot-00-basic-bot-roadmap.md
docs/plans/2026-05-26_bot-mode-considerations.md
docs/plans/2026-05-26_online-03-protocol-sync-plan.md
docs/plans/2026-05-26_online-07-roll-resource-turn-plan.md
```

## 범위

포함:

```text
봇 actor 감지
room 단위 bot runner 예약
runBotCommand 내부 실행 경로
중복 실행 방지
예약 취소/유효성 검사
봇 일반 턴의 최소 fallback: 주사위 굴림 후 턴 종료
봇 runner가 setup/pending actor를 감지하되, 이 단계에서는 setup/pending 자동 처리는 수행하지 않음
```

제외:

```text
고급 건설 판단
초기 배치 평가
7/강도 세부 판단
개발 카드 사용
거래 응답
```

## 설계

### 내부 command 경로

```text
runBotCommand(room, botPlayer, payload)
-> botPlayer.isBot 확인
-> room/status/player context 구성
-> 기존 command 검증/상태 변경 함수 호출
-> 상태 변경 성공 시 broadcast
```

봇은 WebSocket 인증과 requestId 응답은 생략하지만, 턴/자원/위치/phase 검증은 사람과 같은 경로를 통과해야 한다.

권장 분리:

```text
handleClientCommand(...)
-> 인증/요청 응답 처리
-> applyRoomCommand(context, payload)

runBotCommand(...)
-> 봇 context 구성
-> applyRoomCommand(context, payload)
```

`applyRoomCommand`는 사람/봇 공통 규칙 검증과 상태 변경만 담당한다.

broadcast 책임은 한 곳으로 통일한다.

```text
권장: applyRoomCommand는 상태 변경 결과만 반환하고, handleClientCommand/runBotCommand가 broadcast를 호출한다.
금지: applyRoomCommand와 runBotCommand가 둘 다 broadcast를 호출해 같은 상태를 중복 전송하는 구조.
```

scheduleBotRunner는 broadcast 함수 내부에서 직접 여러 번 호출하기보다, 상태 변경 후 한 번만 호출되는 단일 hook으로 둔다.

### runner 예약 정보

```js
{
  active: true,
  timerId,
  runId,
  step,
  revision,
  roomStatus,
  gamePhase,
  actorSeatIndex,
  pendingKind,
  commandInFlight
}
```

실행 직전에 위 값이 현재 상태와 맞는지 확인한다.

`step`은 같은 봇 턴 안의 진행 단계를 구분한다.

```text
detect: actor 확인
roll: 주사위 굴림
afterRoll: pending 여부 확인
endTurn: 턴 종료
```

`revision`은 오래된 예약을 찾는 기준으로 쓰되, 봇이 직전에 실행한 command로 증가한 revision은 다음 step 예약에서 새 값으로 갱신한다.

### 취소 조건

```text
방 종료
새 게임
room.status 변경
예약 이후 다른 actor/action이 상태를 변경한 revision 불일치
pending kind 변경
현재 actor 변경
봇 제거
서버 오류
```

revision 불일치는 무조건 취소가 아니라 다음 기준으로 판단한다.

```text
예약된 step 실행 전에 revision이 달라졌고, 그 변경이 현재 runId의 직전 command 결과가 아니면 취소한다.
현재 runId의 직전 command 결과라면 새 revision으로 다음 step을 다시 예약한다.
```

## 구현 순서

```text
1. isBotPlayer helper 추가
2. getCurrentActor helper 추가
3. scheduleBotRunner(room) 추가
4. cancelBotRunner(room) 추가
5. runBotCommand(room, botPlayer, payload) 추가
6. runner runId/step/revision 유효성 검사 추가
7. broadcast 후 scheduleBotRunner 호출 지점 연결
8. 봇 일반 턴 fallback 구현: rollDice 가능하면 rollDice, pending이 없으면 endTurn
9. NODE_ENV=test에서 bot delay를 0 또는 짧은 값으로 처리
10. 테스트 종료/서버 종료 시 timer 정리 helper 추가
```

## 수정 대상 파일

```text
server.js
- command handler 공통화
- room별 bot runner 상태 저장
- broadcast 후 봇 예약 연결
- endRoom/newGame/leaveRoom 시 runner 취소
- test mode delay 처리

scripts/
- 봇 자동 턴 WebSocket 테스트 추가
```

## runner 상태 계약

room에 다음 내부 상태를 둘 수 있다. 이 값은 public state로 보내지 않는다.

```js
room.botRunner = {
  timerId: null,
  running: false,
  runId: null,
  step: null,
  scheduledRevision: 0,
  scheduledActorSeatIndex: null,
  scheduledPhase: null,
  scheduledPendingKind: null,
  scheduledRoomStatus: null,
  commandInFlight: false,
  lastCommandRevision: null
};
```

실행 직전 검증:

```text
room이 여전히 존재한다.
room.status가 playing이다.
revision이 예약 시점과 맞거나 허용 가능한 최신 상태다.
현재 actor가 예약된 봇과 같다.
pending kind가 예약 시점과 다르면 취소한다.
```

public state에는 `botRunner`를 절대 포함하지 않는다.

runner 상태 갱신 규칙:

```text
schedule 시 기존 timer가 있으면 clearTimeout 후 새 timer로 교체한다.
commandInFlight가 true이면 새 command를 예약하지 않는다.
runBotCommand 시작 직전에 commandInFlight를 true로 바꾼다.
command 성공/실패 후 finally에서 commandInFlight를 false로 되돌린다.
command 성공으로 revision이 증가하면 lastCommandRevision에 기록한다.
room 삭제/종료 시 timerId를 clear하고 botRunner를 초기화한다.
```

## actor 감지 범위

이 단계의 runner는 actor 감지만 넓게 수행하고, 자동 처리는 play phase의 일반 턴 fallback으로 제한한다.

```text
setupIndex가 봇: 감지만 하고 bot-03에서 처리
active가 봇 + play phase + pending 없음: rollDice/endTurn 처리
pending actor가 봇: 감지만 하고 bot-05 이후에서 처리
trade responder가 봇: 감지만 하고 bot-07에서 처리
```

감지만 하는 경우 runner는 command를 실행하지 않고 로그 수준의 trace만 남기거나 조용히 반환한다. 이 덕분에 2단계가 setup/pending 기능 범위를 침범하지 않는다.

중요한 경계:

```text
bot-02만 구현된 상태에서 게임이 setup phase의 봇 차례에 멈추는 것은 실패가 아니다.
setup 자동 배치는 bot-03 완료 기준이다.
pending 자동 처리는 bot-05 이후 완료 기준이다.
```

따라서 bot-02 테스트는 가능하면 fixture로 play phase에서 봇 active 상태를 만들거나, setup을 사람/테스트 fixture로 통과시킨 뒤 검증한다.

## 상세 구현 체크리스트

```text
[ ] 봇 actor 탐색이 setupIndex, active, pending actor를 모두 고려한다.
[ ] 이 단계에서는 setup/pending actor를 감지하되 command를 실행하지 않는다.
[ ] 일반 턴 실행 전 pending action이 있으면 endTurn을 시도하지 않는다.
[ ] runner 내부 예외는 잡고 serverNotice 또는 log만 남긴다.
[ ] runner 실패 fallback으로 가능한 경우에만 endTurn을 시도한다.
[ ] 같은 broadcast cycle에서 runner가 두 번 예약되지 않는다.
[ ] 상태 변경 후 runner 예약 hook은 한 곳에서만 호출된다.
[ ] 테스트 종료 후 timer를 정리할 수 있다.
[ ] runBotCommand가 사람 command의 인증/응답 로직은 우회하되 규칙 검증은 공유한다.
[ ] commandInFlight 중에는 같은 room에서 새 bot command를 실행하지 않는다.
[ ] runBotCommand의 finally에서 commandInFlight를 반드시 false로 되돌린다.
[ ] room 종료/삭제 시 timerId를 clear한다.
[ ] bot-02 테스트는 setup 자동 배치를 완료 기준으로 삼지 않는다.
```

## 기본 동작

```text
사람이 턴 종료
-> 서버가 state broadcast
-> 다음 active가 봇인지 확인
-> 봇이면 runner 예약
-> 유효성 확인
-> rollDice
-> state broadcast
-> pending이 없으면 endTurn
-> state broadcast
-> 다음 actor 확인
```

rollDice 결과 7 또는 다른 pending이 생기면 이 단계에서는 endTurn을 실행하지 않는다. 해당 처리는 bot-05 계획에서 구현한다.

## 검증 계획

자동:

```text
봇 차례가 되면 rollDice가 자동 실행된다.
봇은 endTurn까지 자동 실행한다.
봇 2명이 연속이어도 순서대로 진행된다.
runner가 중복 예약되어도 command가 중복 적용되지 않는다.
revision이 바뀐 오래된 runner는 실행되지 않는다.
room.status가 finished이면 runner가 실행되지 않는다.
rollDice 후 pending이 생기면 endTurn을 시도하지 않는다.
setup phase에서 봇 actor를 감지해도 이 단계에서는 build command를 실행하지 않는다.
commandInFlight 상태에서 두 번째 bot command가 실행되지 않는다.
```

수동:

```text
사람 1 + 봇 2 게임에서 사람 턴 종료 후 봇 턴들이 자동으로 지나간다.
서버 콘솔에 치명 오류가 없다.
브라우저 상태가 모든 클라이언트에서 같은 active player를 표시한다.
```

수동 검증에서 setup 자동 배치가 아직 구현되지 않았다면, fixture 또는 기존 테스트 helper로 play phase 상태를 만든 뒤 확인한다.

## 위험 요소

```text
state broadcast마다 runner가 중복 예약될 수 있다.
applyRoomCommand/runBotCommand/broadcast가 각각 broadcast 또는 schedule을 호출해 중복 예약될 수 있다.
봇의 rollDice와 endTurn 사이에 pending action이 생기면 단순 endTurn이 실패할 수 있다.
테스트에서 타이머가 남아 다음 테스트에 영향을 줄 수 있다.
revision 변경을 무조건 취소하면 봇의 순차 command가 이어지지 않을 수 있다.
setup/pending actor 감지와 실제 처리 범위가 섞이면 3단계/5단계 책임이 흐려질 수 있다.
commandInFlight가 예외 상황에서 true로 남아 이후 봇이 영구 정지할 수 있다.
bot-02만 구현된 상태에서 setup phase 정지를 실패로 오판할 수 있다.
```

## 롤백/복구 방법

```text
scheduleBotRunner 호출만 끄면 봇은 로비에 남아도 자동 행동하지 않는다.
runBotCommand 공통화가 문제를 만들면 사람 command 경로는 기존 handler로 유지한다.
runner 상태는 public state와 분리해 제거 가능하게 둔다.
중복 broadcast 문제가 생기면 schedule hook을 제거하고 명시적인 command 성공 지점 한 곳에서만 예약한다.
```

## 테스트 산출물

```text
docs/tests/2026-05-26_bot-02-turn-runner-test-plan.md
docs/reports/2026-05-26_bot-02-turn-runner-final-report.md
```

## 완료 기준

```text
봇이 일반 play phase에서 최소한 주사위 굴림과 턴 종료를 자동 처리한다.
중복 runner로 인한 이중 주사위/이중 턴 종료가 발생하지 않는다.
오래된 예약은 안전하게 취소된다.
rollDice 후 pending이 생긴 경우 무리하게 endTurn하지 않는다.
setup/pending 자동 처리는 후속 단계로 명확히 남겨둔다.
timer와 commandInFlight가 예외 후에도 정리된다.
broadcast/schedule 호출 책임이 중복되지 않는다.
```
