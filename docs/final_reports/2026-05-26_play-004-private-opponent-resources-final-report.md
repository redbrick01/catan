# 최종 보고서: PLAY-004 상대 자원 구성 비공개 처리

작성일: 2026-05-26  
관련 문제 문서: `docs/known_issues/2026-05-26_playability-issues.md`  
관련 계획서: `docs/implementation_plans/2026-05-26_play-004-private-opponent-resources.md`

## 1. 작업 목적

상대 플레이어의 자원 종류별 보유량이 좌석 UI에 그대로 공개되는 문제를 수정한다.

## 2. 변경 파일

- `script.js`
- `styles.css`
- `docs/known_issues/2026-05-26_playability-issues.md`
- `docs/final_reports/2026-05-26_play-004-private-opponent-resources-final-report.md`

## 3. 수정 내용

`renderSeats()`에서 현재 플레이어와 상대 플레이어 표시를 분기했다.

추가한 렌더링 헬퍼:

- `renderResourceBreakdown(player)`: 현재 플레이어의 자원 종류별 수량 표시
- `renderResourceSummary(player)`: 상대 플레이어의 총 자원 수 표시
- `renderDevSummary(player)`: 개발 카드 총 장수 표시

표시 정책:

- 현재 플레이어: 목재, 곡물, 양모, 벽돌, 광석 수량과 개발 카드 총 장수 표시
- 상대 플레이어: 자원 총 장수와 개발 카드 총 장수만 표시

`styles.css`에는 총량 카드용 `.mini-card.summary` 스타일을 추가했다.

## 4. 검증 결과

통과:

- `node --check script.js`
- 브라우저에서 `http://127.0.0.1:4173/?test=1` 로드
- 새 게임 시작 후 좌석 UI 확인
- 현재 플레이어 좌석은 자원 5종과 개발 카드 총 장수를 표시
- 상대 플레이어 좌석은 `자원0`, `개발0` 총량만 표시

수행하지 못한 검증:

- 턴 전환 후 새 현재 플레이어 기준으로 자원 공개 대상이 바뀌는 흐름 검증

이유:

- 현재 초기 배치 상태에서 정식 턴 전환까지 빠르게 이동하는 자동 시나리오가 준비되어 있지 않다.

## 5. 남은 위험

- 이 수정은 공용 화면에서 불필요한 공개를 줄이는 UI 정책 개선이다.
- 같은 화면을 여러 플레이어가 함께 보는 핫시트 환경에서는 현재 플레이어의 손패가 다른 사람에게도 보일 수 있다.
- 교환 모달 안의 상대 보유량 표시는 PLAY-007에서 별도로 다룬다.

## 6. 최종 판단

완료

PLAY-004의 1차 수정 범위인 좌석 UI의 상대 자원 종류별 수량 비공개 처리를 구현했고, 문법 검증과 기본 브라우저 렌더링 검증을 통과했다.
