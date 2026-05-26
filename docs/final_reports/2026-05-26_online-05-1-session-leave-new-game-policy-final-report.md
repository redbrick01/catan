# 온라인 모드 5-1 구현 보고서

## 작업 요약

온라인 세션의 새 게임 버튼 노출 정책, 명시적 방 나가기, 최근 방 수동 재참가, 게임 중 이탈 종료 정책을 구현했다. 브라우저 새로고침/WebSocket close는 명시적 방 나가기로 처리하지 않고, leaveRoom command를 받은 경우에만 방 나가기 정책을 적용하도록 분리했다.

## 구현 내용

### 서버

대상 파일:

```text
server.js
```

변경 사항:

```text
1. public player state에 left, leftAt을 포함했다.
2. room state에 endReason, endedAt, endedByPlayerId를 포함했다.
3. ended 상태에서도 matchState view를 내려 보내 남은 참가자가 같은 보드를 보며 종료 상태를 확인할 수 있게 했다.
4. findAuthenticatedPlayer가 top-level playerId/playerToken과 payload playerId/playerToken을 모두 허용하도록 정리했다.
5. leaveRoom이 lobby/playing/ended 상태별로 다르게 처리되도록 분리했다.
6. playing 상태에서 명시적 leaveRoom을 받으면 해당 player를 left=true, connected=false로 표시한다.
7. playing 중 방장이 나가면 room.status=ended, endReason=host_left로 처리한다.
8. playing 중 active player가 나가면 room.status=ended, endReason=player_left로 처리한다.
9. playing 중 남은 인원이 3명 미만이면 room.status=ended, endReason=not_enough_players로 처리한다.
10. ended 상태에서 leaveRoom을 받은 경우에도 해당 player를 left=true로 표시해 이후 reconnect를 막는다.
11. 명시적으로 left 처리된 player의 reconnect는 PLAYER_LEFT로 거절한다.
12. ended 상태에서 startGame은 ROOM_ENDED로 거절한다.
13. WebSocket close는 connected=false만 반영하고 left=true나 ended 처리를 하지 않는다.
```

### 클라이언트

대상 파일:

```text
script.js
styles.css
```

변경 사항:

```text
1. 온라인 참가자는 새 게임 버튼을 숨기고, 온라인 방장에게만 새 게임 버튼을 표시한다.
2. 온라인 상태에서 새 게임 버튼을 눌러도 로컬 resetToSetup을 실행하지 않고 안내 로그만 남긴다.
3. 오프라인 상태의 새 게임 버튼은 기존처럼 resetToSetup을 실행한다.
4. 게임 화면에 온라인 방 나가기 버튼을 동적으로 추가했다.
5. 방 나가기 시 leaveRoom command를 best-effort로 전송한다.
6. 방 나가기 후 catanOnlineIdentity를 삭제한다.
7. 방 나가기 후 URL의 ?room 파라미터를 제거한다.
8. 방 나가기 후 catanLastLeftRoom에 최근 방 코드/닉네임/시각/origin을 저장한다.
9. 최근 방에 다시 참가 버튼을 모드 선택 화면과 참가 화면에 제공한다.
10. 최근 방 재참가는 자동 join이 아니라 참가 화면으로 이동하고 방 코드/닉네임만 채우는 방식으로 구현했다.
11. URL에 ?room이 없을 때 readLastOnlineIdentity 기반 자동 reconnect를 수행하지 않도록 변경했다.
12. URL에 ?room이 있고 해당 방 identity가 있는 새로고침/reconnect 흐름은 유지했다.
13. ended 상태를 온라인 제어 게임 상태로 취급해 roll/build/trade 등 로컬 게임 조작을 잠근다.
14. ended 상태에서는 종료 사유별 안내 문구를 표시한다.
15. .hidden 클래스를 보강해 동적 버튼 숨김이 안정적으로 적용되게 했다.
```

## 테스트 결과

실행한 자동 테스트:

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
- 대기실 참가자 leaveRoom 후 남은 참가자에게 players 목록 갱신 broadcast
- WebSocket close가 playing 방을 ended로 만들지 않음
- 3명 playing 방에서 일반 참가자 leaveRoom 후 status=ended, endReason=not_enough_players
- 명시적으로 나간 player의 reconnect가 PLAYER_LEFT로 거절됨
- ended 상태에서 startGame이 ROOM_ENDED로 거절됨
- playing 방에서 방장 leaveRoom 후 status=ended, endReason=host_left
```

브라우저 스모크 테스트:

```text
결과: 통과

검증 URL:
http://127.0.0.1:4173/

검증 항목:
- 모드 선택 화면 표시
- 최근 방에 다시 참가 버튼 DOM 생성
- 최근 방 정보가 없을 때 최근 방 버튼 숨김
- 게임 화면 방 나가기 버튼 DOM 생성
- 온라인 게임 전에는 게임 화면 방 나가기 버튼 숨김
```

## 수동 테스트가 필요한 항목

```text
1. 실제 Chrome 3개 또는 실제 기기 3개에서 방장/참가자별 새 게임 버튼 노출 확인
2. 온라인 방장이 새 게임 버튼을 눌렀을 때 로컬 오프라인 초기화가 실행되지 않는지 실제 UI로 확인
3. 게임 화면에서 모든 온라인 유저에게 방 나가기 버튼이 보이는지 확인
4. 방 나가기 후 localStorage catanOnlineIdentity 삭제와 catanLastLeftRoom 저장 확인
5. 방 나가기 후 URL ?room 제거 확인
6. 방 나가기 후 새로고침해도 자동 복귀되지 않는지 확인
7. 최근 방에 다시 참가 버튼이 자동 join 없이 참가 화면으로만 이동하는지 확인
8. URL에 ?room이 있는 새로고침/reconnect가 대기실/playing에서 계속 유지되는지 확인
9. active player가 비방장인 경우 leaveRoom 종료 정책은 턴 진행 command가 구현된 뒤 실제 턴 상태에서 재검증
```

## 제외한 항목

```text
1. 게임 시작 이후 새 게임 서버 command는 이번 단계에서 구현하지 않았다.
2. 초기 배치, 주사위, 턴 종료, 건설 command는 구현하지 않았다.
3. 게임 중 이탈 후 재입장/관전/대체 플레이어 정책은 완성하지 않았다.
4. active player가 비방장인 실제 UI 시나리오는 아직 턴 진행 command가 없어 자동 테스트로 직접 만들지 않았다.
```

## 후속 과제

```text
1. 6단계 이후 모든 게임 command에서 room.status=playing, requester.left=false를 공통으로 검증한다.
2. 게임 중 이탈한 player의 장기 처리 정책을 확정한다.
3. 서버 기반 새 게임 또는 재시작 command가 필요하면 별도 단계에서 구현한다.
4. active player가 비방장인 상태를 만들 수 있는 턴 command 구현 후 종료 정책을 추가 자동 테스트한다.
```
