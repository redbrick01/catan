# 온라인 모드 5-2 테스트 계획

## 목적

온라인 방 나가기 최종 정책을 검증한다. 명시적 `leaveRoom`은 방 종료로 처리하고, 브라우저 새로고침/닫기/네트워크 끊김으로 발생하는 WebSocket close는 재접속 대기 상태로만 처리한다.

## 변경 파일

```text
server.js
script.js
styles.css
docs/plans/2026-05-26_online-05-2-final-leave-room-end-policy-plan.md
```

## 자동 테스트

```text
node --check server.js
node --check script.js
```

WebSocket 자동 테스트:

```text
1. lobby 상태에서 참가자가 leaveRoom command를 보내면 room.status=ended, endReason=player_left가 broadcast된다.
2. lobby 상태에서 방장이 leaveRoom command를 보내면 room.status=ended, endReason=host_left가 broadcast된다.
3. playing 상태에서 참가자가 leaveRoom command를 보내면 room.status=ended, endReason=player_left가 broadcast된다.
4. ended 방에 joinRoom을 보내면 ROOM_ENDED로 거절된다.
5. ended 방에 reconnect를 보내면 ROOM_ENDED로 거절된다.
6. ended 방에 startGame을 보내면 ROOM_ENDED로 거절된다.
7. ended 방에 미구현 게임 command를 보내면 ROOM_ENDED로 거절된다.
8. WebSocket close만 발생하면 room.status는 ended가 되지 않고 player.connected=false, player.left=false가 broadcast된다.
9. 끊긴 유저가 reconnect하면 player.connected=true, disconnectedAt=null이 broadcast된다.
```

## 브라우저 스모크 테스트

```text
1. http://127.0.0.1:4173/ 접속
2. 모드 선택 화면 표시 확인
3. 최근 방에 다시 참가 버튼 DOM이 생성되지 않는지 확인
4. 게임 화면 방 나가기 버튼 DOM 생성 확인
5. 온라인 접속 전에는 게임 화면 방 나가기 버튼이 숨겨져 있는지 확인
6. 오프라인 상태에서는 새 게임 버튼이 계속 표시되는지 확인
```

## 수동 테스트 필요 항목

```text
1. Chrome 3개 또는 실제 기기 3개로 온라인 방을 만든다.
2. 대기실/게임 화면에서 모든 온라인 유저에게 방 나가기 버튼이 보이는지 확인한다.
3. 온라인에서는 방장 포함 모든 유저에게 새 게임 버튼이 숨겨지는지 확인한다.
4. 방 나가기 클릭 시 확인 모달이 표시되는지 확인한다.
5. 확인 모달 문구가 "나가면 게임방이 종료되며 다시 참가할 수 없음"을 명확히 안내하는지 확인한다.
6. 확인 모달에서 취소를 누르면 방 상태, URL, localStorage가 변경되지 않는지 확인한다.
7. 확인 후 나가면 본인은 모드 선택 화면으로 이동하고 catanOnlineIdentity와 ?room이 삭제되는지 확인한다.
8. 남은 유저에게 게임방 종료 알림 모달이 표시되는지 확인한다.
9. 종료 알림 모달에 나가기 버튼만 있는지 확인한다.
10. 종료 알림 모달의 나가기 버튼을 누르면 localStorage identity와 ?room이 삭제되고 모드 선택 화면으로 이동하는지 확인한다.
11. 종료된 방의 기존 공유 URL로 다시 접근하면 참가 또는 재접속이 거절되는지 확인한다.
12. 브라우저 새로고침만으로는 방이 종료되지 않고 reconnect되는지 확인한다.
13. 참가자 창 닫기/네트워크 끊김 시 남은 유저에게 재접속 대기 모달이 표시되는지 확인한다.
14. 끊긴 유저가 같은 URL/identity로 돌아오면 재접속 대기 모달이 자동으로 닫히는지 확인한다.
15. 재접속 대기 모달의 방 나가기 버튼을 누르면 일반 방 나가기 확인 모달을 거쳐 방이 종료되는지 확인한다.
```

## 회귀 테스트

```text
1. 오프라인 새 게임 버튼은 기존처럼 resetToSetup을 실행한다.
2. 온라인 새 게임 버튼은 방장에게도 표시되지 않는다.
3. 온라인 새로고침 reconnect는 대기실/playing에서 기존처럼 동작한다.
4. WebSocket close와 leaveRoom command가 서버에서 분리되어 동작한다.
5. ended state에서도 private view state 필터링이 유지된다.
```

## 통과 기준

```text
명시적 leaveRoom은 항상 room.status=ended로 이어진다.
ended 방에는 아무도 다시 join/reconnect/startGame/game command를 성공시킬 수 없다.
최근 방 재참가 로직이 제거되어 자동/수동 재참가 버튼이 없다.
방 나가기 취소는 상태를 변경하지 않는다.
WebSocket close는 방 종료가 아니라 connected=false broadcast만 수행한다.
reconnect 성공 시 connected=true broadcast로 재접속 대기 모달을 닫을 수 있다.
오프라인 새 게임 동작은 유지된다.
```
