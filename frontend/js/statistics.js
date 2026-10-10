/**
 * DataSphare Interactive Statistics Engine
 * Features:
 *   - Real-time topic search & filter
 *   - Topic 1: Introduction to Statistics & Data Types
 *       - Comprehensive theory (GeeksforGeeks & TutorialsPoint standard)
 *       - Interactive Data Type Classifier Quiz
 *   - Topic 2: Measures of Central Tendency & Dispersion
 *       - Mean, Median, Mode, Variance, Standard Deviation
 *       - Definitions, math formulation & solved examples
 *       - Live Visual Math Solver (Deviation table & Canvas number line with ±1σ, ±2σ bands)
 *       - In-browser editable & runnable Python runner
 *   - Topic 3: Measures of Position
 *       - Quartiles (Q1, Q2, Q3), Percentiles, IQR
 *       - Tukey's Outlier detection fences
 *       - Interactive 5-number summary & Canvas Box Plot
 *       - In-browser editable & runnable Python runner
 */

(function () {
  'use strict';

  // Global namespace
  window.DataSphareStats = {
    init: function () {
      initSearchAndFilters();
      initCardNavigation();
      initTopic1Quiz();
      initTopic2Solver();
      initTopic3Solver();
      initPythonRunners();
      checkDeepLink();
    }
  };

  /* ==============================================================
     1. SEARCH & CATEGORY FILTER SYSTEM
     ============================================================== */

  function initSearchAndFilters() {
    const searchInput = document.getElementById('statsTopicSearch');
    const clearBtn = document.getElementById('statsSearchClear');
    const filterTags = document.querySelectorAll('.stats-filter-tag');
    const cards = document.querySelectorAll('.stats-topic-card');

    if (!searchInput) return;

    function applyFilter() {
      const query = (searchInput.value || '').trim().toLowerCase();
      const activeTag = document.querySelector('.stats-filter-tag.active');
      const category = activeTag ? activeTag.dataset.category : 'all';

      if (clearBtn) {
        clearBtn.classList.toggle('visible', query.length > 0);
      }

      cards.forEach(card => {
        const title = (card.dataset.title || '').toLowerCase();
        const desc = (card.dataset.desc || '').toLowerCase();
        const tags = (card.dataset.tags || '').toLowerCase();
        const cardCat = card.dataset.category || '';

        const matchesQuery = !query || title.includes(query) || desc.includes(query) || tags.includes(query);
        const matchesCategory = category === 'all' || cardCat.includes(category);

        if (matchesQuery && matchesCategory) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    searchInput.addEventListener('input', applyFilter);

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        applyFilter();
        searchInput.focus();
      });
    }

    filterTags.forEach(tag => {
      tag.addEventListener('click', function () {
        filterTags.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        applyFilter();
      });
    });
  }

  /* ==============================================================
     2. CARD SELECTION & LESSON NAVIGATION
     ============================================================== */

  function initCardNavigation() {
    const cards = document.querySelectorAll('.stats-topic-card');
    const lessons = document.querySelectorAll('.stats-lesson-container');
    const gridWrap = document.getElementById('statsCardsGridWrap');

    cards.forEach(card => {
      const openBtn = card.querySelector('.stats-open-btn');
      const targetId = card.dataset.targetLesson;

      function openLesson() {
        cards.forEach(c => c.classList.remove('card-active'));
        card.classList.add('card-active');

        lessons.forEach(l => l.classList.remove('active'));
        const targetLesson = document.getElementById(targetId);
        if (targetLesson) {
          targetLesson.classList.add('active');
          targetLesson.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Re-render KaTeX math inside the opened lesson
          if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(targetLesson, {
              delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
              ],
              throwOnError: false
            });
          }

          // Re-render canvases if needed
          if (targetId === 'lesson-central') {
            window.dispatchEvent(new Event('resize'));
            if (window._updateCentralSolver) window._updateCentralSolver();
          } else if (targetId === 'lesson-position') {
            window.dispatchEvent(new Event('resize'));
            if (window._updatePositionSolver) window._updatePositionSolver();
          }
        }
      }

      if (openBtn) openBtn.addEventListener('click', openLesson);
    });

    // Close buttons on lessons
    document.querySelectorAll('.stats-close-lesson-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        lessons.forEach(l => l.classList.remove('active'));
        cards.forEach(c => c.classList.remove('card-active'));
        if (gridWrap) gridWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function checkDeepLink() {
    const hash = window.location.hash;
    if (hash === '#intro') {
      const btn = document.querySelector('[data-target-lesson="lesson-intro"] .stats-open-btn');
      if (btn) btn.click();
    } else if (hash === '#central-tendency' || hash === '#dispersion') {
      const btn = document.querySelector('[data-target-lesson="lesson-central"] .stats-open-btn');
      if (btn) btn.click();
    } else if (hash === '#position' || hash === '#quartiles') {
      const btn = document.querySelector('[data-target-lesson="lesson-position"] .stats-open-btn');
      if (btn) btn.click();
    }
  }

  /* ==============================================================
     3. TOPIC 1: DATA CLASSIFIER QUIZ
     ============================================================== */

  function initTopic1Quiz() {
    const selects = document.querySelectorAll('.stats-quiz-select');
    selects.forEach(sel => {
      sel.addEventListener('change', function () {
        const correct = this.dataset.correct;
        const val = this.value;
        this.classList.remove('correct', 'wrong');
        if (!val) return;
        if (val === correct) {
          this.classList.add('correct');
        } else {
          this.classList.add('wrong');
        }
      });
    });
  }

  /* ==============================================================
     4. TOPIC 2: MEASURES OF CENTRAL TENDENCY & DISPERSION SOLVER
     ============================================================== */

  function initTopic2Solver() {
    let data = [12, 18, 25, 25, 30, 42, 55];

    const inputEl = document.getElementById('centralNumInput');
    const addBtn = document.getElementById('centralAddBtn');
    const pillsContainer = document.getElementById('centralPills');
    const resetBtn = document.getElementById('centralResetBtn');
    const canvas = document.getElementById('centralCanvas');

    // Metrics elements
    const elN = document.getElementById('centralN');
    const elMean = document.getElementById('centralMean');
    const elMedian = document.getElementById('centralMedian');
    const elMode = document.getElementById('centralMode');
    const elVar = document.getElementById('centralVar');
    const elStd = document.getElementById('centralStd');
    const elRange = document.getElementById('centralRange');
    const stepsTableBody = document.getElementById('centralStepsTable');

    function calculateStats() {
      if (!data.length) return null;
      const sorted = [...data].sort((a, b) => a - b);
      const n = sorted.length;
      const sum = sorted.reduce((acc, v) => acc + v, 0);
      const mean = sum / n;

      // Median
      let median = 0;
      if (n % 2 === 1) {
        median = sorted[Math.floor(n / 2)];
      } else {
        median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      }

      // Mode
      const counts = {};
      let maxCount = 0;
      sorted.forEach(v => {
        counts[v] = (counts[v] || 0) + 1;
        if (counts[v] > maxCount) maxCount = counts[v];
      });
      let modes = [];
      if (maxCount > 1) {
        modes = Object.keys(counts).filter(k => counts[k] === maxCount).map(Number);
      }

      // Variance & Std Dev (Sample variance with Bessel's correction if n > 1)
      const sqDiffSum = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0);
      const variance = n > 1 ? sqDiffSum / (n - 1) : 0;
      const stdDev = Math.sqrt(variance);
      const range = sorted[n - 1] - sorted[0];

      return {
        sorted, n, sum, mean, median,
        mode: modes.length ? modes.join(', ') : 'No Mode',
        variance, stdDev, sqDiffSum, range
      };
    }

    function renderPills() {
      if (!pillsContainer) return;
      pillsContainer.innerHTML = data.map((v, i) => `
        <span class="stats-data-pill">
          ${v}
          <span class="del-pt" data-idx="${i}">&times;</span>
        </span>
      `).join('');

      pillsContainer.querySelectorAll('.del-pt').forEach(b => {
        b.addEventListener('click', function () {
          const idx = parseInt(this.dataset.idx, 10);
          data.splice(idx, 1);
          updateAll();
        });
      });
    }

    function renderStepsTable(res) {
      if (!stepsTableBody || !res) return;
      let html = '';
      res.sorted.forEach((x, i) => {
        const diff = x - res.mean;
        const diffSq = diff * diff;
        html += `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${x}</strong></td>
            <td>${diff >= 0 ? '+' : ''}${diff.toFixed(2)}</td>
            <td>${diffSq.toFixed(2)}</td>
          </tr>
        `;
      });

      html += `
        <tr style="background: rgba(99, 102, 241, 0.15); font-weight: 700;">
          <td>Total</td>
          <td>Σ x = ${res.sum}</td>
          <td>Σ(x - x̄) = 0.00</td>
          <td>Σ(x - x̄)² = ${res.sqDiffSum.toFixed(2)}</td>
        </tr>
      `;
      stepsTableBody.innerHTML = html;
    }

    function drawVisual(res) {
      if (!canvas || !res) return;
      const ctx = canvas.getContext('2d');
      const w = (canvas.width = canvas.parentElement.clientWidth || 500);
      const h = (canvas.height = 240);
      ctx.clearRect(0, 0, w, h);

      const pLeft = 40, pRight = 40;
      const plotW = w - pLeft - pRight;
      const axisY = h / 2 + 30;

      const minX = Math.min(...res.sorted) - res.stdDev * 1.5;
      const maxX = Math.max(...res.sorted) + res.stdDev * 1.5;
      const toCanvasX = v => pLeft + ((v - minX) / (maxX - minX || 1)) * plotW;

      // ±2σ and ±1σ Bands Shading
      const mX = toCanvasX(res.mean);
      const xMinus2 = toCanvasX(res.mean - 2 * res.stdDev);
      const xPlus2 = toCanvasX(res.mean + 2 * res.stdDev);
      const xMinus1 = toCanvasX(res.mean - res.stdDev);
      const xPlus1 = toCanvasX(res.mean + res.stdDev);

      // ±2σ Band
      ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.fillRect(xMinus2, axisY - 80, xPlus2 - xMinus2, 110);

      // ±1σ Band
      ctx.fillStyle = 'rgba(139, 92, 246, 0.18)';
      ctx.fillRect(xMinus1, axisY - 80, xPlus1 - xMinus1, 110);

      // Baseline Axis
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pLeft - 10, axisY);
      ctx.lineTo(w - pRight + 10, axisY);
      ctx.stroke();

      // Band labels
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#a78bfa';
      ctx.textAlign = 'center';
      ctx.fillText('-1σ (' + (res.mean - res.stdDev).toFixed(1) + ')', xMinus1, axisY + 45);
      ctx.fillText('+1σ (' + (res.mean + res.stdDev).toFixed(1) + ')', xPlus1, axisY + 45);
      ctx.fillText('±1σ Spread (68%)', mX, axisY - 90);

      // Mean Line (Gold)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(mX, axisY - 75);
      ctx.lineTo(mX, axisY + 25);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Mean x̄ = ' + res.mean.toFixed(2), mX, axisY - 60);

      // Median Line (Teal)
      const medX = toCanvasX(res.median);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(medX, axisY - 50);
      ctx.lineTo(medX, axisY + 25);
      ctx.stroke();
      ctx.fillStyle = '#06b6d4';
      ctx.fillText('Median = ' + res.median.toFixed(2), medX, axisY - 35);

      // Data Points (Points stacked if duplicate)
      const pointCounts = {};
      res.sorted.forEach(v => {
        pointCounts[v] = (pointCounts[v] || 0) + 1;
        const stackIdx = pointCounts[v];
        const cx = toCanvasX(v);
        const cy = axisY - stackIdx * 14;

        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px monospace';
        ctx.fillText(v, cx, axisY + 16);
      });
      ctx.textAlign = 'left';
    }

    function updateAll() {
      const res = calculateStats();
      renderPills();
      if (!res) {
        if (elN) elN.textContent = '0';
        return;
      }
      if (elN) elN.textContent = res.n;
      if (elMean) elMean.textContent = res.mean.toFixed(2);
      if (elMedian) elMedian.textContent = res.median.toFixed(2);
      if (elMode) elMode.textContent = res.mode;
      if (elVar) elVar.textContent = res.variance.toFixed(2);
      if (elStd) elStd.textContent = res.stdDev.toFixed(2);
      if (elRange) elRange.textContent = res.range.toFixed(2);

      renderStepsTable(res);
      drawVisual(res);
    }

    window._updateCentralSolver = updateAll;

    if (addBtn && inputEl) {
      addBtn.addEventListener('click', function () {
        const val = parseFloat(inputEl.value);
        if (!isNaN(val)) {
          data.push(val);
          inputEl.value = '';
          updateAll();
          inputEl.focus();
        }
      });
      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') addBtn.click();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        data = [12, 18, 25, 25, 30, 42, 55];
        updateAll();
      });
    }

    // Presets
    document.querySelectorAll('[data-preset-central]').forEach(btn => {
      btn.addEventListener('click', function () {
        const type = this.dataset.presetCentral;
        if (type === 'exams') data = [58, 64, 72, 75, 78, 82, 85, 88, 92, 95];
        else if (type === 'salaries') data = [30, 35, 38, 40, 42, 45, 50, 140];
        else if (type === 'symmetric') data = [10, 20, 30, 40, 50, 60, 70, 80, 90];
        updateAll();
      });
    });

    updateAll();
  }

  /* ==============================================================
     5. TOPIC 3: MEASURES OF POSITION & BOX PLOT SOLVER
     ============================================================== */

  function initTopic3Solver() {
    let data = [14, 19, 21, 22, 24, 25, 28, 30, 32, 35, 38, 44, 68];

    const inputEl = document.getElementById('posNumInput');
    const addBtn = document.getElementById('posAddBtn');
    const pillsContainer = document.getElementById('posPills');
    const resetBtn = document.getElementById('posResetBtn');
    const canvas = document.getElementById('posCanvas');

    // Metrics elements
    const elMin = document.getElementById('posMin');
    const elQ1 = document.getElementById('posQ1');
    const elMedian = document.getElementById('posMedian');
    const elQ3 = document.getElementById('posQ3');
    const elMax = document.getElementById('posMax');
    const elIQR = document.getElementById('posIQR');
    const elOutliers = document.getElementById('posOutliers');
    const stepsBox = document.getElementById('posStepsBreakdown');

    // Percentile interpolation helper
    function getPercentile(sorted, p) {
      const n = sorted.length;
      if (n === 0) return 0;
      if (n === 1) return sorted[0];
      const index = (n - 1) * p;
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }

    function calculatePositionStats() {
      if (!data.length) return null;
      const sorted = [...data].sort((a, b) => a - b);
      const n = sorted.length;

      const min = sorted[0];
      const max = sorted[n - 1];
      const q1 = getPercentile(sorted, 0.25);
      const q2 = getPercentile(sorted, 0.50);
      const q3 = getPercentile(sorted, 0.75);
      const iqr = q3 - q1;

      // Tukey's fences
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;

      const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
      const nonOutliers = sorted.filter(v => v >= lowerFence && v <= upperFence);
      const whiskerLow = nonOutliers.length ? nonOutliers[0] : min;
      const whiskerHigh = nonOutliers.length ? nonOutliers[nonOutliers.length - 1] : max;

      return {
        sorted, n, min, max, q1, q2, q3, iqr,
        lowerFence, upperFence, outliers,
        whiskerLow, whiskerHigh
      };
    }

    function renderPills() {
      if (!pillsContainer) return;
      pillsContainer.innerHTML = data.map((v, i) => `
        <span class="stats-data-pill">
          ${v}
          <span class="del-pt" data-idx="${i}">&times;</span>
        </span>
      `).join('');

      pillsContainer.querySelectorAll('.del-pt').forEach(b => {
        b.addEventListener('click', function () {
          const idx = parseInt(this.dataset.idx, 10);
          data.splice(idx, 1);
          updateAll();
        });
      });
    }

    function renderBreakdown(res) {
      if (!stepsBox || !res) return;
      stepsBox.innerHTML = `
        <div class="stats-step-row"><span>Sample Size (n):</span><strong>${res.n} observations</strong></div>
        <div class="stats-step-row"><span>Sorted Array:</span><strong>[${res.sorted.join(', ')}]</strong></div>
        <div class="stats-step-row"><span>Q1 (25th Percentile):</span><strong>${res.q1.toFixed(2)}</strong></div>
        <div class="stats-step-row"><span>Q2 (Median / 50th Percentile):</span><strong>${res.q2.toFixed(2)}</strong></div>
        <div class="stats-step-row"><span>Q3 (75th Percentile):</span><strong>${res.q3.toFixed(2)}</strong></div>
        <div class="stats-step-row"><span>Interquartile Range (IQR = Q3 - Q1):</span><strong>${res.q3.toFixed(2)} - ${res.q1.toFixed(2)} = ${res.iqr.toFixed(2)}</strong></div>
        <div class="stats-step-row"><span>Lower Fence (Q1 - 1.5×IQR):</span><strong>${res.q1.toFixed(2)} - ${(1.5 * res.iqr).toFixed(2)} = ${res.lowerFence.toFixed(2)}</strong></div>
        <div class="stats-step-row"><span>Upper Fence (Q3 + 1.5×IQR):</span><strong>${res.q3.toFixed(2)} + ${(1.5 * res.iqr).toFixed(2)} = ${res.upperFence.toFixed(2)}</strong></div>
        <div class="stats-step-row" style="color: ${res.outliers.length ? '#f43f5e' : '#10b981'}; font-weight:700;">
          <span>Detected Outliers:</span>
          <strong>${res.outliers.length ? res.outliers.join(', ') : 'None (No points outside fences)'}</strong>
        </div>
      `;
    }

    function drawBoxPlot(res) {
      if (!canvas || !res) return;
      const ctx = canvas.getContext('2d');
      const w = (canvas.width = canvas.parentElement.clientWidth || 500);
      const h = (canvas.height = 240);
      ctx.clearRect(0, 0, w, h);

      const pLeft = 50, pRight = 50;
      const plotW = w - pLeft - pRight;
      const axisY = h / 2 + 40;
      const boxY = axisY - 65;
      const boxH = 50;

      const minVal = Math.min(res.min, res.lowerFence) - 5;
      const maxVal = Math.max(res.max, res.upperFence) + 5;
      const toCanvasX = v => pLeft + ((v - minVal) / (maxVal - minVal || 1)) * plotW;

      // Axis Line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pLeft - 10, axisY + 20);
      ctx.lineTo(w - pRight + 10, axisY + 20);
      ctx.stroke();

      // Lower & Upper Fences (Dashed Red Lines)
      const lfX = toCanvasX(res.lowerFence);
      const ufX = toCanvasX(res.upperFence);

      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(lfX, boxY - 15); ctx.lineTo(lfX, axisY + 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ufX, boxY - 15); ctx.lineTo(ufX, axisY + 20); ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.textAlign = 'center';
      ctx.fillText('LF: ' + res.lowerFence.toFixed(1), lfX, boxY - 20);
      ctx.fillText('UF: ' + res.upperFence.toFixed(1), ufX, boxY - 20);

      // Whisker Lines (Horizontal)
      const wLowX = toCanvasX(res.whiskerLow);
      const wHighX = toCanvasX(res.whiskerHigh);
      const q1X = toCanvasX(res.q1);
      const q3X = toCanvasX(res.q3);
      const q2X = toCanvasX(res.q2);

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wLowX, boxY + boxH / 2);
      ctx.lineTo(q1X, boxY + boxH / 2);
      ctx.moveTo(q3X, boxY + boxH / 2);
      ctx.lineTo(wHighX, boxY + boxH / 2);
      ctx.stroke();

      // Whisker Caps (Vertical)
      ctx.beginPath();
      ctx.moveTo(wLowX, boxY + 12); ctx.lineTo(wLowX, boxY + boxH - 12);
      ctx.moveTo(wHighX, boxY + 12); ctx.lineTo(wHighX, boxY + boxH - 12);
      ctx.stroke();

      // The Box (Q1 to Q3)
      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.fillRect(q1X, boxY, q3X - q1X, boxH);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.strokeRect(q1X, boxY, q3X - q1X, boxH);

      // Median Line inside Box (Gold)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(q2X, boxY);
      ctx.lineTo(q2X, boxY + boxH);
      ctx.stroke();

      // Labels for Q1, Q2, Q3
      ctx.fillStyle = '#c7d2fe';
      ctx.font = '11px sans-serif';
      ctx.fillText('Q1: ' + res.q1.toFixed(1), q1X, boxY + boxH + 15);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('Med (Q2): ' + res.q2.toFixed(1), q2X, boxY + boxH + 28);
      ctx.fillStyle = '#c7d2fe';
      ctx.fillText('Q3: ' + res.q3.toFixed(1), q3X, boxY + boxH + 15);

      // Data Points below axis
      res.sorted.forEach(v => {
        const cx = toCanvasX(v);
        const isOutlier = res.outliers.includes(v);

        if (isOutlier) {
          // Red diamond
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.moveTo(cx, boxY + boxH / 2 - 7);
          ctx.lineTo(cx + 7, boxY + boxH / 2);
          ctx.lineTo(cx, boxY + boxH / 2 + 7);
          ctx.lineTo(cx - 7, boxY + boxH / 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = '#f43f5e';
          ctx.fillText(v + ' (outlier)', cx, boxY - 3);
        } else {
          // Regular dot on axis
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(cx, axisY + 20, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.textAlign = 'left';
    }

    function updateAll() {
      const res = calculatePositionStats();
      renderPills();
      if (!res) return;

      if (elMin) elMin.textContent = res.min.toFixed(1);
      if (elQ1) elQ1.textContent = res.q1.toFixed(2);
      if (elMedian) elMedian.textContent = res.q2.toFixed(2);
      if (elQ3) elQ3.textContent = res.q3.toFixed(2);
      if (elMax) elMax.textContent = res.max.toFixed(1);
      if (elIQR) elIQR.textContent = res.iqr.toFixed(2);
      if (elOutliers) elOutliers.textContent = res.outliers.length ? res.outliers.join(', ') : 'None';

      renderBreakdown(res);
      drawBoxPlot(res);
    }

    window._updatePositionSolver = updateAll;

    if (addBtn && inputEl) {
      addBtn.addEventListener('click', function () {
        const val = parseFloat(inputEl.value);
        if (!isNaN(val)) {
          data.push(val);
          inputEl.value = '';
          updateAll();
          inputEl.focus();
        }
      });
      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') addBtn.click();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        data = [14, 19, 21, 22, 24, 25, 28, 30, 32, 35, 38, 44, 68];
        updateAll();
      });
    }

    // Presets
    document.querySelectorAll('[data-preset-position]').forEach(btn => {
      btn.addEventListener('click', function () {
        const type = this.dataset.presetPosition;
        if (type === 'clean') data = [10, 15, 18, 20, 22, 25, 28, 30, 35, 40];
        else if (type === 'outliers') data = [12, 14, 15, 18, 19, 20, 22, 25, 26, 28, 75, 92];
        else if (type === 'grades') data = [45, 52, 60, 65, 70, 75, 80, 85, 90, 95];
        updateAll();
      });
    });

    updateAll();
  }

  /* ==============================================================
     6. IN-BROWSER EDITABLE & RUNNABLE PYTHON EXECUTION
     ============================================================== */

  function initPythonRunners() {
    // Configure Skulpt output handler
    function runCode(codeText, outputElement) {
      outputElement.textContent = 'Executing Python code...\\n';
      outputElement.classList.remove('error');

      if (typeof Sk !== 'undefined') {
        let outputBuffer = '';
        Sk.configure({
          output: function (text) {
            outputBuffer += text;
          },
          read: function (file) {
            if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][file] === undefined) {
              throw "File not found: '" + file + "'";
            }
            return Sk.builtinFiles["files"][file];
          },
          __future__: Sk.python3
        });

        const myPromise = Sk.misceval.asyncToPromise(function () {
          return Sk.importMainWithBody("<stdin>", false, codeText, true);
        });

        myPromise.then(function () {
          outputElement.textContent = outputBuffer || 'Code executed successfully (no output).';
        }, function (err) {
          outputElement.classList.add('error');
          outputElement.textContent = 'Runtime Error:\\n' + err.toString();
        });
      } else {
        // Fallback execution simulator if Skulpt is not yet ready
        executePythonFallback(codeText, outputElement);
      }
    }

    // Fallback lightweight JS evaluator for the demo statistical codes
    function executePythonFallback(code, outputEl) {
      try {
        let log = '';
        const mockPrint = function () {
          log += Array.from(arguments).join(' ') + '\\n';
        };

        // If code has basic print statements, simulate:
        const lines = code.split('\\n');
        lines.forEach(line => {
          const m = line.match(/^print\\((.*)\\)$/);
          if (m) {
            try {
              // Extract string or expression inside
              log += m[1].replace(/f?"/g, '').replace(/\\{.*?\\}/g, '... ') + '\\n';
            } catch (e) {}
          }
        });
        outputEl.textContent = log || 'Python engine loading... Please click Run Code again in 2 seconds.';
      } catch (err) {
        outputEl.textContent = 'Execution finished.';
      }
    }

    // Bind runner 1 (Central Tendency)
    const runBtn1 = document.getElementById('pyRunCentralBtn');
    const resetBtn1 = document.getElementById('pyResetCentralBtn');
    const codeArea1 = document.getElementById('pyCodeCentral');
    const outEl1 = document.getElementById('pyOutputCentral');

    const defaultCodeCentral = `# ── Measures of Central Tendency & Dispersion ──
# Pure Python implementation with demo data

data = [12, 18, 25, 25, 30, 42, 55]
n = len(data)
data_sorted = sorted(data)

# 1. Mean
mean = sum(data) / n

# 2. Median
if n % 2 == 1:
    median = data_sorted[n // 2]
else:
    median = (data_sorted[n // 2 - 1] + data_sorted[n // 2]) / 2

# 3. Mode
counts = {}
for x in data:
    counts[x] = counts.get(x, 0) + 1
max_count = max(counts.values())
modes = [k for k, v in counts.items() if v == max_count]

# 4. Variance & Standard Deviation (Sample, n-1)
sq_diffs = [(x - mean) ** 2 for x in data]
variance = sum(sq_diffs) / (n - 1)
std_dev  = variance ** 0.5

print("====================================")
print("     STATISTICAL SUMMARY REPORT     ")
print("====================================")
print("Dataset         :", data)
print("Sample Size (n) :", n)
print(f"Mean (x̄)        : {mean:.2f}")
print(f"Median          : {median:.2f}")
print("Mode            :", modes if max_count > 1 else "No Mode")
print(f"Variance (s²)   : {variance:.2f}")
print(f"Std Dev (s)     : {std_dev:.2f}")
print("====================================")

# Try testing a new value:
new_pt = 60
print(f"Deviation of {new_pt} from mean: {new_pt - mean:.2f}")
print(f"Z-Score of {new_pt}             : {(new_pt - mean) / std_dev:.2f}")
`;

    if (runBtn1 && codeArea1 && outEl1) {
      runBtn1.addEventListener('click', function () {
        runCode(codeArea1.value, outEl1);
      });
    }

    if (resetBtn1 && codeArea1) {
      resetBtn1.addEventListener('click', function () {
        codeArea1.value = defaultCodeCentral;
        if (outEl1) outEl1.textContent = 'Output ready. Click "▶ Run Python Code" above.';
      });
    }

    // Bind runner 2 (Measures of Position)
    const runBtn2 = document.getElementById('pyRunPosBtn');
    const resetBtn2 = document.getElementById('pyResetPosBtn');
    const codeArea2 = document.getElementById('pyCodePos');
    const outEl2 = document.getElementById('pyOutputPos');

    const defaultCodePos = `# ── Measures of Position & Outlier Detection ──
# Calculates Quartiles, Percentiles, IQR, and Outliers

data = [14, 19, 21, 22, 24, 25, 28, 30, 32, 35, 38, 44, 68]
sorted_data = sorted(data)
n = len(sorted_data)

def percentile(arr, p):
    """Linear interpolation percentile method"""
    k = (len(arr) - 1) * p
    f = int(k)
    c = f + 1 if f + 1 < len(arr) else f
    d = k - f
    return arr[f] + d * (arr[c] - arr[f])

q1 = percentile(sorted_data, 0.25)
q2 = percentile(sorted_data, 0.50)  # Median
q3 = percentile(sorted_data, 0.75)
iqr = q3 - q1

# Tukey's Fences for Outliers
lower_fence = q1 - 1.5 * iqr
upper_fence = q3 + 1.5 * iqr
outliers = [x for x in sorted_data if x < lower_fence or x > upper_fence]

print("====================================")
print("     MEASURES OF POSITION & IQR     ")
print("====================================")
print("Sorted Data  :", sorted_data)
print("Sample Size  :", n)
print(f"Q1 (25th %)  : {q1:.2f}")
print(f"Q2 (Median)  : {q2:.2f}")
print(f"Q3 (75th %)  : {q3:.2f}")
print(f"IQR (Q3 - Q1): {iqr:.2f}")
print(f"Lower Fence  : {lower_fence:.2f}")
print(f"Upper Fence  : {upper_fence:.2f}")
print("Outliers     :", outliers if outliers else "None detected")
print("====================================")
`;

    if (runBtn2 && codeArea2 && outEl2) {
      runBtn2.addEventListener('click', function () {
        runCode(codeArea2.value, outEl2);
      });
    }

    if (resetBtn2 && codeArea2) {
      resetBtn2.addEventListener('click', function () {
        codeArea2.value = defaultCodePos;
        if (outEl2) outEl2.textContent = 'Output ready. Click "▶ Run Python Code" above.';
      });
    }
  }

  // Auto-init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    window.DataSphareStats.init();
  });

})();
