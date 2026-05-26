# 온라인 모드 7단계 테스트 계획

## 목적

온라인 `play` phase에서 주사위 굴림, 자원 지급, 턴 종료가 서버 권위 command로만 처리되는지 검증한다. 클라이언트는 주사위 값을 확정하지 않고 서버 state를 렌더링해야 한다.

## 변경 파일

```text
server.js
script.js
docs/implementation_plans/2026-05-26_online-07-roll-resource-turn-plan.md
```

## 자동 테스트

```text
node --check server.js
node --check script.js
```

WebSocket 자동 테스트:

```text
1. 3인 방을 생성하고 초기 배치를 완료해 phase=play fixture를 만든다.
2. rolled=false 상태에서 endTurn이 ROLL_REQUIRED로 거절되는지 확인한다.
3. active player가 아닌 유저의 rollDice가 NOT_YOUR_TURN으로 거절되는지 확인한다.
4. active player의 rollDice가 성공하고 lastDice/rolled=true가 저장되는지 확인한다.
5. rollDice 후 자원이 지급되는지 확인한다.
6. 상대 플레이어 resources 상세가 viewer state에 노출되지 않는지 확인한다.
7. 중복 rollDice가 ALREADY_ROLLED로 거절되는지 확인한다.
8. active player의 endTurn이 성공하고 active/rolled/round가 동기화되는지 확인한다.
9. testTotal=7 rollDice에서는 자원 지급이 없는지 확인한다.
10. active가 0으로 돌아오면 round가 증가하는지 확인한다.
11. connected=false 유저가 있으면 rollDice가 ROOM_NOT_READY로 거절되는지 확인한다.
12. ended 방에서 rollDice/endTurn이 ROOM_ENDED로 거절되는지 확인한다.
```

## 브라우저 스모크 테스트

```text
1. http://127.0.0.1:4173/ 접속
2. 페이지 로드 확인
3. rollButton/endTurnButton DOM 존재 확인
4. dice DOM 존재 확인
5. board DOM 존재 확인
```

## 수동 테스트 필요 항목

```text
1. Chrome 3개 또는 실제 기기 3개로 온라인 방을 만든다.
2. 초기 배치를 완료해 play phase로 진입한다.
3. 현재 차례 플레이어에게만 주사위 버튼이 활성화되는지 확인한다.
4. 내 차례가 아닌 브라우저에서 주사위/턴 넘기기가 비활성화되는지 확인한다.
5. 주사위 결과가 모든 브라우저에 동일하게 표시되는지 확인한다.
6. 자원 변화가 본인 상세/상대 총량 기준으로 표시되는지 확인한다.
7. 주사위를 굴린 뒤 현재 차례 플레이어에게만 턴 넘기기 버튼이 활성화되는지 확인한다.
8. 턴 넘기기 후 다음 플레이어에게 주사위 버튼이 넘어가는지 확인한다.
9. 새로고침 후 lastDice, active, rolled 상태가 유지되는지 확인한다.
10. 참가자 연결 종료 시 재접속 대기 모달이 뜨고 roll/endTurn이 불가능한지 확인한다.
11. 참가자 재접속 후 roll/endTurn이 다시 가능한지 확인한다.
12. 방 나가기 후 ended 상태에서는 roll/endTurn이 불가능한지 확인한다.
```

## 회귀 테스트

```text
1. 오프라인 roll/endTurn은 기존 로컬 흐름으로 동작한다.
2. 온라인 초기 배치 command는 계속 동작한다.
3. 온라인 일반 건설/교환/개발 카드 조작은 아직 로컬 상태를 바꾸지 않는다.
4. private view state 필터링이 유지된다.
5. 5-2 재접속 대기/ended 정책이 유지된다.
```

## 통과 기준

```text
주사위 값은 서버에서만 생성된다.
rollDice/endTurn은 active player만 실행할 수 있다.
중복 rollDice와 rolled=false endTurn은 거절된다.
자원 지급은 서버 state에만 반영된다.
7은 이번 단계에서 자원 지급 없이 rolled=true로 기록된다.
endTurn 후 active/round/rolled/usedDevThisTurn이 동기화된다.
상대 자원 상세가 노출되지 않는다.
재접속 대기/ended/left/인증 실패 상태에서 command가 거절된다.
오프라인 모드는 기존처럼 유지된다.
```
