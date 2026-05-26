# 온라인 모드 6단계 테스트 계획

## 목적

온라인 초기 배치를 서버 권위 command로 처리하는지 검증한다. 클라이언트 클릭은 서버에 `placeInitialSettlement`/`placeInitialRoad`를 보내고, 서버가 순서/위치/거리/연결/재접속 대기/종료 상태를 모두 검증해야 한다.

## 변경 파일

```text
server.js
script.js
docs/implementation_plans/2026-05-26_online-06-initial-placement-plan.md
```

## 자동 테스트

```text
node --check server.js
node --check script.js
```

WebSocket 자동 테스트:

```text
1. 3인 방 생성, 참가, startGame 후 setup1 phase 진입 확인
2. 현재 setupIndex가 아닌 플레이어의 placeInitialSettlement 거절 확인
3. pendingSettlement 없이 placeInitialRoad 거절 확인
4. 정상 placeInitialSettlement 성공 확인
5. pendingSettlement와 연결되지 않은 placeInitialRoad 거절 확인
6. 실제 차례 플레이어의 거리 규칙 위반 settlement가 DISTANCE_RULE로 거절되는지 확인
7. 3인 setup1 순서 0 -> 1 -> 2 진행 확인
8. 3인 setup2 순서 2 -> 1 -> 0 진행 확인
9. 모든 초기 배치 완료 후 phase=play 진입 확인
10. setup2 마을+도로 완료 후 시작 자원이 지급되는지 확인
11. viewer 본인에게만 resources 상세가 있고 상대에게는 resources 상세가 없는지 확인
12. WebSocket close로 connected=false 유저가 있으면 초기 배치 command가 ROOM_NOT_READY로 거절되는지 확인
13. ended 방에서 초기 배치 command가 ROOM_ENDED로 거절되는지 확인
```

## 브라우저 스모크 테스트

```text
1. http://127.0.0.1:4173/ 접속
2. 페이지 title 확인
3. 모드 선택 화면 표시 확인
4. board, guide 영역 존재 확인
5. 온라인 방 나가기 버튼 DOM 존재 확인
```

## 수동 테스트 필요 항목

```text
1. Chrome 3개 또는 실제 기기 3개로 온라인 방을 만든다.
2. 방장이 게임 시작 후 모든 클라이언트가 같은 보드를 보는지 확인한다.
3. 현재 초기 배치 차례 플레이어 표시가 각 브라우저에서 일치하는지 확인한다.
4. 내 차례가 아닌 브라우저에서 마을/도로 클릭이 반영되지 않고 안내가 표시되는지 확인한다.
5. 내 차례에 마을을 먼저 놓을 수 있는지 확인한다.
6. 마을을 놓기 전 도로 클릭이 불가능한지 확인한다.
7. 마을을 놓은 뒤 해당 마을과 연결된 도로만 선택 가능한지 확인한다.
8. 서버 거절 메시지가 사용자 로그에 표시되는지 확인한다.
9. setup2에서 본인 시작 자원 상세만 표시되고 상대 자원은 count로만 보이는지 확인한다.
10. 새로고침 후 같은 초기 배치 상태로 reconnect되는지 확인한다.
11. 다른 참가자 연결 종료 시 재접속 대기 모달이 뜨고, 배치 command가 진행되지 않는지 확인한다.
12. 끊긴 참가자가 돌아오면 배치가 계속 가능한지 확인한다.
13. 방 나가기 후 ended 상태에서는 배치 조작이 불가능한지 확인한다.
```

## 회귀 테스트

```text
1. 오프라인 초기 배치는 기존 로컬 buildSettlement/buildRoad 흐름으로 동작한다.
2. 오프라인 새 게임은 기존처럼 동작한다.
3. 온라인에서는 로컬 buildSettlement/buildRoad가 직접 상태를 바꾸지 않는다.
4. private view state 필터링이 유지된다.
5. 5-2의 방 나가기/재접속 대기/ended 정책이 유지된다.
```

## 통과 기준

```text
온라인 초기 배치 결과는 서버 state broadcast로만 반영된다.
잘못된 차례, 잘못된 위치, 점유된 위치, 거리 규칙 위반, 연결되지 않은 도로가 거절된다.
setup1/setup2 순서가 인원 수에 맞게 진행된다.
setup2 시작 자원이 서버에서 지급된다.
초기 배치 완료 후 모든 클라이언트가 phase=play를 받는다.
상대 자원 상세가 노출되지 않는다.
재접속 대기/ended/left/인증 실패 상태에서 command가 거절된다.
오프라인 모드는 기존처럼 유지된다.
```
