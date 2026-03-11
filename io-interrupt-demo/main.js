/* ============================================================
   main.js – I/O System & Interrupt Handling Demo
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// TAB NAVIGATION
// ─────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + target).classList.add('active');

    // Auto-animate bar chart on comparison tab
    if (target === 'comparison') setTimeout(animateBars, 400);
    if (target === 'flowchart') highlightFlowchartNodes();
  });
});

// ─────────────────────────────────────────────────────────────
// TAB 1: FLOW ANIMATION
// ─────────────────────────────────────────────────────────────
const flowSteps = [
  {
    node: 'fn-app',
    arrow: null,
    status: 'Processing',
    desc: '📱 Application sends an I/O request',
    detail: 'User program calls read("/dev/sda", buf, 512) — a POSIX I/O function.',
    irq: false
  },
  {
    node: 'fn-syscall',
    arrow: 'fa-1', pkt: 'pkt-1',
    status: 'Kernel Trap',
    desc: '🔧 System Call Interface — Kernel mode switch',
    detail: 'CPU executes INT 0x80 (Linux) or SYSCALL instruction → privilege level switches from Ring 3 → Ring 0.',
    irq: false
  },
  {
    node: 'fn-driver',
    arrow: 'fa-2', pkt: 'pkt-2',
    status: 'Servicing',
    desc: '🗂️ Device Driver processes the I/O request',
    detail: 'Kernel block layer queues request; disk driver (e.g., ahci.ko) translates it into hardware commands.',
    irq: false
  },
  {
    node: 'fn-controller',
    arrow: 'fa-3', pkt: 'pkt-3',
    status: 'Commanding',
    desc: '🔌 Device Controller receives command via I/O Port',
    detail: 'Driver writes command bytes to controller registers (I/O ports 0x1F0–0x1F7 for ATA). DMA set up.',
    irq: false
  },
  {
    node: 'fn-device',
    arrow: 'fa-4', pkt: 'pkt-4',
    status: 'Executing I/O',
    desc: '💾 I/O Device performs the physical operation',
    detail: 'Disk arm moves, sectors are read. CPU is FREE to do other work during this time (interrupt mode).',
    irq: false
  },
  {
    node: null,
    arrow: null,
    status: 'Complete',
    desc: '⚡ Device fires IRQ — Interrupt Service Routine runs',
    detail: 'Controller raises IRQ14 → PIC signals CPU → ISR copies data buffer → wakes waiting process → IRET.',
    irq: true
  }
];

let flowStep = 0;
let flowAnimating = false;
let flowTimer = null;
let flowSpeedMult = 1;

const stepDescs = { 'fn-app': 'Initiating', 'fn-syscall': 'Kernel Trap', 'fn-driver': 'Servicing', 'fn-controller': 'Commanding', 'fn-device': 'Executing I/O' };

document.getElementById('flowSpeed').addEventListener('input', function () {
  flowSpeedMult = parseFloat(this.value);
  document.getElementById('flowSpeedVal').textContent = this.value + 'x';
});

document.getElementById('startFlowBtn').addEventListener('click', () => {
  if (!flowAnimating) startFlowAnimation();
});
document.getElementById('resetFlowBtn').addEventListener('click', resetFlow);

function startFlowAnimation() {
  if (flowAnimating) return;
  flowAnimating = true;
  document.getElementById('startFlowBtn').disabled = true;
  runFlowStep();
}

function runFlowStep() {
  if (flowStep >= flowSteps.length) {
    flowAnimating = false;
    document.getElementById('startFlowBtn').disabled = false;
    document.getElementById('startFlowBtn').textContent = '↺ Replay';
    document.getElementById('startFlowBtn').addEventListener('click', () => { resetFlow(); setTimeout(startFlowAnimation, 200); }, { once: true });
    return;
  }
  const step = flowSteps[flowStep];
  const delay = 1200 / flowSpeedMult;

  // Update node visual
  if (step.node) {
    // Mark previous as done
    if (flowStep > 0 && flowSteps[flowStep - 1].node) {
      const prevNode = document.getElementById(flowSteps[flowStep - 1].node);
      if (prevNode) { prevNode.classList.remove('active'); prevNode.classList.add('done'); prevNode.querySelector('.node-status').textContent = '✓ Done'; }
    }
    const nodeEl = document.getElementById(step.node);
    if (nodeEl) { nodeEl.classList.add('active'); nodeEl.querySelector('.node-status').textContent = step.status; }
  }

  // Arrow animation
  if (step.arrow) {
    const arrowEl = document.getElementById(step.arrow);
    const pktEl   = document.getElementById(step.pkt);
    if (arrowEl) arrowEl.classList.add('active');
    if (pktEl)   { pktEl.classList.remove('animate'); void pktEl.offsetWidth; pktEl.classList.add('animate'); }
  }

  // IRQ return signal
  if (step.irq) {
    document.getElementById('ra-irq').classList.add('active');
    // Mark last node done
    if (flowSteps[flowStep - 1].node) {
      const prevNode = document.getElementById(flowSteps[flowStep - 1].node);
      if (prevNode) { prevNode.classList.remove('active'); prevNode.classList.add('done'); prevNode.querySelector('.node-status').textContent = '✓ Done'; }
    }
  }

  // Update info panel
  document.getElementById('stepNum').textContent = flowStep + 1;
  document.getElementById('stepDesc').textContent = step.desc;
  document.getElementById('stepDetail').textContent = step.detail;

  flowStep++;
  flowTimer = setTimeout(runFlowStep, delay);
}

function resetFlow() {
  clearTimeout(flowTimer);
  flowStep = 0; flowAnimating = false;
  document.getElementById('startFlowBtn').disabled = false;
  document.getElementById('startFlowBtn').textContent = '▶ Start Animation';
  document.querySelectorAll('.flow-node').forEach(n => {
    n.classList.remove('active', 'done');
    n.querySelector('.node-status').textContent = 'Idle';
  });
  document.querySelectorAll('.flow-arrow').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('.arrow-packet').forEach(p => p.classList.remove('animate'));
  document.getElementById('ra-irq').classList.remove('active');
  document.getElementById('stepNum').textContent = '0';
  document.getElementById('stepDesc').textContent = 'Click "Start Animation" to begin the I/O request journey.';
  document.getElementById('stepDetail').textContent = '';
}

// ─────────────────────────────────────────────────────────────
// TAB 2: LIVE SIMULATION
// ─────────────────────────────────────────────────────────────
let simMode = 'interrupt';
let logEntries = [];
let stats = { requests: 0, interrupts: 0, pollCycles: 0, cpuBusyMs: 0 };
let simStartTime = Date.now();
let ioInProgress = false;

function setMode(mode) {
  simMode = mode;
  document.getElementById('modeInterrupt').classList.toggle('active', mode === 'interrupt');
  document.getElementById('modePolling').classList.toggle('active', mode === 'polling');
}

const DEVICES = {
  disk:     { name: 'Hard Disk',   icon: '💾', irq: 14, latencyMs: 4000 },
  keyboard: { name: 'Keyboard',    icon: '⌨️',  irq: 1,  latencyMs: 500 },
  network:  { name: 'Network Card',icon: '🌐', irq: 3,  latencyMs: 2500 },
  printer:  { name: 'Printer',     icon: '🖨️',  irq: 7,  latencyMs: 5500 }
};

function sendIORequest() {
  if (ioInProgress) return;
  ioInProgress = true;
  const devKey = document.getElementById('deviceSelect').value;
  const dev    = DEVICES[devKey];
  stats.requests++;
  updateStats();

  // Update device UI
  document.getElementById('deviceIcon').textContent = dev.icon;
  document.getElementById('deviceName').textContent = dev.name;

  const t0 = Date.now();

  addLog('syscall', `sys_read() called → device: ${dev.name}`);
  setCPUState('busy', 'SYS_READ', 'Kernel');
  setCtrl('BUSY', `READ@${devKey.toUpperCase()}`, '0x00');

  setTimeout(() => {
    addLog('driver', `Device driver received request (IRQ target: ${dev.irq})`);
    activateBus('address', 200);
    activateBus('data', 300);
  }, 300);

  setTimeout(() => {
    addLog('cpu', 'CPU releases device, resumes user tasks (interrupt mode) / starts polling (poll mode)');
    if (simMode === 'interrupt') {
      setCPUState('idle', 'NOP', 'User');
      runInterruptSim(dev, t0);
    } else {
      setCPUState('busy', 'POLL', 'Kernel');
      runPollingSim(dev, t0);
    }
  }, 700);
}

function runInterruptSim(dev, t0) {
  const totalMs = dev.latencyMs;
  let progress = 0;
  const interval = setInterval(() => {
    progress += 6;
    setDeviceProgress(progress);
    if (progress >= 100) {
      clearInterval(interval);
      fireInterrupt(dev, Date.now() - t0);
    }
  }, totalMs / 17);
}

function fireInterrupt(dev, elapsedMs) {
  stats.interrupts++;
  activateBus('irq', 600);

  // Record in IVT
  const ivtIds = { 14: 'ivt14', 1: 'ivt1', 3: 'ivt3' };
  const ivtEl = document.getElementById(ivtIds[dev.irq] || 'ivt14');
  if (ivtEl) {
    ivtEl.classList.add('triggered');
    setTimeout(() => ivtEl.classList.remove('triggered'), 1500);
  }

  addLog('interrupt', `⚡ IRQ ${dev.irq} fired — ${dev.name} data ready (+${elapsedMs}ms)`);
  setCPUState('isr', `ISR_IRQ${dev.irq}`, 'Kernel ISR');
  setCtrl('DONE', 'DATA_READY', '0xFF');

  setTimeout(() => {
    addLog('interrupt', `ISR executing: copying data buffer, waking sleeping process`);
  }, 300);

  setTimeout(() => {
    addLog('cpu', `Context restored via IRET — process resumed`);
    setCPUState('idle', 'USER_PC', 'User');
    setDeviceProgress(0);
    setCtrl('READY', 'NONE', '0x00');
    updateStats();
    ioInProgress = false;
  }, 900);
}

function runPollingSim(dev, t0) {
  const totalMs  = dev.latencyMs;
  const pollRate = 200; // poll every 200ms
  let elapsed    = 0;
  let pollCount  = 0;
  let progress   = 0;

  const pollInterval = setInterval(() => {
    elapsed   += pollRate;
    pollCount++;
    progress   = Math.min(100, Math.round((elapsed / totalMs) * 100));
    stats.pollCycles++;
    setDeviceProgress(progress);

    addLog('poll', `CPU polls status register… BUSY (cycle #${pollCount})`);
    setCtrl('BUSY', 'READ_STATUS', `0x${(pollCount % 256).toString(16).padStart(2,'0').toUpperCase()}`);

    if (elapsed >= totalMs) {
      clearInterval(pollInterval);
      addLog('poll', `✓ Device READY after ${pollCount} poll cycles — data read`);
      setCtrl('DONE', 'DATA_READY', '0xFF');
      setCPUState('idle', 'RET', 'User');
      setDeviceProgress(0);
      setTimeout(() => { setCtrl('READY', 'NONE', '0x00'); ioInProgress = false; updateStats(); }, 400);
    }
  }, pollRate);
}

// Helpers
function setCPUState(state, ir, mode) {
  const dot = document.getElementById('cpuDot');
  const statusEl = document.getElementById('cpuStatus');
  dot.className = 'cpu-status-dot ' + (state === 'busy' ? 'busy' : state === 'isr' ? 'isr' : '');
  statusEl.textContent = state === 'idle' ? 'Idle' : state === 'isr' ? 'ISR Running' : 'Busy';
  document.getElementById('regIR').textContent = ir;
  document.getElementById('regMode').textContent = mode;
  document.getElementById('regPC').textContent = '0x' + Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function setCtrl(status, cmd, buf) {
  document.getElementById('ctrlStatus').textContent = status;
  document.getElementById('ctrlCmd').textContent = cmd;
  document.getElementById('ctrlBuf').textContent = buf;
}

function setDeviceProgress(pct) {
  document.getElementById('deviceProgress').style.width = pct + '%';
  document.getElementById('deviceProgressLabel').textContent = pct + '%';
}

function activateBus(type, duration) {
  const map = { data: 'dataBusSignal', address: 'addressBusSignal', irq: 'irqBusSignal' };
  const el = document.getElementById(map[type]);
  if (!el) return;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), duration);
}

let logCount = 0;
let currentFilter = 'all';

function addLog(type, msg) {
  logCount++;
  const now = new Date();
  const ts  = `${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0').slice(0,2)}`;
  const entry = { type, msg, ts, id: logCount };
  logEntries.push(entry);

  const container = document.getElementById('logEntries');
  // Remove placeholder
  const empty = container.querySelector('.log-empty');
  if (empty) empty.remove();

  const el = createLogEl(entry);
  if (currentFilter === 'all' || currentFilter === type) {
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  document.getElementById('logBadge').textContent = logEntries.length;
}

function createLogEl(entry) {
  const div = document.createElement('div');
  div.className = `log-entry type-${entry.type}`;
  div.dataset.type = entry.type;
  div.innerHTML = `
    <span class="log-time">${entry.ts}</span>
    <span class="log-type">${entry.type.toUpperCase()}</span>
    <span class="log-msg">${entry.msg}</span>`;
  return div;
}

function filterLog(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  const container = document.getElementById('logEntries');
  container.innerHTML = '';
  const filtered = filter === 'all' ? logEntries : logEntries.filter(e => e.type === filter || (filter === 'interrupt' && (e.type === 'interrupt' || e.type === 'poll')));
  if (filtered.length === 0) {
    container.innerHTML = '<div class="log-empty">No entries for this filter.</div>';
    return;
  }
  filtered.forEach(e => container.appendChild(createLogEl(e)));
  container.scrollTop = container.scrollHeight;
}

function clearLog() {
  logEntries = [];
  logCount = 0;
  document.getElementById('logEntries').innerHTML = '<div class="log-empty">No events yet. Send an I/O request to begin.</div>';
  document.getElementById('logBadge').textContent = '0';
}

function updateStats() {
  document.getElementById('statRequests').textContent   = stats.requests;
  document.getElementById('statInterrupts').textContent = stats.interrupts;
  document.getElementById('statPollCycles').textContent = stats.pollCycles;
  const cpuFree = simMode === 'interrupt'
    ? Math.max(0, 100 - stats.requests * 4) + '%'
    : Math.max(0, 100 - stats.pollCycles * 3) + '%';
  document.getElementById('statCPUFree').textContent = cpuFree;
}

// ─────────────────────────────────────────────────────────────
// TAB 3: TIMELINE
// ─────────────────────────────────────────────────────────────
const TIMELINE_EVENTS = [
  { time: 0,   track: 0, label: 'App: read()', type: 'cpu',     width: 8,  desc: 'Application calls read("/dev/sda") — user mode' },
  { time: 8,   track: 1, label: 'syscall',     type: 'syscall', width: 6,  desc: 'System call INT 0x80 — CPU switches to kernel mode' },
  { time: 14,  track: 2, label: 'Driver init', type: 'driver',  width: 10, desc: 'Block device driver processes request, builds command struct' },
  { time: 24,  track: 3, label: 'Ctrl CMD',    type: 'driver',  width: 6,  desc: 'Controller registers written: LBA, sector count, command byte' },
  { time: 30,  track: 0, label: 'App: wait',   type: 'idle',    width: 50, desc: 'Process sleeps (blocked on I/O) — scheduler runs others' },
  { time: 30,  track: 1, label: 'CPU other',   type: 'cpu',     width: 50, desc: 'CPU free — executes other processes (interrupt advantage!)' },
  { time: 80,  track: 4, label: '⚡ IRQ14',    type: 'irq',     width: 5,  desc: 'Disk controller raises IRQ14 — I/O complete signal' },
  { time: 85,  track: 5, label: 'ISR runs',    type: 'isr',     width: 10, desc: 'ISR: save ctx, copy DMA buffer, EOI to PIC, wake process' },
  { time: 95,  track: 0, label: 'App resumes', type: 'cpu',     width: 15, desc: 'Scheduler wakes process — read() returns data to application' },
  { time: 95,  track: 1, label: 'IRET',        type: 'syscall', width: 5,  desc: 'Interrupt return — CPU switches back to user mode' },
];

function generateTimeline() {
  const body = document.getElementById('timelineBody');
  const eventsList = document.getElementById('timelineEventsList');
  body.innerHTML = '';
  eventsList.innerHTML = '';

  const trackNames = ['Application','Kernel/Syscall','Driver','Controller','IRQ Line','ISR'];
  const totalWidth = 110; // units

  trackNames.forEach((_, trackIdx) => {
    const row = document.createElement('div');
    row.className = 'tl-row';
    row.style.position = 'relative';

    const events = TIMELINE_EVENTS.filter(e => e.track === trackIdx);
    events.forEach(ev => {
      const block = document.createElement('div');
      block.className = `tl-block ${ev.type}`;
      block.style.left  = (ev.time / totalWidth * 100) + '%';
      block.style.width = (ev.width / totalWidth * 100) + '%';
      block.textContent = ev.label;
      block.title = ev.desc;
      row.appendChild(block);
    });

    body.appendChild(row);
  });

  // Event list
  [...TIMELINE_EVENTS].sort((a,b) => a.time - b.time).forEach(ev => {
    const card = document.createElement('div');
    card.className = 'tl-event-card';
    card.innerHTML = `
      <div class="tl-time-stamp">T+${ev.time}ms</div>
      <div>
        <div class="tl-event-title tl-block ${ev.type}" style="position:static;height:auto;padding:2px 8px;display:inline-flex;margin-bottom:4px">${ev.label}</div>
        <div class="tl-event-desc">${ev.desc}</div>
      </div>`;
    eventsList.appendChild(card);
  });
}

function clearTimeline() {
  document.getElementById('timelineBody').innerHTML = '<div class="timeline-placeholder">Click "Generate Sample Timeline" to see an example I/O event sequence.</div>';
  document.getElementById('timelineEventsList').innerHTML = '';
}

// ─────────────────────────────────────────────────────────────
// TAB 4: FLOWCHART (highlight on load)
// ─────────────────────────────────────────────────────────────
function highlightFlowchartNodes() {
  // subtle pulse animation on SVG elements done via CSS classes
  // Nothing extra needed — SVG is static/self-contained
}

// ─────────────────────────────────────────────────────────────
// TAB 5: COMPARISON – ANIMATED BARS
// ─────────────────────────────────────────────────────────────
function animateBars() {
  document.querySelectorAll('.bar').forEach(bar => {
    const target = bar.style.getPropertyValue('--target');
    bar.style.width = '0';
    requestAnimationFrame(() => {
      setTimeout(() => { bar.style.width = target; }, 50);
    });
  });
}

function animateGantt() {
  buildPollingGantt();
  buildInterruptGantt();
}

function buildPollingGantt() {
  const gantt = document.getElementById('pollingGantt');
  gantt.innerHTML = '';
  // Polling: lots of poll cycles, small useful work
  const blocks = [
    { cls: 'gantt-poll', w: 30, label: 'Poll' },
    { cls: 'gantt-work', w: 5,  label: 'Work' },
    { cls: 'gantt-poll', w: 25, label: 'Poll' },
    { cls: 'gantt-io',   w:  5, label: 'Wait' },
    { cls: 'gantt-poll', w: 25, label: 'Poll' },
    { cls: 'gantt-work', w: 10, label: 'Work' },
  ];
  blocks.forEach((b, i) => {
    const el = document.createElement('div');
    el.className = `gantt-block ${b.cls}`;
    el.textContent = b.label;
    el.style.width = '0';
    gantt.appendChild(el);
    setTimeout(() => { el.style.width = b.w + '%'; }, i * 120);
  });
}

function buildInterruptGantt() {
  const gantt = document.getElementById('interruptGantt');
  gantt.innerHTML = '';
  const blocks = [
    { cls: 'gantt-work', w: 35, label: 'Useful Work' },
    { cls: 'gantt-idle', w: 25, label: 'Idle/Sleep' },
    { cls: 'gantt-isr',  w: 8,  label: 'ISR' },
    { cls: 'gantt-work', w: 27, label: 'Useful Work' },
    { cls: 'gantt-isr',  w: 5,  label: 'ISR' },
  ];
  blocks.forEach((b, i) => {
    const el = document.createElement('div');
    el.className = `gantt-block ${b.cls}`;
    el.textContent = b.label;
    el.style.width = '0';
    gantt.appendChild(el);
    setTimeout(() => { el.style.width = b.w + '%'; }, i * 120);
  });
}

// Auto-animate bars when page loads on comparison tab
window.addEventListener('load', () => {
  // Pre-build gantt as hidden
  buildPollingGantt();
  buildInterruptGantt();
  // Animate bars on next paint
  setTimeout(animateBars, 800);
});
