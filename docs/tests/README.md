# 테스트 문서

이 폴더는 테스트 계획, 테스트 결과, 감사 문서를 보관한다. 스크린샷과 JSON 로그는 `artifacts/`에 둔다.

## 파일명

```text
YYYY-MM-DD_<area>-<sequence>-<short-title>-test-plan.md
YYYY-MM-DD_<area>-<short-title>-test-result.md
YYYY-MM-DD_<area>-<short-title>-audit.md
```

## 산출물 위치

```text
docs/tests/           Markdown 테스트 문서
docs/tests/artifacts/ 스크린샷, 콘솔 로그, JSON 결과
```

## 작성 기준

테스트 문서는 수행한 검증과 수행하지 못한 검증을 모두 적는다. 미검증 항목은 숨기지 않고 해당 테스트 문서 또는 `docs/issues/`에 남긴다.
