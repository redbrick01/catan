# 오프라인 플레이와 규칙 정확도

## 목적

오프라인 플레이는 이 프로젝트의 기본 게임 엔진입니다. 온라인 모드와 봇 모드도 이 규칙 모델을 기준으로 확장되므로, 보드 생성과 턴 진행, 건설, 교역, 개발 카드, 승점 판정은 여기서 먼저 일관성을 가져야 합니다.

## 현재 지원 범위

- 3~4인 플레이어 설정
- 카탄 기본판 형태의 19개 지형 타일 보드 생성
- 사막과 도둑 초기 배치
- 숫자 칩 배치와 6/8 확률 표시
- 초기 정착지와 도로 배치
- 두 번째 초기 정착지의 시작 자원 지급
- 주사위 굴림과 자원 생산
- 도둑이 있는 지형의 생산 차단
- 7이 나왔을 때 자원 버리기, 도둑 이동, 자원 빼앗기
- 도로, 정착지, 도시 건설
- 은행 자원 재고와 건설 비용 차감
- 은행 4:1 교환과 항구 비율 적용
- 플레이어 간 교환 UX
- 개발 카드 더미, 구매, 사용 제한
- 기사, 승점, 독점, 도로 건설, 풍년 카드
- 최대 기사력과 최장 교역로 보너스
- 공개 승점과 비공개 승점 카드 기반 승리 판정

## 핵심 구현 파일

```text
index.html
styles.css
script.js
```

온라인 모드에서는 `server.js`가 같은 규칙을 서버 권위 방식으로 다시 검증합니다.

## 관련 기준 문서

- [상세 규칙 정리](../../catan_detailed_rules.md)
- [규칙 보완 문서](../../catan_project_rule_gap_analysis.md)
- [개발 프로세스 가이드라인](../../catan_implementation_process_guideline.md)

## 관련 구현 계획

- [Stage 1: 규칙 정확도](../implementation_plans/2026-05-26_stage-1-rule-accuracy.md)
- [Stage 2: 턴과 개발 카드 제한](../implementation_plans/2026-05-26_stage-2-turn-and-dev-limits.md)
- [Stage 3: 개발 카드](../implementation_plans/2026-05-26_stage-3-development-cards.md)
- [Stage 4: 교역과 항구](../implementation_plans/2026-05-26_stage-4-trading-and-harbors.md)
- [Stage 5: 은행 자원 재고](../implementation_plans/2026-05-26_stage-5-bank-resource-stock.md)
- [Stage 6: UI 플레이 보조](../implementation_plans/2026-05-26_stage-6-ui-play-assists.md)
- [정착지 승리 판정](../implementation_plans/2026-05-26_play-001-settlement-win-check.md)
- [최대 기사력 승리 판정](../implementation_plans/2026-05-26_play-002-largest-army-win-check.md)
- [비공개 승점](../implementation_plans/2026-05-26_play-003-private-victory-points.md)
- [상대 자원 비공개](../implementation_plans/2026-05-26_play-004-private-opponent-resources.md)
- [항구 edge 모델](../implementation_plans/2026-05-26_play-005-harbor-edge-model.md)
- [보드 랜덤 밸런스](../implementation_plans/2026-05-26_play-006-board-randomizer-balance.md)
- [플레이어 교환 UX](../implementation_plans/2026-05-26_play-007-player-trade-ux.md)

## 관련 테스트와 보고서

- [전체 기능 테스트 계획](../test_plans/2026-05-26_full-feature-test-plan.md)
- [전체 기능 테스트 실행 보고서](../test_plans/2026-05-26_full-feature-test-run-report.md)
- [Stage 1 최종 보고서](../final_reports/2026-05-26_stage-1-rule-accuracy-final-report.md)
- [Stage 6 최종 보고서](../final_reports/2026-05-26_stage-6-ui-play-assists-final-report.md)
- [플레이어 교환 UX 최종 보고서](../final_reports/2026-05-26_play-007-player-trade-ux-final-report.md)
- [플레이 가능성 known issues](../known_issues/2026-05-26_playability-issues.md)

## 유지보수 체크리스트

- 규칙 변경은 `catan_detailed_rules.md`와 `catan_project_rule_gap_analysis.md` 기준으로 검토합니다.
- 오프라인에서 동작을 바꾸면 온라인 서버 검증 로직과 차이가 생기지 않았는지 확인합니다.
- 비공개 정보 표시 정책은 오프라인 UI와 온라인 private state 필터링을 분리해서 확인합니다.
- 승점 관련 변경은 공개 승점, 비공개 승점 카드, 최대 기사력, 최장 교역로를 함께 점검합니다.

