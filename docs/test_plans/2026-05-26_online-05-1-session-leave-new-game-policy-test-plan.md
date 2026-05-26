# 온라인 모드 5-1 테스트 계획

## 목적

온라인 세션의 명시적 방 나가기, 새 게임 버튼 노출 정책, 최근 방 수동 재참가, 게임 중 이탈 종료 정책이 의도대로 동작하는지 검증한다.

## 자동 테스트

```text
node --check server.js
node --check script.js
```

WebSocket 자동 테스트:

```text
1. 대기실 참가자가 leaveRoom command를 보내면 남은 참가자에게 players 목록 1명 상태가 broadcast된다.
2. WebSocket close만 발생하면 playing 방은 ended가 되지 않고 해당 player.connected=false, left=false로 남는다.
3. 3명 playing 방에서 일반 참가자가 leaveRoom 하면 남은 인원이 2명이 되어 room.status=ended, endReason=not_enough_players가 된다.
4. 명시적으로 나간 플레이어가 같은 token으로 reconnect하면 PLAYER_LEFT 에러가 반환된다.
5. ended 상태에서 startGame command는 ROOM_ENDED로 거절된다.
6. playing 방에서 방장이 leaveRoom 하면 room.status=ended, endReason=host_left가 남은 참가자에게 broadcast된다.
```

## 브라우저 스모크 테스트

```text
1. http://127.0.0.1:4173/ 로 접속한다.
2. 모드 선택 화면이 표시되는지 확인한다.
3. 동적으로 추가한 최근 방에 다시 참가 버튼이 존재하고 최근 방 정보가 없을 때 숨겨져 있는지 확인한다.
4. 동적으로 추가한 게임 화면 방 나가기 버튼이 존재하고 온라인 게임 전에는 숨겨져 있는지 확인한다.
```

## 수동 테스트 필요 항목

```text
1. Chrome 3개 또는 실제 기기 3개로 온라인 방을 만든다.
2. 대기실에서는 기존 방 나가기 버튼이 모든 유저에게 보이는지 확인한다.
3. 게임 시작 후 방장에게만 새 게임 버튼이 보이고, 참가자에게는 숨겨지는지 확인한다.
4. 온라인 방장이 새 게임 버튼을 눌러도 오프라인 resetToSetup이 실행되지 않는지 확인한다.
5. 게임 시작 후 모든 온라인 유저에게 방 나가기 버튼이 보이는지 확인한다.
6. 방 나가기 후 localStorage의 catanOnlineIdentity가 삭제되는지 확인한다.
7. 방 나가기 후 URL에서 ?room 파라미터가 제거되는지 확인한다.
8. 방 나가기 후 새로고침해도 자동으로 이전 방에 복귀하지 않는지 확인한다.
9. 방 나가기 후 최근 방에 다시 참가 버튼이 표시되는지 확인한다.
10. 최근 방에 다시 참가 버튼을 눌렀을 때 자동 참가가 아니라 참가 화면으로 이동하고 방 코드/닉네임만 채워지는지 확인한다.
11. 사용자가 참가하기를 명시적으로 눌렀을 때만 다시 참가가 시도되는지 확인한다.
12. 브라우저 새로고침이나 일시적인 WebSocket close가 명시적 나가기로 처리되지 않고 reconnect되는지 확인한다.
13. active player가 방장인 현재 구조에서 방장 이탈 시 ended가 되는지 확인한다.
14. active player가 비방장인 경우의 직접 검증은 턴 진행 command가 구현된 뒤 재검증한다.
```

## 회귀 테스트

```text
1. 오프라인 모드 새 게임 버튼은 기존처럼 resetToSetup을 실행한다.
2. 온라인 대기실 reconnect는 기존처럼 유지된다.
3. 온라인 playing 상태 새로고침 reconnect는 같은 playerId로 같은 보드를 다시 본다.
4. devDeck 전체, 상대 자원 상세, 상대 개발 카드 상세는 클라이언트 view state에 노출되지 않는다.
```

## 통과 기준

```text
명시적 leaveRoom과 WebSocket close가 서버에서 분리된다.
명시적 방 나가기 후 자동 복귀 identity와 URL room query가 정리된다.
최근 방 재참가는 사용자가 명시적으로 버튼을 눌렀을 때 참가 화면으로 이동하는 방식이다.
게임 중 이탈 종료 정책이 room.status=ended로 남은 참가자에게 동기화된다.
ended 상태에서 현재 구현된 게임 command가 거절된다.
오프라인 새 게임 동작은 유지된다.
```
