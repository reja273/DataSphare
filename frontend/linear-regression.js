// Linear Regression Demo JavaScript

// Global variables
let dataset = [];
let trainSet = [];
let testSet = [];
let weight = 0;
let bias = 0;
let lossHistory = [];
let weightHistory = [];
let biasHistory = [];
let regressionChart = null;
let lossChart = null;
let weightChart = null;
let isTraining = false;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateFeatureTargetLabels();
    initScrollAnimations();
});

// Scroll Animations using Intersection Observer
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all animated elements
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
    animatedElements.forEach(el => observer.observe(el));
}

// Update labels based on user input
function updateFeatureTargetLabels() {
    const featureName = document.getElementById('featureName').value;
    const targetName = document.getElementById('targetName').value;
    
    document.getElementById('predictionLabel').textContent = `Enter ${featureName}:`;
    document.getElementById('resultTarget').textContent = targetName;
}

// Add data point
function addDataPoint() {
    const x = parseFloat(document.getElementById('pointX').value);
    const y = parseFloat(document.getElementById('pointY').value);
    
    if (isNaN(x) || isNaN(y)) {
        alert('Please enter valid numbers for both X and Y');
        return;
    }
    
    dataset.push({ x, y });
    updatePointsDisplay();
    
    // Clear inputs
    document.getElementById('pointX').value = '';
    document.getElementById('pointY').value = '';
    document.getElementById('pointX').focus();
}

// Update points display
function updatePointsDisplay() {
    const container = document.getElementById('pointsContainer');
    container.innerHTML = '';
    
    dataset.forEach((point, index) => {
        const pointItem = document.createElement('div');
        pointItem.className = 'point-item';
        pointItem.innerHTML = `
            <span>(${point.x.toFixed(2)}, ${point.y.toFixed(2)})</span>
            <button class="remove-btn" onclick="removePoint(${index})">×</button>
        `;
        container.appendChild(pointItem);
    });
}

// Remove point
function removePoint(index) {
    dataset.splice(index, 1);
    updatePointsDisplay();
}

// Load preset datasets
function loadPreset(type) {
    if (type === 'simple') {
        dataset = [
            { x: 1, y: 2 },
            { x: 2, y: 4 },
            { x: 3, y: 5 },
            { x: 4, y: 4 },
            { x: 5, y: 5 },
            { x: 6, y: 7 },
            { x: 7, y: 8 },
            { x: 8, y: 9 }
        ];
        document.getElementById('featureName').value = 'Study Hours';
        document.getElementById('targetName').value = 'Score';
    } else if (type === 'house') {
        dataset = [
            { x: 1000, y: 200000 },
            { x: 1500, y: 250000 },
            { x: 2000, y: 300000 },
            { x: 2500, y: 350000 },
            { x: 3000, y: 400000 },
            { x: 3500, y: 450000 },
            { x: 4000, y: 500000 },
            { x: 4500, y: 550000 }
        ];
        document.getElementById('featureName').value = 'Square Feet';
        document.getElementById('targetName').value = 'Price';
    } else if (type === 'large') {
        // Larger dataset for practice
        dataset = [];
        for (let i = 1; i <= 50; i++) {
            const x = i;
            const y = 2 * x + 1 + (Math.random() - 0.5) * 4; // y = 2x + 1 with noise
            dataset.push({ x, y });
        }
        document.getElementById('featureName').value = 'Experience (Years)';
        document.getElementById('targetName').value = 'Salary (K)';
    } else if (type === 'noisy') {
        // Noisy dataset
        dataset = [];
        for (let i = 1; i <= 30; i++) {
            const x = i;
            const y = 1.5 * x + 2 + (Math.random() - 0.5) * 10; // More noise
            dataset.push({ x, y });
        }
        document.getElementById('featureName').value = 'Temperature (°C)';
        document.getElementById('targetName').value = 'Ice Cream Sales';
    }
    
    updatePointsDisplay();
    updateFeatureTargetLabels();
}

// Clear dataset
function clearDataset() {
    dataset = [];
    updatePointsDisplay();
}

// Navigation functions
function goToStep1() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step4').style.display = 'none';
    document.getElementById('step5').style.display = 'none';
    document.querySelector('.dataset-builder').style.display = 'block';
}

function goToStep2() {
    if (dataset.length < 4) {
        alert('Please add at least 4 data points before proceeding');
        return;
    }
    
    document.querySelector('.dataset-builder').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    updateTrainSize();
}

function goToStep3() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    initializeWeights();
}

function goToStep4() {
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step4').style.display = 'block';
    resetTraining();
}

function goToStep5() {
    document.getElementById('step4').style.display = 'none';
    document.getElementById('step5').style.display = 'block';
    initializeRegressionChart();
}

// Update train size
function updateTrainSize() {
    const trainSize = document.getElementById('trainSize').value;
    document.getElementById('trainSizeDisplay').textContent = trainSize;
    
    const trainCount = Math.floor(dataset.length * (trainSize / 100));
    
    // Shuffle and split
    const shuffled = [...dataset].sort(() => Math.random() - 0.5);
    trainSet = shuffled.slice(0, trainCount);
    testSet = shuffled.slice(trainCount);
    
    // Update display
    updateSplitDisplay('trainPoints', trainSet);
    updateSplitDisplay('testPoints', testSet);
}

function updateSplitDisplay(containerId, data) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    data.forEach(point => {
        const pointEl = document.createElement('div');
        pointEl.className = 'preview-point';
        pointEl.textContent = `(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`;
        container.appendChild(pointEl);
    });
}

// Initialize weights
function initializeWeights() {
    weight = Math.random() * 2 - 1; // Random between -1 and 1
    bias = Math.random() * 2 - 1;
    
    document.getElementById('weightValue').textContent = weight.toFixed(4);
    document.getElementById('biasValue').textContent = bias.toFixed(4);
    document.getElementById('eqWeight').textContent = weight.toFixed(4);
    document.getElementById('eqBias').textContent = bias.toFixed(4);
}

// Training functions
function startTraining() {
    if (isTraining) return;
    
    isTraining = true;
    lossHistory = [];
    weightHistory = [];
    biasHistory = [];
    
    const learningRate = parseFloat(document.getElementById('learningRate').value);
    const epochs = parseInt(document.getElementById('epochs').value);
    
    document.getElementById('totalEpochs').textContent = epochs;
    document.getElementById('step4NextBtn').style.display = 'none';
    
    initializeLossChart();
    initializeWeightChart();
    
    let epoch = 0;
    const interval = setInterval(() => {
        if (epoch >= epochs) {
            clearInterval(interval);
            isTraining = false;
            document.getElementById('step4NextBtn').style.display = 'inline-block';
            return;
        }
        
        // Gradient descent step
        gradientDescentStep(learningRate);
        
        // Calculate loss
        const loss = calculateLoss();
        lossHistory.push(loss);
        weightHistory.push(weight);
        biasHistory.push(bias);
        
        // Update display
        document.getElementById('currentEpoch').textContent = epoch + 1;
        document.getElementById('currentLoss').textContent = loss.toFixed(4);
        document.getElementById('currentWeight').textContent = weight.toFixed(4);
        document.getElementById('currentBias').textContent = bias.toFixed(4);
        document.getElementById('gradientDw').textContent = window.currentDw.toFixed(6);
        document.getElementById('gradientDb').textContent = window.currentDb.toFixed(6);
        document.getElementById('weightUpdate').textContent = window.currentWeightUpdate.toFixed(6);
        document.getElementById('progressFill').style.width = ((epoch + 1) / epochs * 100) + '%';
        
        // Update charts
        updateLossChart();
        updateWeightChart();
        
        epoch++;
    }, 50);
}

function gradientDescentStep(learningRate) {
    let dw = 0;
    let db = 0;
    const n = trainSet.length;
    
    trainSet.forEach(point => {
        const prediction = weight * point.x + bias;
        const error = prediction - point.y;
        
        dw += (2 / n) * error * point.x;
        db += (2 / n) * error;
    });
    
    const weightUpdate = learningRate * dw;
    const biasUpdate = learningRate * db;
    
    // Store for display
    window.currentDw = dw;
    window.currentDb = db;
    window.currentWeightUpdate = weightUpdate;
    
    weight -= weightUpdate;
    bias -= biasUpdate;
}

function calculateLoss() {
    let totalLoss = 0;
    const n = trainSet.length;
    
    trainSet.forEach(point => {
        const prediction = weight * point.x + bias;
        const error = prediction - point.y;
        totalLoss += error * error;
    });
    
    return totalLoss / n;
}

function resetTraining() {
    isTraining = false;
    initializeWeights();
    lossHistory = [];
    weightHistory = [];
    biasHistory = [];
    
    document.getElementById('currentEpoch').textContent = '0';
    document.getElementById('currentLoss').textContent = '0.0000';
    document.getElementById('currentWeight').textContent = weight.toFixed(4);
    document.getElementById('currentBias').textContent = bias.toFixed(4);
    document.getElementById('gradientDw').textContent = '0.0000';
    document.getElementById('gradientDb').textContent = '0.0000';
    document.getElementById('weightUpdate').textContent = '0.0000';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('step4NextBtn').style.display = 'none';
    
    if (lossChart) {
        lossChart.destroy();
        lossChart = null;
    }
    
    if (weightChart) {
        weightChart.destroy();
        weightChart = null;
    }
}

// Loss chart
function initializeLossChart() {
    const ctx = document.getElementById('lossChart').getContext('2d');
    
    if (lossChart) {
        lossChart.destroy();
    }
    
    lossChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Loss (MSE)',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Training Loss Over Epochs'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateLossChart() {
    if (!lossChart) return;
    
    lossChart.data.labels = lossHistory.map((_, i) => i + 1);
    lossChart.data.datasets[0].data = lossHistory;
    lossChart.update('none');
}

// Weight chart
function initializeWeightChart() {
    const ctx = document.getElementById('weightChart').getContext('2d');
    
    if (weightChart) {
        weightChart.destroy();
    }
    
    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Weight (w)',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Bias (b)',
                    data: [],
                    borderColor: '#ff9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Weight & Bias Updates Over Epochs'
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function updateWeightChart() {
    if (!weightChart) return;
    
    weightChart.data.labels = weightHistory.map((_, i) => i + 1);
    weightChart.data.datasets[0].data = weightHistory;
    weightChart.data.datasets[1].data = biasHistory;
    weightChart.update('none');
}

// Prediction
function makePrediction() {
    const input = parseFloat(document.getElementById('predictionInput').value);
    
    if (isNaN(input)) {
        alert('Please enter a valid number');
        return;
    }
    
    const prediction = weight * input + bias;
    
    document.getElementById('predictionResult').style.display = 'block';
    document.getElementById('predictedValue').textContent = prediction.toFixed(2);
    document.getElementById('finalWeight').textContent = weight.toFixed(4);
    document.getElementById('inputValue').textContent = input.toFixed(2);
    document.getElementById('finalBias').textContent = bias.toFixed(4);
    
    updateRegressionChart(input, prediction);
}

// Regression chart
function initializeRegressionChart() {
    const ctx = document.getElementById('regressionChart').getContext('2d');
    
    if (regressionChart) {
        regressionChart.destroy();
    }
    
    const featureName = document.getElementById('featureName').value;
    const targetName = document.getElementById('targetName').value;
    
    regressionChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Training Data',
                    data: trainSet.map(p => ({ x: p.x, y: p.y })),
                    backgroundColor: 'rgba(102, 126, 234, 0.7)',
                    pointRadius: 8
                },
                {
                    label: 'Test Data',
                    data: testSet.map(p => ({ x: p.x, y: p.y })),
                    backgroundColor: 'rgba(255, 152, 0, 0.7)',
                    pointRadius: 8
                },
                {
                    label: 'Regression Line',
                    data: [],
                    type: 'line',
                    borderColor: '#4caf50',
                    borderWidth: 3,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Linear Regression: ${targetName} vs ${featureName}`
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: featureName
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: targetName
                    }
                }
            }
        }
    });
    
    updateRegressionLine();
}

function updateRegressionLine() {
    if (!regressionChart) return;
    
    const xValues = dataset.map(p => p.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    
    const lineData = [
        { x: minX, y: weight * minX + bias },
        { x: maxX, y: weight * maxX + bias }
    ];
    
    regressionChart.data.datasets[2].data = lineData;
    regressionChart.update();
}

function updateRegressionChart(inputX, predictedY) {
    if (!regressionChart) {
        initializeRegressionChart();
    }
    
    updateRegressionLine();
    
    // Add prediction point
    regressionChart.data.datasets.push({
        label: 'Prediction',
        data: [{ x: inputX, y: predictedY }],
        backgroundColor: 'rgba(255, 0, 0, 1)',
        pointRadius: 12,
        pointStyle: 'star'
    });
    
    regressionChart.update();
}

// Reset demo
function resetDemo() {
    dataset = [];
    trainSet = [];
    testSet = [];
    weight = 0;
    bias = 0;
    lossHistory = [];
    weightHistory = [];
    biasHistory = [];
    isTraining = false;
    
    if (regressionChart) {
        regressionChart.destroy();
        regressionChart = null;
    }
    
    if (lossChart) {
        lossChart.destroy();
        lossChart = null;
    }
    
    if (weightChart) {
        weightChart.destroy();
        weightChart = null;
    }
    
    updatePointsDisplay();
    goToStep1();
    
    document.getElementById('predictionResult').style.display = 'none';
}

// Listen for feature/target name changes
document.getElementById('featureName').addEventListener('input', updateFeatureTargetLabels);
document.getElementById('targetName').addEventListener('input', updateFeatureTargetLabels);

// Smooth scroll for CTA button (only if it exists)
const ctaButton = document.querySelector('.cta-button');
if (ctaButton) {
    ctaButton.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
}
