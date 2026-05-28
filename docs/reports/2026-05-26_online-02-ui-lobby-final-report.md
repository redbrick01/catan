# 온라인 02 UI/대기실 최종 보고서

작성일: 2026-05-26

## 관련 문서

```text
docs/guides/development-process-guideline.md
docs/plans/2026-05-26_online-00-mvp-roadmap.md
docs/plans/2026-05-26_online-02-ui-lobby-plan.md
docs/reports/2026-05-26_online-01-server-lan-room-final-report.md
docs/tests/2026-05-26_online-02-ui-lobby-test-plan.md
```

## 변경 파일 목록

```text
index.html
script.js
styles.css
docs/plans/2026-05-26_online-02-ui-lobby-plan.md
docs/tests/2026-05-26_online-02-ui-lobby-test-plan.md
docs/tests/artifacts/2026-05-26_online-02-ui-lobby-browser.png
docs/reports/2026-05-26_online-02-ui-lobby-final-report.md
```

## 구현 요약

```text
첫 화면에 오프라인 게임, 온라인 방 만들기, 온라인 방 참가하기 선택 UI를 추가했다.
오프라인 선택 시 기존 플레이어 수/이름 입력과 startGame 흐름으로 진입하도록 유지했다.
온라인 방 만들기/참가 닉네임 입력 UI를 추가했다.
URL의 ?room= 값을 읽어 온라인 참가 화면으로 자동 진입하도록 했다.
WebSocket으로 서버 createRoom/joinRoom을 호출하는 온라인 세션 상태를 추가했다.
클라이언트 요청은 type: "command" + payload.name 형식을 사용하도록 했다.
state 메시지의 top-level revision을 기준으로 온라인 상태를 갱신하도록 했다.
대기실에 방 코드, 공유 URL 후보, 복사 버튼, 참가자 목록, 방장/나/연결 상태를 표시했다.
접속 실패와 참가 실패 안내를 화면 상태 문구로 표시했다.
```

## 범위 준수

```text
게임 시작 서버 명령은 구현하지 않았다.
초기 배치, 주사위, 게임 엔진 서버 이전은 구현하지 않았다.
기존 오프라인 게임 로직은 유지했다.
```

## 테스트 결과

통과:

```text
node --check server.js
node --check script.js
HTTP GET / 200 확인
WebSocket command createRoom/joinRoom 및 top-level revision 확인
브라우저 첫 화면 모드 선택 확인
오프라인 게임 선택 후 기존 게임 시작 확인
온라인 방 만들기 후 대기실 표시 확인
대기실 방 코드, 공유 URL, 복사 버튼, 참가자 목록 확인
?room= URL 접속 시 참가 화면 자동 진입 및 방 코드 자동 입력 확인
원시 WebSocket 참가자 연결 후 방장 대기실 참가자 목록 2/4 갱신 확인
참가 실패(room not found) 안내 확인
서버 미연결 상태에서 접속 실패 안내 확인
브라우저 콘솔 error/warning 없음 확인
```

확인된 UI 스크린샷:

```text
docs/tests/artifacts/2026-05-26_online-02-ui-lobby-browser.png
```

## 특이 사항

```text
Codex 인앱 브라우저가 이 환경에서 실제 탭을 하나만 유지해 두 브라우저 UI를 동시에 비교하지는 못했다.
대신 방장 UI는 브라우저로 확인하고, 두 번째 참가자는 WebSocket 클라이언트로 접속시켜 대기실 실시간 갱신을 확인했다.
실제 다른 LAN 기기에서 Network URL 접속은 아직 수행하지 못했다.
```

## 남은 위험

```text
Windows 방화벽 또는 네트워크 정책이 실제 친구 기기 접속을 막을 수 있다.
재접속 토큰 저장이 없으므로 새로고침하면 같은 플레이어로 복구되지 않는다.
게임 시작은 UI에 비활성 버튼과 안내만 있으며 다음 단계 구현이 필요하다.
```

## 후속 작업

```text
온라인 03 단계에서 프로토콜/상태 동기화 규격을 더 엄격히 정리한다.
실제 LAN 기기 접속 테스트를 수행한다.
온라인 04 이후 단계에서 게임 엔진 서버 이전을 진행한다.
```

## 최종 판단

부분 완료

## 리뷰 피드백 반영 결과

```text
나가기 정책을 "방에서 제거"로 결정했다.
서버에 leaveRoom command를 추가했다.
leaveRoom은 playerId/playerToken 인증을 통과한 본인만 처리한다.
참가자가 나가면 players 배열에서 제거하고 남은 참가자에게 state를 broadcast한다.
방장이 나가면 남은 첫 참가자에게 hostPlayerId를 이전한다.
마지막 참가자가 나가면 방을 rooms Map에서 삭제한다.
클라이언트 나가기 버튼은 leaveRoom을 best-effort로 보낸 뒤 로컬 세션을 정리한다.
게임 시작 버튼에 future-button class를 추가하고 disabled 상태를 muted/dashed 스타일로 조정했다.
```

## 리뷰 피드백 반영 테스트 결과

통과:

```text
node --check server.js
node --check script.js
WebSocket createRoom/joinRoom/leaveRoom 테스트
참가자 leaveRoom 후 방장 클라이언트 state에서 해당 참가자 제거 확인
방장 leaveRoom 후 남은 참가자로 hostPlayerId 이전 확인
마지막 참가자 leaveRoom 후 같은 roomId joinRoom이 room_not_found를 반환하는지 확인
index.html의 lobbyStartButton future-button class 확인
```

## 리뷰 피드백 및 후속 보완 권고

작성일: 2026-05-26

### 긍정적 평가

```text
개발 프로세스 가이드라인의 문서 흐름을 잘 지켰다.
구현 계획서 갱신, 테스트 계획서 작성, 브라우저 스크린샷, 최종 보고서가 모두 있다.
2단계 범위를 UI/대기실에 잘 제한했다.
게임 시작, 초기 배치, 주사위, 게임 엔진 이전을 이번 단계에서 구현하지 않은 점이 적절하다.
1단계 피드백이었던 type: "command" + payload.name 요청 형식을 클라이언트에 반영했다.
서버도 command 형식을 받을 수 있게 되어 다음 단계와의 연결성이 좋아졌다.
state 메시지의 top-level revision을 기준으로 처리하도록 한 점도 적절하다.
오프라인 모드 회귀를 확인했고, 수행하지 못한 검증을 숨기지 않았다.
```

### 보완이 필요한 점

```text
나가기 버튼의 의미가 아직 애매하다.
현재 UI에서 나가기를 누르면 클라이언트는 소켓을 닫고 모드 선택으로 돌아가지만, 서버에서는 플레이어가 방에서 제거되지 않고 connected=false로 남는 구조다.
친구 입장에서는 "나간 플레이어"가 참가자 목록에 끊김 상태로 계속 남아 보일 수 있다.
다음 단계 전에 나가기 정책을 정해야 한다.
선택지는 "나가기=연결 끊김 처리" 또는 "나가기=방에서 제거"이다.
```

```text
게임 시작 버튼은 disabled 상태이지만 시각적으로는 눌러질 수 있는 버튼처럼 보인다.
현재 단계에서는 게임 시작이 구현되지 않았으므로 더 명확하게 비활성/준비 중 상태로 보이게 하는 편이 좋다.
예: "게임 시작은 다음 단계에서 구현됩니다" 안내를 버튼 근처에 더 강하게 표시하거나, 버튼 스타일을 더 muted 처리한다.
```

```text
다중 UI 검증은 아직 완전하지 않다.
두 번째 참가자는 실제 브라우저 UI가 아니라 원시 WebSocket 클라이언트로 접속시켰다.
서버 동기화 검증으로는 의미가 있지만, 실제 친구가 보는 참가 화면까지 완전히 검증한 것은 아니다.
따라서 최종 판단을 부분 완료로 둔 것은 적절하다.
```

```text
실제 LAN 기기 접속 테스트가 1단계에 이어 2단계에서도 수행되지 못했다.
온라인 03 또는 04로 넘어가기 전에 휴대폰이나 다른 PC로 Network URL 접속 테스트를 한 번 수행하는 것이 좋다.
이 검증을 계속 미루면 서버와 UI가 맞더라도 실제 친구 접속 문제가 뒤늦게 발견될 수 있다.
```

```text
재접속은 아직 지원하지 않는다.
현재는 새로고침하면 같은 플레이어로 복구되지 않는다.
3단계 프로토콜/동기화 정리에서 reconnect 메시지와 localStorage 저장 시점을 함께 설계하는 것이 좋다.
```

### 다음 단계 전 권장 조치

```text
1. 나가기/연결 끊김 정책을 결정한다.
2. 게임 시작 버튼의 비활성 상태를 더 명확하게 보이도록 조정할지 검토한다.
3. 실제 브라우저 2개 또는 다른 기기에서 참가자 UI 동기화를 검증한다.
4. 실제 LAN 기기에서 Network URL 접속 테스트를 수행한다.
5. 온라인 03 단계에서 reconnect 메시지와 localStorage identity 저장 흐름을 함께 정리한다.
```

## 실제 기기 접속 테스트 후속 기록

작성일: 2026-05-26

관련 문서:

```text
docs/tests/2026-05-26_online-device-connection-test-result.md
```

결과:

```text
MacBook에서 http://100.88.125.81:4173/ 접속 및 방 참가 성공을 확인했다.
iPhone Chrome에서 http://100.88.125.81:4173/ 접속 및 방 참가 성공을 확인했다.
```

운영 권장:

```text
접속 주소는 http://100.88.125.81:4173/ 로 통일한다.
권장 브라우저는 Chrome으로 둔다.
iPhone Safari는 방 참가 흐름이 불안정하므로 후순위 확인 대상으로 남긴다.
```

판단:

```text
2단계에서 남아 있던 실제 기기 접속/방 참가 검증은 100.88.125.81 + Chrome 기준으로 완료했다.
```
