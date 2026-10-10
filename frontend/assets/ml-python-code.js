/**
 * DataSphare Python Code Section
 * Renders two-tab Python code blocks (With Libraries + From Scratch)
 * for Linear Regression, Logistic Regression, and Decision Tree.
 */

(function () {
  'use strict';

  window.DataSpharePyCode = {
    init: function (containerId, options) {
      const type = (options && options.type) || 'linear-regression';
      const container = document.getElementById(containerId);
      if (!container) return;
      const instance = new PythonCodeSection(container, type);
      instance.mount();
      return instance;
    }
  };

  const CODE = {

    /* ================================================================
       LINEAR REGRESSION
       ================================================================ */
    'linear-regression': {
      withLibrary: `# ─── Linear Regression with scikit-learn ───────────────────────────
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import matplotlib.pyplot as plt

# ── 1. Dataset (House pricing example) ──────────────────────────────
data = {
    'Area_100sqft': [5, 7, 8, 6, 9, 4, 10, 3, 11, 6, 7, 8, 5, 9, 4],
    'Bedrooms':     [2, 3, 3, 2, 4, 1,  4, 1,  5, 3, 2, 4, 3, 3, 2],
    'Price_10k':    [3.8,5.6,6.5,4.8,7.0,3.2,8.0,2.5,8.8,4.5,5.8,6.2,3.9,7.5,3.0]
}
df = pd.DataFrame(data)

X = df[['Area_100sqft', 'Bedrooms']]
y = df['Price_10k']

# ── 2. Train-Test Split ──────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Train: {len(X_train)} samples  |  Test: {len(X_test)} samples")

# ── 3. Model Training ────────────────────────────────────────────────
model = LinearRegression()
model.fit(X_train, y_train)

print(f"\\nLearned Weights : {model.coef_}")
print(f"Learned Bias    : {model.intercept_:.4f}")

# ── 4. Evaluation ────────────────────────────────────────────────────
y_pred = model.predict(X_test)

mse  = mean_squared_error(y_test, y_pred)
r2   = r2_score(y_test, y_pred)
print(f"\\nTest MSE  : {mse:.4f}")
print(f"Test R²   : {r2:.4f}")

# ── 5. Prediction ────────────────────────────────────────────────────
new_house = [[8.5, 3]]  # Area=850 sqft, 3 bedrooms
predicted_price = model.predict(new_house)
print(f"\\nPredicted Price for 850sqft/3bed: \${predicted_price[0]:.2f}×10k")

# ── 6. Visualize ─────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Left: Actual vs Predicted
axes[0].scatter(y_test, y_pred, color='#6366f1', edgecolors='white', s=80)
axes[0].plot([y_test.min(), y_test.max()],
             [y_test.min(), y_test.max()], 'r--', lw=2)
axes[0].set_xlabel('Actual Price'); axes[0].set_ylabel('Predicted Price')
axes[0].set_title(f'Actual vs Predicted  (R²={r2:.3f})')

# Right: Training loss curve (simulate gradient descent manually for viz)
losses = []
w = np.zeros(X_train.shape[1]); b = 0.0; lr = 0.01
X_np = X_train.values; y_np = y_train.values
for epoch in range(200):
    y_hat = X_np @ w + b
    loss = np.mean((y_hat - y_np)**2)
    losses.append(loss)
    grad_w = (2/len(y_np)) * X_np.T @ (y_hat - y_np)
    grad_b = (2/len(y_np)) * np.sum(y_hat - y_np)
    w -= lr * grad_w; b -= lr * grad_b

axes[1].plot(losses, color='#10b981', linewidth=2)
axes[1].set_xlabel('Epoch'); axes[1].set_ylabel('MSE Loss')
axes[1].set_title('Training Loss Curve (Gradient Descent)')

plt.tight_layout()
plt.show()
`,

      fromScratch: `# ─── Linear Regression FROM SCRATCH (No Libraries) ─────────────────
# Pure Python — no numpy, no pandas, no sklearn

# ── 1. Dataset ───────────────────────────────────────────────────────
# Features: [Area_100sqft, Bedrooms]
X_data = [
    [5, 2], [7, 3], [8, 3], [6, 2], [9, 4], [4, 1], [10, 4],
    [3, 1], [11, 5], [6, 3], [7, 2], [8, 4], [5, 3], [9, 3], [4, 2]
]
y_data = [3.8, 5.6, 6.5, 4.8, 7.0, 3.2, 8.0, 2.5, 8.8, 4.5, 5.8, 6.2, 3.9, 7.5, 3.0]

# ── 2. Train-Test Split (80/20) ──────────────────────────────────────
split = int(0.8 * len(X_data))
X_train, X_test = X_data[:split], X_data[split:]
y_train, y_test = y_data[:split], y_data[split:]

# ── 3. Helper Functions ──────────────────────────────────────────────
def dot(weights, features):
    """w · x"""
    return sum(w * x for w, x in zip(weights, features))

def predict(weights, bias, features):
    """ŷ = w·x + b"""
    return dot(weights, features) + bias

def mse_loss(weights, bias, X, y):
    """MSE = (1/N) Σ (ŷ - y)²"""
    N = len(y)
    return sum((predict(weights, bias, x) - yi)**2 for x, yi in zip(X, y)) / N

# ── 4. Gradient Descent Training ─────────────────────────────────────
n_features = len(X_train[0])
weights = [0.5] * n_features   # ← you can change initial weights
bias    = 0.0                   # ← you can change initial bias

learning_rate = 0.04
epochs        = 100

print(f"Initial weights: {weights}")
print(f"Initial bias   : {bias}")
print(f"Initial MSE    : {mse_loss(weights, bias, X_train, y_train):.4f}")
print("\\n--- Training ---")

loss_history = []
for epoch in range(epochs):
    N = len(X_train)
    grad_w = [0.0] * n_features
    grad_b = 0.0
    loss   = 0.0

    # Compute gradients over all training points
    for x, y_true in zip(X_train, y_train):
        y_hat = predict(weights, bias, x)
        err   = y_hat - y_true
        loss += err ** 2

        for j in range(n_features):
            grad_w[j] += (2 / N) * err * x[j]   # dL/dw_j
        grad_b += (2 / N) * err                  # dL/db

    loss /= N
    loss_history.append(loss)

    # Parameter Update: w ← w - α·∇w,  b ← b - α·∇b
    for j in range(n_features):
        weights[j] -= learning_rate * grad_w[j]
    bias -= learning_rate * grad_b

    if epoch % 20 == 0:
        print(f"Epoch {epoch:3d}: Loss={loss:.4f} | w={[round(w,4) for w in weights]} | b={bias:.4f}")

# ── 5. Evaluation (from scratch) ─────────────────────────────────────
def r2_score_scratch(weights, bias, X, y):
    y_mean = sum(y) / len(y)
    ss_tot = sum((yi - y_mean)**2 for yi in y)
    ss_res = sum((predict(weights, bias, x) - yi)**2 for x, yi in zip(X, y))
    return 1 - ss_res / ss_tot if ss_tot != 0 else 0

test_mse = mse_loss(weights, bias, X_test, y_test)
test_r2  = r2_score_scratch(weights, bias, X_test, y_test)

print(f"\\n--- Final Results ---")
print(f"Learned weights : {[round(w, 4) for w in weights]}")
print(f"Learned bias    : {round(bias, 4)}")
print(f"Test MSE        : {test_mse:.4f}")
print(f"Test R²         : {test_r2:.4f}")

# ── 6. Prediction ────────────────────────────────────────────────────
new_house = [8.5, 3]  # 850 sqft, 3 bedrooms
price = predict(weights, bias, new_house)
print(f"\\nPredicted price for {new_house}: \${price:.2f}×10k")

print("\\nLoss over epochs:", [round(l, 3) for l in loss_history[::20]])
`
    },

    /* ================================================================
       LOGISTIC REGRESSION
       ================================================================ */
    'logistic-regression': {
      withLibrary: `# ─── Logistic Regression with scikit-learn ──────────────────────────
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, classification_report,
                              confusion_matrix, roc_auc_score, roc_curve)
import matplotlib.pyplot as plt

# ── 1. Dataset (Exam Pass/Fail) ──────────────────────────────────────
data = {
    'Exam1': [7,8,9,6,7.5,8.5,9,6.5,7,8, 3,2,4,3,2.5,4,3.5,2,4.5,3],
    'Exam2': [6,7,8,7,8.5,9,6,8,9,6.5, 4,3,3,2,4,2.5,3,4.5,2,3.5],
    'Pass':  [1,1,1,1,1,1,1,1,1,1,    0,0,0,0,0,0,0,0,0,0]
}
df = pd.DataFrame(data)

X = df[['Exam1', 'Exam2']].values
y = df['Pass'].values

# ── 2. Train-Test Split ──────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── 3. Model Training ────────────────────────────────────────────────
model = LogisticRegression(max_iter=1000, C=1.0)
model.fit(X_train, y_train)

print(f"Weights  : {model.coef_[0]}")
print(f"Bias     : {model.intercept_[0]:.4f}")

# ── 4. Evaluation ────────────────────────────────────────────────────
y_pred      = model.predict(X_test)
y_prob      = model.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_prob)

print(f"\\nAccuracy : {acc*100:.1f}%")
print(f"AUC-ROC  : {auc:.4f}")
print("\\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Fail','Pass']))

# ── 5. Visualize Decision Boundary ───────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Left: Decision boundary
x1_min, x1_max = X[:, 0].min() - 1, X[:, 0].max() + 1
x2_min, x2_max = X[:, 1].min() - 1, X[:, 1].max() + 1
xx1, xx2 = np.meshgrid(np.linspace(x1_min, x1_max, 200),
                        np.linspace(x2_min, x2_max, 200))
Z = model.predict_proba(np.c_[xx1.ravel(), xx2.ravel()])[:, 1]
Z = Z.reshape(xx1.shape)

axes[0].contourf(xx1, xx2, Z, alpha=0.3, cmap='coolwarm')
axes[0].scatter(X[y==0,0], X[y==0,1], c='#06b6d4', label='Fail', edgecolors='w')
axes[0].scatter(X[y==1,0], X[y==1,1], c='#ec4899', marker='^', label='Pass', edgecolors='w')
axes[0].set_xlabel('Exam 1'); axes[0].set_ylabel('Exam 2')
axes[0].set_title(f'Decision Boundary (Acc={acc*100:.1f}%)')
axes[0].legend()

# Right: ROC curve
fpr, tpr, _ = roc_curve(y_test, y_prob)
axes[1].plot(fpr, tpr, color='#6366f1', linewidth=2, label=f'AUC={auc:.3f}')
axes[1].plot([0,1],[0,1],'r--')
axes[1].set_xlabel('False Positive Rate'); axes[1].set_ylabel('True Positive Rate')
axes[1].set_title('ROC Curve'); axes[1].legend()

plt.tight_layout()
plt.show()
`,

      fromScratch: `# ─── Logistic Regression FROM SCRATCH (No Libraries) ────────────────
# Pure Python — manual sigmoid, BCE loss, gradient descent

import math

# ── 1. Dataset ───────────────────────────────────────────────────────
X_data = [
    [7,6],[8,7],[9,8],[6,7],[7.5,8.5],[8.5,9],[9,6],[6.5,8],[7,9],[8,6.5],
    [3,4],[2,3],[4,3],[3,2],[2.5,4],[4,2.5],[3.5,3],[2,4.5],[4.5,2],[3,3.5]
]
y_data = [1,1,1,1,1,1,1,1,1,1, 0,0,0,0,0,0,0,0,0,0]

# ── 2. Train-Test Split ──────────────────────────────────────────────
split   = int(0.8 * len(X_data))
X_train = X_data[:split]; y_train = y_data[:split]
X_test  = X_data[split:]; y_test  = y_data[split:]

# ── 3. Helper Functions ──────────────────────────────────────────────
def sigmoid(z):
    """σ(z) = 1 / (1 + e^{-z})"""
    z = max(-20, min(20, z))   # numerical stability
    return 1.0 / (1.0 + math.exp(-z))

def linear_combination(weights, bias, x):
    """z = w·x + b"""
    return sum(w * xi for w, xi in zip(weights, x)) + bias

def predict_prob(weights, bias, x):
    """P(Y=1 | x) = σ(w·x + b)"""
    return sigmoid(linear_combination(weights, bias, x))

def bce_loss(weights, bias, X, y):
    """Binary Cross-Entropy = -(1/N) Σ [y·log(p̂) + (1-y)·log(1-p̂)]"""
    N = len(y)
    eps = 1e-7
    total = 0
    for xi, yi in zip(X, y):
        p = predict_prob(weights, bias, xi)
        total -= yi * math.log(p + eps) + (1-yi) * math.log(1-p + eps)
    return total / N

# ── 4. Gradient Descent Training ─────────────────────────────────────
n_features = len(X_train[0])
weights = [0.6, -0.8]   # ← change these initial values
bias    = 0.1           # ← change initial bias

learning_rate = 0.08
epochs        = 100
threshold     = 0.5

print(f"Initial weights: {weights}")
print(f"Initial bias   : {bias}")
print(f"Initial BCE    : {bce_loss(weights, bias, X_train, y_train):.4f}")
print("\\n--- Training ---")

loss_history = []
for epoch in range(epochs):
    N = len(X_train)
    grad_w = [0.0] * n_features
    grad_b = 0.0
    loss   = bce_loss(weights, bias, X_train, y_train)
    loss_history.append(loss)

    # Compute gradients
    for x, y_true in zip(X_train, y_train):
        p   = predict_prob(weights, bias, x)   # σ(z)
        err = p - y_true                        # ∂L/∂z = (p - y)

        for j in range(n_features):
            grad_w[j] += (1/N) * err * x[j]   # ∂L/∂w_j
        grad_b += (1/N) * err                  # ∂L/∂b

    # Parameter Update
    for j in range(n_features):
        weights[j] -= learning_rate * grad_w[j]
    bias -= learning_rate * grad_b

    if epoch % 20 == 0:
        # Compute accuracy
        correct = sum(
            1 for x, y_true in zip(X_train, y_train)
            if (1 if predict_prob(weights, bias, x) >= threshold else 0) == y_true
        )
        acc = correct / N * 100
        print(f"Epoch {epoch:3d}: BCE={loss:.4f} | w={[round(w,4) for w in weights]} | b={bias:.4f} | Acc={acc:.1f}%")

# ── 5. Test Evaluation ────────────────────────────────────────────────
correct = sum(
    1 for x, y_true in zip(X_test, y_test)
    if (1 if predict_prob(weights, bias, x) >= threshold else 0) == y_true
)
test_acc = correct / len(y_test) * 100
test_bce = bce_loss(weights, bias, X_test, y_test)

print(f"\\n--- Final Results ---")
print(f"Weights  : {[round(w,4) for w in weights]}")
print(f"Bias     : {round(bias, 4)}")
print(f"Test BCE : {test_bce:.4f}")
print(f"Test Acc : {test_acc:.1f}%")

# ── 6. Prediction (Decision Boundary) ────────────────────────────────
new_student = [7.5, 8.0]
prob = predict_prob(weights, bias, new_student)
pred = 1 if prob >= threshold else 0
z = linear_combination(weights, bias, new_student)
print(f"\\nNew student scores: {new_student}")
print(f"z = w·x + b = {z:.4f}")
print(f"σ(z) = {prob:.4f}  →  Prediction: {'PASS ✅' if pred else 'FAIL ❌'}")

# Decision boundary equation: w1*x1 + w2*x2 + b = 0
# → x2 = -(w1*x1 + b) / w2
print(f"\\nDecision boundary: {weights[0]:.3f}·x₁ + {weights[1]:.3f}·x₂ + {bias:.3f} = 0")
`
    },

    /* ================================================================
       DECISION TREE
       ================================================================ */
    'decision-tree': {
      withLibrary: `# ─── Decision Tree with scikit-learn ────────────────────────────────
import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier, export_text, plot_tree
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import matplotlib.pyplot as plt

# ── 1. Dataset (Tree Species — Height & Diameter) ────────────────────
data = {
    'Height_m':   [1.2,1.5,1.8,2.0,1.3,1.7,2.2,1.4,1.6,1.9,
                   4.5,5.0,4.8,5.5,4.2,5.2,4.7,5.8,4.3,5.1,
                   3.0,3.3,3.5,3.2,3.8],
    'Diameter_m': [0.3,0.4,0.5,0.4,0.6,0.3,0.5,0.4,0.6,0.3,
                   1.2,1.5,1.1,1.8,1.3,1.4,1.6,1.2,1.5,1.3,
                   0.9,0.8,1.0,0.7,0.9],
    'Species':    [0,0,0,0,0,0,0,0,0,0,
                   1,1,1,1,1,1,1,1,1,1,
                   0,0,0,0,0]
}
df = pd.DataFrame(data)

X = df[['Height_m', 'Diameter_m']].values
y = df['Species'].values

# ── 2. Train-Test Split ──────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── 3. Model Training ────────────────────────────────────────────────
model = DecisionTreeClassifier(
    criterion='entropy',    # or 'gini'
    max_depth=3,
    min_samples_split=2,
    random_state=42
)
model.fit(X_train, y_train)

# ── 4. Evaluation ────────────────────────────────────────────────────
y_pred = model.predict(X_test)
acc    = accuracy_score(y_test, y_pred)

print(f"Test Accuracy : {acc*100:.1f}%")
print(f"Tree Depth    : {model.get_depth()}")
print(f"Tree Leaves   : {model.get_n_leaves()}")
print("\\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Species 0','Species 1']))

# ── 5. Print Tree Rules ───────────────────────────────────────────────
feature_names = ['Height_m', 'Diameter_m']
tree_rules = export_text(model, feature_names=feature_names)
print("\\nDecision Tree Rules:")
print(tree_rules)

# ── 6. Feature Importance ────────────────────────────────────────────
importances = model.feature_importances_
print("Feature Importances:")
for name, imp in zip(feature_names, importances):
    print(f"  {name}: {imp:.4f}")

# ── 7. Visualize ─────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# Left: Tree diagram
plot_tree(model, feature_names=feature_names,
          class_names=['Species 0','Species 1'],
          filled=True, rounded=True, ax=axes[0], fontsize=9)
axes[0].set_title('Trained Decision Tree')

# Right: Decision boundary
x_min, x_max = X[:, 0].min()-0.5, X[:, 0].max()+0.5
y_min, y_max = X[:, 1].min()-0.2, X[:, 1].max()+0.2
xx, yy = np.meshgrid(np.linspace(x_min, x_max, 300),
                     np.linspace(y_min, y_max, 300))
Z = model.predict(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)

axes[1].contourf(xx, yy, Z, alpha=0.3, cmap='coolwarm')
axes[1].scatter(X[y==0,0], X[y==0,1], c='#06b6d4', label='Species 0', edgecolors='w')
axes[1].scatter(X[y==1,0], X[y==1,1], c='#ec4899', marker='^', label='Species 1', edgecolors='w')
axes[1].set_xlabel('Height (m)'); axes[1].set_ylabel('Diameter (m)')
axes[1].set_title('Decision Boundary'); axes[1].legend()

plt.tight_layout()
plt.show()
`,

      fromScratch: `# ─── Decision Tree FROM SCRATCH (No Libraries) ──────────────────────
# Pure Python — manual entropy, information gain, recursive splitting

import math
from collections import Counter

# ── 1. Dataset ───────────────────────────────────────────────────────
# Features: [Height_m, Diameter_m], Labels: 0=Species0, 1=Species1
X_data = [
    [1.2,0.3],[1.5,0.4],[1.8,0.5],[2.0,0.4],[1.3,0.6],[1.7,0.3],
    [2.2,0.5],[1.4,0.4],[1.6,0.6],[1.9,0.3],
    [4.5,1.2],[5.0,1.5],[4.8,1.1],[5.5,1.8],[4.2,1.3],[5.2,1.4],
    [4.7,1.6],[5.8,1.2],[4.3,1.5],[5.1,1.3],
    [3.0,0.9],[3.3,0.8],[3.5,1.0],[3.2,0.7],[3.8,0.9]
]
y_data = [0,0,0,0,0,0,0,0,0,0, 1,1,1,1,1,1,1,1,1,1, 0,0,0,0,0]
feature_names = ['Height_m', 'Diameter_m']

# ── 2. Helper Functions ──────────────────────────────────────────────
def entropy(labels):
    """H(S) = -Σ p_c · log2(p_c)"""
    if not labels:
        return 0.0
    n = len(labels)
    counts = Counter(labels)
    return -sum((c/n) * math.log2(c/n) for c in counts.values() if c > 0)

def information_gain(labels, left_labels, right_labels):
    """IG = H(parent) - weighted_avg_H(children)"""
    n = len(labels)
    h_parent  = entropy(labels)
    h_left    = entropy(left_labels)
    h_right   = entropy(right_labels)
    weighted  = (len(left_labels)/n) * h_left + (len(right_labels)/n) * h_right
    return h_parent - weighted

def best_split(X, y, n_features):
    """Find best (feature, threshold) to split on using max IG."""
    best_ig    = -1
    best_feat  = None
    best_thresh = None

    for f in range(n_features):
        values = sorted(set(x[f] for x in X))
        for i in range(len(values) - 1):
            thresh = (values[i] + values[i+1]) / 2

            left_y  = [yi for x, yi in zip(X, y) if x[f] <= thresh]
            right_y = [yi for x, yi in zip(X, y) if x[f] >  thresh]

            if not left_y or not right_y:
                continue

            ig = information_gain(y, left_y, right_y)
            if ig > best_ig:
                best_ig    = ig
                best_feat  = f
                best_thresh = thresh

    return best_feat, best_thresh, best_ig

# ── 3. Decision Tree Node ────────────────────────────────────────────
class TreeNode:
    def __init__(self, feature=None, threshold=None, label=None,
                 left=None, right=None, impurity=0, samples=0, ig=0):
        self.feature   = feature     # split feature index
        self.threshold = threshold   # split threshold
        self.label     = label       # leaf class prediction
        self.left      = left
        self.right     = right
        self.impurity  = impurity    # entropy at this node
        self.samples   = samples
        self.ig        = ig          # information gain of this split

# ── 4. Build Tree (Recursive) ────────────────────────────────────────
def build_tree(X, y, max_depth=3, min_samples=2, depth=0):
    n = len(y)
    node_entropy = entropy(y)
    node_samples = n

    # Stop conditions: pure node, too small, or max depth reached
    if n < min_samples or depth >= max_depth or node_entropy < 1e-6:
        label = max(Counter(y), key=Counter(y).get)
        return TreeNode(label=label, impurity=node_entropy, samples=node_samples)

    feat, thresh, ig = best_split(X, y, n_features=len(X[0]))

    if feat is None or ig < 1e-6:
        label = max(Counter(y), key=Counter(y).get)
        return TreeNode(label=label, impurity=node_entropy, samples=node_samples)

    # Split data
    left_X  = [x for x in X if x[feat] <= thresh]
    left_y  = [yi for x, yi in zip(X, y) if x[feat] <= thresh]
    right_X = [x for x in X if x[feat] >  thresh]
    right_y = [yi for x, yi in zip(X, y) if x[feat] >  thresh]

    print(f"{'  '*depth}Depth {depth}: Split on [{feature_names[feat]}] <= {thresh:.3f} "
          f"| IG={ig:.4f} | H={node_entropy:.4f} | n={n}")

    left_node  = build_tree(left_X,  left_y,  max_depth, min_samples, depth+1)
    right_node = build_tree(right_X, right_y, max_depth, min_samples, depth+1)

    return TreeNode(feature=feat, threshold=thresh, left=left_node,
                    right=right_node, impurity=node_entropy, samples=n, ig=ig)

# ── 5. Train ─────────────────────────────────────────────────────────
split_idx = int(0.8 * len(X_data))
X_train = X_data[:split_idx]; y_train = y_data[:split_idx]
X_test  = X_data[split_idx:]; y_test  = y_data[split_idx:]

print("=== Building Decision Tree ===")
root = build_tree(X_train, y_train, max_depth=3, min_samples=2)
print("\\nTree built successfully!")

# ── 6. Prediction ────────────────────────────────────────────────────
def predict_one(node, x):
    """Walk the tree for a single sample."""
    if node.label is not None:  # leaf node
        return node.label
    if x[node.feature] <= node.threshold:
        return predict_one(node.left, x)
    else:
        return predict_one(node.right, x)

def predict(root, X):
    return [predict_one(root, x) for x in X]

# ── 7. Evaluation ────────────────────────────────────────────────────
y_pred = predict(root, X_test)
correct = sum(p == t for p, t in zip(y_pred, y_test))
accuracy = correct / len(y_test) * 100

print(f"\\n=== Test Results ===")
print(f"Predictions : {y_pred}")
print(f"Ground Truth: {y_test}")
print(f"Accuracy    : {accuracy:.1f}%  ({correct}/{len(y_test)})")

# ── 8. Print Tree ────────────────────────────────────────────────────
def print_tree(node, depth=0):
    indent = "  " * depth
    if node.label is not None:
        print(f"{indent}→ Leaf: Class {node.label}  [H={node.impurity:.3f}, n={node.samples}]")
    else:
        print(f"{indent}[{feature_names[node.feature]} <= {node.threshold:.3f}]  "
              f"IG={node.ig:.3f}, H={node.impurity:.3f}, n={node.samples}")
        print(f"{indent}  LEFT (<=):")
        print_tree(node.left, depth+2)
        print(f"{indent}  RIGHT (>):")
        print_tree(node.right, depth+2)

print("\\n=== Tree Structure ===")
print_tree(root)

# Predict new sample
new_sample = [3.5, 0.7]
pred = predict_one(root, new_sample)
print(f"\\nNew sample {dict(zip(feature_names, new_sample))} → Class {pred}")
`
    }
  };

  /* ==================================================================
     PYTHON CODE SECTION — UI
     ================================================================== */

  function PythonCodeSection(container, type) {
    this.container = container;
    this.type = type;
    this.activeTab = 'library';
  }

  PythonCodeSection.prototype.mount = function () {
    const typeLabel = this.type === 'linear-regression'
      ? 'Linear Regression'
      : this.type === 'logistic-regression'
        ? 'Logistic Regression'
        : 'Decision Tree';

    const codeData = CODE[this.type] || CODE['linear-regression'];

    this.container.innerHTML = `
      <div class="ds-pycode-wrapper">
        <div class="ds-pycode-header">
          <span class="ds-pycode-badge">Python Code</span>
          <h2 class="ds-pycode-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
              <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
              <path d="M7 7h.01"/>
            </svg>
            ${typeLabel} — Python Implementation
          </h2>
          <p class="ds-pycode-subtitle">Two versions: using scikit-learn library vs. pure Python from scratch — so you understand both the API and the math behind it.</p>
        </div>

        <div class="ds-pycode-tabs">
          <button class="ds-tab-btn ds-tab-active" data-tab="library">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 9-2 2 2 2"/><path d="m15 9 2 2-2 2"/><path d="M11 17l2-10"/>
            </svg>
            With Libraries (scikit-learn)
          </button>
          <button class="ds-tab-btn" data-tab="scratch">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/>
            </svg>
            From Scratch (No Libraries)
          </button>
        </div>

        <div class="ds-pycode-content">
          <div class="ds-pycode-toolbar">
            <span class="ds-pycode-lang">Python 3</span>
            <button class="ds-copy-btn" id="dsCopyBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy Code
            </button>
          </div>
          <pre class="ds-pycode-pre" id="dsPycodeBlock"><code id="dsPycodeInner"></code></pre>
        </div>

        <div class="ds-pycode-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
          <span>Run in <strong>Jupyter Notebook</strong>, <strong>Google Colab</strong>, or any Python 3.7+ environment. Install requirements: <code>pip install numpy pandas scikit-learn matplotlib</code></span>
        </div>
      </div>
    `;

    this._codeData = codeData;
    this.setTab('library');
    this.bindEvents();
  };

  PythonCodeSection.prototype.setTab = function (tab) {
    this.activeTab = tab;
    const codeEl = this.container.querySelector('#dsPycodeInner');
    if (!codeEl) return;

    const code = tab === 'library'
      ? this._codeData.withLibrary
      : this._codeData.fromScratch;

    codeEl.textContent = code;
    this.highlightKeywords(codeEl);

    // Update tab buttons
    this.container.querySelectorAll('.ds-tab-btn').forEach(btn => {
      btn.classList.toggle('ds-tab-active', btn.dataset.tab === tab);
    });
  };

  PythonCodeSection.prototype.highlightKeywords = function (el) {
    // Simple keyword highlighting via CSS class injection
    const text = el.textContent;
    const html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // Comments
      .replace(/(#[^\n]*)/g, '<span class="py-comment">$1</span>')
      // Strings
      .replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/g, '<span class="py-string">$1</span>')
      // Keywords
      .replace(/\b(import|from|as|def|class|return|if|else|elif|for|while|in|not|and|or|True|False|None|break|continue|pass|with|yield|lambda|try|except|finally|raise|del|global|nonlocal|assert)\b/g, '<span class="py-kw">$1</span>')
      // Built-ins & functions
      .replace(/\b(print|len|range|sum|max|min|zip|map|filter|list|dict|set|tuple|str|int|float|round|abs|sorted|enumerate|type|isinstance|hasattr|getattr)\b/g, '<span class="py-builtin">$1</span>')
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="py-num">$1</span>')
      // Decorators
      .replace(/@\w+/g, '<span class="py-decorator">$&</span>');

    el.innerHTML = html;
  };

  PythonCodeSection.prototype.bindEvents = function () {
    const self = this;

    this.container.querySelectorAll('.ds-tab-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        self.setTab(this.dataset.tab);
      });
    });

    const copyBtn = this.container.querySelector('#dsCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        const code = self.activeTab === 'library'
          ? self._codeData.withLibrary
          : self._codeData.fromScratch;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(code).then(function () {
            copyBtn.textContent = '✓ Copied!';
            setTimeout(function () {
              copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Code';
            }, 2000);
          });
        }
      });
    }
  };

})();
