# 온라인 13 Catan 공식 규칙 감사

작성일: 2026-05-26

## 목적

온라인 Catan 구현이 Catan 공식 규칙과 비교해 누락되었거나 잘못 구현된 부분이 있는지 점검한다.

이 문서는 13단계 안정화의 보조 감사 문서이며, 공식 배포 품질을 목표로 하기보다는 친구들과 공정하게 플레이할 수 있는 규칙 정확도를 확인하는 데 목적이 있다.

## 참고 자료

```text
Catan 공식 Game Rules/Rulebook
Catan 공식 Basegame FAQ
Catan 공식 다운로드 PDF
```

감사 시 실제 사용한 URL과 확인 날짜를 아래에 기록한다.

```text
자료명:
URL:
확인일:
참고한 규칙:
```

## 분류 기준

```text
IMPLEMENTED: 공식 규칙과 일치하고 테스트 또는 수동 검증 완료
PARTIAL: 일부 구현됐지만 검증 부족 또는 edge case 부족
INTENTIONAL_DEFERRED: 개인용/LAN 범위에서 뒤로 미룬 항목
INTENTIONAL_DIFFERENCE: 공식 규칙과 다르지만 개인용 편의상 의도한 차이
BUG: 공식 규칙과 다르고 게임 진행/공정성에 영향을 주는 문제
NOT_APPLICABLE: 현재 앱 범위에 없는 확장/시나리오 규칙
```

## 감사 체크리스트

| 영역 | 공식 규칙 확인 항목 | 구현 상태 | 검증 근거 | 심각도 | 후속 조치 |
| --- | --- | --- | --- | --- | --- |
| 초기 배치 | 순방향/역방향 배치, 두 번째 마을 초기 자원 지급 |  |  |  |  |
| 턴 순서 | 주사위, 교환, 건설, 개발 카드 타이밍 |  |  |  |  |
| 자원 생산 | 숫자 토큰, 도시 2장, 강도 타일 생산 차단 |  |  |  |  |
| 주사위 7 | 8장 이상 절반 버리기, 강도 이동, 약탈 |  |  |  |  |
| 기사 카드 | 주사위 전/후 사용, discard 없음, 강도 이동/약탈 |  |  |  |  |
| Largest Army | 기사 3장 이상, 더 많은 기사로 탈취, 2점 |  |  |  |  |
| Longest Road | 5개 이상, 상대 건물 차단, 탈취/동률 |  |  |  |  |
| 개발 카드 제한 | 구매 턴 사용 금지, 한 턴 1장, 승점 카드 예외 |  |  |  |  |
| 풍년 | 은행에서 자원 2장 선택, 재고 부족 처리 |  |  |  |  |
| 독점 | 지정 자원 전부 회수, 공개 범위 |  |  |  |  |
| 도로 건설 | 무료 도로 2개, 일반 도로 규칙 적용 |  |  |  |  |
| 승점 카드 | 게임 중 비공개, 승리 시 공개/요약 |  |  |  |  |
| 은행 교환 | 4:1 교환 |  |  |  |  |
| 항구 교환 | 일반 3:1, 특정 2:1 |  |  |  |  |
| 플레이어 거래 | 자원 카드만 거래, 개발 카드 거래 불가 |  |  |  |  |
| 건설 규칙 | 도로 연결, 마을 거리 규칙, 도시 업그레이드 |  |  |  |  |
| 승리 조건 | 자기 턴 10점, 특수 점수 포함 |  |  |  |  |
| 비공개 정보 | 상대 자원/개발 카드/버린 카드/약탈 카드 공개 범위 |  |  |  |  |

## 우선 처리 기준

```text
BUG + P0/P1: 13단계에서 수정하거나 최종 사용 가능 판정을 보류한다.
PARTIAL + P1 후보: 수동 검증을 먼저 수행하고 실패 시 수정한다.
INTENTIONAL_DIFFERENCE: 최종 보고서에 이유를 기록한다.
NOT_APPLICABLE: 확장판/시나리오 규칙이면 처리하지 않는다.
```

## 최종 요약

```text
IMPLEMENTED:
PARTIAL:
INTENTIONAL_DEFERRED:
INTENTIONAL_DIFFERENCE:
BUG:
NOT_APPLICABLE:
최종 판정:
```
# 2026-05-26 13단계 공식 규칙 감사 결과

## 참고 자료

자료명: Catan Game Rules & Almanac  
URL: https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf  
확인일: 2026-05-26  
확인 범위: 기본판 3~4인, 초기 배치, 턴 순서, 생산, 은행 부족, 7/강도, 개발 카드, 거래, 건설, 승리 조건, 비공개 정보

## 감사 요약

| 영역 | 구현 상태 | 검증 근거 | 심각도 | 후속 조치 |
| --- | --- | --- | --- | --- |
| 초기 배치 | IMPLEMENTED | online-06 이후 서버 command, online-08~12 테스트 room setup | - | 실제 3기기 수동 확인 남음 |
| 턴 순서 | IMPLEMENTED | roll/endTurn WebSocket 회귀, active/round 갱신 | - | 없음 |
| 생산 | IMPLEMENTED | settlement 1, city 2, robberTile 제외 | - | 없음 |
| 은행 재고 부족 생산 | FIXED | 13단계에서 부족 자원 다중 생산 차단 수정 및 online-12 테스트 추가 | P1 처리 완료 | 없음 |
| 주사위 7 | IMPLEMENTED | online-12 discard/moveRobber 테스트 | - | 실제 모달 수동 확인 남음 |
| 강도 이동/약탈 | IMPLEMENTED | 0명/1명/2명 이상 victim 테스트, privacy 테스트 | - | 실제 모달 수동 확인 남음 |
| 기사 카드 | IMPLEMENTED | knight -> moveRobber pending, largestArmy 회귀 | - | 없음 |
| Largest Army | IMPLEMENTED | online-11 테스트 | - | 동률/재탈취 추가 edge test는 P2 |
| Longest Road | PARTIAL | 일반/무료 도로 갱신 테스트 | P2 | 복잡한 분기/동률 edge case 추가 감사 필요 |
| 개발 카드 구매/사용 제한 | IMPLEMENTED | online-11 테스트 | - | 없음 |
| 풍년/독점/도로 건설 | IMPLEMENTED | online-11 테스트 | - | 없음 |
| 승점 카드 | IMPLEMENTED | 숨은 점수 winner 반영, victoryDevCount 요약 | - | 없음 |
| 은행/항구 교환 | IMPLEMENTED | online-09 테스트 | - | 3:1/2:1 실제 UI 수동 확인 남음 |
| 플레이어 간 거래 | IMPLEMENTED | online-10/10-1 테스트 | - | 실제 3브라우저 UX 수동 확인 남음 |
| 건설 규칙 | IMPLEMENTED | online-08 테스트 | - | 상대 settlement로 road 차단 edge case는 테스트됨 |
| 승리 조건 | IMPLEMENTED | 건설/개발/longestRoad/largestArmy 테스트 | - | 내 턴 10점 공식 timing edge case 추가 감사 필요 |
| 비공개 정보 | IMPLEMENTED | devDeck/raw pendingAction/opponent dev/resources/robber result privacy 테스트 | - | 브라우저 Network 수동 확인 남음 |

## 13단계에서 수정한 공식 규칙 차이

### 은행 재고 부족 생산

공식 규칙 요지:

```text
특정 자원의 은행 재고가 해당 턴 생산량 전체를 충족하지 못하면, 여러 플레이어가 영향받는 경우 아무도 그 자원을 받지 않는다. 한 플레이어만 영향받는 경우에는 가능한 만큼 받는다.
```

기존 상태:

```text
서버가 vertex 순서대로 가능한 만큼 지급할 수 있어 먼저 순회된 플레이어가 이득을 볼 수 있었다.
```

조치:

```text
server.js distributeResourcesForRoll()을 자원 타입별 demand 수집 후 지급 방식으로 수정했다.
은행 재고가 총 수요보다 적고 affected player가 2명 이상이면 해당 자원 생산을 모두 스킵한다.
```

검증:

```text
scripts/online-12-robber-seven-pending-ws-test.js에 bank shortage multi-player production test 추가.
```

## 남은 감사 항목

P2:

```text
Longest Road 복잡한 분기/루프/동률 공식 edge case 추가 테스트 필요.
실제 브라우저에서 은행/항구 3:1, 2:1 UI 확인 필요.
실제 브라우저에서 playerTrade UX 확인 필요.
실제 브라우저 Network 탭 privacy payload 확인 필요.
```

P3:

```text
Safari 보조 검증 미실행.
모바일 Chrome 레이아웃 미실행.
```

## 최종 요약

IMPLEMENTED:

```text
초기 배치, 생산, 주사위/턴, 기본 건설, 은행/항구 교환, 플레이어 교환, 개발 카드, 7/강도, privacy view, 승리 조건의 주요 온라인 흐름.
```

PARTIAL:

```text
Longest Road 고급 edge case, 실제 브라우저 UX 검증, 모바일/Safari 검증.
```

BUG:

```text
은행 재고 부족 생산 지급 순서 문제 발견 후 13단계에서 수정 완료.
```

최종 판정:

```text
자동 테스트와 코드 감사 기준 P0/P1 없음.
실제 3기기 Chrome 수동 검증은 미실행이므로 실기기 플레이 가능 최종 판정은 보류.
```
