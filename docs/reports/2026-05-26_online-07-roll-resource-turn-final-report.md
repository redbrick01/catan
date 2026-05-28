# 온라인 모드 7단계 구현 보고서

## 작업명

온라인 주사위, 자원 지급, 턴 종료 서버 권위 command 구현

## 관련 문서

```text
docs/guides/development-process-guideline.md
docs/plans/2026-05-26_online-07-roll-resource-turn-plan.md
docs/tests/2026-05-26_online-07-roll-resource-turn-test-plan.md
```

## 변경 파일

```text
server.js
script.js
docs/plans/2026-05-26_online-07-roll-resource-turn-plan.md
docs/tests/2026-05-26_online-07-roll-resource-turn-test-plan.md
docs/reports/2026-05-26_online-07-roll-resource-turn-final-report.md
```

## 구현 요약

온라인 `play` phase에서 `rollDice`와 `endTurn`을 서버 권위 command로 구현했다. 주사위 값은 서버에서만 생성하고, 자원 지급과 턴 전환도 서버 `matchState`에만 반영한다. 클라이언트는 온라인 상태에서 로컬 `roll()`/`endTurn()`으로 직접 상태를 바꾸지 않고 command를 보낸 뒤 viewer별 state를 렌더링한다.

## 서버 반영

```text
1. play phase command 공통 검증 추가
   - room 존재
   - room.status=playing
   - ended 방 거절
   - playerId/playerToken 인증
   - left player 거절
   - connected=false 참가자 존재 시 ROOM_NOT_READY
   - matchState 존재
   - game.phase=play
   - 현재 active player만 허용
2. rollDice command 추가
   - crypto.randomInt로 die1/die2 생성
   - game.lastDice 저장
   - game.rolled=true 저장
   - 중복 rollDice는 ALREADY_ROLLED 거절
3. 자원 지급 구현
   - total과 같은 number token 타일만 생산
   - robberTile 제외
   - desert 제외
   - settlement 1장, city 2장
   - bank 차감, player.resources 증가
   - bank 음수 방지
4. 7 처리
   - lastDice/rolled만 기록
   - 이번 단계에서는 discard/robber pending 생성 없음
   - 자원 지급 없음
5. endTurn command 추가
   - rolled=true에서만 허용
   - active를 다음 seat로 이동
   - active가 0으로 돌아오면 round 증가
   - rolled=false
   - usedDevThisTurn=false
   - lastDice 유지
6. diceRolled/turnEnded ack와 viewer별 broadcast 처리
7. lastProduction은 viewer별로 본인 resource만 공개하고 상대 resource 상세는 숨김
```

## 클라이언트 반영

```text
1. diceRolled/turnEnded ack 처리 추가
2. 온라인 play phase helper 추가
   - isOnlinePlayPhase
   - isMyOnlineTurn
   - canRollOnlineDice
   - canEndOnlineTurn
   - rollOnlineDice
   - endOnlineTurn
3. 온라인 play phase에서 rollButton 클릭은 rollDice command 전송
4. 온라인 play phase에서 endTurnButton 클릭은 endTurn command 전송
5. 오프라인 상태에서는 기존 roll()/endTurn() 유지
6. 내 차례/rolled/재접속 대기/ended 상태에 따라 버튼 활성화
7. 서버 거절 메시지를 addLog로 표시
8. render()에서 서버 lastDice가 주사위 UI에 반영되도록 renderDice 호출
9. guide 문구에 온라인 play phase의 내 차례/상대 차례/주사위 후 상태 표시
```

## 테스트 결과

정적 검사:

```text
node --check server.js
결과: 통과

node --check script.js
결과: 통과
```

WebSocket 자동 테스트:

```text
결과: 통과

검증 항목:
- 3인 초기 배치 완료 후 play fixture 생성
- 현재 차례 rollDice 성공
- 차례가 아닌 플레이어 rollDice 거절
- 중복 rollDice 거절
- rollDice 후 lastDice/rolled 저장
- rollDice 후 자원 지급
- 7이 나오면 자원 지급 없음
- 상대 자원 상세 미노출
- rolled=false에서 endTurn 거절
- 현재 차례 endTurn 성공
- endTurn 후 active/round/rolled 동기화
- connected=false 유저가 있으면 rollDice 거절
- ended 방에서 rollDice/endTurn 거절
```

브라우저 스모크 테스트:

```text
결과: 통과

검증 URL:
http://127.0.0.1:4173/

검증 항목:
- 페이지 로드
- rollButton/endTurnButton DOM 존재
- dice DOM 존재
- board DOM 존재
```

## 통과한 항목

```text
서버 주사위 생성
서버 자원 지급
robberTile 생산 제외
bank 음수 방지
7 자원 지급 없음
active player roll/endTurn 제한
중복 rollDice 거절
rolled=false endTurn 거절
active/round/rolled 동기화
viewer별 matchState broadcast
상대 resources 상세 미노출
온라인 로컬 roll/endTurn 직접 상태 변경 방지
재접속 대기/ended 상태 command 거절
오프라인 모드 유지
```

## 수행하지 못한 항목

```text
실제 Chrome 3개 또는 실제 기기 3개로 버튼 활성화와 주사위 표시를 수동 검증하지 못했다.
실제 브라우저에서 자원 패널이 본인 상세/상대 총량 기준으로 보이는지 시각 검증하지 못했다.
새로고침 후 lastDice/active/rolled UI 복구는 WebSocket state 기준으로만 검증했고 수동 브라우저 검증이 필요하다.
```

## 남은 위험

```text
7 처리의 discard/robber 흐름은 아직 구현하지 않았으므로 현재는 7 이후에도 턴 종료가 가능하다.
play phase 일반 건설/교환/개발 카드 command는 아직 서버 권위로 구현되지 않았다.
bank 부족 시 부분 지급 정책으로 구현되어 있어, 공식 보드게임의 "해당 자원 전체 부족 시 아무도 받지 않음" 정책과 다를 수 있다.
```

## 후속 작업

```text
1. 실제 다중 브라우저에서 roll/endTurn 버튼 활성화와 UI 표시를 검증한다.
2. 8단계에서 일반 도로/마을/도시 건설 command와 비용 차감을 구현한다.
3. 이후 7/강도/버리기 처리를 별도 단계에서 서버 권위로 구현한다.
4. bank 부족 정책을 공식 규칙 기준으로 확정할지 검토한다.
```

## 최종 판단

완료
