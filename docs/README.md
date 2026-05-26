# Katan 문서 허브

이 디렉터리는 Katan 프로젝트의 기능 설명, 구현 계획, 테스트 계획, 최종 보고서를 보관합니다. 기존 문서는 날짜와 작업 단계 기준으로 작성되어 있어 추적에는 좋지만, 처음 보는 사람이 기능별 맥락을 잡기 어렵습니다. 그래서 기능별 진입 문서를 `docs/features`에 추가해 관련 문서를 다시 묶었습니다.

## 먼저 읽을 문서

1. [루트 README](../README.md)
2. [프로젝트 진행 상황과 발전 로드맵](project-status-and-roadmap.md)
3. [개발 프로세스](features/development-process.md)
4. [오프라인 플레이와 규칙 정확도](features/offline-play.md)
5. [온라인 멀티플레이](features/online-multiplayer.md)
6. [봇 플레이어](features/bot-players.md)
7. [테스트와 검증](features/testing-and-quality.md)

## 기능별 문서 묶음

| 기능 영역 | 설명 | 진입 문서 |
| --- | --- | --- |
| 오프라인 플레이 | 기본 카탄 규칙, 보드, 턴, 건설, 교역, 개발 카드, 승점 | [offline-play.md](features/offline-play.md) |
| 온라인 멀티플레이 | LAN 방, WebSocket, 서버 권위 상태, 재접속, 비공개 정보 | [online-multiplayer.md](features/online-multiplayer.md) |
| 봇 플레이어 | 봇 추가/제거, 자동 턴, 초기 배치, 기본 행동, pending 처리 | [bot-players.md](features/bot-players.md) |
| UI와 플레이 보조 | 모드 선택, 로비, 보드 표시, 카드/자원 패널, 교환 UX | [ui-and-play-assists.md](features/ui-and-play-assists.md) |
| 테스트와 품질 | 자동 테스트, 수동 테스트, 회귀 범위, known issues | [testing-and-quality.md](features/testing-and-quality.md) |
| 개발 프로세스 | 계획, 구현, 테스트, 최종 보고서 작성 규칙 | [development-process.md](features/development-process.md) |

## 최근 단위 개발

- [턴 안내 시각 효과 계획](implementation_plans/2026-05-27_turn-guidance-visual-effects-plan.md)
- [턴 안내 시각 효과 테스트 계획](test_plans/2026-05-27_turn-guidance-visual-effects-test-plan.md)
- [턴 안내 시각 효과 최종 보고서](final_reports/2026-05-27_turn-guidance-visual-effects-final-report.md)

## 현재 상태와 로드맵

현재까지 구현된 기능, 검증 상태, 남은 제한, 후속 발전 방향은 [프로젝트 진행 상황과 발전 로드맵](project-status-and-roadmap.md)에 정리합니다.

## 기존 문서 보관 방식

기존 산출물은 아래 디렉터리에 그대로 유지합니다.

```text
docs/implementation_plans/  기능 구현 전 계획과 범위
docs/test_plans/            테스트 계획, 테스트 결과, 스크린샷, 로그
docs/final_reports/         작업 완료 보고서와 검증 요약
docs/known_issues/          남은 문제, 제한 사항, 후속 권장 작업
```

루트의 기준 문서는 프로젝트 전체의 규칙과 작업 원칙을 담고 있습니다.

```text
catan_detailed_rules.md
catan_project_rule_gap_analysis.md
catan_implementation_process_guideline.md
catan_bot_development_process_guideline.md
catan_playbot_reference_guideline.md
```

## 문서 작성 규칙

- 새 기능은 먼저 `docs/implementation_plans`에 구현 계획을 작성합니다.
- 구현 후 `docs/test_plans`에 테스트 계획과 결과를 남깁니다.
- 완료 시 `docs/final_reports`에 최종 보고서를 작성합니다.
- 기능 상태가 바뀌면 `docs/features`의 해당 기능 문서를 갱신합니다.
- 알려진 제한이나 미검증 항목은 `docs/known_issues`에 남깁니다.
