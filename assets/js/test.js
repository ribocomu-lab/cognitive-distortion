/**
 * 인지 왜곡 진단 테스트 — 한 문항씩 집중해서 답하는 저부하 스크립트 (test.js)
 */
(function () {
  "use strict";

  const data = window.CD_DATA;
  if (!data) {
    return;
  }

  const totalQuestions = data.QUESTIONS.length;
  const answers = new Array(totalQuestions).fill(null);
  let currentIndex = 0;
  let advanceTimer = null;
  let pointerTriggered = false;

  const titleEl = document.getElementById("test-title");
  const guideEl = document.getElementById("test-guide");
  const progressBar = document.getElementById("progress-bar");
  const progressFill = document.getElementById("progress-fill");
  const progressCount = document.getElementById("progress-count");
  const qNumEl = document.getElementById("question-num");
  const qTextEl = document.getElementById("question-text");
  const optionsWrap = document.getElementById("scale-options");
  const poleLeft = document.getElementById("pole-left");
  const poleRight = document.getElementById("pole-right");
  const hintEl = document.getElementById("inline-hint");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const submitBtn = document.getElementById("submit-btn");
  const footnoteEl = document.getElementById("quiet-footnote");
  const formEl = document.getElementById("test-form");

  function padTwo(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function buildScaleRadios() {
    optionsWrap.innerHTML = "";
    data.UI_TEXT.scaleOptions.forEach(function (opt) {
      const label = document.createElement("label");
      label.className = "scale-option-label";
      label.title = opt.label;
      label.addEventListener("pointerdown", function () {
        pointerTriggered = true;
      });

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.className = "scale-radio";
      radio.name = "current-answer";
      radio.value = String(opt.value);
      radio.setAttribute("aria-label", opt.label + " (" + opt.value + "점)");

      radio.addEventListener("change", function () {
        answers[currentIndex] = opt.value;
        hintEl.hidden = true;
        updateControls();

        if (pointerTriggered) {
          pointerTriggered = false;
          if (currentIndex < totalQuestions - 1) {
            if (advanceTimer) window.clearTimeout(advanceTimer);
            advanceTimer = window.setTimeout(function () {
              goToQuestion(currentIndex + 1);
            }, 170);
          }
        }
      });

      const circle = document.createElement("span");
      circle.className = "scale-circle scale-circle--size-" + opt.value;
      circle.setAttribute("aria-hidden", "true");

      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = opt.label;

      label.appendChild(radio);
      label.appendChild(circle);
      label.appendChild(sr);
      optionsWrap.appendChild(label);
    });
  }

  function updateControls() {
    const isLast = currentIndex === totalQuestions - 1;
    const allDone = answers.every(function (v) {
      return v !== null;
    });

    prevBtn.disabled = currentIndex === 0;

    if (isLast || allDone) {
      nextBtn.hidden = isLast;
      nextBtn.disabled = answers[currentIndex] === null;
      submitBtn.hidden = false;
      submitBtn.disabled = !allDone;
    } else {
      submitBtn.hidden = true;
      nextBtn.hidden = false;
      nextBtn.disabled = answers[currentIndex] === null;
    }
  }

  function goToQuestion(index) {
    if (advanceTimer) {
      window.clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    currentIndex = Math.max(0, Math.min(totalQuestions - 1, index));
    const q = data.QUESTIONS[currentIndex];
    const stepNum = currentIndex + 1;

    qNumEl.textContent = padTwo(q.id);
    qTextEl.textContent = q.text;

    const pct = Math.round((stepNum / totalQuestions) * 100);
    progressFill.style.width = pct + "%";
    progressCount.textContent = stepNum + " / " + totalQuestions;
    progressBar.setAttribute("aria-valuenow", String(stepNum));

    const radios = optionsWrap.querySelectorAll('input[name="current-answer"]');
    radios.forEach(function (r) {
      r.checked = answers[currentIndex] !== null && Number(r.value) === answers[currentIndex];
    });

    updateControls();
  }

  function init() {
    document.title = data.UI_TEXT.fullTitle;
    titleEl.textContent = data.UI_TEXT.title;
    guideEl.textContent = data.UI_TEXT.guideText;
    poleLeft.textContent = data.UI_TEXT.leftEndLabel;
    poleRight.textContent = data.UI_TEXT.rightEndLabel;
    prevBtn.textContent = data.UI_TEXT.prevButton;
    nextBtn.textContent = data.UI_TEXT.nextButton;
    submitBtn.textContent = data.UI_TEXT.submitButton;
    footnoteEl.textContent = data.UI_TEXT.quietFootnote;

    buildScaleRadios();
    goToQuestion(0);

    prevBtn.addEventListener("click", function () {
      if (currentIndex > 0) {
        hintEl.hidden = true;
        goToQuestion(currentIndex - 1);
      }
    });

    nextBtn.addEventListener("click", function () {
      if (answers[currentIndex] !== null && currentIndex < totalQuestions - 1) {
        hintEl.hidden = true;
        goToQuestion(currentIndex + 1);
      }
    });

    formEl.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && answers[currentIndex] !== null) {
        if (currentIndex < totalQuestions - 1) {
          event.preventDefault();
          goToQuestion(currentIndex + 1);
        }
      }
    });

    formEl.addEventListener("submit", function (event) {
      event.preventDefault();
      const firstMissing = answers.findIndex(function (v) {
        return v === null;
      });
      if (firstMissing !== -1) {
        hintEl.hidden = false;
        hintEl.textContent = data.UI_TEXT.incompleteHint.replace(
          "{firstQuestion}",
          String(firstMissing + 1)
        );
        goToQuestion(firstMissing);
        return;
      }

      const encoded = data.encodeAnswerString(answers);
      window.location.href = "./result.html?a=" + encodeURIComponent(encoded);
    });
  }

  init();
})();
