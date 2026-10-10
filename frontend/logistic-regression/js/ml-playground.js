/**
 * DataSphare ML Interactive Playground Engine v2.0
 * Supports: Linear Regression, Logistic Regression, Decision Tree
 * Features:
 *   - Custom multivariate feature names and values
 *   - Preset and synthetic dataset generation
 *   - Train/test split with visual badges
 *   - Custom weight & bias initialization (manual number input)
 *   - Epoch-wise training (Play, Pause, Step 1 Epoch, Reset, Speed control)
 *   - Mathematical formula breakdown with live substitution
 *   - 2D data points convergence (regression fit / decision boundary)
 *   - 3D loss surface graph showing gradient descent path to global minima
 *   - Decision Tree: multi-level recursive splitting per epoch
 *   - Decision Tree: real-time tree diagram canvas
 *   - Python code section: library version + from-scratch version
 */

(function () {
  'use strict';

  window.DataSpharePlayground = {
    init: function (containerId, options) {
      const type = (options && options.type) || 'linear-regression';
      const container = document.getElementById(containerId);
      if (!container) return;
      const instance = new PlaygroundInstance(container, type, options || {});
      instance.mount();
      return instance;
    }
  };

  /* ==============================================================
     PLAYGROUND INSTANCE CONSTRUCTOR
     ============================================================== */

  function PlaygroundInstance(container, type, options) {
    this.container = container;
    this.type = type;
    this.options = options;

    this.features = [];
    this.targetName = 'Target';
    this.data = [];
    this.trainSplitRatio = 0.8;
    this.weights = [];
    this.bias = 0;
    this.lr = 0.05;
    this.maxEpochs = 80;
    this.currentEpoch = 0;
    this.isRunning = false;
    this.timer = null;
    this.speed = 120;

    this.history = [];
    this.metrics = { trainLoss: 0, testLoss: 0, score: 0, gradients: [] };

    // Decision Tree
    this.maxDepth = 3;
    this.minSamplesSplit = 2;
    this.criterion = 'entropy';
    this.treeRoot = null;
    this.treeNodes = [];       // array of node objects revealed progressively
    this.currentTreeStep = 0;  // how many nodes have been revealed
    this.maxTreeSteps = 0;

    this.initDefaults();
  }

  PlaygroundInstance.prototype.initDefaults = function () {
    if (this.type === 'linear-regression') {
      this.features = ['Area (100 sqft)', 'Bedrooms'];
      this.targetName = 'Price ($10k)';
      this.weights = [0.8, -0.4];
      this.bias = 0.5;
      this.lr = 0.04;
      this.maxEpochs = 60;
      this.loadPreset('bivariate');
    } else if (this.type === 'logistic-regression') {
      this.features = ['Exam 1 Score', 'Exam 2 Score'];
      this.targetName = 'Admitted (0 or 1)';
      this.weights = [0.6, -0.8];
      this.bias = 0.1;
      this.lr = 0.08;
      this.maxEpochs = 70;
      this.threshold = 0.5;
      this.loadPreset('separable');
    } else if (this.type === 'decision-tree') {
      this.features = ['Height (m)', 'Diameter (m)'];
      this.targetName = 'Species (Class 0/1)';
      this.maxDepth = 3;
      this.minSamplesSplit = 2;
      this.criterion = 'entropy';
      this.loadPreset('tree_clusters');
    }
  };

  /* ==============================================================
     PRESET DATASETS
     ============================================================== */

  PlaygroundInstance.prototype.loadPreset = function (presetName) {
    this.data = [];
    if (this.type === 'linear-regression') {
      if (presetName === 'univariate') {
        this.features = ['Study Hours'];
        this.targetName = 'Score';
        this.weights = [0.5];
        this.bias = 1.0;
        const pts = [[1,2],[2,3.5],[3,4],[4,5.5],[5,6],[6,7.5],[7,8],[8,9],[9,10],[10,11.5],[3.5,5],[4.5,6],[6.5,7],[7.5,9],[2.5,3],[5.5,7],[1.5,2.5],[8.5,10],[9.5,11],[0.5,1.5]];
        pts.forEach(p => this.data.push({ features: [p[0]], y: p[1], isTrain: true }));
      } else if (presetName === 'bivariate') {
        this.features = ['Area (100 sqft)', 'Bedrooms'];
        this.targetName = 'Price ($10k)';
        this.weights = [0.8, -0.4];
        this.bias = 0.5;
        const pts = [[5,2,3.8],[7,3,5.6],[8,3,6.5],[6,2,4.8],[9,4,7.0],[4,1,3.2],[10,4,8.0],[3,1,2.5],[11,5,8.8],[6,3,4.5],[7,2,5.8],[8,4,6.2],[5,3,3.9],[9,3,7.5],[4,2,3.0],[12,4,9.5],[6,2,5.1],[8,2,6.8],[7,4,5.3],[10,3,8.2]];
        pts.forEach(p => this.data.push({ features: [p[0], p[1]], y: p[2], isTrain: true }));
      } else if (presetName === 'multivariate') {
        this.features = ['Area', 'Bedrooms', 'Age (yrs)'];
        this.targetName = 'Price ($10k)';
        this.weights = [0.7, -0.3, -0.1];
        this.bias = 0.5;
        const pts = [[5,2,10,3.5],[7,3,5,5.8],[8,3,8,6.2],[6,2,15,4.3],[9,4,3,7.5],[4,1,20,2.8],[10,4,2,8.5],[3,1,25,2.0],[11,5,1,9.0],[6,3,12,4.0],[7,2,7,5.5],[8,4,9,5.8],[5,3,18,3.2],[9,3,4,7.2],[4,2,22,2.5]];
        pts.forEach(p => this.data.push({ features: [p[0],p[1],p[2]], y: p[3], isTrain: true }));
      } else if (presetName === 'random') {
        this.generateRandomData(25);
        return;
      }
    } else if (this.type === 'logistic-regression') {
      if (presetName === 'separable') {
        this.features = ['Exam 1 Score', 'Exam 2 Score'];
        this.targetName = 'Admitted (0 or 1)';
        this.weights = [0.6, -0.8];
        this.bias = 0.1;
        const pts = [[7,6,1],[8,7,1],[9,8,1],[6,7,1],[7.5,8.5,1],[8.5,9,1],[9,6,1],[6.5,8,1],[7,9,1],[8,6.5,1],[3,4,0],[2,3,0],[4,3,0],[3,2,0],[2.5,4,0],[4,2.5,0],[3.5,3,0],[2,4.5,0],[4.5,2,0],[3,3.5,0],[5,5.5,0],[5.5,4.5,0],[4.8,6,0],[5.2,5,0],[6,4,1]];
        pts.forEach(p => this.data.push({ features: [p[0], p[1]], y: p[2], isTrain: true }));
      } else if (presetName === 'medical') {
        this.features = ['Tumor Size (cm)', 'Age'];
        this.targetName = 'Malignant (0/1)';
        this.weights = [0.8, 0.3];
        this.bias = -0.5;
        const pts = [[2,45,0],[3,55,1],[1.5,35,0],[4,60,1],[2.5,50,0],[5,65,1],[1,40,0],[3.5,58,1],[2,48,0],[4.5,62,1],[1.5,30,0],[3,52,1],[2.5,42,0],[4,68,1],[1,38,0],[5,70,1],[2,44,0],[3.5,56,1],[1.5,32,0],[4.5,64,1]];
        pts.forEach(p => this.data.push({ features: [p[0],p[1]], y: p[2], isTrain: true }));
      } else if (presetName === 'random') {
        this.generateRandomData(25);
        return;
      }
    } else if (this.type === 'decision-tree') {
      if (presetName === 'tree_clusters') {
        this.features = ['Height (m)', 'Diameter (m)'];
        this.targetName = 'Species (Class 0/1)';
        const pts = [[1.2,0.3,0],[1.5,0.4,0],[1.8,0.5,0],[2.0,0.4,0],[1.3,0.6,0],[1.7,0.3,0],[2.2,0.5,0],[1.4,0.4,0],[1.6,0.6,0],[1.9,0.3,0],[4.5,1.2,1],[5.0,1.5,1],[4.8,1.1,1],[5.5,1.8,1],[4.2,1.3,1],[5.2,1.4,1],[4.7,1.6,1],[5.8,1.2,1],[4.3,1.5,1],[5.1,1.3,1],[3.0,0.9,0],[3.3,0.8,0],[3.5,1.0,0],[3.2,0.7,0],[3.8,0.9,0]];
        pts.forEach(p => this.data.push({ features: [p[0], p[1]], y: p[2], isTrain: true }));
      } else if (presetName === 'random') {
        this.generateRandomData(25);
        return;
      }
    }
    this.applySplit();
  };

  PlaygroundInstance.prototype.generateRandomData = function (n) {
    this.data = [];
    if (this.type === 'linear-regression') {
      const trueW = this.weights.map(() => Math.random() * 2 - 1);
      const trueB = Math.random() * 3;
      for (let i = 0; i < n; i++) {
        const feats = this.features.map(() => Math.random() * 10);
        let y = trueB;
        feats.forEach((v, j) => y += trueW[j] * v);
        y += (Math.random() - 0.5) * 2;
        this.data.push({ features: feats, y: Math.max(0, y), isTrain: true });
      }
    } else if (this.type === 'logistic-regression') {
      for (let i = 0; i < n; i++) {
        const f1 = Math.random() * 10;
        const f2 = Math.random() * 10;
        const feats = [f1].concat(this.features.slice(1).map(() => Math.random() * 10));
        feats[0] = f1; if (feats.length > 1) feats[1] = f2;
        const y = (f1 + f2) > 10 ? 1 : 0;
        this.data.push({ features: feats, y, isTrain: true });
      }
    } else {
      for (let i = 0; i < n; i++) {
        const feats = this.features.map(() => Math.random() * 6);
        const y = (feats[0] + (feats[1] || 0)) > 6 ? 1 : 0;
        this.data.push({ features: feats, y, isTrain: true });
      }
    }
    this.applySplit();
  };

  PlaygroundInstance.prototype.applySplit = function () {
    const n = this.data.length;
    const trainCount = Math.max(1, Math.floor(n * this.trainSplitRatio));
    this.data.forEach((d, i) => { d.isTrain = (i < trainCount); });
  };

  PlaygroundInstance.prototype.resetTraining = function () {
    this.pause();
    this.currentEpoch = 0;
    this.history = [];
    this.metrics = { trainLoss: 0, testLoss: 0, score: 0, gradients: [] };
    if (this.type === 'linear-regression' || this.type === 'logistic-regression') {
      while (this.weights.length < this.features.length) this.weights.push(0.5);
      this.weights = this.weights.slice(0, this.features.length);
      this.recordEpoch(0);
    } else {
      this.currentTreeStep = 0;
      this.buildTreeFull();
    }
  };

  /* ==============================================================
     MATH & TRAINING LOGIC
     ============================================================== */

  PlaygroundInstance.prototype.getNormalizedData = function () {
    if (!this.data.length) return { train: [], test: [], mins: [], maxs: [] };
    const numF = this.features.length;
    const mins = Array(numF).fill(Infinity);
    const maxs = Array(numF).fill(-Infinity);
    this.data.forEach(d => {
      d.features.forEach((v, j) => {
        if (v < mins[j]) mins[j] = v;
        if (v > maxs[j]) maxs[j] = v;
      });
    });
    const train = this.data.filter(d => d.isTrain);
    const test = this.data.filter(d => !d.isTrain);
    return { train, test, mins, maxs };
  };

  PlaygroundInstance.prototype.stepEpoch = function () {
    if (this.type === 'decision-tree') {
      this.stepTree();
      return;
    }
    const { train, test } = this.getNormalizedData();
    if (!train.length) return;

    const N = train.length;
    const numF = this.features.length;
    const gradsW = Array(numF).fill(0);
    let gradB = 0;
    let trainLoss = 0;

    if (this.type === 'linear-regression') {
      train.forEach(pt => {
        let yHat = this.bias;
        pt.features.forEach((x, j) => { yHat += this.weights[j] * x; });
        const err = yHat - pt.y;
        trainLoss += err * err;
        pt.features.forEach((x, j) => { gradsW[j] += (2 / N) * err * x; });
        gradB += (2 / N) * err;
      });
      trainLoss /= N;

      let testLoss = 0;
      if (test.length > 0) {
        test.forEach(pt => {
          let yHat = this.bias;
          pt.features.forEach((x, j) => { yHat += this.weights[j] * x; });
          const err = yHat - pt.y;
          testLoss += err * err;
        });
        testLoss /= test.length;
      }

      for (let j = 0; j < numF; j++) {
        const clipped = Math.max(-10, Math.min(10, gradsW[j]));
        this.weights[j] -= this.lr * clipped;
      }
      this.bias -= this.lr * Math.max(-10, Math.min(10, gradB));

      const evalSet = test.length > 0 ? test : train;
      const yMean = evalSet.reduce((s, p) => s + p.y, 0) / evalSet.length;
      const ssTot = evalSet.reduce((s, p) => s + (p.y - yMean) ** 2, 0) || 1e-6;
      let ssRes = 0;
      evalSet.forEach(p => {
        let yH = this.bias;
        p.features.forEach((x, j) => { yH += this.weights[j] * x; });
        ssRes += (p.y - yH) ** 2;
      });
      const r2 = Math.max(-1, 1 - ssRes / ssTot);

      this.metrics = {
        trainLoss, testLoss: test.length ? testLoss : trainLoss,
        score: r2, gradients: [...gradsW, gradB]
      };

    } else if (this.type === 'logistic-regression') {
      let correct = 0;
      train.forEach(pt => {
        let z = this.bias;
        pt.features.forEach((x, j) => { z += this.weights[j] * x; });
        const yHat = 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
        const eps = 1e-7;
        trainLoss += -(pt.y * Math.log(yHat + eps) + (1 - pt.y) * Math.log(1 - yHat + eps));
        const err = yHat - pt.y;
        pt.features.forEach((x, j) => { gradsW[j] += (1 / N) * err * x; });
        gradB += (1 / N) * err;
        if ((yHat >= (this.threshold || 0.5) ? 1 : 0) === pt.y) correct++;
      });
      trainLoss /= N;

      let testLoss = 0, testCorrect = 0;
      if (test.length > 0) {
        test.forEach(pt => {
          let z = this.bias;
          pt.features.forEach((x, j) => { z += this.weights[j] * x; });
          const yHat = 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
          const eps = 1e-7;
          testLoss += -(pt.y * Math.log(yHat + eps) + (1 - pt.y) * Math.log(1 - yHat + eps));
          if ((yHat >= (this.threshold || 0.5) ? 1 : 0) === pt.y) testCorrect++;
        });
        testLoss /= test.length;
      }

      for (let j = 0; j < numF; j++) this.weights[j] -= this.lr * gradsW[j];
      this.bias -= this.lr * gradB;

      const acc = test.length > 0 ? (testCorrect / test.length) : (correct / train.length);
      this.metrics = {
        trainLoss, testLoss: test.length ? testLoss : trainLoss,
        score: acc * 100, gradients: [...gradsW, gradB]
      };
    }

    this.currentEpoch++;
    this.recordEpoch(this.currentEpoch);
    this.updateUI();
  };

  PlaygroundInstance.prototype.recordEpoch = function (ep) {
    this.history.push({
      epoch: ep,
      weights: [...this.weights],
      bias: this.bias,
      loss: this.metrics.trainLoss || 0
    });
  };

  /* ==============================================================
     DECISION TREE — MULTI-LEVEL RECURSIVE BUILDING
     ============================================================== */

  function calcEntropy(subset) {
    if (!subset.length) return 0;
    const p0 = subset.filter(d => d.y === 0).length / subset.length;
    const p1 = 1 - p0;
    return -(p0 > 0 ? p0 * Math.log2(p0) : 0) - (p1 > 0 ? p1 * Math.log2(p1) : 0);
  }

  function calcGini(subset) {
    if (!subset.length) return 0;
    const p0 = subset.filter(d => d.y === 0).length / subset.length;
    const p1 = 1 - p0;
    return 1 - p0 * p0 - p1 * p1;
  }

  function bestSplit(subset, featureCount, criterion) {
    let bestIG = -1, bestF = 0, bestT = 0;
    const parentImp = criterion === 'gini' ? calcGini(subset) : calcEntropy(subset);

    for (let f = 0; f < Math.min(featureCount, subset[0].features.length); f++) {
      const vals = subset.map(d => d.features[f]).sort((a, b) => a - b);
      for (let i = 0; i < vals.length - 1; i++) {
        const thresh = (vals[i] + vals[i + 1]) / 2;
        const left = subset.filter(d => d.features[f] <= thresh);
        const right = subset.filter(d => d.features[f] > thresh);
        if (left.length === 0 || right.length === 0) continue;
        const leftImp = criterion === 'gini' ? calcGini(left) : calcEntropy(left);
        const rightImp = criterion === 'gini' ? calcGini(right) : calcEntropy(right);
        const ig = parentImp - ((left.length / subset.length) * leftImp + (right.length / subset.length) * rightImp);
        if (ig > bestIG) { bestIG = ig; bestF = f; bestT = thresh; }
      }
    }
    return { feature: bestF, threshold: bestT, ig: Math.max(0, bestIG), impurity: parentImp };
  }

  // Build entire tree and collect all nodes in BFS order for reveal
  PlaygroundInstance.prototype.buildTreeFull = function () {
    const { train } = this.getNormalizedData();
    this.treeNodes = [];
    this.treeRoot = null;
    if (!train.length) return;

    let nodeId = 0;
    const makeNode = (data, depth, parentId, side) => {
      if (!data.length) return null;
      const id = nodeId++;
      const impurity = this.criterion === 'gini' ? calcGini(data) : calcEntropy(data);
      const class0 = data.filter(d => d.y === 0).length;
      const class1 = data.length - class0;
      const predClass = class1 >= class0 ? 1 : 0;
      const node = { id, depth, parentId, side, data, impurity, predClass, samples: data.length, class0, class1, split: null, left: null, right: null };

      if (depth < this.maxDepth && data.length >= this.minSamplesSplit && impurity > 1e-6) {
        const sp = bestSplit(data, this.features.length, this.criterion);
        if (sp.ig > 1e-6) {
          node.split = sp;
          const leftData = data.filter(d => d.features[sp.feature] <= sp.threshold);
          const rightData = data.filter(d => d.features[sp.feature] > sp.threshold);
          node.left = makeNode(leftData, depth + 1, id, 'left');
          node.right = makeNode(rightData, depth + 1, id, 'right');
        }
      }
      this.treeNodes.push(node);
      return node;
    };

    this.treeRoot = makeNode(train, 0, null, 'root');
    // Sort by BFS order (depth then id)
    this.treeNodes.sort((a, b) => a.depth - b.depth || a.id - b.id);
    this.maxTreeSteps = this.treeNodes.length;

    // Update metrics from root
    if (this.treeNodes.length > 0) {
      const root = this.treeNodes[0];
      const splitInfo = root.split || { ig: 0, feature: 0, threshold: 0 };
      this.metrics = {
        trainLoss: root.impurity,
        testLoss: splitInfo.ig,
        score: 0,
        gradients: []
      };
    }
  };

  PlaygroundInstance.prototype.stepTree = function () {
    if (this.currentTreeStep >= this.maxTreeSteps) {
      this.currentTreeStep = 0;
    }
    this.currentTreeStep++;
    // Update metrics based on current revealed nodes
    const visibleNodes = this.treeNodes.slice(0, this.currentTreeStep);
    const leafNodes = visibleNodes.filter(n => {
      const left = visibleNodes.find(x => x.parentId === n.id && x.side === 'left');
      const right = visibleNodes.find(x => x.parentId === n.id && x.side === 'right');
      return !left && !right;
    });
    const totalLeafSamples = leafNodes.reduce((s, n) => s + n.samples, 0) || 1;
    const acc = leafNodes.reduce((s, n) => {
      const correct = Math.max(n.class0, n.class1);
      return s + correct;
    }, 0) / totalLeafSamples * 100;

    const root = this.treeNodes[0] || { impurity: 0, split: { ig: 0 } };
    const splitNode = this.treeNodes[this.currentTreeStep - 1] || {};
    this.metrics = {
      trainLoss: root.impurity,
      testLoss: (splitNode.split || {}).ig || 0,
      score: acc,
      gradients: []
    };
    if (this.currentTreeStep >= this.maxTreeSteps) {
      this.pause();
    }
    this.updateUI();
  };

  PlaygroundInstance.prototype.play = function () {
    if (this.isRunning) return;
    if (this.type === 'decision-tree') {
      if (this.currentTreeStep >= this.maxTreeSteps) {
        this.currentTreeStep = 0;
        this.updateUI();
      }
    } else {
      if (this.currentEpoch >= this.maxEpochs) {
        this.currentEpoch = 0;
        this.history = [];
        this.recordEpoch(0);
        this.updateUI();
      }
    }
    this.isRunning = true;
    const self = this;
    this.timer = setInterval(function () {
      if (self.type === 'decision-tree') {
        if (self.currentTreeStep >= self.maxTreeSteps) {
          self.pause();
          return;
        }
        self.stepEpoch();
      } else {
        if (self.currentEpoch >= self.maxEpochs) {
          self.pause();
          return;
        }
        self.stepEpoch();
      }
    }, this.speed);
    this.updatePlayButtons();
  };

  PlaygroundInstance.prototype.pause = function () {
    this.isRunning = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.updatePlayButtons();
  };

  PlaygroundInstance.prototype.updatePlayButtons = function () {
    const playBtn = this.container.querySelector('.ds-btn-play');
    if (playBtn) {
      playBtn.innerHTML = this.isRunning
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Train Model';
      playBtn.className = this.isRunning ? 'ds-btn ds-btn-danger ds-btn-play' : 'ds-btn ds-btn-primary ds-btn-play';
    }
  };

  /* ==============================================================
     UI RENDERING — MOUNT
     ============================================================== */

  PlaygroundInstance.prototype.mount = function () {
    const typeLabel = this.type === 'linear-regression'
      ? 'Linear Regression'
      : this.type === 'logistic-regression'
        ? 'Logistic Regression'
        : 'Decision Tree';

    const descText = this.type === 'linear-regression'
      ? 'Design custom features, generate bivariate or multivariate datasets, initialize parameters, and track gradient descent convergence live in 2D and 3D loss surface space.'
      : this.type === 'logistic-regression'
        ? 'Construct custom classification features, observe epoch-wise probability boundaries converging in 2D, and navigate the 3D convex log-loss bowl toward the global minimum.'
        : 'Experiment with custom tree features, compute Shannon entropy & Information Gain step-by-step, and visualize recursive partitioning boundaries and real-time tree splits.';

    const epochLabel = this.type === 'decision-tree' ? 'Tree Split' : 'Epoch';
    const epochTotal = this.type === 'decision-tree' ? `<span id="dsMaxSteps">?</span> splits` : `<span>/ ${this.maxEpochs}</span>`;
    const stepBtnLabel = this.type === 'decision-tree' ? 'Step 1 Split' : 'Step 1 Epoch';

    this.container.innerHTML = `
      <div class="ds-playground-wrapper">
        <div class="ds-pg-header">
          <span class="ds-pg-badge">Interactive Laboratory</span>
          <h2 class="ds-pg-title">${typeLabel} — Hands-on Practice Simulator</h2>
          <p class="ds-pg-subtitle">${descText}</p>

          <div class="ds-pg-pipeline">
            <div class="ds-pipeline-step active"><span class="ds-pipeline-num">1</span><span>[User Input: Features &amp; Values]</span></div>
            <span class="ds-pipeline-arrow">➔</span>
            <div class="ds-pipeline-step active"><span class="ds-pipeline-num">2</span><span>[Generate Demo Dataset]</span></div>
            <span class="ds-pipeline-arrow">➔</span>
            <div class="ds-pipeline-step active"><span class="ds-pipeline-num">3</span><span>[Train-Test Split &amp; Param Init]</span></div>
            <span class="ds-pipeline-arrow">➔</span>
            <div class="ds-pipeline-step active"><span class="ds-pipeline-num">4</span><span>[Epoch-wise Math &amp; Visuals]</span></div>
          </div>
        </div>

        <div class="ds-pg-grid">
          <!-- Left Column -->
          <div class="ds-pg-controls-card">
            <!-- Features & Data -->
            <div class="ds-panel-section">
              <div class="ds-section-heading">
                <span>1. Features &amp; Data Points</span>
                <span style="font-size:11px;color:#94a3b8;" class="ds-feat-count">${this.features.length} Features</span>
              </div>
              <div class="ds-feature-tags" id="dsFeaturePills"></div>
              <div class="ds-input-row">
                <input type="text" id="dsNewFeatInput" placeholder="New feature name (e.g. Size)" />
                <button class="ds-btn ds-btn-secondary ds-btn-sm" id="dsAddFeatBtn">+ Add Feat</button>
              </div>
              <div style="margin-top: 10px;">
                <label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:4px;">Add Single Data Point:</label>
                <div class="ds-input-row" id="dsRowInputs"></div>
                <button class="ds-btn ds-btn-secondary ds-btn-sm" style="width:100%;margin-top:4px;" id="dsAddRowBtn">+ Add Data Row</button>
              </div>
              <div style="margin-top:12px;">
                <label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:4px;">Load Preset Datasets:</label>
                <div class="ds-presets-box" id="dsPresetsBox"></div>
              </div>
              <div class="ds-table-wrapper">
                <table class="ds-table" id="dsDataTable"></table>
              </div>
            </div>

            <!-- Train/Test Split -->
            <div class="ds-panel-section">
              <div class="ds-section-heading">
                <span>2. Train-Test Split</span>
                <span id="dsSplitSummary" style="font-size:11px;color:#c4b5fd;">80% / 20%</span>
              </div>
              <div class="ds-slider-group">
                <div class="ds-slider-label">
                  <span>Train Ratio: <strong id="dsSplitVal">80%</strong></span>
                  <span id="dsTrainTestCount" style="color:#a78bfa;"></span>
                </div>
                <input type="range" class="ds-range" id="dsSplitSlider" min="50" max="90" step="5" value="80" />
              </div>
            </div>

            <!-- Weights / Hyperparameters -->
            <div class="ds-panel-section">
              <div class="ds-section-heading"><span>3. Weights &amp; Hyperparameters</span></div>
              ${this.type !== 'decision-tree' ? `
                <div id="dsWeightInputs"></div>
                <div class="ds-btn-group">
                  <button class="ds-btn ds-btn-secondary ds-btn-sm" id="dsRandWeights">🎲 Random Init</button>
                  <button class="ds-btn ds-btn-secondary ds-btn-sm" id="dsZeroWeights">0️⃣ Zero Init</button>
                </div>
                <div class="ds-slider-group" style="margin-top:12px;">
                  <div class="ds-slider-label"><span>Learning Rate (α): <strong id="dsLrVal">${this.lr}</strong></span></div>
                  <input type="range" class="ds-range" id="dsLrSlider" min="0.005" max="0.2" step="0.005" value="${this.lr}" />
                </div>
                <div class="ds-slider-group">
                  <div class="ds-slider-label"><span>Total Epochs: <strong id="dsEpochVal">${this.maxEpochs}</strong></span></div>
                  <input type="range" class="ds-range" id="dsEpochSlider" min="20" max="200" step="10" value="${this.maxEpochs}" />
                </div>
              ` : `
                <div class="ds-slider-group">
                  <div class="ds-slider-label"><span>Max Depth: <strong id="dsDepthVal">${this.maxDepth}</strong></span></div>
                  <input type="range" class="ds-range" id="dsDepthSlider" min="1" max="6" step="1" value="${this.maxDepth}" />
                </div>
                <div class="ds-slider-group">
                  <div class="ds-slider-label"><span>Min Samples Split: <strong id="dsMinSampVal">${this.minSamplesSplit}</strong></span></div>
                  <input type="range" class="ds-range" id="dsMinSampSlider" min="1" max="10" step="1" value="${this.minSamplesSplit}" />
                </div>
                <div class="ds-input-row" style="margin-top:8px;">
                  <label style="font-size:12px;color:#94a3b8;align-self:center;">Criterion:</label>
                  <select id="dsCriterionSelect">
                    <option value="entropy">Shannon Entropy (IG)</option>
                    <option value="gini">Gini Impurity</option>
                  </select>
                </div>
              `}
            </div>
          </div>

          <!-- Right Column -->
          <div class="ds-pg-display">
            <!-- Training Bar -->
            <div class="ds-training-bar">
              <div class="ds-epoch-counter">
                ${epochLabel}: <strong id="dsCurrentEpoch">0</strong> ${epochTotal}
              </div>
              <div class="ds-training-controls">
                <button class="ds-btn ds-btn-primary ds-btn-play">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Train Model
                </button>
                <button class="ds-btn ds-btn-secondary" id="dsStepBtn">${stepBtnLabel}</button>
                <button class="ds-btn ds-btn-secondary" id="dsResetBtn">↺ Reset</button>
                <select class="ds-input-row" style="width:105px;padding:6px;" id="dsSpeedSelect">
                  <option value="500">Slow</option>
                  <option value="150" selected>Normal</option>
                  <option value="40">Fast</option>
                </select>
              </div>
            </div>

            <!-- Live Metrics -->
            <div class="ds-metrics-grid">
              <div class="ds-metric-card">
                <span class="ds-metric-name">${this.type === 'decision-tree' ? 'Root Impurity' : 'Train Loss'}</span>
                <span class="ds-metric-val" id="dsMetricTrainLoss">0.000</span>
              </div>
              <div class="ds-metric-card">
                <span class="ds-metric-name">${this.type === 'decision-tree' ? 'Info Gain' : 'Test Loss'}</span>
                <span class="ds-metric-val" id="dsMetricTestLoss">0.000</span>
              </div>
              <div class="ds-metric-card">
                <span class="ds-metric-name">${this.type === 'linear-regression' ? 'R² Score' : 'Accuracy'}</span>
                <span class="ds-metric-val" id="dsMetricScore">—</span>
              </div>
              <div class="ds-metric-card">
                <span class="ds-metric-name">${this.type === 'decision-tree' ? 'Nodes Revealed' : 'Gradient |∇|'}</span>
                <span class="ds-metric-val" id="dsMetricGrad">0</span>
              </div>
            </div>

            <!-- Math Panel -->
            <div class="ds-math-panel">
              <div class="ds-math-header">
                <span class="ds-math-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  Epoch-wise Math &amp; Parameter Update Equations
                </span>
                <span style="font-size:11px;color:#94a3b8;">Real-time substitution</span>
              </div>
              <div class="ds-math-content" id="dsMathContent"></div>
            </div>

            <!-- Visualizations Grid -->
            <div class="ds-visuals-grid ${this.type === 'decision-tree' ? 'ds-tree-visuals' : ''}">
              <!-- 2D Canvas -->
              <div class="ds-vis-card">
                <div class="ds-vis-head">
                  <span class="ds-vis-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>
                    ${this.type === 'decision-tree' ? '2D Decision Boundary' : '2D Convergence &amp; Decision Boundary'}
                  </span>
                  <span class="ds-vis-subtitle">Data points &amp; fit line</span>
                </div>
                <div class="ds-canvas-container">
                  <canvas id="ds2DCanvas"></canvas>
                </div>
              </div>

              ${this.type === 'decision-tree' ? `
              <!-- Tree Diagram Canvas -->
              <div class="ds-vis-card">
                <div class="ds-vis-head">
                  <span class="ds-vis-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M12 2v20M2 12h20M12 2 2 12M12 2l10 10"/></svg>
                    Real-Time Tree Splitting Diagram
                  </span>
                  <span class="ds-vis-subtitle">Node splits revealed each step</span>
                </div>
                <div class="ds-canvas-container">
                  <canvas id="dsTreeCanvas"></canvas>
                </div>
              </div>
              ` : `
              <!-- 3D Loss Surface -->
              <div class="ds-vis-card">
                <div class="ds-vis-head">
                  <span class="ds-vis-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    3D Loss Surface (Minima Descent)
                  </span>
                  <span class="ds-vis-subtitle">Interactive 3D bowl</span>
                </div>
                <div class="ds-3d-container" id="ds3DContainer"></div>
              </div>
              `}
            </div>

            <!-- Inference Sandbox -->
            <div class="ds-inference-card">
              <div class="ds-section-heading">
                <span>Test Real-Time Prediction</span>
                <span style="font-size:11px;color:#94a3b8;">Input custom values to test trained model</span>
              </div>
              <div class="ds-inference-form" id="dsInferenceForm"></div>
              <div class="ds-inference-result" id="dsInferenceResult">
                <span>Model Output:</span>
                <span class="ds-inference-val" id="dsPredVal">Awaiting input...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.render();
  };

  /* ==============================================================
     EVENT BINDING
     ============================================================== */

  PlaygroundInstance.prototype.bindEvents = function () {
    const self = this;
    const c = this.container;

    // Add feature
    const addFeatBtn = c.querySelector('#dsAddFeatBtn');
    const newFeatInput = c.querySelector('#dsNewFeatInput');
    if (addFeatBtn && newFeatInput) {
      addFeatBtn.addEventListener('click', function () {
        const name = newFeatInput.value.trim();
        if (name && !self.features.includes(name)) {
          self.features.push(name);
          self.weights.push(0.5);
          self.data.forEach(d => d.features.push(1.0));
          newFeatInput.value = '';
          self.render();
        }
      });
    }

    // Add row
    const addRowBtn = c.querySelector('#dsAddRowBtn');
    if (addRowBtn) {
      addRowBtn.addEventListener('click', function () {
        const inputs = c.querySelectorAll('.ds-new-row-val');
        const vals = [];
        inputs.forEach(inp => vals.push(parseFloat(inp.value) || 0));
        const targetEl = c.querySelector('#dsNewRowTarget');
        const targetVal = parseFloat(targetEl ? targetEl.value : 0) || 0;
        self.data.push({ features: vals, y: targetVal, isTrain: true });
        self.applySplit();
        self.renderTable();
        self.draw2D();
        if (self.type === 'decision-tree') { self.resetTraining(); self.updateUI(); }
      });
    }

    // Split slider
    const splitSlider = c.querySelector('#dsSplitSlider');
    if (splitSlider) {
      splitSlider.addEventListener('input', function () {
        self.trainSplitRatio = parseInt(this.value, 10) / 100;
        c.querySelector('#dsSplitVal').textContent = this.value + '%';
        c.querySelector('#dsSplitSummary').textContent = `${this.value}% / ${100 - parseInt(this.value, 10)}%`;
        self.applySplit();
        self.renderTable();
        self.draw2D();
      });
    }

    // LR slider
    const lrSlider = c.querySelector('#dsLrSlider');
    if (lrSlider) {
      lrSlider.addEventListener('input', function () {
        self.lr = parseFloat(this.value);
        c.querySelector('#dsLrVal').textContent = this.value;
      });
    }

    // Epoch slider
    const epochSlider = c.querySelector('#dsEpochSlider');
    if (epochSlider) {
      epochSlider.addEventListener('input', function () {
        self.maxEpochs = parseInt(this.value, 10);
        c.querySelector('#dsEpochVal').textContent = this.value;
      });
    }

    // DT depth slider
    const depthSlider = c.querySelector('#dsDepthSlider');
    if (depthSlider) {
      depthSlider.addEventListener('input', function () {
        self.maxDepth = parseInt(this.value, 10);
        c.querySelector('#dsDepthVal').textContent = this.value;
        self.resetTraining();
        self.updateUI();
      });
    }

    // DT min samples slider
    const minSampSlider = c.querySelector('#dsMinSampSlider');
    if (minSampSlider) {
      minSampSlider.addEventListener('input', function () {
        self.minSamplesSplit = parseInt(this.value, 10);
        c.querySelector('#dsMinSampVal').textContent = this.value;
        self.resetTraining();
        self.updateUI();
      });
    }

    // DT criterion
    const criterionSel = c.querySelector('#dsCriterionSelect');
    if (criterionSel) {
      criterionSel.addEventListener('change', function () {
        self.criterion = this.value;
        self.resetTraining();
        self.updateUI();
      });
    }

    // Random / Zero weights
    const randBtn = c.querySelector('#dsRandWeights');
    if (randBtn) {
      randBtn.addEventListener('click', function () {
        self.weights = self.weights.map(() => parseFloat((Math.random() * 2 - 1).toFixed(2)));
        self.bias = parseFloat((Math.random() * 2 - 1).toFixed(2));
        self.resetTraining();
        self.render();
      });
    }

    const zeroBtn = c.querySelector('#dsZeroWeights');
    if (zeroBtn) {
      zeroBtn.addEventListener('click', function () {
        self.weights = self.weights.map(() => 0);
        self.bias = 0;
        self.resetTraining();
        self.render();
      });
    }

    // Play / Step / Reset
    const playBtn = c.querySelector('.ds-btn-play');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (self.isRunning) self.pause();
        else self.play();
      });
    }

    const stepBtn = c.querySelector('#dsStepBtn');
    if (stepBtn) {
      stepBtn.addEventListener('click', function () { self.stepEpoch(); });
    }

    const resetBtn = c.querySelector('#dsResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        self.resetTraining();
        self.updateUI();
      });
    }

    const speedSelect = c.querySelector('#dsSpeedSelect');
    if (speedSelect) {
      speedSelect.addEventListener('change', function () {
        self.speed = parseInt(this.value, 10);
        if (self.isRunning) { self.pause(); self.play(); }
      });
    }
  };

  /* ==============================================================
     RENDER HELPERS
     ============================================================== */

  PlaygroundInstance.prototype.render = function () {
    this.renderFeaturePills();
    this.renderRowInputs();
    this.renderPresets();
    this.renderTable();
    this.renderWeightInputs();
    this.renderInferenceForm();
    if (this.type === 'decision-tree') {
      this.resetTraining();
    } else {
      this.recordEpoch(0);
      this.init3DPlot();
    }
    this.updateUI();
  };

  PlaygroundInstance.prototype.renderFeaturePills = function () {
    const container = this.container.querySelector('#dsFeaturePills');
    if (!container) return;
    const self = this;
    container.innerHTML = this.features.map((f, i) => `
      <span class="ds-feature-pill">
        ${escapeHtml(f)}
        ${self.features.length > 1 ? `<span class="del-feat" data-idx="${i}">×</span>` : ''}
      </span>
    `).join('');
    container.querySelectorAll('.del-feat').forEach(el => {
      el.addEventListener('click', function () {
        const idx = parseInt(this.dataset.idx, 10);
        self.features.splice(idx, 1);
        if (self.type !== 'decision-tree') self.weights.splice(idx, 1);
        self.data.forEach(d => d.features.splice(idx, 1));
        self.render();
      });
    });
    const fcEl = self.container.querySelector('.ds-feat-count');
    if (fcEl) fcEl.textContent = self.features.length + ' Features';
  };

  PlaygroundInstance.prototype.renderRowInputs = function () {
    const container = this.container.querySelector('#dsRowInputs');
    if (!container) return;
    let html = this.features.map(f => `<input type="number" step="0.1" class="ds-new-row-val" placeholder="${escapeHtml(f)}" value="3.0" />`).join('');
    html += `<input type="number" step="0.1" id="dsNewRowTarget" placeholder="${escapeHtml(this.targetName)}" value="${this.type === 'logistic-regression' || this.type === 'decision-tree' ? 1 : 5.0}" />`;
    container.innerHTML = html;
  };

  PlaygroundInstance.prototype.renderPresets = function () {
    const container = this.container.querySelector('#dsPresetsBox');
    if (!container) return;
    const self = this;
    let presets = [];
    if (this.type === 'linear-regression') {
      presets = [
        { id: 'bivariate', label: 'Bivariate (2 Feat)' },
        { id: 'univariate', label: 'Univariate (1 Feat)' },
        { id: 'multivariate', label: 'Multivariate (3 Feat)' },
        { id: 'random', label: '🎲 Random 25' }
      ];
    } else if (this.type === 'logistic-regression') {
      presets = [
        { id: 'separable', label: 'Exams Pass/Fail' },
        { id: 'medical', label: 'Medical Tumor Data' },
        { id: 'random', label: '🎲 Random 25' }
      ];
    } else {
      presets = [
        { id: 'tree_clusters', label: 'Orchard Species' },
        { id: 'random', label: '🎲 Random 25' }
      ];
    }
    container.innerHTML = presets.map(p => `<button class="ds-btn ds-btn-secondary ds-btn-sm" data-preset="${p.id}">${p.label}</button>`).join('');
    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.dataset.preset;
        if (id === 'random') self.generateRandomData(25);
        else self.loadPreset(id);
        self.render();
      });
    });
  };

  PlaygroundInstance.prototype.renderTable = function () {
    const table = this.container.querySelector('#dsDataTable');
    if (!table) return;
    const self = this;
    let headHtml = '<thead><tr>';
    this.features.forEach(f => { headHtml += `<th>${escapeHtml(f)}</th>`; });
    headHtml += `<th>${escapeHtml(this.targetName)}</th><th>Split</th><th></th></tr></thead>`;
    let bodyHtml = '<tbody>';
    this.data.forEach((row, i) => {
      bodyHtml += '<tr>';
      row.features.forEach(v => { bodyHtml += `<td>${v.toFixed(1)}</td>`; });
      bodyHtml += `<td>${row.y.toFixed(1)}</td>`;
      bodyHtml += `<td><span class="${row.isTrain ? 'ds-badge-train' : 'ds-badge-test'}">${row.isTrain ? 'TRAIN' : 'TEST'}</span></td>`;
      bodyHtml += `<td><button class="ds-btn ds-btn-danger ds-btn-sm del-row" data-idx="${i}" style="padding:1px 6px;">×</button></td>`;
      bodyHtml += '</tr>';
    });
    bodyHtml += '</tbody>';
    table.innerHTML = headHtml + bodyHtml;
    table.querySelectorAll('.del-row').forEach(b => {
      b.addEventListener('click', function () {
        const idx = parseInt(this.dataset.idx, 10);
        self.data.splice(idx, 1);
        self.applySplit();
        self.renderTable();
        self.draw2D();
        if (self.type === 'decision-tree') { self.resetTraining(); self.updateUI(); }
      });
    });
    const trainCnt = this.data.filter(d => d.isTrain).length;
    const testCnt = this.data.length - trainCnt;
    const cntEl = this.container.querySelector('#dsTrainTestCount');
    if (cntEl) cntEl.textContent = `(${trainCnt} train, ${testCnt} test)`;
  };

  PlaygroundInstance.prototype.renderWeightInputs = function () {
    const container = this.container.querySelector('#dsWeightInputs');
    if (!container || this.type === 'decision-tree') return;
    const self = this;
    let html = '';
    this.features.forEach((f, i) => {
      html += `
        <div class="ds-slider-group">
          <div class="ds-slider-label">
            <span>Weight w<sub>${i + 1}</sub> (${escapeHtml(f)}):</span>
            <strong id="dsWVal_${i}">${(self.weights[i] || 0).toFixed(2)}</strong>
          </div>
          <input type="number" step="0.01" class="ds-weight-input" data-idx="${i}" value="${(self.weights[i] || 0).toFixed(2)}" style="width:100%;padding:5px 8px;background:#1e293b;border:1px solid #334155;color:#fff;border-radius:6px;font-size:13px;" />
        </div>
      `;
    });
    html += `
      <div class="ds-slider-group">
        <div class="ds-slider-label">
          <span>Bias (b):</span>
          <strong id="dsBVal">${self.bias.toFixed(2)}</strong>
        </div>
        <input type="number" step="0.01" id="dsBiasInput" value="${self.bias.toFixed(2)}" style="width:100%;padding:5px 8px;background:#1e293b;border:1px solid #334155;color:#fff;border-radius:6px;font-size:13px;" />
      </div>
    `;
    container.innerHTML = html;

    container.querySelectorAll('.ds-weight-input').forEach(inp => {
      inp.addEventListener('input', function () {
        const idx = parseInt(this.dataset.idx, 10);
        const val = parseFloat(this.value);
        if (!isNaN(val)) {
          self.weights[idx] = val;
          self.resetTraining();
          self.draw2D();
          self.update3DPlot();
          const el = self.container.querySelector(`#dsWVal_${idx}`);
          if (el) el.textContent = val.toFixed(2);
        }
      });
    });

    const bInp = container.querySelector('#dsBiasInput');
    if (bInp) {
      bInp.addEventListener('input', function () {
        const val = parseFloat(this.value);
        if (!isNaN(val)) {
          self.bias = val;
          self.resetTraining();
          self.draw2D();
          self.update3DPlot();
          const bel = self.container.querySelector('#dsBVal');
          if (bel) bel.textContent = val.toFixed(2);
        }
      });
    }
  };

  PlaygroundInstance.prototype.renderInferenceForm = function () {
    const container = this.container.querySelector('#dsInferenceForm');
    if (!container) return;
    const self = this;
    let html = this.features.map((f, i) => `
      <div class="ds-inference-field">
        <label>${escapeHtml(f)}:</label>
        <input type="number" step="0.1" class="ds-inf-val" data-idx="${i}" value="4.0" />
      </div>
    `).join('');
    html += `<button class="ds-btn ds-btn-primary" id="dsPredictBtn">Predict Result</button>`;
    container.innerHTML = html;
    const predBtn = container.querySelector('#dsPredictBtn');
    if (predBtn) {
      predBtn.addEventListener('click', function () {
        const inps = container.querySelectorAll('.ds-inf-val');
        const vals = [];
        inps.forEach(inp => vals.push(parseFloat(inp.value) || 0));
        self.runInference(vals);
      });
    }
  };

  PlaygroundInstance.prototype.runInference = function (inputs) {
    const resultEl = this.container.querySelector('#dsPredVal');
    if (!resultEl) return;
    if (this.type === 'linear-regression') {
      let yHat = this.bias;
      inputs.forEach((x, j) => { yHat += (this.weights[j] || 0) * x; });
      resultEl.innerHTML = `Predicted ${escapeHtml(this.targetName)} = <strong>${yHat.toFixed(3)}</strong> <span style="font-size:12px;color:#94a3b8;">(Σ w_j·x_j + b)</span>`;
    } else if (this.type === 'logistic-regression') {
      let z = this.bias;
      inputs.forEach((x, j) => { z += (this.weights[j] || 0) * x; });
      const prob = 1 / (1 + Math.exp(-z));
      const predClass = prob >= (this.threshold || 0.5) ? 1 : 0;
      resultEl.innerHTML = `Predicted Class = <strong>${predClass}</strong> &nbsp;|&nbsp; P(Y=1) = ${(prob * 100).toFixed(1)}% &nbsp;|&nbsp; z = ${z.toFixed(3)}`;
    } else {
      // Walk the revealed tree
      const visibleNodes = this.treeNodes.slice(0, this.currentTreeStep);
      if (!visibleNodes.length) { resultEl.textContent = 'Train model first.'; return; }
      let node = this.treeNodes[0];
      while (node && node.split) {
        const f = node.split.feature;
        const t = node.split.threshold;
        const go = inputs[f] <= t ? 'left' : 'right';
        const child = visibleNodes.find(n => n.parentId === node.id && n.side === go);
        if (!child) break;
        node = child;
      }
      if (node) {
        resultEl.innerHTML = `Predicted Class = <strong>${node.predClass}</strong> &nbsp;|&nbsp; Node Impurity = ${node.impurity.toFixed(3)} &nbsp;|&nbsp; Samples: ${node.samples}`;
      }
    }
  };

  /* ==============================================================
     UPDATE UI
     ============================================================== */

  PlaygroundInstance.prototype.updateUI = function () {
    const c = this.container;
    const epEl = c.querySelector('#dsCurrentEpoch');
    if (epEl) epEl.textContent = this.type === 'decision-tree' ? this.currentTreeStep : this.currentEpoch;

    const maxEl = c.querySelector('#dsMaxSteps');
    if (maxEl && this.type === 'decision-tree') maxEl.textContent = this.maxTreeSteps;

    const mTrainLoss = c.querySelector('#dsMetricTrainLoss');
    const mTestLoss = c.querySelector('#dsMetricTestLoss');
    const mScore = c.querySelector('#dsMetricScore');
    const mGrad = c.querySelector('#dsMetricGrad');

    if (this.type === 'linear-regression') {
      if (mTrainLoss) mTrainLoss.textContent = this.metrics.trainLoss.toFixed(4);
      if (mTestLoss) mTestLoss.textContent = this.metrics.testLoss.toFixed(4);
      if (mScore) mScore.textContent = this.metrics.score.toFixed(3);
      const gm = this.metrics.gradients.length
        ? Math.sqrt(this.metrics.gradients.reduce((s, g) => s + g * g, 0)).toFixed(4) : '0.0000';
      if (mGrad) mGrad.textContent = gm;
    } else if (this.type === 'logistic-regression') {
      if (mTrainLoss) mTrainLoss.textContent = this.metrics.trainLoss.toFixed(4);
      if (mTestLoss) mTestLoss.textContent = this.metrics.testLoss.toFixed(4);
      if (mScore) mScore.textContent = this.metrics.score.toFixed(1) + '%';
      const gm = this.metrics.gradients.length
        ? Math.sqrt(this.metrics.gradients.reduce((s, g) => s + g * g, 0)).toFixed(4) : '0.0000';
      if (mGrad) mGrad.textContent = gm;
    } else {
      if (mTrainLoss) mTrainLoss.textContent = this.metrics.trainLoss.toFixed(4);
      if (mTestLoss) mTestLoss.textContent = this.metrics.testLoss.toFixed(4);
      if (mScore) mScore.textContent = this.currentTreeStep > 0 ? this.metrics.score.toFixed(1) + '%' : '—';
      if (mGrad) mGrad.textContent = this.currentTreeStep + ' / ' + this.maxTreeSteps;
    }

    this.weights.forEach((w, i) => {
      const el = c.querySelector(`#dsWVal_${i}`);
      if (el) el.textContent = w.toFixed(2);
    });
    const bEl = c.querySelector('#dsBVal');
    if (bEl) bEl.textContent = this.bias.toFixed(2);

    this.renderMathPanel();
    this.draw2D();
    if (this.type === 'decision-tree') {
      this.drawTree();
    } else {
      this.update3DPlot();
    }
  };

  PlaygroundInstance.prototype.renderMathPanel = function () {
    const container = this.container.querySelector('#dsMathContent');
    if (!container) return;

    if (this.type === 'linear-regression') {
      const wTerms = this.weights.map((w, i) => `${w.toFixed(3)}·x<sub>${i+1}</sub>`).join(' + ');
      const b = this.bias.toFixed(3);
      const loss = this.metrics.trainLoss.toFixed(4);
      const g1 = (this.metrics.gradients[0] || 0).toFixed(4);
      const gb = (this.metrics.gradients[this.metrics.gradients.length - 1] || 0).toFixed(4);
      container.innerHTML = `
        <div class="ds-math-box">
          <h4>1. Hypothesis &amp; MSE Loss</h4>
          <div class="ds-math-formula">ŷ = Σ w<sub>j</sub>·x<sub>j</sub> + b</div>
          <div class="ds-math-calc">Current: ŷ = ${wTerms} + ${b}</div>
          <div class="ds-math-formula" style="margin-top:6px;">MSE = <sup>1</sup>/<sub>N</sub> Σ (ŷ<sub>i</sub> − y<sub>i</sub>)<sup>2</sup></div>
          <div class="ds-math-calc">Train Loss = <strong style="color:#f59e0b;">${loss}</strong> &nbsp;|&nbsp; R² = ${this.metrics.score.toFixed(3)}</div>
        </div>
        <div class="ds-math-box">
          <h4>2. Gradient Descent Updates (Epoch ${this.currentEpoch})</h4>
          <div class="ds-math-formula">∇w<sub>1</sub> = <sup>2</sup>/<sub>N</sub> Σ (ŷ<sub>i</sub>−y<sub>i</sub>)·x<sub>i1</sub> = <strong>${g1}</strong></div>
          <div class="ds-math-formula">∇b = <sup>2</sup>/<sub>N</sub> Σ (ŷ<sub>i</sub>−y<sub>i</sub>) = <strong>${gb}</strong></div>
          <div class="ds-math-calc">w<sub>1</sub> ← w<sub>1</sub> − α·∇w<sub>1</sub> &nbsp;|&nbsp; α = ${this.lr}</div>
          <div class="ds-math-calc">w<sub>1</sub> = <strong style="color:#10b981;">${(this.weights[0]||0).toFixed(3)}</strong> &nbsp;|&nbsp; b = <strong style="color:#10b981;">${this.bias.toFixed(3)}</strong></div>
        </div>
      `;
    } else if (this.type === 'logistic-regression') {
      const w1 = (this.weights[0] || 0).toFixed(3);
      const w2 = (this.weights[1] || 0).toFixed(3);
      const b = this.bias.toFixed(3);
      const loss = this.metrics.trainLoss.toFixed(4);
      container.innerHTML = `
        <div class="ds-math-box">
          <h4>1. Sigmoid &amp; Binary Cross-Entropy</h4>
          <div class="ds-math-formula">z = Σ w<sub>j</sub>·x<sub>j</sub> + b &nbsp;→&nbsp; σ(z) = 1/(1+e<sup>−z</sup>)</div>
          <div class="ds-math-calc">z = ${w1}·x<sub>1</sub> + ${w2}·x<sub>2</sub> + ${b}</div>
          <div class="ds-math-formula" style="margin-top:6px;">BCE = −<sup>1</sup>/<sub>N</sub> Σ[y·ln(σ) + (1−y)·ln(1−σ)]</div>
          <div class="ds-math-calc">Loss = <strong style="color:#f59e0b;">${loss}</strong> &nbsp;|&nbsp; Accuracy = ${this.metrics.score.toFixed(1)}%</div>
        </div>
        <div class="ds-math-box">
          <h4>2. Decision Boundary (Epoch ${this.currentEpoch})</h4>
          <div class="ds-math-formula">Boundary: w<sub>1</sub>·x<sub>1</sub> + w<sub>2</sub>·x<sub>2</sub> + b = 0</div>
          <div class="ds-math-calc">Slope = −w<sub>1</sub>/w<sub>2</sub> = ${(-this.weights[0]/(this.weights[1]||1e-4)).toFixed(3)}</div>
          <div class="ds-math-formula" style="margin-top:6px;">w<sub>j</sub> ← w<sub>j</sub> − α · <sup>1</sup>/<sub>N</sub> Σ (σ−y)·x<sub>j</sub></div>
          <div class="ds-math-calc">w<sub>1</sub> = <strong style="color:#10b981;">${w1}</strong> &nbsp;|&nbsp; w<sub>2</sub> = <strong style="color:#10b981;">${w2}</strong> &nbsp;|&nbsp; b = <strong style="color:#10b981;">${b}</strong></div>
        </div>
      `;
    } else {
      // Decision Tree
      const root = this.treeNodes[0] || null;
      const currentNode = this.treeNodes[this.currentTreeStep - 1] || null;
      const rootE = root ? root.impurity.toFixed(4) : '—';
      const ig = currentNode && currentNode.split ? currentNode.split.ig.toFixed(4) : '—';
      const splitFeat = currentNode && currentNode.split ? escapeHtml(this.features[currentNode.split.feature]) : '—';
      const splitT = currentNode && currentNode.split ? currentNode.split.threshold.toFixed(3) : '—';
      container.innerHTML = `
        <div class="ds-math-box">
          <h4>1. Shannon Entropy (${this.criterion === 'gini' ? 'Gini Impurity' : 'Entropy'})</h4>
          <div class="ds-math-formula">${this.criterion === 'gini' ? 'Gini = 1 − Σ p<sub>c</sub>²' : 'H(S) = −Σ p<sub>c</sub>·log<sub>2</sub>(p<sub>c</sub>)'}</div>
          <div class="ds-math-calc">Root Impurity H(S₀) = <strong style="color:#f59e0b;">${rootE}</strong> bits</div>
        </div>
        <div class="ds-math-box">
          <h4>2. Information Gain — Step ${this.currentTreeStep}</h4>
          <div class="ds-math-formula">IG(S,A) = H(S) − Σ (|Sᵥ|/|S|)·H(Sᵥ)</div>
          <div class="ds-math-calc">Current Split: <strong style="color:#a855f7;">${splitFeat} ≤ ${splitT}</strong></div>
          <div class="ds-math-calc">IG = <strong style="color:#10b981;">${ig}</strong></div>
        </div>
      `;
    }
  };

  /* ==============================================================
     2D VISUALIZATION
     ============================================================== */

  PlaygroundInstance.prototype.draw2D = function () {
    const canvas = this.container.querySelector('#ds2DCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 420);
    const height = (canvas.height = 320);
    ctx.clearRect(0, 0, width, height);

    const pLeft = 45, pRight = 20, pTop = 20, pBottom = 35;
    const plotW = width - pLeft - pRight;
    const plotH = height - pTop - pBottom;

    const xVals = this.data.map(d => d.features[0] || 0);
    const minX = Math.min(0, ...xVals) - 0.5;
    const maxX = Math.max(10, ...xVals) + 0.5;
    const toCanvasX = x => pLeft + ((x - minX) / (maxX - minX || 1)) * plotW;

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const yCoord = pTop + (plotH / 5) * i;
      ctx.beginPath(); ctx.moveTo(pLeft, yCoord); ctx.lineTo(pLeft + plotW, yCoord); ctx.stroke();
      const xCoord = pLeft + (plotW / 5) * i;
      ctx.beginPath(); ctx.moveTo(xCoord, pTop); ctx.lineTo(xCoord, pTop + plotH); ctx.stroke();
    }
    // Axis
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pLeft, pTop); ctx.lineTo(pLeft, pTop + plotH); ctx.lineTo(pLeft + plotW, pTop + plotH); ctx.stroke();

    if (this.type === 'linear-regression') {
      const yVals = this.data.map(d => d.y);
      const minY = Math.min(0, ...yVals) - 0.5;
      const maxY = Math.max(10, ...yVals) + 0.5;
      const toCanvasY = y => pTop + plotH - ((y - minY) / (maxY - minY || 1)) * plotH;

      this.data.forEach(d => {
        const cx = toCanvasX(d.features[0]);
        const cy = toCanvasY(d.y);
        let yPred = this.bias;
        d.features.forEach((v, j) => { yPred += (this.weights[j] || 0) * v; });
        const predY = toCanvasY(yPred);
        // Residual
        ctx.strokeStyle = 'rgba(239,68,68,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, predY); ctx.stroke();
        ctx.setLineDash([]);
        // Point
        ctx.fillStyle = d.isTrain ? '#6366f1' : '#f59e0b';
        ctx.beginPath(); ctx.arc(cx, cy, d.isTrain ? 5 : 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      });

      // Regression line
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3; ctx.setLineDash([]);
      ctx.beginPath();
      const y0 = this.bias + (this.weights[0] || 0) * minX;
      const y1 = this.bias + (this.weights[0] || 0) * maxX;
      ctx.moveTo(toCanvasX(minX), toCanvasY(y0)); ctx.lineTo(toCanvasX(maxX), toCanvasY(y1)); ctx.stroke();

      ctx.font = '11px sans-serif'; ctx.fillStyle = '#94a3b8';
      ctx.fillText(this.features[0] || 'X', pLeft + 5, height - 8);
      ctx.fillText(this.targetName || 'Y', 4, pTop + 12);
    } else {
      // Classification (LogR or DT)
      const y2Vals = this.data.map(d => d.features[1] || 0);
      const minY = Math.min(0, ...y2Vals) - 0.5;
      const maxY = Math.max(10, ...y2Vals) + 0.5;
      const toCanvasY = y => pTop + plotH - ((y - minY) / (maxY - minY || 1)) * plotH;

      if (this.type === 'logistic-regression') {
        const w1 = this.weights[0] || 0;
        const w2 = this.weights[1] || 1e-4;
        const b = this.bias;
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
        ctx.beginPath();
        const startY = -(w1 * minX + b) / w2;
        const endY = -(w1 * maxX + b) / w2;
        ctx.moveTo(toCanvasX(minX), toCanvasY(startY));
        ctx.lineTo(toCanvasX(maxX), toCanvasY(endY)); ctx.stroke();
      } else if (this.type === 'decision-tree' && this.currentTreeStep > 0) {
        // Draw all revealed split boundaries
        const visibleNodes = this.treeNodes.slice(0, this.currentTreeStep);
        const colors = ['#a855f7', '#38bdf8', '#10b981', '#f59e0b', '#ec4899'];
        visibleNodes.forEach((node, idx) => {
          if (!node.split) return;
          const sp = node.split;
          ctx.strokeStyle = colors[idx % colors.length];
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          if (sp.feature === 0) {
            const cx = toCanvasX(sp.threshold);
            ctx.moveTo(cx, pTop); ctx.lineTo(cx, pTop + plotH);
          } else {
            const cy = toCanvasY(sp.threshold);
            ctx.moveTo(pLeft, cy); ctx.lineTo(pLeft + plotW, cy);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // Data points
      this.data.forEach(d => {
        const cx = toCanvasX(d.features[0]);
        const cy = toCanvasY(d.features[1] || 0);
        ctx.fillStyle = d.y === 1 ? '#ec4899' : '#06b6d4';
        ctx.beginPath();
        if (d.y === 1) {
          ctx.moveTo(cx, cy - 7); ctx.lineTo(cx + 7, cy); ctx.lineTo(cx, cy + 7); ctx.lineTo(cx - 7, cy); ctx.closePath();
        } else {
          ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      });

      ctx.font = '11px sans-serif'; ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${this.features[0]} (X₁)`, pLeft + 5, height - 8);
      ctx.fillText(`${this.features[1] || 'X₂'} (X₂)`, 4, pTop + 12);
    }
  };

  /* ==============================================================
     DECISION TREE DIAGRAM CANVAS
     ============================================================== */

  PlaygroundInstance.prototype.drawTree = function () {
    const canvas = this.container.querySelector('#dsTreeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.parentElement.clientWidth || 420);
    const h = (canvas.height = 320);
    ctx.clearRect(0, 0, w, h);

    const visibleNodes = this.treeNodes.slice(0, this.currentTreeStep);
    if (!visibleNodes.length) {
      ctx.fillStyle = '#475569'; ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click Train Model / Step to reveal tree splits', w / 2, h / 2);
      ctx.textAlign = 'left';
      return;
    }

    // Compute layout positions per depth
    const maxDepth = Math.max(...visibleNodes.map(n => n.depth));
    const rowH = Math.min(80, (h - 30) / (maxDepth + 1));
    const nodeW = 96, nodeH = 38;

    // BFS layout
    const positions = {};
    const byDepth = {};
    visibleNodes.forEach(n => {
      if (!byDepth[n.depth]) byDepth[n.depth] = [];
      byDepth[n.depth].push(n);
    });
    Object.keys(byDepth).forEach(dep => {
      const nodes = byDepth[dep];
      const totalW = nodes.length * (nodeW + 12);
      const startX = (w - totalW) / 2 + 6;
      nodes.forEach((n, i) => {
        positions[n.id] = {
          x: startX + i * (nodeW + 12) + nodeW / 2,
          y: 20 + parseInt(dep) * rowH + nodeH / 2
        };
      });
    });

    // Draw edges
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
    visibleNodes.forEach(n => {
      if (n.parentId === null) return;
      const p = positions[n.parentId];
      const c = positions[n.id];
      if (!p || !c) return;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + nodeH / 2);
      ctx.lineTo(c.x, c.y - nodeH / 2);
      ctx.stroke();
      // Edge label
      const midX = (p.x + c.x) / 2;
      const midY = (p.y + c.y) / 2;
      ctx.fillStyle = n.side === 'left' ? '#38bdf8' : '#f59e0b';
      ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(n.side === 'left' ? '≤' : '>', midX, midY);
    });

    // Draw nodes
    visibleNodes.forEach(n => {
      const pos = positions[n.id];
      if (!pos) return;
      const isLeaf = !n.split || !visibleNodes.find(x => x.parentId === n.id);
      const x = pos.x - nodeW / 2;
      const y = pos.y - nodeH / 2;

      // Box
      const grad = ctx.createLinearGradient(x, y, x, y + nodeH);
      if (isLeaf) {
        grad.addColorStop(0, n.predClass === 1 ? '#831843' : '#0e7490');
        grad.addColorStop(1, n.predClass === 1 ? '#9d174d' : '#155e75');
      } else {
        grad.addColorStop(0, '#312e81'); grad.addColorStop(1, '#1e1b4b');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, nodeW, nodeH, 6);
      } else {
        ctx.rect(x, y, nodeW, nodeH);
      }
      ctx.fill();
      ctx.strokeStyle = isLeaf ? (n.predClass === 1 ? '#ec4899' : '#06b6d4') : '#6366f1';
      ctx.lineWidth = 1.5; ctx.stroke();

      ctx.textAlign = 'center'; ctx.fillStyle = '#e2e8f0';
      if (n.split && !isLeaf) {
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(escapeHtml(this.features[n.split.feature] || 'f'), pos.x, y + 13);
        ctx.font = '9px monospace';
        ctx.fillText('≤ ' + n.split.threshold.toFixed(2), pos.x, y + 23);
        ctx.font = '9px sans-serif'; ctx.fillStyle = '#94a3b8';
        ctx.fillText('H=' + n.impurity.toFixed(2) + ' n=' + n.samples, pos.x, y + 33);
      } else {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('Class ' + n.predClass, pos.x, y + 15);
        ctx.font = '9px sans-serif'; ctx.fillStyle = '#94a3b8';
        ctx.fillText('n=' + n.samples + ' H=' + n.impurity.toFixed(2), pos.x, y + 28);
      }
    });
    ctx.textAlign = 'left';
  };

  /* ==============================================================
     3D LOSS SURFACE GRAPH (Plotly)
     ============================================================== */

  PlaygroundInstance.prototype.init3DPlot = function () {
    const el = this.container.querySelector('#ds3DContainer');
    if (!el || typeof Plotly === 'undefined') return;

    const centerW1 = this.weights[0] || 0.5;
    const centerW2 = (this.type === 'linear-regression' ? this.bias : (this.weights[1] || 0));
    const steps = 20;
    const w1Range = [], w2Range = [], zSurface = [];

    for (let i = 0; i <= steps; i++) {
      w1Range.push(centerW1 - 2.5 + (5.0 / steps) * i);
      w2Range.push(centerW2 - 2.5 + (5.0 / steps) * i);
    }

    const { train } = this.getNormalizedData();
    const pts = train.length ? train : [{ features: [1, 1], y: 2 }];

    for (let j = 0; j <= steps; j++) {
      const row = [];
      const v2 = w2Range[j];
      for (let i = 0; i <= steps; i++) {
        const v1 = w1Range[i];
        let loss = 0;
        if (this.type === 'linear-regression') {
          pts.forEach(p => { const pred = v1 * p.features[0] + v2; loss += (pred - p.y) ** 2; });
          loss /= pts.length;
        } else {
          pts.forEach(p => {
            const z = v1 * p.features[0] + v2 * (p.features[1] || 1) + 0.1;
            const sig = 1 / (1 + Math.exp(-Math.max(-10, Math.min(10, z))));
            loss += -(p.y * Math.log(sig + 1e-5) + (1 - p.y) * Math.log(1 - sig + 1e-5));
          });
          loss /= pts.length;
        }
        row.push(Math.min(30, loss));
      }
      zSurface.push(row);
    }

    const surfaceData = { z: zSurface, x: w1Range, y: w2Range, type: 'surface', colorscale: 'Purples', showscale: false, opacity: 0.85 };
    const pathData = {
      x: [this.weights[0]], y: [this.type === 'linear-regression' ? this.bias : this.weights[1]],
      z: [this.metrics.trainLoss || 5], type: 'scatter3d', mode: 'lines+markers',
      line: { color: '#38bdf8', width: 6 }, marker: { color: '#f43f5e', size: 6 }, name: 'Descent Path'
    };
    const layout = {
      autosize: true, margin: { l: 0, r: 0, b: 0, t: 0 },
      paper_bgcolor: '#0b0f19', plot_bgcolor: '#0b0f19',
      scene: {
        xaxis: { title: 'w₁', color: '#94a3b8', gridcolor: '#1e293b' },
        yaxis: { title: this.type === 'linear-regression' ? 'bias (b)' : 'w₂', color: '#94a3b8', gridcolor: '#1e293b' },
        zaxis: { title: 'Loss J(w)', color: '#94a3b8', gridcolor: '#1e293b' },
        camera: { eye: { x: 1.5, y: -1.5, z: 1.2 } }
      }
    };
    Plotly.newPlot(el, [surfaceData, pathData], layout, { responsive: true, displayModeBar: false });
  };

  PlaygroundInstance.prototype.update3DPlot = function () {
    const el = this.container.querySelector('#ds3DContainer');
    if (!el || typeof Plotly === 'undefined' || !el.data) return;
    const histX = this.history.map(h => h.weights[0]);
    const histY = this.history.map(h => (this.type === 'linear-regression' ? h.bias : (h.weights[1] || 0)));
    const histZ = this.history.map(h => h.loss);
    Plotly.restyle(el, { x: [histX], y: [histY], z: [histZ] }, [1]);
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

})();
