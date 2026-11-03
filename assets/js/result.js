/**
 * 인지 왜곡 진단 테스트 — 저부하 결과 페이지 스크립트 (result.js)
 */
(function () {
  "use strict";

  const data = window.CD_DATA;
  if (!data) {
    return;
  }

  let radarChartInstance = null;

  function createChevronSvg() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "chevron-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    const polyline = document.createElementNS(ns, "polyline");
    polyline.setAttribute("points", "6 9 12 15 18 9");
    svg.appendChild(polyline);
    return svg;
  }

  function getChartColors() {
    const styles = window.getComputedStyle(document.documentElement);
    return {
      grid: styles.getPropertyValue("--chart-grid").trim() || "rgba(0,0,0,0.12)",
      angle: styles.getPropertyValue("--chart-angle").trim() || "rgba(0,0,0,0.1)",
      label: styles.getPropertyValue("--chart-label").trim() || "#2a373d",
      tickBg: styles.getPropertyValue("--chart-tick-bg").trim() || "rgba(255,255,255,0.85)",
      fill: styles.getPropertyValue("--chart-fill").trim() || "rgba(27,92,110,0.2)",
      stroke: styles.getPropertyValue("--chart-stroke").trim() || "#1b5c6e",
      point: styles.getPropertyValue("--chart-point").trim() || "#1b5c6e"
    };
  }

  function renderFallbackSvgRadar(wrapEl, typeScores) {
    const ns = "http://www.w3.org/2000/svg";
    const size = 320;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = 104;
    const colors = getChartColors();

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + size + " " + size);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "10가지 인지 왜곡 유형별 점수 차트");

    [4, 8, 12].forEach(function (step) {
      const r = (step / 12) * maxR;
      const pts = typeScores
        .map(function (_, i) {
          const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
          return (cx + r * Math.cos(angle)).toFixed(1) + "," + (cy + r * Math.sin(angle)).toFixed(1);
        })
        .join(" ");
      const poly = document.createElementNS(ns, "polygon");
      poly.setAttribute("points", pts);
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", colors.grid);
      svg.appendChild(poly);
    });

    typeScores.forEach(function (t, i) {
      const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
      const labelR = maxR + 24;
      const text = document.createElementNS(ns, "text");
      text.setAttribute("x", (cx + labelR * Math.cos(angle)).toFixed(1));
      text.setAttribute("y", (cy + labelR * Math.sin(angle) + 4).toFixed(1));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", colors.label);
      text.setAttribute("font-size", "11");
      text.setAttribute("font-weight", "600");
      text.textContent = t.name;
      svg.appendChild(text);
    });

    const dataPts = typeScores
      .map(function (t, i) {
        const r = (t.score / 12) * maxR;
        const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        return (cx + r * Math.cos(angle)).toFixed(1) + "," + (cy + r * Math.sin(angle)).toFixed(1);
      })
      .join(" ");

    const area = document.createElementNS(ns, "polygon");
    area.setAttribute("points", dataPts);
    area.setAttribute("fill", colors.fill);
    area.setAttribute("stroke", colors.stroke);
    area.setAttribute("stroke-width", "2");
    svg.appendChild(area);

    wrapEl.innerHTML = "";
    wrapEl.appendChild(svg);
  }

  function renderRadarChart(typeScores) {
    const canvas = document.getElementById("radar-canvas");
    const wrapEl = document.getElementById("radar-wrap");
    if (!canvas || !wrapEl) return;

    if (typeof window.Chart === "undefined") {
      renderFallbackSvgRadar(wrapEl, typeScores);
      return;
    }

    const colors = getChartColors();
    const isNarrow = window.innerWidth < 400;

    if (radarChartInstance) {
      radarChartInstance.destroy();
    }

    radarChartInstance = new window.Chart(canvas, {
      type: "radar",
      data: {
        labels: typeScores.map(function (t) {
          return t.name;
        }),
        datasets: [
          {
            label: "점수",
            data: typeScores.map(function (t) {
              return t.score;
            }),
            backgroundColor: colors.fill,
            borderColor: colors.stroke,
            borderWidth: 2,
            pointBackgroundColor: colors.point,
            pointBorderColor: colors.tickBg,
            pointBorderWidth: 1.5,
            pointRadius: 3.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 350 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return " " + ctx.raw + " / 12점";
              }
            }
          }
        },
        scales: {
          r: {
            min: 0,
            max: 12,
            beginAtZero: true,
            ticks: {
              stepSize: 4,
              color: colors.label,
              backdropColor: colors.tickBg,
              font: { size: 10 }
            },
            grid: { color: colors.grid },
            angleLines: { color: colors.angle },
            pointLabels: {
              color: colors.label,
              padding: isNarrow ? 5 : 8,
              font: {
                family: "Pretendard Variable, Pretendard, sans-serif",
                size: isNarrow ? 11 : 12.5,
                weight: "600"
              }
            }
          }
        }
      }
    });
  }

  function buildTypeDetailBody(typeMeta, levelKey, progressive) {
    const exp = typeMeta.explanation;
    const ui = data.UI_TEXT;
    const frag = document.createDocumentFragment();

    const summaryP = document.createElement("p");
    summaryP.className = "body-copy";
    summaryP.textContent = exp.levelIntro[levelKey] + " " + exp.summary;
    frag.appendChild(summaryP);

    const tipsBox = document.createElement("div");
    tipsBox.className = "tips-box";
    const tipsTitle = document.createElement("h4");
    tipsTitle.className = "sub-heading";
    tipsTitle.textContent = ui.tipsHeading;
    const tipsList = document.createElement("ul");
    tipsList.className = "compact-list";
    exp.tips.forEach(function (t) {
      const li = document.createElement("li");
      li.textContent = t;
      tipsList.appendChild(li);
    });
    tipsBox.appendChild(tipsTitle);
    tipsBox.appendChild(tipsList);
    frag.appendChild(tipsBox);

    if (progressive) {
      const more = document.createElement("details");
      more.className = "more-toggle";
      const sum = document.createElement("summary");
      sum.className = "more-toggle-summary";
      sum.textContent = ui.moreDetailsLabel + " ▾";

      const moreBody = document.createElement("div");
      moreBody.className = "more-toggle-body";

      const exDiv = document.createElement("div");
      const exH = document.createElement("h4");
      exH.className = "sub-heading";
      exH.textContent = ui.examplesHeading;
      const exUl = document.createElement("ul");
      exUl.className = "compact-list";
      exp.examples.forEach(function (ex) {
        const li = document.createElement("li");
        li.textContent = ex;
        exUl.appendChild(li);
      });
      exDiv.appendChild(exH);
      exDiv.appendChild(exUl);

      const impDiv = document.createElement("div");
      const impH = document.createElement("h4");
      impH.className = "sub-heading";
      impH.textContent = ui.impactHeading;
      const impP = document.createElement("p");
      impP.className = "body-copy";
      impP.textContent = exp.impact;
      impDiv.appendChild(impH);
      impDiv.appendChild(impP);

      moreBody.appendChild(exDiv);
      moreBody.appendChild(impDiv);
      more.appendChild(sum);
      more.appendChild(moreBody);
      frag.appendChild(more);
    }

    return frag;
  }

  function showToast(msg) {
    const toast = document.getElementById("toast-feedback");
    if (!toast) return;
    toast.hidden = false;
    toast.textContent = msg;
  }

  function copyLink(url) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard
        .writeText(url)
        .then(function () {
          showToast(data.UI_TEXT.copiedMessage);
        })
        .catch(function () {
          fallbackCopy(url);
        });
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast(data.UI_TEXT.copiedMessage);
    } catch (_e) {
      showToast(text);
    }
    document.body.removeChild(ta);
  }

  function renderInvalid() {
    const ui = data.UI_TEXT;
    document.getElementById("invalid-title").textContent = ui.invalidTitle;
    document.getElementById("invalid-body").textContent = ui.invalidBody;
    document.getElementById("invalid-retry-btn").textContent = ui.retryButton;
    document.getElementById("invalid-state").hidden = false;
  }

  function renderResult(answers) {
    const ui = data.UI_TEXT;
    document.getElementById("valid-result").hidden = false;

    const total = data.totalScore(answers);
    const totalLv = data.level(total, "total");
    const typeScores = data.scoreByType(answers);

    // 1. 종합 점수
    document.getElementById("total-score-heading").textContent = ui.totalScoreHeading;
    document.getElementById("total-score-value").textContent = String(total);
    document.getElementById("total-score-max").textContent = "/ " + ui.totalMaxScore;
    document.getElementById("total-meter-fill").style.width =
      Math.round((total / ui.totalMaxScore) * 100) + "%";

    const badgeEl = document.getElementById("total-level-badge");
    badgeEl.className = "level-pill level-pill--" + totalLv.key;
    badgeEl.textContent = totalLv.shortLabel;
    document.getElementById("total-level-msg").textContent = totalLv.message;

    // 점수 내림차순 정렬
    const sorted = typeScores.slice().sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.id - b.id;
    });

    // 2. 상위 1~3개 핵심 습관 (7점 이상)
    document.getElementById("top-types-heading").textContent = ui.topTypesHeading;
    const topContainer = document.getElementById("top-types-container");
    const topTypes = sorted
      .filter(function (item) {
        return item.score >= 7;
      })
      .slice(0, 3);

    if (topTypes.length === 0) {
      const card = document.createElement("article");
      card.className = "card";
      const h3 = document.createElement("h3");
      h3.className = "top-card-title";
      h3.style.marginBottom = "8px";
      h3.textContent = ui.flexibleTitle;
      const p = document.createElement("p");
      p.className = "body-copy";
      p.textContent = ui.flexibleBody;
      card.appendChild(h3);
      card.appendChild(p);
      topContainer.appendChild(card);
    } else {
      topTypes.forEach(function (item) {
        const meta = data.TYPES.find(function (t) {
          return t.id === item.id;
        });
        if (!meta) return;

        const card = document.createElement("article");
        card.className = "card";

        const head = document.createElement("div");
        head.className = "top-card-head";

        const title = document.createElement("h3");
        title.className = "top-card-title";
        title.textContent = item.symbol + " " + item.name;

        const right = document.createElement("span");
        right.className = "score-meta";
        const num = document.createElement("span");
        num.className = "score-num-sm";
        num.textContent = item.score + " / " + ui.typeMaxScore;
        const pill = document.createElement("span");
        pill.className = "level-pill level-pill--" + item.level.key;
        pill.textContent = item.level.label;
        right.appendChild(num);
        right.appendChild(pill);

        head.appendChild(title);
        head.appendChild(right);
        card.appendChild(head);
        card.appendChild(buildTypeDetailBody(meta, item.level.key, true));
        topContainer.appendChild(card);
      });
    }

    // 3. 레이더 차트 + 10개 전체 유형 통합 아코디언
    document.getElementById("overview-heading").textContent = ui.overviewHeading;
    document.getElementById("overview-subheading").textContent = ui.overviewSubheading;
    renderRadarChart(typeScores);

    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", function () {
          renderRadarChart(typeScores);
        });
      }
    }

    const overviewList = document.getElementById("overview-list");
    sorted.forEach(function (item) {
      const meta = data.TYPES.find(function (t) {
        return t.id === item.id;
      });
      if (!meta) return;

      const details = document.createElement("details");
      details.className = "type-accordion";

      const summary = document.createElement("summary");
      summary.className = "type-accordion-summary";

      const mainRow = document.createElement("div");
      mainRow.className = "type-row-main";

      const nameEl = document.createElement("span");
      nameEl.className = "type-row-name";
      nameEl.textContent = item.symbol + " " + item.name;

      const right = document.createElement("span");
      right.className = "score-meta";
      const scoreEl = document.createElement("span");
      scoreEl.className = "score-num-sm";
      scoreEl.textContent = item.score + " / " + ui.typeMaxScore;
      const pill = document.createElement("span");
      pill.className = "level-pill level-pill--" + item.level.key;
      pill.textContent = item.level.label;
      right.appendChild(scoreEl);
      right.appendChild(pill);
      right.appendChild(createChevronSvg());

      mainRow.appendChild(nameEl);
      mainRow.appendChild(right);

      const barTrack = document.createElement("div");
      barTrack.className = "mini-bar-track";
      barTrack.setAttribute("aria-hidden", "true");
      const barFill = document.createElement("div");
      barFill.className = "mini-bar-fill mini-bar-fill--" + item.level.key;
      barFill.style.width = Math.round((item.score / ui.typeMaxScore) * 100) + "%";
      barTrack.appendChild(barFill);

      summary.appendChild(mainRow);
      summary.appendChild(barTrack);

      const body = document.createElement("div");
      body.className = "type-accordion-body";
      body.appendChild(buildTypeDetailBody(meta, item.level.key, false));

      details.appendChild(summary);
      details.appendChild(body);
      overviewList.appendChild(details);
    });

    // 4. 버튼 및 각주
    const retryBtn = document.getElementById("action-retry");
    const copyBtn = document.getElementById("action-copy");
    const shareBtn = document.getElementById("action-share");
    const footnoteEl = document.getElementById("result-footnote");

    retryBtn.textContent = ui.retryButton;
    copyBtn.textContent = ui.copyButton;
    shareBtn.textContent = ui.shareButton;
    footnoteEl.textContent = ui.resultFootnote;

    copyBtn.addEventListener("click", function () {
      copyLink(window.location.href);
    });

    if (navigator.share && typeof navigator.share === "function") {
      shareBtn.hidden = false;
      shareBtn.addEventListener("click", function () {
        navigator
          .share({
            title: ui.shareTitle,
            text: ui.shareText + " (종합 " + total + "점 · " + totalLv.shortLabel + ")",
            url: window.location.href
          })
          .catch(function () {});
      });
    }
  }

  document.title = data.UI_TEXT.resultPageTitle;
  const params = new URLSearchParams(window.location.search);
  const parsed = data.parseAnswerString(params.get("a"));

  if (!parsed) {
    renderInvalid();
  } else {
    renderResult(parsed);
  }
})();
