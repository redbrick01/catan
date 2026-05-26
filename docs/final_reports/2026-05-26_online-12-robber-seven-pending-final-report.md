# 온라인 12단계 7/강도/pending action 최종 보고서

작성일: 2026-05-26

## 관련 문서

- `catan_implementation_process_guideline.md`
- `docs/implementation_plans/2026-05-26_online-12-robber-seven-pending-plan.md`
- `docs/test_plans/2026-05-26_online-12-robber-seven-pending-test-plan.md`

## 변경 파일

- `server.js`
- `script.js`
- `scripts/online-12-robber-seven-pending-ws-test.js`
- `scripts/online-11-development-cards-ws-test.js`
- `docs/implementation_plans/2026-05-26_online-12-robber-seven-pending-plan.md`
- `docs/test_plans/2026-05-26_online-12-robber-seven-pending-test-plan.md`
- `docs/final_reports/2026-05-26_online-12-robber-seven-pending-final-report.md`

## 구현 요약

온라인 12단계 7/강도 흐름을 서버 권위 `game.pendingAction` 기준으로 구현했다. 클라이언트에는 내부 raw `pendingAction`을 직접 노출하지 않고 viewer별 `pendingActionView`만 전달한다. 기존 `pendingFreeRoads/freeRoadOwnerSeat` roadBuilding pending은 그대로 유지했고 12단계 pendingAction으로 통합하지 않았다.

## 서버 구현

- `game.pendingAction` 추가
  - `discardForSeven`
  - `moveRobber`
  - `chooseRobberVictim`
- `lastRobberResult`와 viewer별 결과 필터링 추가
  - actor/victim: 약탈 resource 표시
  - others: resource `null`
- `discardForSeven` command 추가
  - discard 대상자만 가능
  - 정확한 수량만 허용
  - 보유량 초과 거절
  - 모든 discard 완료 후 `moveRobber` pending 전환
- `moveRobber` command 추가
  - actor만 가능
  - 현재 robberTile과 같은 타일 거절
  - 피해자 후보 0명: `NO_VICTIM` 기록 후 pending 종료
  - 피해자 후보 1명: 서버가 카드 단위 pool 기준으로 자동 무작위 약탈
  - 피해자 후보 2명 이상: `chooseRobberVictim` pending 전환
- `chooseRobberVictim` command 추가
  - `victimSeatIndex` 기준 선택
  - 후보가 아니거나 자원이 없는 victim 거절
  - 성공 시 서버가 무작위 약탈 후 pending 종료
- 주사위 7 처리
  - 생산 없음
  - 8장 이상 보유 플레이어 discard pending 생성
  - discard 대상이 없으면 바로 `moveRobber` pending 생성
- 기사 카드 처리
  - discard 없이 바로 `moveRobber` pending 생성
  - 기존 knights/largestArmy/usedDevThisTurn 동작 유지
- pending 중 진행 command 차단
  - `rollDice`, `endTurn`, 건설, 은행 교환, 플레이어 교환, 개발 카드 구매/사용, 무료 도로 배치
- 방 종료 시 pending 관련 상태 정리
- 강도 위치 타일은 기존 생산 helper에서 계속 생산 제외

## 클라이언트 구현

- 온라인 match hydrate에서 `pendingActionView`, `lastRobberResult`를 반영한다.
- `pendingActionView.type === discardForSeven`
  - 대상자는 자원 선택 모달 표시
  - 비대상자는 대기 모달 표시
- `pendingActionView.type === moveRobber`
  - actor는 강도 이동 안내와 보드 클릭/드래그로 `moveRobber` 전송
  - 비actor는 대기 모달 표시
- `pendingActionView.type === chooseRobberVictim`
  - actor에게 victim 선택 모달 표시
  - 비actor는 대기 모달 표시
- `lastRobberResult.id` 기준으로 약탈 결과 모달 중복 표시를 방지한다.
- pending 중 일반 roll/end/build/trade/dev command 버튼/동작은 차단된다.
- disconnect/reconnect 대기 모달 우선순위는 기존 5-2 정책을 유지한다.

## 테스트 결과

통과:

```text
node --check server.js
node --check script.js
node --check scripts/online-12-robber-seven-pending-ws-test.js
node --check scripts/online-11-development-cards-ws-test.js
node scripts/online-12-robber-seven-pending-ws-test.js
node scripts/online-11-development-cards-ws-test.js
node scripts/online-10-player-trade-ws-test.js
```

검증된 항목:

- 주사위 7 discard pending 생성
- 7장 이하 보유 플레이어 discard 제외
- discard 수량 검증
- 모든 discard 완료 후 `moveRobber` 전환
- pending 중 `endTurn` 차단
- 현재 robberTile 이동 거절
- 피해자 0명 `NO_VICTIM`
- 피해자 1명 자동 무작위 약탈
- 피해자 2명 이상 `chooseRobberVictim`
- `victimSeatIndex` 기반 선택
- 약탈 결과 privacy
- raw `pendingAction` 미노출 및 `pendingActionView` 사용
- robberTile 생산 차단
- knight source는 discard 없이 robber pending 진입
- 11단계 개발 카드 회귀 통과
- 10단계 플레이어 교환 회귀 통과

## 수행하지 못한 테스트

실제 브라우저 3개/LAN 수동 테스트는 수행하지 못했다. 다음 항목은 브라우저에서 직접 확인이 필요하다.

- discard 대상자/비대상자 모달 표시 UX
- 강도 이동 actor/비actor UI 표시
- 피해자 선택 모달 레이아웃
- 약탈 결과 모달이 새로고침/재접속 후 반복 표시되지 않는지
- pending actor 새로고침 후 같은 pending UI 복구
- pending 중 disconnect 시 5-2 재접속 대기 모달 우선 표시
- 오프라인 7/강도 기존 동작 유지

## 남은 위험

- 실제 브라우저 모달 레이아웃은 자동 WebSocket 테스트로 검증하지 못했다.
- `lastRobberResult.id` 중복 표시 방지는 클라이언트 메모리 기준이라, 완전 새 세션에서는 결과가 다시 보일 수 있다. 계획서의 새로고침/재접속 수동 검증 항목으로 남겼다.
- 12단계에서는 roadBuilding pending과 pendingAction을 통합하지 않았으므로, 이후 공통 pendingAction 리팩터링을 진행할 때 roadBuilding과 충돌하지 않게 별도 설계가 필요하다.

## 최종 판단

완료.
