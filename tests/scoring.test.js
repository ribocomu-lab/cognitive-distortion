/**
 * 채점 함수, 경계값 및 데이터 무결성 검증 테스트
 * 실행: node tests/scoring.test.js
 */
const assert = require("node:assert/strict");
const data = require("../assets/js/data.js");

const {
  TYPES,
  QUESTIONS,
  scoreByType,
  totalScore,
  level,
  parseAnswerString,
  encodeAnswerString
} = data;

function runTests() {
  // 1. 기본 구조 검증 (10개 유형, 30문항)
  assert.equal(TYPES.length, 10, "유형은 정확히 10개여야 합니다.");
  assert.equal(QUESTIONS.length, 30, "문항은 정확히 30개여야 합니다.");

  TYPES.forEach((type, index) => {
    assert.equal(type.id, index + 1);
    assert.equal(type.items.length, 3, `${type.name} 문항 수는 3개여야 합니다.`);
    type.items.forEach((itemId) => {
      const q = QUESTIONS.find((item) => item.id === itemId);
      assert.ok(q, `문항 ${itemId}번이 존재해야 합니다.`);
      assert.equal(q.typeId, type.id, `문항 ${itemId}번의 유형 ID가 일치해야 합니다.`);
    });
  });

  // 2. 전 문항 0점 / 전 문항 4점 검증
  const allZeros = Array(30).fill(0);
  assert.equal(totalScore(allZeros), 0);
  assert.equal(level(totalScore(allZeros), "total").shortLabel, "거의 없음");
  scoreByType(allZeros).forEach((t) => {
    assert.equal(t.score, 0);
    assert.equal(t.level.label, "약함");
  });

  const allFours = Array(30).fill(4);
  assert.equal(totalScore(allFours), 120);
  assert.equal(level(totalScore(allFours), "total").shortLabel, "매우 강함");
  scoreByType(allFours).forEach((t) => {
    assert.equal(t.score, 12);
    assert.equal(t.level.label, "강함");
  });

  // 3. 유형 점수 경계값 검증 (0, 6/7, 9/10, 12)
  assert.equal(level(0, "type").label, "약함");
  assert.equal(level(6, "type").label, "약함");
  assert.equal(level(7, "type").label, "보통");
  assert.equal(level(9, "type").label, "보통");
  assert.equal(level(10, "type").label, "강함");
  assert.equal(level(12, "type").label, "강함");

  // 4. 종합 점수 경계값 검증 (0, 45/46, 70/71, 95/96, 120)
  assert.equal(level(0, "total").shortLabel, "거의 없음");
  assert.equal(level(45, "total").shortLabel, "거의 없음");
  assert.equal(level(46, "total").shortLabel, "약간 있음");
  assert.equal(level(70, "total").shortLabel, "약간 있음");
  assert.equal(level(71, "total").shortLabel, "다소 강함");
  assert.equal(level(95, "total").shortLabel, "다소 강함");
  assert.equal(level(96, "total").shortLabel, "매우 강함");
  assert.equal(level(120, "total").shortLabel, "매우 강함");

  // 기본 인자(mode 생략 시 total 기준 동작) 확인
  assert.equal(level(45).shortLabel, "거의 없음");
  assert.equal(level(46).shortLabel, "약간 있음");
  assert.equal(level(70).shortLabel, "약간 있음");
  assert.equal(level(71).shortLabel, "다소 강함");
  assert.equal(level(95).shortLabel, "다소 강함");
  assert.equal(level(96).shortLabel, "매우 강함");

  // 범위 밖 점수 예외 처리 확인
  assert.throws(() => level(-1, "type"), RangeError);
  assert.throws(() => level(13, "type"), RangeError);
  assert.throws(() => level(-1, "total"), RangeError);
  assert.throws(() => level(121, "total"), RangeError);

  // 5. 개별 유형 합산 정확성 검증
  const pattern = [
    4, 4, 4, // 유형 1: 12 (강함)
    3, 3, 3, // 유형 2: 9  (보통)
    3, 2, 2, // 유형 3: 7  (보통)
    2, 2, 2, // 유형 4: 6  (약함)
    0, 0, 0, // 유형 5: 0  (약함)
    4, 3, 3, // 유형 6: 10 (강함)
    1, 1, 1, // 유형 7: 3  (약함)
    2, 3, 2, // 유형 8: 7  (보통)
    4, 4, 3, // 유형 9: 11 (강함)
    1, 2, 3  // 유형 10: 6 (약함)
  ];
  const byType = scoreByType(pattern);
  const expectedScores = [12, 9, 7, 6, 0, 10, 3, 7, 11, 6];
  const expectedLabels = [
    "강함", "보통", "보통", "약함", "약함",
    "강함", "약함", "보통", "강함", "약함"
  ];
  byType.forEach((item, idx) => {
    assert.equal(item.score, expectedScores[idx], `유형 ${idx + 1} 점수 불일치`);
    assert.equal(item.level.label, expectedLabels[idx], `유형 ${idx + 1} 등급 불일치`);
  });
  assert.equal(totalScore(pattern), 71);
  assert.equal(level(totalScore(pattern)).shortLabel, "다소 강함");

  // 6. URL 쿼리 인코딩/디코딩 검증
  const encoded = encodeAnswerString(pattern);
  assert.equal(encoded.length, 30);
  assert.deepEqual(parseAnswerString(encoded), pattern);
  assert.equal(parseAnswerString(""), null);
  assert.equal(parseAnswerString("0123"), null);
  assert.equal(parseAnswerString("5".repeat(30)), null);
  assert.equal(parseAnswerString("a".repeat(30)), null);

  // 7. 결과 해설 분량 검증 (유형당 600~900자 기준 확인)
  console.log("--- 유형별 결과 해설 글자 수 점검 ---");
  TYPES.forEach((type) => {
    const exp = type.explanation;
    assert.ok(exp.levelIntro.high && exp.levelIntro.moderate && exp.levelIntro.low);
    assert.ok(Array.isArray(exp.examples) && exp.examples.length >= 2 && exp.examples.length <= 3);
    assert.ok(Array.isArray(exp.tips) && exp.tips.length === 3);

    const coreText = [
      exp.summary,
      exp.examples.join(" "),
      exp.impact,
      exp.tips.join(" ")
    ].join(" ");

    ["high", "moderate", "low"].forEach((lvlKey) => {
      const fullRenderedText = exp.levelIntro[lvlKey] + " " + coreText;
      const len = fullRenderedText.length;
      assert.ok(
        len >= 600 && len <= 900,
        `${type.name}(${lvlKey}) 해설 분량(${len}자)이 600~900자 범위를 벗어났습니다.`
      );
    });
    console.log(
      `  ${type.symbol} ${type.name}: 본문 ${coreText.length}자 / 도입문 포함 ${(exp.levelIntro.high + " " + coreText).length}자`
    );
  });

  console.log("✅ 모든 채점·경계값·해설 분량 테스트를 통과했습니다.");
}

runTests();
