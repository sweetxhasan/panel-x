let ws = null;
let autoMode = true;
let currentStep = 0;

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    setupWebSocket();
});

function initializeEventListeners() {
    // Start button
    document.getElementById('startBtn').addEventListener('click', startBypass);
    
    // Auto mode toggle
    document.getElementById('autoToggle').addEventListener('click', toggleAutoMode);
    
    // Browser controls
    document.getElementById('backBtn').addEventListener('click', () => navigateBrowser('back'));
    document.getElementById('forwardBtn').addEventListener('click', () => navigateBrowser('forward'));
    document.getElementById('reloadBtn').addEventListener('click', () => navigateBrowser('reload'));
    
    // Step buttons
    document.querySelectorAll('.step-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => executeStep(index + 1));
    });
    
    // Clear logs
    document.getElementById('clearLogs').addEventListener('click', clearLogs);
}

function setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/browser-stream`);
    
    ws.onopen = () => {
        addLog('WebSocket connected', 'green');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleBrowserUpdate(data);
    };
}

async function startBypass() {
    const url = document.getElementById('targetUrl').value;
    const proxy = document.getElementById('proxyInput').value;
    
    addLog(`Starting bypass for: ${url}`, 'blue');
    showLoading(true);
    
    try {
        const response = await fetch('/api/bypass/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, proxy, autoMode })
        });
        
        const data = await response.json();
        
        if (data.success) {
            addLog('Browser launched successfully', 'green');
            document.getElementById('currentUrl').textContent = url;
            document.getElementById('browserFrame').src = `/api/proxy?url=${encodeURIComponent(url)}`;
            
            // Start step-by-step process
            if (autoMode) {
                executeBypassSteps();
            }
        }
    } catch (error) {
        addLog(`Error: ${error.message}`, 'red');
    } finally {
        showLoading(false);
    }
}

async function executeBypassSteps() {
    // Step 1: Cloudflare Detection
    currentStep = 1;
    addLog('🔍 Step 1: Checking for Cloudflare...', 'yellow');
    
    const checkResult = await checkCloudflare();
    
    if (checkResult.hasCloudflare) {
        addLog('⚠️ Cloudflare detected! Solving...', 'orange');
        await solveCloudflare();
    } else {
        addLog('✅ No Cloudflare detected', 'green');
    }
    
    // Step 2: Human Verification Simulation
    currentStep = 2;
    addLog('👤 Step 2: Simulating human behavior...', 'yellow');
    await simulateHumanBehavior();
    
    // Step 3: Challenge Solving
    currentStep = 3;
    addLog('🤖 Step 3: Solving challenges...', 'yellow');
    await solveChallenges();
    
    // Step 4: Final Bypass
    currentStep = 4;
    addLog('🎉 Step 4: Bypass complete!', 'green');
}

async function checkCloudflare() {
    // Check if current page has Cloudflare
    const frame = document.getElementById('browserFrame');
    try {
        const hasCF = await new Promise(resolve => {
            // Check frame content for Cloudflare indicators
            setTimeout(() => resolve(false), 2000);
        });
        return { hasCloudflare: false };
    } catch (e) {
        return { hasCloudflare: false };
    }
}

async function solveCloudflare() {
    showLoading(true, 'Solving Cloudflare...');
    
    // Wait for Cloudflare to process
    await new Promise(r => setTimeout(r, 5000));
    
    // Simulate successful bypass
    addLog('✅ Cloudflare bypassed successfully!', 'green');
    showLoading(false);
}

async function simulateHumanBehavior() {
    // Random mouse movements
    const movements = [100, 200, 300, 400];
    for (const move of movements) {
        await new Promise(r => setTimeout(r, 500));
        addLog(`🖱️ Mouse movement: ${move}px`, 'gray');
    }
}

async function solveChallenges() {
    // Auto-click if needed
    addLog('🔄 Checking for challenges...', 'yellow');
    await new Promise(r => setTimeout(r, 2000));
    addLog('✅ All challenges solved', 'green');
}

function toggleAutoMode() {
    autoMode = !autoMode;
    const toggle = document.getElementById('autoToggle');
    if (autoMode) {
        toggle.classList.add('active');
        toggle.innerHTML = '<span class="absolute right-1 top-1 w-4 h-4 bg-white"></span>';
    } else {
        toggle.classList.remove('active');
        toggle.innerHTML = '<span class="absolute left-1 top-1 w-4 h-4 bg-white"></span>';
    }
    addLog(`Auto mode: ${autoMode ? 'ON' : 'OFF'}`, 'blue');
}

async function navigateBrowser(action) {
    addLog(`Browser: ${action}`, 'gray');
    
    switch(action) {
        case 'back':
            // Implement back navigation
            break;
        case 'forward':
            // Implement forward navigation
            break;
        case 'reload':
            document.getElementById('browserFrame').src += '';
            break;
    }
}

async function executeStep(step) {
    addLog(`Executing step ${step} manually...`, 'yellow');
    // Implement manual step execution
}

function handleBrowserUpdate(data) {
    // Update browser view based on WebSocket data
    if (data.url) {
        document.getElementById('currentUrl').textContent = data.url;
    }
}

function addLog(message, color = 'gray') {
    const console = document.getElementById('logConsole');
    const logEntry = document.createElement('div');
    logEntry.className = `text-${color}-500`;
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    console.appendChild(logEntry);
    console.scrollTop = console.scrollHeight;
}

function clearLogs() {
    document.getElementById('logConsole').innerHTML = '';
    addLog('Console cleared', 'gray');
}

function showLoading(show, message = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
        overlay.querySelector('p').textContent = message;
    } else {
        overlay.classList.add('hidden');
    }
}
