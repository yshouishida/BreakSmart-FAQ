// ── FLOW STEPS ────────────────────────────────────────────────────────────────
const flowData = [
    {
        tag: 'Step 01 — User Interface',
        title: 'Browser Dashboard',
        body: `The user opens the dashboard served from the ESP32's LittleFS filesystem at <span class="detail-code">http://ESP32_IP</span>. The single-page app (HTML + <span class="detail-code">script.js</span>) loads and authenticates via <span class="detail-code">X-Session-Token</span>. A persistent WebSocket connection to <span class="detail-code">ws://NODE_SERVER_IP:3000/ws</span> is established so the UI stays live without polling.`
    },
    {
        tag: 'Step 02 — REST API Call',
        title: 'Node.js Receives the Request',
        body: `<span class="detail-code">script.js</span> sends <span class="detail-code">PATCH /api/relays/:id/state</span> with body <span class="detail-code">{ is_on: 1, user_id }</span>. The Express controller calls <span class="detail-code">RelayService.setState()</span>. The UI updates optimistically — if the request fails, it reverts automatically. All API responses follow the standard envelope: <span class="detail-code">{ success, data, message }</span>.`
    },
    {
        tag: 'Step 03 — Persistence',
        title: 'MySQL Write + Activity Log',
        body: `<span class="detail-code">RelayService</span> calls <span class="detail-code">RelayModel.updateState()</span> to persist the new <span class="detail-code">is_on</span> value in the <span class="detail-code">relays</span> table. It also writes an entry to <span class="detail-code">activity_logs</span> via <span class="detail-code">ActivityService</span>. All DB operations use the <span class="detail-code">mysql2</span> connection pool — no blocking queries.`
    },
    {
        tag: 'Step 04 — WebSocket Broadcast',
        title: 'Real-Time Event Emission',
        body: `After the DB write, <span class="detail-code">wsHub.emitRelayUpdate()</span> broadcasts <span class="detail-code">relay:update</span> to all connected frontend clients (so every open browser tab updates simultaneously). It also sends <span class="detail-code">relay:command</span> specifically to the ESP32 client (identified by <span class="detail-code">device_id</span>). A <span class="detail-code">dashboard:summary</span> event carries updated aggregate stats.`
    },
    {
        tag: 'Step 05 — Hardware Actuation',
        title: 'ESP32 GPIO + ACK',
        body: `The ESP32 receives <span class="detail-code">relay:command</span>, drives the corresponding GPIO pin HIGH or LOW (active-LOW relay: LOW = energised). It sends <span class="detail-code">esp32:relay_ack</span> back to Node.js to confirm physical actuation. Node.js re-broadcasts the confirmed state to all frontends, completing the full round-trip. The physical click of the relay can be heard within ~50–100 ms of the user's click.`
    }
];

const steps = document.querySelectorAll('.flow-step');
const detail = document.getElementById('flowDetail');

function setFlowStep(idx) {
    steps.forEach((s, i) => s.classList.toggle('active', i === idx));
    const d = flowData[idx];
    detail.innerHTML = `
    <div class="detail-tag">${d.tag}</div>
    <div class="detail-title">${d.title}</div>
    <div class="detail-body">${d.body}</div>
  `;
}

steps.forEach(s => {
    s.addEventListener('click', () => setFlowStep(Number(s.dataset.idx)));
});

// Auto-cycle
let autoIdx = 0;
const auto = setInterval(() => {
    autoIdx = (autoIdx + 1) % 5;
    setFlowStep(autoIdx);
}, 3000);

steps.forEach(s => s.addEventListener('click', () => clearInterval(auto)));

// ── Q&A TABS ──────────────────────────────────────────────────────────────────
document.querySelectorAll('.qa-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.qa-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.qa-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.level).classList.add('active');
    });
});

// ── Q&A ACCORDION ─────────────────────────────────────────────────────────────
document.querySelectorAll('.qa-question').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.closest('.qa-item');
        const wasOpen = item.classList.contains('open');
        item.closest('.qa-panel').querySelectorAll('.qa-item').forEach(i => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
    });
});

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────────
const io = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
        if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add('visible'), i * 60);
            io.unobserve(e.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ── ACTIVE NAV ────────────────────────────────────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const sio = new IntersectionObserver(entries => {
    entries.forEach(e => {
        const link = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (link) link.style.color = e.isIntersecting ? 'var(--accent)' : '';
    });
}, { threshold: 0.5 });
sections.forEach(s => sio.observe(s));
