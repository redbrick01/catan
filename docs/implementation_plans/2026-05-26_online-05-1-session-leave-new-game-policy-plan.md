# 온라인 05-1 세션 이탈/새 게임 정책 구현 계획

작성일: 2026-05-26

## 목적

5단계에서 구현한 재접속/비공개 상태 정책을 보강한다.

현재 온라인 게임 중 `새 게임` 버튼이 오프라인 초기화처럼 동작하면 한 유저의 화면만 서버 방 상태와 어긋날 수 있다. 또한 `방 나가기`와 브라우저 새로고침/닫기/일시 끊김을 구분하지 않으면, 의도치 않게 게임이 종료되거나 반대로 나간 유저가 새로고침만으로 다시 방에 들어오는 문제가 생긴다.

5-1 단계의 목표는 다음을 명확히 분리하는 것이다.

```text
오프라인 새 게임
온라인 방장용 새 게임 버튼 노출 정책
온라인 방 나가기
새로고침 기반 자동 재접속
방 나가기 후 수동 재참가
게임 중 인원 부족 종료
```

## 2026-05-26 5-1 작업 전 갱신

이번 구현에서 실제로 바꿀 범위:

```text
server.js
- player.left/leftAt 필드 추가
- explicit leaveRoom과 WebSocket close를 분리
- lobby leaveRoom은 기존처럼 players 목록에서 제거
- playing leaveRoom은 left=true로 표시하고 종료 조건 평가
- 남은 non-left 인원이 3명 미만이면 room.status = "ended"
- 방장 또는 active player가 playing 중 leaveRoom 하면 room.status = "ended"
- ended metadata(endReason, endedAt, endedByPlayerId) 추가
- ended 상태에서는 startGame 및 이후 게임 command를 거절하는 기반 추가
- reconnect는 ended 상태도 허용해 종료 안내 state를 받을 수 있게 유지

script.js
- 온라인 참가자에게 새 게임 버튼 숨김
- 온라인 방장에게만 새 게임 버튼 표시하되 resetToSetup 직접 실행 금지
- 온라인 게임 화면에도 방 나가기 버튼 제공
- 방 나가기 시 leaveRoom command 전송, identity 삭제, URL ?room 제거
- 명시적으로 나간 방은 catanLastLeftRoom에 token 없이 저장
- 최근 방에 다시 참가 버튼을 추가하고 join 화면으로만 이동
- URL ?room 없이 자동 복귀할 때 명시적으로 나간 방은 제외
- ended state를 화면/로그로 안내하고 게임 조작을 잠금
- 오프라인 새 게임은 resetToSetup 기존 동작 유지
```

구현하지 않을 범위:

```text
온라인 새 게임 서버 command
방장 권한 이전
게임 중 이탈 후 계속 진행
초기 배치/주사위/턴 종료/건설 command
ended room 자동 삭제
실제 다기기 Chrome 수동 검증 자동화
```

추가 검증:

```text
node --check server.js
node --check script.js
WebSocket: lobby leaveRoom 후 players 목록 제거
WebSocket: refresh/socket close 만으로 ended가 되지 않음
WebSocket: playing guest leave 후 2명 이하이면 ended
WebSocket: playing host leave 후 ended/host_left
WebSocket: playing active player leave 후 ended/player_left
WebSocket: ended 상태 startGame 거절
브라우저 자동화 가능 범위에서 버튼/identity 흐름 확인, 불가 항목은 보고서 기록
```

## 핵심 정책 요약

```text
방장에게만 새 게임 버튼을 보여준다.
참가자에게는 새 게임 버튼을 숨긴다.
모든 온라인 유저에게 방 나가기 버튼을 제공한다.
방 나가기를 누른 유저는 새로고침해도 자동으로 이전 방에 다시 들어가지 않는다.
방 나간 유저에게는 최근 방에 다시 참가 버튼을 제공한다.
최근 방에 다시 참가 버튼은 자동 복귀가 아니라 명시적 수동 재참가이다.
게임 중 명시적으로 나간 유저 때문에 남은 인원이 3명 미만이 되면 게임을 종료한다.
브라우저 새로고침/일시 네트워크 끊김은 방 나가기로 처리하지 않는다.
```

## 범위

포함:

```text
온라인 상태에서 새 게임 버튼 노출 정책 변경
온라인 게임 화면에 방 나가기 버튼 제공
leaveRoom command 게임 중 처리
방 나가기 후 자동 재접속 identity 삭제
방 나가기 후 URL의 room query 제거
최근 나간 방 정보 저장
최근 방에 다시 참가 버튼 추가
게임 중 인원 3명 미만 자동 종료
종료 상태 broadcast
ended 상태 클라이언트 처리
```

제외:

```text
방장 권한 이전
게임 중 새 유저 난입으로 게임 계속 진행
게임 재시작 투표
종료된 게임의 상태 저장/불러오기
관전자 모드
공식 서비스 수준의 방 수명 관리
```

## 상태 정의

### room.status

권장 상태:

```text
lobby
playing
ended
```

`ended` 상태 추가 필드:

```text
endReason: "not_enough_players" | "player_left" | "host_left" | "host_ended"
endedAt: number
endedByPlayerId: string | null
```

### player 상태

대기실과 게임 중 정책을 명확히 하기 위해 플레이어에 상태를 둘 수 있다.

```text
connected: boolean
left: boolean
leftAt: number | null
```

권장 MVP:

```text
대기실에서 leaveRoom: players 목록에서 제거
게임 중 leaveRoom: left=true로 표시하거나 제거 후 ended 처리
WebSocket close: connected=false만 표시
reconnect 성공: connected=true
```

중요:

```text
WebSocket close만으로 left=true를 만들지 않는다.
leaveRoom command를 받은 경우만 명시적 이탈로 처리한다.
```

## 새 게임 버튼 정책

### 오프라인

기존 동작 유지:

```text
새 게임 버튼 표시
resetToSetup() 실행
오프라인 설정 화면으로 이동
```

### 온라인 방장

방장에게만 `새 게임` 버튼을 표시한다.

5-1 MVP 권장 동작:

```text
playing 상태에서는 새 게임 버튼을 비활성화한다.
클릭 가능하게 둔다면 로컬 resetToSetup()을 직접 실행하지 않는다.
안내 문구: "온라인 새 게임은 아직 지원하지 않습니다. 방을 나간 뒤 새 방을 만들어 주세요."
```

대안:

```text
방장이 새 게임을 누르면 host_ended로 현재 방을 종료한다.
남은 유저에게 종료 안내를 보낸다.
방장은 모드 선택 화면으로 이동한다.
```

금지:

```text
방장 브라우저에서만 resetToSetup() 실행
서버 room.status는 playing인데 방장 화면만 초기화
```

### 온라인 참가자

참가자에게는 `새 게임` 버튼을 숨긴다.

판단 기준:

```text
onlineSession.enabled === true
onlineSession.isHost === false
```

## 방 나가기 버튼 정책

### 버튼 노출

온라인 상태에서는 모든 유저에게 `방 나가기` 버튼을 표시한다.

위치:

```text
대기실: 기존 나가기 버튼 유지
게임 화면: 컨트롤 영역에 방 나가기 버튼 추가
ended 화면: 방 나가기 버튼 유지
```

오프라인 상태:

```text
방 나가기 버튼 숨김
새 게임 버튼만 표시
```

### 클릭 시 사용자 흐름

방 나가기 클릭 시 확인창을 둘지 결정한다.

권장:

```text
대기실에서는 즉시 나가기
게임 중에는 확인창 표시
확인 문구: "방을 나가면 현재 온라인 게임에서 이탈합니다. 계속할까요?"
```

게임 중 나가기는 다른 유저의 게임 종료로 이어질 수 있으므로 실수 방지가 필요하다.

### 클라이언트 처리

방 나가기 성공 또는 best-effort 처리 시:

```text
leaveRoom command 전송
응답을 기다리되 실패해도 로컬 이탈은 진행
WebSocket 닫기
onlineSession reset
자동 재접속용 localStorage identity 삭제
URL의 ?room 제거
최근 나간 방 정보 저장
모드 선택 화면 표시
```

주의:

```text
방 나가기 후에는 새로고침해도 자동 재접속하지 않는다.
```

## 자동 재접속과 수동 재참가 분리

### 자동 재접속

자동 재접속은 다음 경우에만 허용한다.

```text
사용자가 방 나가기를 누르지 않았음
localStorage에 유효한 roomId/playerId/playerToken이 있음
현재 URL에 room query가 있거나 마지막 자동 재접속 identity가 있음
서버가 reconnect를 허용함
```

### 방 나가기 후 수동 재참가

방 나가기를 누른 경우 자동 재접속 identity를 삭제한다.

대신 별도 저장소에 최근 나간 방 정보를 남긴다.

권장 key:

```text
catanLastLeftRoom
```

권장 값:

```json
{
  "roomId": "abc123",
  "playerName": "민수",
  "leftAt": 1779780000000,
  "origin": "http://100.88.125.81:4173"
}
```

저장하지 말아야 할 값:

```text
playerToken
상대 플레이어 정보
비공개 자원/개발카드 정보
```

이유:

```text
방 나가기는 명시적 이탈이다.
playerToken을 유지하면 방 나가기 후에도 기존 플레이어 복구처럼 동작할 수 있다.
재참가는 새 joinRoom으로 처리하는 편이 정책이 단순하다.
```

## 최근 방에 다시 참가 버튼

### 표시 위치

권장 위치:

```text
모드 선택 화면 하단
온라인 참가 화면 하단
```

버튼 문구:

```text
최근 방에 다시 참가
```

보조 문구:

```text
방 코드 abc123
```

### 표시 조건

```text
자동 재접속 identity가 없음
catanLastLeftRoom.roomId가 있음
leftAt이 만료되지 않음
현재 origin이 저장된 origin과 같음
```

권장 만료 시간:

```text
30분~2시간
```

개인용 LAN 게임 기준으로는 2시간이 적당하다.

### 버튼 동작

권장 동작:

```text
joinRoomCode에 최근 roomId 입력
joinNickname에 최근 playerName 입력
온라인 참가 화면 표시
사용자가 참가하기 버튼을 눌러 joinRoom command 전송
```

즉시 joinRoom을 보내지 않는 이유:

```text
닉네임 변경 기회를 준다.
사용자에게 "자동 복귀가 아니라 수동 재참가"라는 감각을 준다.
방이 이미 종료되었을 때 에러 메시지를 참가 화면에서 자연스럽게 보여줄 수 있다.
```

### 방이 이미 종료된 경우

최근 방 재참가를 눌렀는데 서버가 거절할 수 있다.

가능한 응답:

```text
ROOM_NOT_FOUND
ROOM_ENDED
ROOM_NOT_JOINABLE
```

클라이언트 처리:

```text
에러 메시지 표시
catanLastLeftRoom 삭제 또는 유지 여부 선택
권장: ROOM_NOT_FOUND/ROOM_ENDED이면 삭제
```

## 서버 구현 계획

### 1. leaveRoom command 강화

기존 `leaveRoom`이 대기실 중심이라면 게임 중에도 처리되도록 확장한다.

공통 검증:

```text
roomId 유효성 확인
playerId/playerToken 인증
room 존재 확인
이미 ended인 방인지 확인
```

대기실 처리:

```text
요청자를 players에서 제거
sockets에서 제거
방장이 나가면 방 종료 또는 방 삭제
남은 플레이어에게 state broadcast
```

게임 중 처리:

```text
요청자를 명시적 left로 처리
sockets에서 제거
room.revision 증가
room.updatedAt 갱신
남은 참가자 수 계산
종료 조건이면 room.status = "ended"
broadcastState(room)
```

### 2. 게임 중 종료 조건

사용자 요구사항:

```text
유저가 나가서 3명 아래가 되면 자동으로 게임 종료
```

구현 기준:

```text
playing 상태에서 leaveRoom 발생
남은 비-left 참가자 수가 2명 이하
=> room.status = "ended"
=> endReason = "not_enough_players"
```

추가 권장 정책:

```text
방장이 게임 중 leaveRoom 하면 인원과 무관하게 ended
endReason = "host_left"
```

검토할 정책:

```text
4인 게임에서 1명이 나가 남은 인원이 3명인 경우 계속할지 종료할지
```

권장 MVP:

```text
남은 인원이 3명 이상이면 일단 계속 가능하게 둔다.
단, 나간 플레이어의 건설물/자원/턴 처리가 복잡하면 모든 게임 중 leaveRoom을 종료로 처리해도 된다.
```

더 안전한 대안:

```text
게임 중 누구든 명시적으로 나가면 종료
```

이번 요구사항을 엄격히 반영하는 기본안:

```text
3명 미만이면 반드시 종료
3명 이상이면 일단 유지
방장이 나가면 종료
```

### 3. active player가 나간 경우

남은 인원이 3명 이상이라도 현재 active player가 나가면 턴 처리가 꼬일 수 있다.

정책 선택 필요:

```text
대안 A: active player가 나가면 게임 종료
대안 B: 다음 남은 플레이어로 active 이동
```

권장 MVP:

```text
active player가 나가면 게임 종료
```

이유:

```text
진행 중인 주사위/건설/pending 상태를 안전하게 넘기기 어렵다.
개인용 게임에서는 종료 후 새 방이 더 예측 가능하다.
```

### 4. ended 상태 응답

room state에 포함:

```text
status: "ended"
endReason
endedAt
endedByPlayerId
players
matchState는 마지막 상태 view로 유지 가능
```

게임 command 거절:

```text
room.status === "ended"이면 startGame/roll/build 등 모든 게임 command 거절
허용 command: leaveRoom, maybe reconnect
```

reconnect 정책:

```text
ended 방 reconnect는 허용해 ended 안내를 볼 수 있게 한다.
단, joinRoom으로 새 참가하는 것은 거절한다.
```

## 클라이언트 구현 계획

### 1. DOM/UI 추가

필요 요소:

```text
게임 화면용 방 나가기 버튼
최근 방에 다시 참가 버튼
ended 상태 안내 영역 또는 기존 로그/가이드 재사용
```

권장:

```text
새 버튼 id 예시: leaveGameRoomButton
최근 방 버튼 id 예시: rejoinLastRoomButton
```

### 2. 버튼 렌더링 함수

온라인/오프라인/방장/참가자 상태에 따라 버튼을 갱신한다.

판단:

```text
isOnline = onlineSession.enabled
isHost = onlineSession.isHost
status = onlineSession.state?.status
```

규칙:

```text
오프라인: 새 게임 표시, 방 나가기 숨김
온라인 방장: 새 게임 표시, 방 나가기 표시
온라인 참가자: 새 게임 숨김, 방 나가기 표시
ended: 게임 조작 버튼 비활성, 방 나가기 표시
```

### 3. 방 나가기 함수

권장 함수:

```text
leaveCurrentOnlineRoom({ userInitiated: true })
```

처리 순서:

```text
현재 roomId/playerName 확보
게임 중이면 확인창
leaveRoom command 전송 시도
최근 나간 방 정보 저장
자동 reconnect identity 삭제
URL room query 제거
onlineSession reset
모드 선택 화면 표시
```

서버 실패 시:

```text
사용자가 명시적으로 나갔으면 로컬 정리는 계속 진행
단, 콘솔/로그에 서버 leave 실패 안내
```

### 4. URL room query 제거

권장 함수:

```text
clearRoomParam()
```

동작:

```text
const url = new URL(window.location.href)
url.searchParams.delete("room")
history.replaceState(null, "", url)
```

### 5. 최근 방 재참가 함수

권장 함수:

```text
readLastLeftRoom()
saveLastLeftRoom(roomId, playerName)
clearLastLeftRoom()
showLastLeftRoomActionIfNeeded()
```

버튼 클릭:

```text
showSetupView(onlineJoinView)
joinRoomCode.value = last.roomId
joinNickname.value = last.playerName
joinNickname.focus()
```

### 6. ended 상태 처리

`applyOnlineState()`에서 `state.status === "ended"` 처리 추가.

처리:

```text
onlineSession.state = state
게임 화면 유지 또는 종료 안내 화면 표시
게임 조작 버튼 비활성
종료 사유 안내
방 나가기 버튼 표시
자동 resetToSetup() 실행 금지
```

종료 문구 예시:

```text
not_enough_players: "참가자가 나가서 게임이 종료되었습니다."
host_left: "방장이 나가서 게임이 종료되었습니다."
player_left: "참가자가 나가서 게임이 종료되었습니다."
host_ended: "방장이 게임을 종료했습니다."
```

## 비공개 상태 고려

방 나가기/종료 상태에서도 5단계 비공개 state 원칙은 유지한다.

```text
나간 유저의 playerToken을 다른 유저에게 보내지 않는다.
상대 자원/개발카드 상세를 종료 화면에서도 노출하지 않는다.
최근 방 정보에는 roomId/playerName/origin/leftAt만 저장한다.
ended state에서도 makeRoomState(room, viewerPlayer)를 통해 viewer별 필터링을 유지한다.
```

## 네트워크/브라우저 고려

### 새로고침

```text
새로고침은 WebSocket close를 발생시킬 수 있다.
이 close를 leave로 처리하면 안 된다.
기존 identity가 있으면 reconnect 가능해야 한다.
```

### 브라우저 닫기

```text
브라우저 닫기는 disconnected 처리
서버 방에는 일정 시간 남겨둔다.
친구가 다시 열면 reconnect 가능해야 한다.
```

### 방 나가기 버튼

```text
명시적 leave
identity 삭제
재접속 자동 복구 금지
최근 방 수동 재참가만 허용
```

## 서버 메모리 정리

개인용 LAN 서버라도 종료된 방이 계속 쌓이지 않게 기준을 둔다.

권장 MVP:

```text
ended 방은 서버 재시작 시 자연 정리
5-1에서는 자동 삭제 필수 아님
```

추가 가능:

```text
endedAt 이후 30분~2시간 지난 방 삭제
lobby에서 모든 플레이어가 나간 방 즉시 삭제
```

## 에러 코드 제안

서버가 명확한 에러 코드를 보내면 UI가 단순해진다.

```text
ROOM_ENDED
ROOM_NOT_JOINABLE
NOT_HOST
PLAYER_LEFT
ALREADY_LEFT
```

기존 에러 형식:

```text
type: "error"
code
message
requestId
```

## 테스트 계획

### 자동 테스트

```text
node --check server.js
node --check script.js
대기실 참가자가 leaveRoom 시 players 목록에서 제거
대기실 방장이 leaveRoom 시 방 종료 또는 삭제
게임 중 참가자가 leaveRoom 후 남은 인원 2명이면 status ended
게임 중 방장이 leaveRoom 하면 status ended, endReason host_left
게임 중 active player가 leaveRoom 하면 status ended
게임 중 leaveRoom 후 ended state가 모든 남은 소켓에 broadcast
ended 상태에서 roll/build/startGame command 거절
WebSocket close만으로 room.status가 ended가 되지 않음
leaveRoom 후 reconnect token으로 자동 복구되지 않음
```

### 클라이언트 수동 테스트

```text
Chrome 3개 또는 실제 기기 3개 접속
방장에게만 새 게임 버튼이 보이는지 확인
참가자에게 새 게임 버튼이 숨겨지는지 확인
모든 유저에게 방 나가기 버튼이 보이는지 확인
대기실 참가자가 방 나가기 후 목록에서 제거되는지 확인
대기실 방장이 나가면 방이 종료/삭제되는지 확인
게임 중 참가자 1명이 방 나가기
남은 유저 화면에 종료 안내 표시
나간 유저가 새로고침해도 이전 방으로 자동 복귀하지 않는지 확인
나간 유저에게 최근 방에 다시 참가 버튼이 표시되는지 확인
최근 방에 다시 참가 클릭 시 방 코드/닉네임이 채워지는지 확인
사용자가 참가하기를 눌렀을 때 새 참가자로 다시 들어갈 수 있는지 확인
브라우저 새로고침은 방 나가기로 처리되지 않고 자동 복구되는지 확인
```

### 회귀 테스트

```text
오프라인 새 게임 버튼이 기존처럼 동작
온라인 새로고침 reconnect가 기존처럼 동작
게임 시작 후 참가자들이 같은 board state를 유지
비공개 자원/개발카드 정보가 여전히 필터링됨
```

## 완료 기준

```text
온라인 참가자는 새 게임 버튼을 볼 수 없다.
온라인 방장은 새 게임 버튼을 볼 수 있지만 로컬 오프라인 reset을 직접 실행하지 않는다.
모든 온라인 유저는 방 나가기를 할 수 있다.
방 나가기 후 자동 재접속 identity와 URL room query가 정리된다.
방 나가기 후 새로고침해도 자동으로 이전 방에 접속되지 않는다.
방 나가기 후 최근 방에 다시 참가 버튼으로만 수동 재참가할 수 있다.
게임 중 인원이 3명 미만이 되면 모든 남은 유저에게 게임 종료 상태가 동기화된다.
방장이 나가거나 active player가 나가는 경우 종료 정책이 일관되게 적용된다.
브라우저 새로고침/일시 끊김은 명시적 나가기로 오판하지 않는다.
ended 상태에서 게임 command는 거절된다.
오프라인 새 게임 버튼은 기존처럼 동작한다.
```

## 구현 우선순위

1. 클라이언트 버튼 정책 정리
2. 방 나가기 후 identity/query 정리
3. 최근 방에 다시 참가 버튼
4. 서버 leaveRoom 게임 중 처리
5. ended 상태 모델과 broadcast
6. ended 클라이언트 표시
7. 자동/수동 테스트

## 다음 단계 연결

5-1 완료 후 6단계 초기 배치 구현으로 넘어간다.

6단계 이후의 모든 게임 command는 다음 상태를 먼저 확인해야 한다.

```text
room.status === "playing"
room.status === "ended"이면 거절
요청 플레이어가 left 상태이면 거절
```
