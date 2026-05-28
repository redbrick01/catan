# Catan 문서 허브

이 디렉터리는 Catan 프로젝트의 문서 기준점입니다. 기능별 현재 상태, 구현 계획, 테스트 결과, 최종 보고서, 규칙 기준 문서를 역할별로 분리해 보관합니다.

## 먼저 읽을 문서

1. [프로젝트 개요](overview/project-overview.md)
2. [프로젝트 진행 상황과 발전 로드맵](overview/status-and-roadmap.md)
3. [개발 프로세스 요약](features/development-process.md)
4. [문서 작성/배치 규칙](guides/documentation-style-guide.md)
5. [오프라인 플레이와 규칙 정확도](features/offline-play.md)
6. [온라인 멀티플레이](features/online-multiplayer.md)
7. [봇 플레이어](features/bot-players.md)
8. [테스트와 검증](features/testing-and-quality.md)

## 디렉터리 구조

| 위치 | 용도 | 현재 수량 |
| --- | --- | ---: |
| `features/` | 기능별 현재 상태와 관련 문서 링크 | 6 |
| `overview/` | 프로젝트 개요, 현황과 로드맵 | 3 |
| `guides/` | 개발/문서화 절차 | 3 |
| `reference/` | 규칙, 규칙 차이 분석, 봇 기준 | 4 |
| `plans/` | 날짜별 구현 계획 | 64 |
| `tests/` | 테스트 계획, 테스트 결과, 감사 문서 | 47 |
| `tests/artifacts/` | 스크린샷, JSON 로그 등 테스트 산출물 | 13 |
| `reports/` | 최종 보고서와 gate summary | 57 |
| `issues/` | 알려진 문제와 후속 조치 | 4 |

## 기능별 진입점

| 기능 영역 | 설명 | 진입 문서 |
| --- | --- | --- |
| 오프라인 플레이 | 보드, 턴, 건설, 교역, 개발 카드, 승점 | [offline-play.md](features/offline-play.md) |
| 온라인 멀티플레이 | LAN 방, WebSocket, 서버 권위 상태, 재접속, 비공개 정보 | [online-multiplayer.md](features/online-multiplayer.md) |
| 봇 플레이어 | 봇 추가/제거, 자동 턴, 초기 배치, 기본 행동, pending 처리 | [bot-players.md](features/bot-players.md) |
| UI와 플레이 보조 | 모드 선택, 로비, 보드 표시, 카드/자원 패널, 교환 UX, 게임 feel | [ui-and-play-assists.md](features/ui-and-play-assists.md) |
| 테스트와 품질 | 자동 테스트, 수동 테스트, 회귀 범위, known issues | [testing-and-quality.md](features/testing-and-quality.md) |
| 개발 프로세스 | 계획, 구현, 테스트, 최종 보고서 작성 규칙 | [development-process.md](features/development-process.md) |

## 기준 문서

| 문서 | 용도 |
| --- | --- |
| [development-process-guideline.md](guides/development-process-guideline.md) | 전체 개발 산출물 절차 |
| [bot-development-process-guideline.md](guides/bot-development-process-guideline.md) | 봇 구현 절차와 검증 기준 |
| [documentation-style-guide.md](guides/documentation-style-guide.md) | 문서 위치, 파일명, 형식 규칙 |
| [catan-detailed-rules.md](reference/catan-detailed-rules.md) | Catan 규칙 상세 기준 |
| [rule-gap-analysis.md](reference/rule-gap-analysis.md) | 구현과 규칙 사이의 차이 분석 |
| [playbot-reference-guideline.md](reference/playbot-reference-guideline.md) | 봇 판단/행동 기준 |

## 최근 단위 개발

- [턴 안내 시각 효과 계획](plans/2026-05-27_turn-guidance-visual-effects-plan.md)
- [턴 안내 시각 효과 테스트 계획](tests/2026-05-27_turn-guidance-visual-effects-test-plan.md)
- [턴 안내 시각 효과 최종 보고서](reports/2026-05-27_turn-guidance-visual-effects-final-report.md)
- [게임 feel 품질 gate 계획](plans/2026-05-27_game-feel-008-quality-gate-plan.md)
- [봇 안정화 회귀 계획](plans/2026-05-26_bot-09-stabilization-regression-plan.md)

## 새 문서 추가 위치

```text
구현 계획       docs/plans/
테스트 계획     docs/tests/
테스트 결과     docs/tests/
스크린샷/로그   docs/tests/artifacts/
최종 보고서     docs/reports/
알려진 문제     docs/issues/
규칙 기준       docs/reference/
작업 절차       docs/guides/
```

기능 상태가 바뀌면 해당 `features/` 문서와 [프로젝트 현황](overview/status-and-roadmap.md)을 함께 갱신합니다.
