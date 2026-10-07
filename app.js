// ==============================================================================
// Script จัดการตารางงาน CPU Scheduling (FCFS, SJF, Round Robin)
// ออกแบบตรงตาม UI ที่ผู้ใช้ระบุ: หน้ากรอกข้อมูล + Popup แสดงผลลัพธ์
// ==============================================================================

const SUBJECT_LIST = [
  "โปรเจกต์ Web Programming",
  "สรุป English",
  "โปรเจกต์ Computer Network",
  "แบบฝึกหัด OS",
  "แบบฝึกหัด Software Eng",
  "แล็บ Database",
  "การบ้าน Data Structure",
  "โครงงาน AI",
  "รายงาน Cloud Computing",
  "แบบฝึกหัด Cyber Security",
  "แล็บ Embedded Systems",
  "การบ้าน Mobile App"
];

const BADGE_COLORS = {
  P1: "#2563EB",
  P2: "#06B6D4",
  P3: "#10B981",
  P4: "#F59E0B",
  P5: "#D946EF",
  P6: "#8B5CF6",
  P7: "#EC4899",
  P8: "#14B8A6",
  P9: "#0EA5E9",
  P10: "#84CC16",
  IDLE: "#64748B"
};

// ข้อมูลเริ่มต้น (ตัวเลขคงที่ 0 ถึง 5 ทั้งหมด ไม่มีการสุ่ม)
let tasks = [
  { pid: "P1", name: "แบบฝึกหัด OS", at: 0, bt: 5 },
  { pid: "P2", name: "รายงาน Database", at: 1, bt: 3 },
  { pid: "P3", name: "สรุป English", at: 2, bt: 1 },
  { pid: "P4", name: "แบบฝึกหัด Math", at: 4, bt: 2 },
  { pid: "P5", name: "โครงงาน AI", at: 3, bt: 4 }
];

let lastResults = null;

function getPidNum(pid) {
  const match = pid.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
}

// ==============================================================================
// 1. Algorithms
// ==============================================================================

function runFCFS(procs) {
  const sorted = [...procs].sort((a, b) => {
    if (a.at !== b.at) return a.at - b.at;
    return getPidNum(a.pid) - getPidNum(b.pid);
  });

  let time = 0;
  const gantt = [];
  const results = [];

  sorted.forEach(p => {
    if (time < p.at) {
      gantt.push({ pid: "IDLE", start: time, end: p.at });
      time = p.at;
    }
    const start = time;
    time += p.bt;
    const ct = time;
    const tat = ct - p.at;
    const wt = tat - p.bt;

    gantt.push({ pid: p.pid, start, end: ct });
    results.push({ pid: p.pid, name: p.name, at: p.at, bt: p.bt, ct, tat, wt });
  });

  results.sort((a, b) => getPidNum(a.pid) - getPidNum(b.pid));
  return { results, gantt };
}

function runSJF(procs) {
  let time = 0;
  const completed = new Set();
  const gantt = [];
  const results = [];

  while (completed.size < procs.length) {
    const available = procs.filter(p => !completed.has(p.pid) && p.at <= time);

    if (available.length === 0) {
      const unfinished = procs.filter(p => !completed.has(p.pid));
      const nextAt = Math.min(...unfinished.map(p => p.at));
      gantt.push({ pid: "IDLE", start: time, end: nextAt });
      time = nextAt;
      continue;
    }

    available.sort((a, b) => {
      if (a.bt !== b.bt) return a.bt - b.bt;
      if (a.at !== b.at) return a.at - b.at;
      return getPidNum(a.pid) - getPidNum(b.pid);
    });

    const best = available[0];
    const start = time;
    time += best.bt;
    const ct = time;
    const tat = ct - best.at;
    const wt = tat - best.bt;

    gantt.push({ pid: best.pid, start, end: ct });
    results.push({ pid: best.pid, name: best.name, at: best.at, bt: best.bt, ct, tat, wt });
    completed.add(best.pid);
  }

  results.sort((a, b) => getPidNum(a.pid) - getPidNum(b.pid));
  return { results, gantt };
}

function runRoundRobin(procs, q) {
  let time = 0;
  const remBt = {};
  const procMap = {};
  procs.forEach(p => {
    remBt[p.pid] = p.bt;
    procMap[p.pid] = p;
  });

  const gantt = [];
  const roundsLog = [];
  const resultsMap = {};
  const readyQueue = [];
  const inQueue = new Set();

  const init = procs.filter(p => p.at <= 0);
  init.sort((a, b) => (a.at !== b.at ? a.at - b.at : getPidNum(a.pid) - getPidNum(b.pid)));
  init.forEach(p => {
    readyQueue.push(p.pid);
    inQueue.add(p.pid);
  });

  while (Object.keys(resultsMap).length < procs.length) {
    if (readyQueue.length === 0) {
      const unfinished = procs.filter(p => !resultsMap[p.pid]);
      const nextAt = Math.min(...unfinished.map(p => p.at));
      gantt.push({ pid: "IDLE", start: time, end: nextAt });
      time = nextAt;

      const newArrivals = unfinished.filter(p => p.at <= time && !inQueue.has(p.pid));
      newArrivals.sort((a, b) => (a.at !== b.at ? a.at - b.at : getPidNum(a.pid) - getPidNum(b.pid)));
      newArrivals.forEach(p => {
        readyQueue.push(p.pid);
        inQueue.add(p.pid);
      });
    }

    const currPid = readyQueue.shift();
    inQueue.delete(currPid);

    const execTime = Math.min(q, remBt[currPid]);
    const start = time;
    const end = time + execTime;
    remBt[currPid] -= execTime;

    gantt.push({ pid: currPid, start, end });
    roundsLog.push({
      interval: `${start}–${end}`,
      pid: currPid,
      remBt: remBt[currPid]
    });

    // Rule: New arrivals during (start, end] get queued BEFORE current task
    const unfinished = procs.filter(p => !resultsMap[p.pid]);
    const newArrivals = unfinished.filter(
      p => start < p.at && p.at <= end && p.pid !== currPid && !inQueue.has(p.pid)
    );
    newArrivals.sort((a, b) => (a.at !== b.at ? a.at - b.at : getPidNum(a.pid) - getPidNum(b.pid)));
    newArrivals.forEach(p => {
      readyQueue.push(p.pid);
      inQueue.add(p.pid);
    });

    if (remBt[currPid] > 0) {
      readyQueue.push(currPid);
      inQueue.add(currPid);
    } else {
      const ct = end;
      const at = procMap[currPid].at;
      const bt = procMap[currPid].bt;
      const tat = ct - at;
      const wt = tat - bt;
      resultsMap[currPid] = {
        pid: currPid,
        name: procMap[currPid].name,
        at,
        bt,
        ct,
        tat,
        wt
      };
    }

    time = end;
  }

  const results = procs.map(p => resultsMap[p.pid]);
  results.sort((a, b) => getPidNum(a.pid) - getPidNum(b.pid));
  return { results, gantt, roundsLog };
}

// ==============================================================================
// 2. Table Rendering & Form Event Binding
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  randomizeTasks();
  setupEventListeners();
});

const DEFAULT_PRESET_TASKS = [
  { pid: "P1", name: "แบบฝึกหัด OS", at: 0, bt: 5 },
  { pid: "P2", name: "รายงาน Database", at: 1, bt: 3 },
  { pid: "P3", name: "สรุป English", at: 2, bt: 1 },
  { pid: "P4", name: "แบบฝึกหัด Math", at: 4, bt: 2 },
  { pid: "P5", name: "โครงงาน AI", at: 3, bt: 4 },
  { pid: "P6", name: "แบบฝึกหัด Computer Network", at: 1, bt: 2 }
];

function setupEventListeners() {
  // Randomize Tasks Button (สุ่มตัวเลข 0-5 โดยตรง ไม่ใช้ Seed)
  document.getElementById("btnRandomizeTasks")?.addEventListener("click", randomizeTasks);

  // Task Count Change (1-6)
  document.getElementById("selectTaskCount")?.addEventListener("change", e => {
    randomizeTasks();
  });

  // Reset to Default (0-5)
  document.getElementById("btnResetDefault")?.addEventListener("click", resetDefaultTasks);

  // Load Example Doc (หน้า 4-5)
  document.getElementById("btnLoadExampleDoc")?.addEventListener("click", loadExampleDoc);

  // Calculate & Open Popup
  document.getElementById("btnCalculate")?.addEventListener("click", handleCalculateAndOpenModal);

  // Modal Close
  document.getElementById("btnCloseModal")?.addEventListener("click", closeModal);
  document.getElementById("btnDismissModal")?.addEventListener("click", closeModal);
  document.getElementById("resultModal")?.addEventListener("click", e => {
    if (e.target.id === "resultModal") closeModal();
  });

  // Modal Tabs
  document.querySelectorAll(".modal-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".modal-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      const pane = document.getElementById(tabId);
      if (pane) pane.classList.add("active");
    });
  });

  // Q Tester inside Modal
  document.getElementById("btnRunNewQ")?.addEventListener("click", handleTestDifferentQ);

  // Print & Copy
  document.getElementById("btnPrintModal")?.addEventListener("click", () => window.print());
  document.getElementById("btnCopyModal")?.addEventListener("click", copySummaryToClipboard);
}

function renderTableRows() {
  const tbody = document.getElementById("taskTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  tasks.forEach((t, idx) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td style="text-align: center;">
        <span class="process-badge badge-${t.pid}">${t.pid}</span>
      </td>
      <td>
        <input type="text" class="task-name-input" data-idx="${idx}" value="${t.name}">
      </td>
      <td>
        <input type="number" class="input-center task-at-input" data-idx="${idx}" value="${t.at}" min="0" max="5">
      </td>
      <td>
        <input type="number" class="input-center task-bt-input" data-idx="${idx}" value="${t.bt}" min="1" max="5">
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn-delete-row" data-idx="${idx}">ลบ</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Event handlers for dynamic inputs (จำกัดตัวเลข 0 ถึง 5 อย่างเข้มงวด)
  tbody.querySelectorAll(".task-name-input").forEach(inp => {
    inp.addEventListener("input", e => {
      const i = parseInt(e.target.getAttribute("data-idx"), 10);
      tasks[i].name = e.target.value;
    });
  });

  tbody.querySelectorAll(".task-at-input").forEach(inp => {
    inp.addEventListener("input", e => {
      const i = parseInt(e.target.getAttribute("data-idx"), 10);
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 0) val = 0;
      if (val > 5) {
        val = 5;
        e.target.value = 5;
      }
      tasks[i].at = val;
    });
  });

  tbody.querySelectorAll(".task-bt-input").forEach(inp => {
    inp.addEventListener("input", e => {
      const i = parseInt(e.target.getAttribute("data-idx"), 10);
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 5) {
        val = 5;
        e.target.value = 5;
      }
      tasks[i].bt = val;
    });
  });

  tbody.querySelectorAll(".btn-delete-row").forEach(btn => {
    btn.addEventListener("click", e => {
      const i = parseInt(e.target.getAttribute("data-idx"), 10);
      tasks.splice(i, 1);
      // Re-assign PIDs
      tasks.forEach((t, index) => {
        t.pid = `P${index + 1}`;
      });
      renderTableRows();
    });
  });

  const countEl = document.getElementById("selectTaskCount");
  if (countEl) countEl.value = String(tasks.length);
}

function adjustTaskCount(targetCount) {
  saveCurrentInputs();
  targetCount = Math.min(6, Math.max(1, targetCount));
  while (tasks.length < targetCount) {
    const nextIdx = tasks.length;
    const nextPid = `P${nextIdx + 1}`;
    const nextPreset = DEFAULT_PRESET_TASKS[nextIdx] || {
      pid: nextPid,
      name: SUBJECT_LIST[nextIdx % SUBJECT_LIST.length],
      at: (nextIdx % 6),
      bt: ((nextIdx % 5) + 1)
    };
    tasks.push({ ...nextPreset, pid: nextPid });
  }
  while (tasks.length > targetCount) {
    tasks.pop();
  }
  renderTableRows();
}

function saveCurrentInputs() {
  const rows = document.querySelectorAll("#taskTableBody tr");
  rows.forEach((tr, i) => {
    if (tasks[i]) {
      const name = tr.querySelector(".task-name-input").value;
      let at = parseInt(tr.querySelector(".task-at-input").value, 10);
      let bt = parseInt(tr.querySelector(".task-bt-input").value, 10);
      if (isNaN(at) || at < 0) at = 0;
      if (at > 5) at = 5;
      if (isNaN(bt) || bt < 1) bt = 1;
      if (bt > 5) bt = 5;

      tasks[i].name = name;
      tasks[i].at = at;
      tasks[i].bt = bt;
    }
  });
}

function randomizeTasks() {
  const countEl = document.getElementById("selectTaskCount");
  const count = countEl ? (parseInt(countEl.value, 10) || 5) : 5;

  const shuffledNames = [...SUBJECT_LIST].sort(() => Math.random() - 0.5);

  tasks = [];
  for (let i = 0; i < count; i++) {
    const pid = `P${i + 1}`;
    const name = shuffledNames[i] || `วิชาที่ ${i + 1}`;
    // สุ่มเลขแค่ 0 ถึง 5 โดยตรง (ไม่ใช้ Seed)
    const at = Math.floor(Math.random() * 6);       // AT: 0, 1, 2, 3, 4, 5
    const bt = Math.floor(Math.random() * 5) + 1;   // BT: 1, 2, 3, 4, 5 (BT > 0)
    tasks.push({ pid, name, at, bt });
  }

  // ตามกติกาหน้า 2 ของชีทอาจารย์: กำหนดอย่างน้อยหนึ่งงานมี AT = 0
  const zeroIdx = Math.floor(Math.random() * count);
  tasks[zeroIdx].at = 0;

  renderTableRows();
}

function resetDefaultTasks() {
  document.getElementById("selectTaskCount").value = "5";
  if (document.getElementById("selectQuantum")) {
    document.getElementById("selectQuantum").value = "2";
  }
  randomizeTasks();
}

function loadExampleDoc() {
  tasks = [
    { pid: "P1", name: "แบบฝึกหัด OS", at: 0, bt: 5 },
    { pid: "P2", name: "รายงาน Database", at: 1, bt: 3 },
    { pid: "P3", name: "สรุป English", at: 2, bt: 1 },
    { pid: "P4", name: "แบบฝึกหัด Math", at: 4, bt: 2 }
  ];
  document.getElementById("selectTaskCount").value = "4";
  document.getElementById("selectQuantum").value = "2";
  renderTableRows();
}

// ==============================================================================
// 3. Calculation & Modal Popup Handler
// ==============================================================================

function handleCalculateAndOpenModal() {
  saveCurrentInputs();

  if (tasks.length === 0) {
    alert("กรุณาเพิ่มงานก่อนคำนวณ");
    return;
  }

  const qEl = document.getElementById("selectQuantum");
  const q = qEl ? (parseInt(qEl.value, 10) || 2) : 2;

  for (const t of tasks) {
    if (isNaN(t.bt) || t.bt < 1 || t.bt > 5) {
      alert(`งาน ${t.pid} มี Burst Time (BT) = ${t.bt} ซึ่งไม่ถูกต้อง (BT ต้องอยู่ระหว่าง 1 ถึง 5)`);
      return;
    }
    if (isNaN(t.at) || t.at < 0 || t.at > 5) {
      alert(`งาน ${t.pid} มี Arrival Time (AT) = ${t.at} ซึ่งไม่ถูกต้อง (AT ต้องอยู่ระหว่าง 0 ถึง 5)`);
      return;
    }
  }

  // Run Algorithms
  const fcfs = runFCFS(tasks);
  const sjf = runSJF(tasks);
  const rr = runRoundRobin(tasks, q);

  lastResults = { q, fcfs, sjf, rr };

  // Render to Modal
  renderModalOutput(fcfs, sjf, rr, q);

  // Open Modal
  document.getElementById("resultModal").classList.add("open");
}

function closeModal() {
  document.getElementById("resultModal").classList.remove("open");
}

function renderModalOutput(fcfs, sjf, rr, q) {
  document.getElementById("modalQVal").textContent = q;
  document.getElementById("rrTabQ").textContent = q;

  // 1. Summary Tab
  renderSummaryTable(fcfs.results, sjf.results, rr.results, q);

  // 2. FCFS Tab
  renderAlgoTab("fcfs", fcfs.results, fcfs.gantt);

  // 3. SJF Tab
  renderAlgoTab("sjf", sjf.results, sjf.gantt);

  // 4. RR Tab
  renderRoundRobinTab(rr.results, rr.gantt, rr.roundsLog);
}

function renderSummaryTable(fcfsRes, sjfRes, rrRes, q) {
  const n = fcfsRes.length;
  const fcfsTat = (fcfsRes.reduce((a, b) => a + b.tat, 0) / n).toFixed(2);
  const fcfsWt = (fcfsRes.reduce((a, b) => a + b.wt, 0) / n).toFixed(2);
  const sjfTat = (sjfRes.reduce((a, b) => a + b.tat, 0) / n).toFixed(2);
  const sjfWt = (sjfRes.reduce((a, b) => a + b.wt, 0) / n).toFixed(2);
  const rrTat = (rrRes.reduce((a, b) => a + b.tat, 0) / n).toFixed(2);
  const rrWt = (rrRes.reduce((a, b) => a + b.wt, 0) / n).toFixed(2);

  const tbody = document.getElementById("summaryTableBody");
  tbody.innerHTML = `
    <tr>
      <td><strong>FCFS</strong></td>
      <td style="text-align: center;">${fcfsTat}</td>
      <td style="text-align: center;"><strong>${fcfsWt}</strong></td>
      <td>เรียงตามเวลาที่มาถึง (AT) หากงานแรกยาวอาจเกิด Convoy Effect</td>
    </tr>
    <tr>
      <td><strong>SJF (Non-preemptive)</strong></td>
      <td style="text-align: center;">${sjfTat}</td>
      <td style="text-align: center;"><strong>${sjfWt}</strong></td>
      <td>เลือกงานที่ BT สั้นสุดเมื่อ CPU ว่าง มักให้เวลารอเฉลี่ยต่ำที่สุด</td>
    </tr>
    <tr>
      <td><strong>Round Robin (q = ${q})</strong></td>
      <td style="text-align: center;">${rrTat}</td>
      <td style="text-align: center;"><strong>${rrWt}</strong></td>
      <td>จัดสรรเวลาวนรอบอย่างยุติธรรม (Fairness) ทุกงานได้เริ่มทำเร็ว</td>
    </tr>
  `;

  // Render Bar Chart
  renderBarChart(parseFloat(fcfsWt), parseFloat(sjfWt), parseFloat(rrWt));

  // Render Analysis Text
  const minWt = Math.min(parseFloat(fcfsWt), parseFloat(sjfWt), parseFloat(rrWt));
  let bestAlgo = "SJF";
  if (parseFloat(fcfsWt) === minWt) bestAlgo = "FCFS";
  else if (parseFloat(rrWt) === minWt) bestAlgo = "Round Robin";

  const analysisEl = document.getElementById("analysisText");
  analysisEl.innerHTML = `
1. เปรียบเทียบค่าเฉลี่ย:
   • FCFS : TAT เฉลี่ย = ${fcfsTat} หน่วย, WT เฉลี่ย = ${fcfsWt} หน่วย
   • SJF  : TAT เฉลี่ย = ${sjfTat} หน่วย, WT เฉลี่ย = ${sjfWt} หน่วย
   • RR   : TAT เฉลี่ย = ${rrTat} หน่วย, WT เฉลี่ย = ${rrWt} หน่วย (q = ${q})

2. สรุปตอบข้อ 1 หน้า 10 (ผลตรงกับสมมติฐานหรือไม่?):
   "ผลการทดลองพบว่าอัลกอริทึมที่ให้ค่าเฉลี่ยเวลารอ (WT) น้อยที่สุดคือ <strong>${bestAlgo} (WT = ${minWt.toFixed(2)} หน่วย)</strong> 
   เนื่องจาก SJF ให้สิทธิ์งานที่มีระยะเวลาทำงานสั้นที่สุดทำก่อน ทำให้งานขนาดเล็กเสร็จสิ้นอย่างรวดเร็ว ส่งผลให้เวลารอรวมลดลงมากที่สุด"

3. สรุปตอบข้อ 3 หน้า 6 (ผลของการเปลี่ยนค่า q):
   "หากค่า q น้อย จะสลับงานบ่อยครั้ง แต่ถ้าเพิ่ม q ให้มีค่าสูงขึ้น พฤติกรรมของ Round Robin จะเริ่มใกล้เคียงกับ FCFS"
  `;
}

function renderBarChart(fcfsWt, sjfWt, rrWt) {
  const chart = document.getElementById("wtBarChart");
  chart.innerHTML = "";
  const maxVal = Math.max(fcfsWt, sjfWt, rrWt, 1);

  const items = [
    { name: "FCFS", val: fcfsWt, cls: "bar-fcfs" },
    { name: "SJF", val: sjfWt, cls: "bar-sjf" },
    { name: "RR", val: rrWt, cls: "bar-rr" }
  ];

  items.forEach(it => {
    const pct = Math.max(15, (it.val / maxVal) * 85);
    const col = document.createElement("div");
    col.className = "bar-item";
    col.innerHTML = `
      <span class="bar-val">${it.val.toFixed(2)}</span>
      <div class="bar-pillar ${it.cls}" style="height: ${pct}%;"></div>
      <span class="bar-name">${it.name}</span>
    `;
    chart.appendChild(col);
  });
}

function renderAlgoTab(algoKey, results, gantt) {
  const n = results.length;
  const avgTat = (results.reduce((a, b) => a + b.tat, 0) / n).toFixed(2);
  const avgWt = (results.reduce((a, b) => a + b.wt, 0) / n).toFixed(2);

  document.getElementById(`${algoKey}AvgTat`).textContent = avgTat;
  document.getElementById(`${algoKey}AvgWt`).textContent = avgWt;

  // Table
  const tbody = document.getElementById(`${algoKey}TableBody`);
  tbody.innerHTML = "";
  results.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align: center;"><span class="process-badge badge-${r.pid}">${r.pid}</span></td>
      <td>${r.name}</td>
      <td style="text-align: center;">${r.at}</td>
      <td style="text-align: center;">${r.bt}</td>
      <td style="text-align: center;"><strong>${r.ct}</strong></td>
      <td style="text-align: center;">${r.tat}</td>
      <td style="text-align: center;">${r.wt}</td>
    `;
    tbody.appendChild(tr);
  });

  // Gantt
  renderGanttChart(`${algoKey}Gantt`, `${algoKey}GanttText`, gantt);
}

function renderRoundRobinTab(results, gantt, rounds) {
  const n = results.length;
  const avgTat = (results.reduce((a, b) => a + b.tat, 0) / n).toFixed(2);
  const avgWt = (results.reduce((a, b) => a + b.wt, 0) / n).toFixed(2);

  document.getElementById("rrAvgTat").textContent = avgTat;
  document.getElementById("rrAvgWt").textContent = avgWt;

  // Table 1: Process Results
  const tbody = document.getElementById("rrTableBody");
  tbody.innerHTML = "";
  results.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align: center;"><span class="process-badge badge-${r.pid}">${r.pid}</span></td>
      <td style="text-align: center;">${r.at}</td>
      <td style="text-align: center;">${r.bt}</td>
      <td style="text-align: center;"><strong>${r.ct}</strong></td>
      <td style="text-align: center;">${r.tat}</td>
      <td style="text-align: center;">${r.wt}</td>
    `;
    tbody.appendChild(tr);
  });

  // Table 2: Round Steps Table (หน้า 5)
  const tbodyRounds = document.getElementById("rrRoundsTableBody");
  tbodyRounds.innerHTML = "";
  rounds.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align: center;">${r.interval}</td>
      <td style="text-align: center;"><span class="process-badge badge-${r.pid}">${r.pid}</span></td>
      <td style="text-align: center;">${r.remBt}</td>
    `;
    tbodyRounds.appendChild(tr);
  });

  // Gantt
  renderGanttChart("rrGantt", "rrGanttText", gantt);
}

function renderGanttChart(wrapperId, textId, gantt) {
  const wrapper = document.getElementById(wrapperId);
  wrapper.innerHTML = "";
  if (!gantt || gantt.length === 0) return;

  const totalTime = gantt[gantt.length - 1].end;
  if (totalTime === 0) return;

  let textLine = "[0]";
  gantt.forEach(b => {
    textLine += `-- ${b.pid} --[${b.end}]`;
  });
  document.getElementById(textId).textContent = `ลำดับเวลา: ${textLine}`;

  const container = document.createElement("div");
  container.className = "gantt-container";
  container.style.width = "100%";
  container.style.minWidth = "500px";

  const tick0 = document.createElement("span");
  tick0.className = "gantt-tick-start";
  tick0.textContent = "0";
  container.appendChild(tick0);

  gantt.forEach(b => {
    const duration = b.end - b.start;
    const pct = ((duration / totalTime) * 100).toFixed(2);

    const block = document.createElement("div");
    block.className = `gantt-block ${b.pid === "IDLE" ? "idle" : ""}`;
    block.style.width = `${pct}%`;
    block.style.backgroundColor = BADGE_COLORS[b.pid] || "#64748B";

    block.innerHTML = `
      <span>${b.pid}</span>
      <span class="gantt-tick">${b.end}</span>
    `;
    container.appendChild(block);
  });

  wrapper.appendChild(container);
}

// ---------------- Q Tester ----------------

function handleTestDifferentQ() {
  if (!lastResults) return;

  const newQ = parseInt(document.getElementById("selectNewQ").value, 10);
  const oldQ = lastResults.q;
  const oldWt = (
    lastResults.rr.results.reduce((a, b) => a + b.wt, 0) / lastResults.rr.results.length
  ).toFixed(2);

  const newRr = runRoundRobin(tasks, newQ);
  const newWt = (
    newRr.results.reduce((a, b) => a + b.wt, 0) / newRr.results.length
  ).toFixed(2);

  const diff = (parseFloat(newWt) - parseFloat(oldWt)).toFixed(2);
  let msg = "";
  if (diff < 0) {
    msg = `<span style="color: #16A34A; font-weight: bold;">WT เฉลี่ยลดลง ${Math.abs(diff)} หน่วยเวลา</span>`;
  } else if (diff > 0) {
    msg = `<span style="color: #DC2626; font-weight: bold;">WT เฉลี่ยเพิ่มขึ้น ${diff} หน่วยเวลา</span>`;
  } else {
    msg = `WT เฉลี่ยเท่าเดิม`;
  }

  document.getElementById("qDiffResult").innerHTML = `
    <strong>ผลการเปรียบเทียบ:</strong> q เดิม (${oldQ}) ได้ WT เฉลี่ย = <strong>${oldWt}</strong> ➔ q ใหม่ (${newQ}) ได้ WT เฉลี่ย = <strong>${newWt}</strong> (${msg})<br>
    <em>คำอธิบายสำหรับเขียนตอบข้อ 2 หน้า 10:</em> "เมื่อเปลี่ยนค่า q จาก ${oldQ} เป็น ${newQ} ทำให้ ${msg} เนื่องจาก Time Quantum ส่งผลต่อความถี่ในการสลับงานและการกลับเข้าคิวของ Process"
  `;
}

// ---------------- Copy Report ----------------

function copySummaryToClipboard() {
  if (!lastResults) return;
  const n = tasks.length;
  const fcfsTat = (lastResults.fcfs.results.reduce((a, b) => a + b.tat, 0) / n).toFixed(2);
  const fcfsWt = (lastResults.fcfs.results.reduce((a, b) => a + b.wt, 0) / n).toFixed(2);
  const sjfTat = (lastResults.sjf.results.reduce((a, b) => a + b.tat, 0) / n).toFixed(2);
  const sjfWt = (lastResults.sjf.results.reduce((a, b) => a + b.wt, 0) / n).toFixed(2);
  const rrTat = (lastResults.rr.results.reduce((a, b) => a + b.tat, 0) / n).toFixed(2);
  const rrWt = (lastResults.rr.results.reduce((a, b) => a + b.wt, 0) / n).toFixed(2);

  const text = `
=== สรุปผลการคำนวณ CPU Scheduling (FCFS, SJF, Round Robin) ===
• FCFS : TAT เฉลี่ย = ${fcfsTat} หน่วย, WT เฉลี่ย = ${fcfsWt} หน่วย
• SJF  : TAT เฉลี่ย = ${sjfTat} หน่วย, WT เฉลี่ย = ${sjfWt} หน่วย
• RR   : TAT เฉลี่ย = ${rrTat} หน่วย, WT เฉลี่ย = ${rrWt} หน่วย (q = ${lastResults.q})
==============================================================
`;
  navigator.clipboard.writeText(text.trim()).then(() => {
    alert("คัดลอกสรุปผลลัพธ์ลงในคลิปบอร์ดเรียบร้อยแล้ว!");
  });
}
