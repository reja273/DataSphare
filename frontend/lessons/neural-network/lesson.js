(() => {
  const library = `from sklearn.neural_network import MLPClassifier\n\nmodel = MLPClassifier(hidden_layer_sizes=(4,), activation="relu", max_iter=500, random_state=7)\nmodel.fit(X_train, y_train)\npredictions = model.predict(X_test)\nprint("Predictions:", predictions)`;
  const raw = `# A tiny one-neuron example using only Python\ndef sigmoid(x):\n    return 1 / (1 + 2.71828 ** (-x))\n\ninputs = [0.2, 0.8, 0.4]\nweights = [0.5, -0.3, 0.9]\nbias = 0.1\nweighted_sum = sum(x * w for x, w in zip(inputs, weights)) + bias\noutput = sigmoid(weighted_sum)\nprint("Weighted sum:", round(weighted_sum, 3))\nprint("Neuron output:", round(output, 3))`;
  const editor = document.querySelector('#pythonCode'); let mode = 'raw';
  editor.value = raw;
  document.querySelectorAll('[data-code]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.code;
    if (mode === 'raw') editor.value = raw;
    else if (mode === 'library') editor.value = library;
    else editor.focus();
  }));
  document.querySelector('#runPython').addEventListener('click', () => {
    const output = document.querySelector('#pythonOutput'); output.textContent = '';
    Sk.configure({ output: text => output.textContent += text, read: path => Sk.builtinFiles.files[path] });
    Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, editor.value, true)).catch(error => output.textContent = String(error));
  });
  const canvas = document.querySelector('#networkCanvas'), ctx = canvas.getContext('2d');
  function draw() {
    const x = Number(document.querySelector('#networkInput').value), activation = document.querySelector('#activation').value;
    const activate = v => activation === 'relu' ? Math.max(0, v) : activation === 'tanh' ? Math.tanh(v) : 1 / (1 + Math.exp(-v));
    const hidden = [-1, 0, 1].map(w => activate(x * w + 0.2));
    const out = activate(hidden.reduce((sum, val, i) => sum + val * (i - 1), 0.4));
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = '#526581'; ctx.lineWidth = 1.5;
    const cols = [[90], [300, 180, 270], [520]]; cols[0].forEach(y => cols[1].forEach(h => { ctx.beginPath();ctx.moveTo(115,y);ctx.lineTo(275,h);ctx.stroke(); })); cols[1].forEach(y => { ctx.beginPath();ctx.moveTo(325,y);ctx.lineTo(495,225);ctx.stroke(); });
    const vals = [[x], hidden, [out]]; cols.forEach((ys,c) => ys.forEach((y,r) => { ctx.beginPath();ctx.arc(c===0?90:c===1?300:520,y,23,0,Math.PI*2);ctx.fillStyle=`hsl(${240-vals[c][r]*120},80%,63%)`;ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='13px sans-serif';ctx.fillText(vals[c][r].toFixed(2),c===0?90:c===1?300:520,y+4); }));
    document.querySelector('#networkOutput').textContent = `Output: ${out.toFixed(3)}`;
  }
  document.querySelector('#networkInput').addEventListener('input', draw); document.querySelector('#activation').addEventListener('change', draw); draw();
})();
