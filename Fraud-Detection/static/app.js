const statsGrid = document.getElementById("statsGrid");
const alertsEl = document.getElementById("alerts");
const rowsEl = document.getElementById("transactionRows");
const explanationEl = document.getElementById("explanation");
const updatedAtEl = document.getElementById("updatedAt");
const graphEl = document.getElementById("graph");
const toggleButton = document.getElementById("toggleStream");
const burstButton = document.getElementById("burst");

let polling = true;
let pollHandle = null;

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function badgeClass(label) {
  return `badge badge-${label}`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function renderStats(stats) {
  const cards = [
    ["Transactions Monitored", stats.transactions_monitored, "Rolling transactions included in scoring"],
    ["Flagged Alerts", stats.flagged_alerts, "Low to critical alerts produced by the pipeline"],
    ["Suspicious Volume", money(stats.suspicious_volume), "Funds tied to hold/block actions"],
    ["Ring Clusters", stats.ring_clusters, "Circular or rapid-hop laundering clusters"],
    ["Rules Triggered", stats.rules_triggered, "Deterministic rules activated this window"],
    ["Hot Origin", stats.hot_country, "Most active source country"],
    ["Blocked", stats.blocked_count, `Hold ${stats.held_count} | Review ${stats.review_count}`],
    ["Latency", `${stats.total_latency_ms} ms`, `Txn ${stats.transaction_scoring_latency_ms} | Graph ${stats.graph_update_latency_ms}`],
  ];

  statsGrid.innerHTML = cards.map(([label, value, hint]) => `
    <article class="stat-card">
      <p class="stat-label">${label}</p>
      <p class="stat-value">${value}</p>
      <p class="stat-hint">${hint}</p>
    </article>
  `).join("");
}

function renderAlerts(alerts) {
  if (!alerts.length) {
    alertsEl.innerHTML = `<div class="alert-card"><p class="alert-title">No active fraud alerts</p><p class="alert-reasons">The detector is still monitoring the latest transaction flow.</p></div>`;
    return;
  }

  alertsEl.innerHTML = alerts.map((alert) => {
    const title = alert.alert_title || (alert.type === "ring" ? "Potential laundering ring detected" : "Suspicious transaction");
    const amountLine = money(alert.amount || alert.suspicious_funds_total || 0);
    const evidence = [...(alert.rule_reasons || []), ...(alert.network_evidence || [])].slice(0, 4);
    return `
      <article class="alert-card">
        <div class="alert-topline">
          <p class="alert-title">${title}</p>
          <span class="risk">${pct(alert.final_risk)} risk</span>
        </div>
        <p class="alert-reasons">
          <span class="${badgeClass(alert.severity)}">${alert.severity}</span>
          <span class="${badgeClass(alert.action)}">${alert.action}</span>
          ${amountLine}
        </p>
        <p class="alert-reasons">${evidence.join(" • ")}</p>
        ${alert.accounts_involved?.length ? `<p class="alert-reasons">Accounts: ${alert.accounts_involved.join(", ")}</p>` : ""}
      </article>
    `;
  }).join("");
}

function renderTransactions(transactions) {
  rowsEl.innerHTML = transactions.map((tx) => `
    <tr>
      <td>${tx.transaction_id}</td>
      <td>${tx.sender_account}</td>
      <td>${tx.receiver_account}</td>
      <td><span class="badge">${tx.ip_country}</span></td>
      <td>${money(tx.amount)}</td>
      <td>${pct(tx.final_risk)}</td>
      <td><span class="${badgeClass(tx.action)}">${tx.action}</span></td>
    </tr>
  `).join("");
}

function renderExplanation(alerts) {
  const prioritized = [
    ...alerts.filter((alert) => alert.type === "transaction"),
    ...alerts.filter((alert) => alert.type === "ring"),
  ];
  const focus = prioritized.slice(0, 3);
  explanationEl.innerHTML = focus.map((alert) => `
    <article class="explanation-card">
      <strong>${alert.alert_title || "Fraud evidence summary"}</strong>
      <p class="explanation-lead">${alert.explanation}</p>
      <div class="score-stack">
        ${(alert.why_flagged?.breakdown || []).map((item) => `
          <div class="score-row">
            <span>${item.label}</span>
            <div class="score-bar"><span style="width:${Math.round((item.value || 0) * 100)}%"></span></div>
            <strong>${pct(item.value || 0)}</strong>
          </div>
        `).join("")}
      </div>
      <p><strong>Decision:</strong> ${alert.why_flagged?.severity || alert.severity} / ${alert.why_flagged?.action || alert.action} at ${pct(alert.why_flagged?.final_risk || alert.final_risk || 0)}</p>
      ${(alert.why_flagged?.top_rule_reasons || []).length ? `<p><strong>Rules:</strong> ${(alert.why_flagged.top_rule_reasons || []).join(" • ")}</p>` : ""}
      ${(alert.why_flagged?.top_network_evidence || []).length ? `<p><strong>Network:</strong> ${(alert.why_flagged.top_network_evidence || []).join(" • ")}</p>` : ""}
    </article>
  `).join("") || `
    <article class="explanation-card">
      <strong>AI Explanation</strong>
      <p class="explanation-lead">The model is waiting for enough unusual behavior to justify a plain-language alert.</p>
    </article>
  `;
}

function renderGraph(graph) {
  const { nodes = [], edges = [] } = graph;
  const width = 800;
  const height = 420;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.33;

  const positionedNodes = nodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1);
    const squash = node.kind === "device" || node.kind === "ip" || node.kind === "beneficiary" ? 0.58 : 0.8;
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius * squash,
    };
  });

  const nodeMap = Object.fromEntries(positionedNodes.map((node) => [node.id, node]));
  const kindFill = {
    account: "#00643a",
    mule: "#bf5f00",
    cashout: "#ab2d1f",
    device: "#355c7d",
    ip: "#6c5b7b",
    beneficiary: "#7c8b39",
  };

  const edgeSvg = edges.map((edge) => {
    const source = nodeMap[edge.source];
    const target = nodeMap[edge.target];
    if (!source || !target) return "";
    const label = edge.amount ? money(edge.amount) : edge.label;
    return `
      <line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"
        stroke="${edge.risk > 0.8 ? "#ab2d1f" : "#7a8a7d"}"
        stroke-width="${edge.risk > 0.8 ? 3 : 1.5}"
        stroke-opacity="0.72" />
      <text x="${(source.x + target.x) / 2}" y="${(source.y + target.y) / 2 - 4}" class="graph-label">${label}</text>
    `;
  }).join("");

  const nodeSvg = positionedNodes.map((node) => `
    <g>
      <circle cx="${node.x}" cy="${node.y}" r="${node.kind === "device" || node.kind === "ip" || node.kind === "beneficiary" ? 14 : 19}"
        fill="${kindFill[node.kind] || "#00643a"}"
        fill-opacity="${Math.max(node.risk, 0.45)}" />
      <circle cx="${node.x}" cy="${node.y}" r="${node.kind === "device" || node.kind === "ip" || node.kind === "beneficiary" ? 19 : 26}"
        fill="none" stroke="rgba(24,38,28,0.14)" />
      <text x="${node.x}" y="${node.y + 36}" text-anchor="middle" class="graph-label">${node.label}</text>
    </g>
  `).join("");

  graphEl.innerHTML = `
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(24,38,28,0.05)" stroke-width="1"></path>
      </pattern>
    </defs>
    <rect width="800" height="420" fill="url(#grid)"></rect>
    ${edgeSvg}
    ${nodeSvg}
  `;
}

function render(payload) {
  renderStats(payload.stats);
  renderAlerts(payload.alerts);
  renderTransactions(payload.transactions);
  renderExplanation(payload.alerts);
  renderGraph(payload.graph);
  updatedAtEl.textContent = `Updated ${new Date(payload.generated_at).toLocaleTimeString()}`;
}

async function load(url) {
  try {
    const payload = await fetchJson(url);
    render(payload);
  } catch (error) {
    alertsEl.innerHTML = `<div class="alert-card"><p class="alert-title">Dashboard unavailable</p><p class="alert-reasons">${error.message}</p></div>`;
  }
}

function startPolling() {
  clearInterval(pollHandle);
  pollHandle = setInterval(() => {
    if (polling) {
      load("/api/stream?batch=6");
    }
  }, 3000);
}

toggleButton.addEventListener("click", () => {
  polling = !polling;
  toggleButton.textContent = polling ? "Pause Live Stream" : "Resume Live Stream";
});

burstButton.addEventListener("click", () => {
  load("/api/stream?batch=12");
});

load("/api/bootstrap");
startPolling();
