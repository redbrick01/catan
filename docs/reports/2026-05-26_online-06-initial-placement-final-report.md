# 온라인 모드 6단계 구현 보고서

## 작업명

온라인 초기 배치 서버 권위 command 구현

## 관련 문서

```text
docs/guides/development-process-guideline.md
docs/plans/2026-05-26_online-06-initial-placement-plan.md
docs/tests/2026-05-26_online-06-initial-placement-test-plan.md
```

## 변경 파일

```text
server.js
script.js
docs/plans/2026-05-26_online-06-initial-placement-plan.md
docs/tests/2026-05-26_online-06-initial-placement-test-plan.md
docs/reports/2026-05-26_online-06-initial-placement-final-report.md
```

## 구현 요약

온라인 초기 배치를 서버 권위 command로 전환했다. 온라인 상태에서 보드의 마을/도로 클릭은 로컬 `buildSettlement`/`buildRoad`로 상태를 직접 바꾸지 않고, `placeInitialSettlement` 또는 `placeInitialRoad` command를 서버로 보낸다. 서버는 차례, 위치, 거리 규칙, pendingSettlement, 연결 도로, 재접속 대기, ended 상태를 검증한 뒤 viewer별 `matchState`를 broadcast한다.

## 서버 반영

```text
1. placeInitialSettlement command 추가
2. placeInitialRoad command 추가
3. 초기 배치 command 공통 검증 추가
   - room 존재
   - room.status=playing
   - ended 방 거절
   - playerId/playerToken 인증
   - left player 거절
   - connected=false player 존재 시 ROOM_NOT_READY 거절
   - matchState 존재
   - phase=setup1/setup2
   - 현재 setupIndex 플레이어만 허용
4. settlement 검증 추가
   - vertexId 유효성
   - pendingSettlement=null
   - vertex 미점유
   - 인접 vertex 점유 없음
   - 남은 settlement 말 존재
5. road 검증 추가
   - edgeId 유효성
   - pendingSettlement 존재
   - edge 미점유
   - pendingSettlement와 연결된 edge
   - 남은 road 말 존재
6. setup2 road 완료 시 시작 자원 지급
7. setup1 순서 0 -> 1 -> 2/3 진행
8. setup2 순서 역순 진행
9. setup2 마지막 road 완료 시 phase=play, active=0
10. 성공 ack 후 viewer별 state broadcast
```

## 클라이언트 반영

```text
1. initialSettlementPlaced, initialRoadPlaced ack 처리 추가
2. 온라인 초기 배치 helper 추가
   - isOnlineInitialSetup
   - isMyOnlineInitialSetupTurn
   - canPlaceOnlineInitialSettlement
   - canPlaceOnlineInitialRoad
   - placeOnlineInitialSettlement
   - placeOnlineInitialRoad
3. 온라인 초기 배치 중 vertex click은 placeInitialSettlement command 전송
4. 온라인 초기 배치 중 edge click은 placeInitialRoad command 전송
5. 온라인 초기 배치 buildable hint는 내 차례/마을 먼저/연결 도로 조건을 반영
6. 서버 거절 메시지를 addLog로 표시
7. 재접속 대기/ended 상태에서 배치 조작 차단
8. guide 문구에 현재 초기 배치 차례와 내 차례 여부 표시
9. 오프라인 초기 배치 로컬 흐름은 유지
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
- 정상 3인 방 startGame 후 setup1 진입
- 잘못된 차례 placeInitialSettlement 거절
- 마을 없이 placeInitialRoad 거절
- 정상 placeInitialSettlement 성공
- pendingSettlement와 연결되지 않은 road 거절
- 실제 차례에서 거리 규칙 위반 settlement가 DISTANCE_RULE로 거절
- setup1 0 -> 1 -> 2 진행
- setup2 2 -> 1 -> 0 진행
- 전체 초기 배치 완료 후 phase=play 진입
- setup2 시작 자원 지급
- viewer 본인 resources 상세 표시
- 상대 resources 상세 미노출
- connected=false 유저 존재 시 ROOM_NOT_READY 거절
- ended 방 placeInitialSettlement ROOM_ENDED 거절
```

브라우저 스모크 테스트:

```text
결과: 통과

검증 URL:
http://127.0.0.1:4173/

검증 항목:
- 페이지 로드
- 모드 선택 화면 표시
- board 영역 존재
- guide 영역 존재
- 온라인 방 나가기 버튼 DOM 존재
```

## 통과한 항목

```text
온라인 초기 배치 서버 command 처리
setup1/setup2 순서 진행
pendingSettlement 기반 마을 먼저/도로 다음 강제
현재 setupIndex 플레이어만 배치 가능
유효하지 않거나 점유된 위치 거절
거리 규칙 위반 거절
pendingSettlement와 연결되지 않은 도로 거절
초기 배치 비용 차감 없음
setup2 시작 자원 지급
초기 배치 완료 후 play phase 전환
viewer별 matchState broadcast
상대 자원 상세 미노출
온라인 로컬 직접 배치 방지
재접속 대기/ended 상태 command 거절
오프라인 모드 유지
```

## 수행하지 못한 항목

```text
실제 Chrome 3개 또는 실제 기기 3개로 마우스 클릭 기반 전체 초기 배치 수동 검증은 수행하지 못했다.
다중 브라우저에서 buildable 하이라이트가 기대대로 보이는지 시각 검증은 수동 테스트가 필요하다.
실제 새로고침 후 초기 배치 중 reconnect UI 복구는 WebSocket 상태 검증으로 대체했고, 브라우저 수동 테스트가 필요하다.
```

## 남은 위험

```text
온라인 초기 배치 중 build action 버튼은 비활성화되어 있지만 selectedAction은 서버 state에 맞춰 내부적으로 전환된다. 실제 UI 클릭 흐름에서 혼란이 없는지 수동 확인이 필요하다.
브라우저별 WebSocket close/reconnect 타이밍에 따라 재접속 직후 command가 일시적으로 ROOM_NOT_READY로 거절될 수 있다.
일반 건설 command는 아직 서버 권위로 구현되지 않았으므로 play phase 이후 건설은 후속 단계에서 막거나 구현해야 한다.
```

## 후속 작업

```text
1. 실제 다중 브라우저에서 초기 배치 클릭 UX를 검증한다.
2. 7단계에서 주사위 굴림, 자원 생산, 턴 종료를 서버 권위 command로 구현한다.
3. play phase 이후 일반 건설 command 구현 전까지 온라인 로컬 조작 차단을 유지한다.
4. 초기 배치 중 reconnect 후 내 차례 표시/하이라이트를 추가 수동 검증한다.
```

## 최종 판단

완료
