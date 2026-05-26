# 온라인 05-2 최종 방 나가기/게임 종료 정책 구현 계획

작성일: 2026-05-26

## 목적

5-1에서 검토했던 `최근 방에 다시 참가` 흐름을 제거하고, 온라인 방 나가기 정책을 더 단순하고 명확하게 확정한다.

개인용 LAN/소규모 온라인 게임에서는 누군가 게임 중 방을 나가면 남은 사람들끼리 계속 진행하거나 재입장을 허용하는 것보다, 해당 방을 종료하고 새 방을 만들어 다시 시작하는 편이 예측 가능하다.

따라서 5-2의 최종 정책은 다음과 같다.

```text
방 나가기 = 현재 온라인 방 종료
방 종료 후 재입장 불가
최근 방 재접속/재참가 버튼 없음
나가기 전 본인에게 확인 모달 표시
나간 뒤 남은 유저들에게 종료 알림 모달 표시
```

## 핵심 정책

```text
모든 온라인 유저는 방 나가기 버튼을 볼 수 있다.
방 나가기 버튼을 누르면 확인 모달을 띄운다.
확인 모달에는 "나가면 게임방이 종료되며 다시 참가할 수 없습니다"를 명확히 표시한다.
사용자가 확인하면 leaveRoom command를 보낸다.
서버는 방을 ended 상태로 만든다.
남은 유저들에게 종료 알림 모달을 띄운다.
종료 알림 모달 아래에는 나가기 버튼만 제공한다.
나간 유저와 남은 유저 모두 해당 방에 다시 참가할 수 없다.
재입장/최근 방 재참가 로직은 전부 제거한다.
```

## 5-1에서 변경되는 점

제거:

```text
catanLastLeftRoom 저장
최근 방에 다시 참가 버튼
방 나가기 후 수동 재참가
방 코드/닉네임 자동 입력 재참가 흐름
게임 중 일부 인원이 나가도 3명 이상이면 계속 진행하는 정책
```

유지:

```text
방 나가기 후 자동 재접속 identity 삭제
방 나가기 후 URL의 ?room 제거
브라우저 새로고침/WebSocket close를 leaveRoom으로 오판하지 않기
웹페이지 닫기/네트워크 끊김 감지 시 남은 유저에게 재접속 대기 모달 표시
오프라인 새 게임 버튼 기존 동작 유지
온라인에서는 방장 포함 모든 유저에게 새 게임 버튼 숨김
```

변경:

```text
게임 중 누가 나가든 방은 종료된다.
대기실에서 누가 나가도 정책상 방 종료로 통일할 수 있다.
재입장 불가가 원칙이므로 ended 방에 joinRoom/reconnect를 허용하지 않는다.
```

## 범위

포함:

```text
방 나가기 확인 모달
leaveRoom command 최종 정책 변경
room.status = ended 처리
endReason 저장
남은 유저들에게 종료 알림 모달 표시
종료 알림 모달의 나가기 버튼
방 종료 후 identity/query 정리
재입장 관련 코드 제거
ended 방 joinRoom/reconnect 거절
```

제외:

```text
방장 권한 이전
게임 재시작 투표
종료된 방 저장/복구
최근 방 재참가
관전자 모드
```

## UI/UX 구현 계획

### 1. 방 나가기 버튼

온라인 상태에서는 모든 유저에게 `방 나가기` 버튼을 표시한다.

오프라인 상태:

```text
방 나가기 버튼 숨김
새 게임 버튼은 기존처럼 표시
```

온라인 상태:

```text
모든 유저: 방 나가기 버튼 표시
방장 포함 모든 유저: 새 게임 버튼 숨김
```

정책:

```text
온라인에서는 새 게임 버튼을 사용하지 않는다.
새로 시작하려면 방을 나간 뒤 새 방을 만든다.
```

### 2. 나가기 확인 모달

방 나가기 버튼 클릭 시 즉시 나가지 않고 확인 모달을 띄운다.

모달 문구:

```text
방을 나가시겠습니까?
나가면 현재 게임방이 종료되며 다시 참가할 수 없습니다.
친구들도 이 방에서 더 이상 게임을 진행할 수 없습니다.
```

버튼:

```text
취소
나가기
```

동작:

```text
취소: 모달 닫기, 아무 상태 변경 없음
나가기: leaveRoom command 전송
```

주의:

```text
확인 모달 없이 즉시 leaveRoom을 보내지 않는다.
```

### 3. 남은 유저 종료 알림 모달

다른 유저가 나가서 방이 종료되면 남은 유저들에게 모달을 띄운다.

모달 문구:

```text
게임방이 종료되었습니다.
참가자가 방을 나가서 이 게임방은 더 이상 진행할 수 없습니다.
이 방에는 다시 참가할 수 없습니다.
```

버튼:

```text
나가기
```

버튼 동작:

```text
localStorage identity 삭제
URL의 ?room 제거
onlineSession reset
WebSocket 닫기
모드 선택 화면으로 이동
```

중요:

```text
종료 모달에는 "다시 참가" 버튼을 제공하지 않는다.
```

### 4. 본인이 나간 뒤 화면

본인이 나가기를 확정하면:

```text
leaveRoom command 전송 시도
응답 성공 여부와 무관하게 로컬 세션 정리
모드 선택 화면으로 이동
```

권장 안내:

```text
방에서 나갔습니다. 새로 게임하려면 새 방을 만들어 주세요.
```

## 서버 구현 계획

### 1. leaveRoom command 정책

`leaveRoom`을 받으면 현재 방을 종료한다.

공통 처리:

```text
roomId 유효성 확인
playerId/playerToken 인증
room 존재 확인
이미 ended인 경우 중복 처리 방지
```

성공 처리:

```text
room.status = "ended"
room.endReason = "player_left" 또는 "host_left"
room.endedAt = Date.now()
room.endedByPlayerId = 요청 playerId
room.revision += 1
room.updatedAt = Date.now()
broadcastState(room)
leave 요청자에게 ack 전송
```

방장이 나간 경우:

```text
endReason = "host_left"
```

일반 참가자가 나간 경우:

```text
endReason = "player_left"
```

### 2. 대기실에서도 종료할지 여부

권장 최종 정책:

```text
lobby 상태에서 누가 방 나가기를 눌러도 방을 종료한다.
```

이유:

```text
재입장 불가 정책과 가장 일관된다.
방장/참가자별 예외가 줄어든다.
친구들끼리 실수로 나간 경우에도 새 방을 만드는 흐름이 명확하다.
```

대안:

```text
lobby에서는 참가자만 제거하고 방은 유지
```

하지만 5-2 정책에서는 "방 나가기 = 방 종료"가 더 단순하므로 권장하지 않는다.

### 3. ended 방 접근 차단

ended 상태의 방에 대해:

```text
joinRoom 거절
reconnect 거절
startGame 거절
모든 game command 거절
```

권장 에러 코드:

```text
ROOM_ENDED
ROOM_NOT_JOINABLE
```

응답 문구:

```text
종료된 방입니다. 새 방을 만들어 다시 시작하세요.
```

### 4. WebSocket close와 leaveRoom 구분

중요:

```text
브라우저 새로고침
탭 닫기
네트워크 일시 끊김
```

이 경우는 WebSocket close만 발생할 수 있다.

정책:

```text
WebSocket close만으로 방을 ended 처리하지 않는다.
leaveRoom command를 받은 경우에만 방 종료
WebSocket close는 해당 유저를 connected=false로 표시하고 재접속 대기 상태를 broadcast한다.
```

이 구분을 지키지 않으면 새로고침만 해도 방이 종료되는 심각한 문제가 생긴다.

### 5. 비의도적 연결 끊김 처리

웹페이지 닫기, 브라우저 종료, 네트워크 끊김, 새로고침 중 일시 close는 `leaveRoom`이 아니다.

서버 정책:

```text
WebSocket close 발생
해당 socket의 roomId/playerId 확인
room이 lobby 또는 playing이면 해당 player.connected = false
player.disconnectedAt = Date.now()
room.revision += 1
room.updatedAt = Date.now()
broadcastState(room)
방은 ended 처리하지 않음
```

재접속 성공 시:

```text
player.connected = true
player.disconnectedAt = null
기존 reconnect 흐름으로 같은 player 복구
room.revision += 1
broadcastState(room)
```

5-2 MVP에서는 자동 타임아웃 종료를 필수로 구현하지 않는다.

권장:

```text
누군가 끊기면 남은 유저에게 재접속 대기 모달 표시
끊긴 유저가 돌아오면 모달 자동 닫힘
방장은 필요하면 방 나가기 버튼으로 방 종료
```

주의:

```text
leaveRoom command를 받은 경우만 방 종료
WebSocket close는 재접속 대기 상태로만 처리
```

## 클라이언트 구현 계획

### 1. 재입장 로직 제거

제거 대상:

```text
catanLastLeftRoom
readLastLeftRoom()
saveLastLeftRoom()
clearLastLeftRoom()
최근 방에 다시 참가 버튼
방 나가기 후 roomId/playerName 보관
방 나가기 후 join 화면 자동 채움
```

유지 대상:

```text
정상 reconnect용 catanOnlineIdentity
단, leaveRoom 후에는 삭제
```

### 2. 방 나가기 처리 함수

권장 함수:

```text
confirmLeaveOnlineRoom()
leaveOnlineRoomAfterConfirm()
cleanupOnlineRoomAfterLeave()
```

흐름:

```text
방 나가기 버튼 클릭
confirmLeaveOnlineRoom() 실행
확인 모달 표시
사용자가 나가기 선택
leaveRoom command 전송
cleanupOnlineRoomAfterLeave() 실행
```

cleanup:

```text
clearOnlineIdentity()
clearRoomParam()
resetOnlineSession()
showModeSelect()
```

### 3. ended state 처리

`applyOnlineState()`에서 `state.status === "ended"` 처리 추가.

본인이 leaveRoom을 눌러 이미 정리 중인 경우:

```text
모드 선택 화면으로 이동
```

남은 유저가 ended state를 받은 경우:

```text
게임 조작 버튼 비활성
종료 알림 모달 표시
모달 아래 나가기 버튼만 제공
```

중요:

```text
자동으로 resetToSetup()을 호출하지 않는다.
```

### 4. 재접속 대기 모달 처리

`state.players` 중 `connected === false`이고 `left !== true`인 유저가 있으면 남은 유저에게 재접속 대기 모달을 표시한다.

표시 조건:

```text
onlineSession.enabled === true
state.status === "lobby" 또는 "playing"
disconnected player가 1명 이상 있음
현재 유저 본인이 disconnected 대상이 아님
```

모달 문구:

```text
연결이 끊긴 참가자가 있습니다.
민수님의 재접속을 기다리는 중입니다.
```

여러 명이 끊긴 경우:

```text
민수, 지우님의 재접속을 기다리는 중입니다.
```

버튼:

```text
방 나가기
```

버튼 설명:

```text
방 나가기를 누르면 현재 방이 종료되며 다시 참가할 수 없습니다.
```

재접속 시:

```text
서버가 connected=true state를 broadcast
disconnected player가 없어지면 재접속 대기 모달 자동 닫힘
게임 화면/대기실 화면 유지
```

주의:

```text
재접속 대기 모달은 방 종료 모달이 아니다.
나가기 버튼을 누르기 전까지 방은 유지된다.
```

### 5. 끊긴 유저 본인의 복구

끊긴 유저가 같은 브라우저/같은 URL에서 다시 접속하면 기존 5단계 reconnect를 사용한다.

정상 흐름:

```text
페이지 새로 열기 또는 새로고침
localStorage identity 확인
reconnect command 전송
성공하면 같은 플레이어로 복구
다른 유저들의 재접속 대기 모달 닫힘
```

명시적으로 방 나가기를 누른 경우:

```text
identity 삭제
reconnect 불가
room ended
남은 유저에게 종료 모달
```

### 6. URL 정리

방 나가기 또는 종료 모달의 나가기 클릭 시:

```text
const url = new URL(window.location.href)
url.searchParams.delete("room")
history.replaceState(null, "", url)
```

새로고침 후:

```text
초기 화면으로 이동
이전 방 자동 접속 없음
재참가 버튼 없음
```

### 7. 버튼 표시 규칙

온라인 상태:

```text
방 나가기 버튼 표시
방장 포함 모든 유저에게 새 게임 버튼 숨김
ended 상태에서는 게임 조작 버튼 비활성
```

오프라인 상태:

```text
방 나가기 버튼 숨김
새 게임 버튼 표시
```

## 비공개 상태 고려

종료 상태에서도 비공개 정보는 노출하지 않는다.

```text
ended broadcast도 viewer별 makeRoomState 필터링을 유지한다.
상대 resources/dev 상세를 종료 모달이나 로그에 표시하지 않는다.
endReason, endedByPlayerId 정도만 공개한다.
```

## 추가 고려사항

### 0. 웹페이지 닫기 감지 가능 여부

가능하다.

브라우저가 페이지를 닫거나 네트워크가 끊기면 WebSocket 연결이 닫히고 서버의 `close` 이벤트가 발생한다. 서버는 이 이벤트로 해당 유저를 `connected=false`로 표시할 수 있다.

다만 주의:

```text
close 이벤트는 새로고침 중에도 발생한다.
close 이벤트만으로 방 종료하면 안 된다.
close 이벤트는 재접속 대기로만 처리한다.
명시적인 방 나가기는 leaveRoom command로만 처리한다.
```

정리:

```text
웹페이지 닫기/새로고침/네트워크 끊김 -> 재접속 대기
방 나가기 버튼 확인 후 나가기 -> 방 종료
```

### 1. 본인 leave ack와 broadcast 순서

서버가 leave 요청자에게 ack를 보내기 전에 broadcast로 ended state를 보낼 수 있다.

클라이언트는 다음 상황을 모두 견뎌야 한다.

```text
ack 먼저 수신
ended state 먼저 수신
소켓 close 먼저 발생
서버 응답 없음
```

권장:

```text
사용자가 확인 후 나가기를 누른 순간부터 로컬 cleanup은 best-effort로 진행한다.
서버 응답 순서에 의존하지 않는다.
```

### 2. 중복 클릭 방지

```text
나가기 확인 후 leaveRoom 전송 중에는 나가기 버튼 disabled
중복 leaveRoom command 전송 방지
```

### 3. 종료된 방 공유 URL

누군가 예전 공유 URL로 들어오면:

```text
join 화면은 열릴 수 있음
참가 시 ROOM_ENDED 표시
자동 재접속은 실패
identity 삭제
```

### 4. 방 삭제 시점

개인용 서버 기준:

```text
ended 방은 서버 재시작 시 자연 정리
또는 endedAt 기준 30분~2시간 뒤 메모리에서 삭제
```

5-2에서는 자동 삭제 필수 아님.

### 5. 문구 명확성

반드시 사용자가 알 수 있어야 하는 것:

```text
나가면 방이 종료된다.
친구들도 계속 진행할 수 없다.
이 방에는 다시 참가할 수 없다.
새로 하려면 새 방을 만들어야 한다.
```

## 테스트 계획

### 자동 테스트

```text
node --check server.js
node --check script.js
leaveRoom command 수신 시 room.status ended
방장 leaveRoom 시 endReason host_left
참가자 leaveRoom 시 endReason player_left
ended state가 남은 모든 소켓에 broadcast
ended 방 joinRoom 거절
ended 방 reconnect 거절
ended 방 startGame/게임 command 거절
WebSocket close만으로 ended 처리되지 않음
WebSocket close 시 player.connected=false broadcast
reconnect 성공 시 player.connected=true broadcast
```

### 수동 테스트

```text
Chrome 3개 또는 실제 기기 3개 접속
모든 온라인 유저에게 방 나가기 버튼 표시
방장 포함 모든 온라인 유저에게 새 게임 버튼 숨김
방 나가기 클릭 시 확인 모달 표시
취소 클릭 시 방 유지
나가기 클릭 시 본인은 모드 선택 화면으로 이동
남은 유저들에게 종료 알림 모달 표시
종료 알림 모달에 나가기 버튼만 표시
남은 유저가 나가기 클릭 시 모드 선택 화면 이동
나간 유저가 새로고침해도 이전 방 자동 접속 안 됨
최근 방 재참가 버튼이 없는지 확인
이전 공유 URL로 다시 들어가도 참가 불가 안내 표시
브라우저 새로고침만으로 방이 종료되지 않는지 확인
참가자 1명이 브라우저 탭을 닫으면 남은 유저에게 재접속 대기 모달 표시
닫은 참가자가 같은 URL로 다시 접속하면 같은 플레이어로 복구
복구 후 남은 유저의 재접속 대기 모달 자동 닫힘
재접속 대기 모달의 방 나가기 버튼 클릭 시 방 종료
```

### 회귀 테스트

```text
오프라인 새 게임 기존 동작 유지
온라인에서는 방장 포함 모든 유저에게 새 게임 버튼 숨김
온라인 새로고침 reconnect 기존 동작 유지
브라우저 닫기/네트워크 끊김은 재접속 대기 상태로 표시
방 나가기 전까지는 게임/대기실 상태 동기화 유지
비공개 자원/개발카드 정보 필터링 유지
```

## 완료 기준

```text
방 나가기 전 확인 모달이 표시된다.
확인 모달은 재참가 불가와 방 종료를 명확히 안내한다.
취소하면 아무 상태도 변경되지 않는다.
확인 후 나가면 서버 방이 ended 상태가 된다.
남은 유저들에게 종료 알림 모달이 표시된다.
종료 알림 모달에는 나가기 버튼만 있다.
방 종료 후 누구도 해당 방에 다시 참가할 수 없다.
재입장/최근 방 재참가 로직이 제거되어 있다.
방 나가기 후 새로고침해도 이전 방으로 자동 접속되지 않는다.
WebSocket close/새로고침만으로 방이 종료되지 않는다.
웹페이지 닫기/네트워크 끊김 시 남은 유저에게 재접속 대기 모달이 표시된다.
끊긴 유저가 재접속하면 재접속 대기 모달이 자동으로 닫힌다.
재접속 대기 모달의 방 나가기 버튼을 누르면 기존 방 나가기 정책대로 방이 종료된다.
오프라인 새 게임은 기존처럼 동작한다.
```

## 구현 우선순위

1. 5-1의 재입장 관련 계획/코드 제거 범위 확정
2. 방 나가기 확인 모달 추가
3. 클라이언트 cleanup 정책 구현
4. 서버 leaveRoom = room ended 정책 구현
5. ended 방 join/reconnect/game command 거절
6. WebSocket close 기반 connected=false broadcast
7. reconnect 성공 시 connected=true broadcast
8. 남은 유저 종료 알림 모달 구현
9. 재접속 대기 모달 구현
10. 버튼 표시 규칙 정리
11. 자동/수동 테스트

## 다음 단계 연결

5-2 완료 후 6단계 초기 배치 구현으로 넘어간다.

6단계 이후 모든 온라인 command는 다음을 먼저 확인해야 한다.

```text
room.status === "playing"
room.status === "ended"이면 거절
```

## 2026-05-26 작업 전 갱신

### 실제 수정 대상

```text
server.js
script.js
styles.css
docs/test_plans/2026-05-26_online-05-2-final-leave-room-end-policy-test-plan.md
docs/final_reports/2026-05-26_online-05-2-final-leave-room-end-policy-final-report.md
```

### 구현 반영 방식

```text
server.js
- leaveRoom을 받은 경우 lobby/playing 구분 없이 room.status="ended"로 전환한다.
- ended 방의 joinRoom, reconnect, startGame은 ROOM_ENDED로 거절한다.
- 명시적 leaveRoom과 WebSocket close를 분리한다.
- WebSocket close는 connected=false, disconnectedAt 기록, broadcastState만 수행한다.
- reconnect 성공 시 connected=true, disconnectedAt=null로 복구하고 broadcastState한다.

script.js
- 5-1의 catanLastLeftRoom 및 최근 방 재참가 UI/흐름을 제거한다.
- 온라인 상태에서는 방장 포함 모든 유저에게 새 게임 버튼을 숨긴다.
- 온라인 상태에서는 대기실/게임/종료/재접속 대기 상황에서 방 나가기 버튼을 제공한다.
- 방 나가기 클릭 시 확인 모달을 먼저 표시하고, 취소 시 아무 상태도 바꾸지 않는다.
- 확인 시 leaveRoom command를 best-effort로 전송하고 identity/query/session을 정리한다.
- 남은 유저가 ended state를 받으면 종료 알림 모달을 표시하며, 모달에는 나가기 버튼만 제공한다.
- connected=false인 다른 참가자가 있으면 재접속 대기 모달을 표시하고, reconnect broadcast로 모두 connected=true가 되면 자동 닫는다.
- URL에 ?room이 있을 때의 정상 reconnect는 유지하지만 ended 방 reconnect는 서버 에러를 표시하고 identity를 삭제한다.
```

### 구현하지 않을 범위

```text
게임 재시작 command
ended 방 복구
최근 방 재참가
게임 중 이탈한 플레이어의 대체/관전 정책
초기 배치, 주사위, 턴 종료, 건설 command
```

### 검증 계획

```text
node --check server.js
node --check script.js
WebSocket 자동 테스트:
- lobby leaveRoom 후 ended broadcast
- playing leaveRoom 후 ended broadcast
- ended joinRoom/reconnect/startGame 거절
- WebSocket close는 ended가 아니라 connected=false broadcast
- reconnect 성공 시 connected=true broadcast
브라우저 스모크:
- 동적 모달/버튼 DOM 존재
- 온라인 전에는 새 게임 버튼 표시, 방 나가기 숨김
수동 테스트:
- 실제 다중 브라우저에서 확인 모달/종료 알림 모달/재접속 대기 모달 확인
```
