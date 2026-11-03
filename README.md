# 인지 왜곡 진단 테스트

일상 속 30개 문항으로 나의 10가지 생각 습관(인지 왜곡)을 점검하는 무서버·정적 웹사이트입니다. 인지 부하를 줄이기 위해 불필요한 탐색 메뉴와 부가 콘텐츠를 덜어내고, **한 번에 한 문항씩** 집중해서 답한 뒤 핵심 결과만 간결하게 확인할 수 있도록 구성했습니다.

## 폴더 구조
```text
/
├─ index.html              # 문항 집중 테스트 (메인 진입점)
├─ test.html               # 문항 집중 테스트 (직접 링크 호환)
├─ result.html             # 진단 결과 및 유형별 요약·실천 팁
├─ assets/
│  ├─ css/style.css        # 라이트/다크 모드 반응형 스타일시트
│  ├─ og-placeholder.svg   # OG 공유 이미지
│  └─ js/
│     ├─ data.js           # 모든 문항·유형·해설 텍스트 및 순수 채점 함수
│     ├─ test.js           # 단일 문항 단계별 응답 스크립트
│     └─ result.js         # 결과 렌더링 및 레이더 차트 스크립트
├─ tests/
│  └─ scoring.test.js      # 채점 함수 및 경계값 검증 스크립트
└─ README.md
```

## 로컬 실행 방법
```bash
python3 -m http.server 8080
```
브라우저에서 `http://127.0.0.1:8080`에 접속하거나, `index.html` 파일을 직접 열어도 동작합니다.

## 문구 수정 위치
모든 문항(`QUESTIONS`), 10가지 유형과 해설(`TYPES`), 채점 기준(`TYPE_LEVELS`, `TOTAL_LEVELS`), UI 안내 문구(`UI_TEXT`)는 **`assets/js/data.js`** 한 곳에 모여 있습니다.

## 채점 테스트
```bash
node tests/scoring.test.js
```
