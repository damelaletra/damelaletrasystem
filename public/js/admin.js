const requestsList = document.getElementById("requests-list");
const auditLogs = document.getElementById("audit-logs");
const metricTtc = document.getElementById("metric-ttc");
const metricTotalRequests = document.getElementById("metric-total-requests");
const metricAcceptance = document.getElementById("metric-acceptance");
const metricProviders = document.getElementById("metric-providers");
const demandLocations = document.getElementById("demand-locations");
const demandGaps = document.getElementById("demand-gaps");
const btnResetDb = document.getElementById("btn-reset-db");

let cachedProviders = [];

async function loadInitialData() {
  try {
    const [reqsRes, metricsRes, provsRes] = await Promise.all([
      fetch("/api/requests"),
      fetch("/api/metrics"),
      fetch("/api/providers")
    ]);

    const reqsData = await reqsRes.json();
    const metricsData = await metricsRes.json();
    const provsData = await provsRes.json();

    cachedProviders = provsData.providers || [];
    renderRequests(reqsData.requests || []);
    renderMetrics(metricsData);
  } catch (err) {
    console.error("[ADMIN] Error loading initial data:", err);
  }
}

function renderMetrics(metrics) {
  if (!metrics) return;
  metricTtc.textContent = metrics.northStar.averageSeconds > 0
    ? `${metrics.northStar.averageSeconds}s`
    : "-- s";

  metricTotalRequests.textContent = metrics.funnel.totalRequests;
  metricAcceptance.textContent = metrics.funnel.quoteAcceptanceRate;
  metricProviders.textContent = `${metrics.funnel.activeProviders} / ${metrics.funnel.totalProviders}`;

  // Locations
  const locEntries = Object.entries(metrics.demandIntelligence.byLocation || {});
  if (locEntries.length === 0) {
    demandLocations.textContent = "Sin datos de ubicación aún";
  } else {
    demandLocations.innerHTML = locEntries.map(([loc, count]) => `• <strong>${loc}</strong>: ${count} req`).join("<br>");
  }

  // Gaps
  const gapEntries = Object.entries(metrics.demandIntelligence.unservedGaps || {});
  if (gapEntries.length === 0) {
    demandGaps.textContent = "Sin solicitudes no atendidas registradas";
  } else {
    demandGaps.innerHTML = gapEntries.map(([cat, count]) => `?? <strong>${cat}</strong>: ${count} solicitudes sin proveedor en red`).join("<br>");
  }
}

function renderRequests(requests) {
  if (requests.length === 0) {
    requestsList.innerHTML = `<div style="color: var(--text-dim); text-align: center; padding: 2rem;">No hay solicitudes activas aún. Envía una desde la vista de Cliente.</div>`;
    return;
  }

  requestsList.innerHTML = requests.map(req => {
    const matchedProvider = cachedProviders.find(p => p.id === req.matched_provider_id);
    const providerName = matchedProvider ? matchedProvider.display_name : "Buscando...";

    let quoteSummary = "";
    if (req.quoted_price) {
      quoteSummary = `?? $${req.quoted_price} (${req.estimated_arrival})`;
    }

    return `
      <div class="request-card" id="card-${req.id}">
        <div class="request-card-header">
          <span style="font-weight: 700; font-size: 0.95rem;">"${escapeHtml(req.raw_message)}"</span>
          <span class="status-badge status-${req.status}">${req.status}</span>
        </div>

        <div class="request-meta">
          <span>?? ${req.location_raw || "Louisville"}</span>
          <span>??? ${req.service_category || "GENERAL"} / ${req.property_type}</span>
          <span>? ${req.urgency}</span>
          ${quoteSummary ? `<span>${quoteSummary}</span>` : ""}
        </div>

        <div style="font-size: 0.82rem; color: var(--text-muted);">
          ?? <strong>Proveedor:</strong> ${providerName}
          ${req.candidate_provider_ids ? ` · Candidatos en cascada: ${req.candidate_provider_ids.length}` : ""}
        </div>

        <div class="request-actions">
          <button class="btn-small" onclick="manualAssign('${req.id}')">Asignar Manualmente</button>
          <button class="btn-small" onclick="forceFallback('${req.id}')">Forzar Fallback Público</button>
        </div>
      </div>
    `;
  }).join("");
}

function appendAuditLog(text) {
  const div = document.createElement("div");
  const time = new Date().toLocaleTimeString();
  div.textContent = `[${time}] ${text}`;
  auditLogs.prepend(div);
}

// SSE real-time listener
const eventSource = new EventSource("/api/events");

eventSource.addEventListener("request_status_update", (e) => {
  const data = JSON.parse(e.data);
  appendAuditLog(`Estado actualizado a ${data.status} para solicitud ${data.requestId}`);
  loadInitialData();
});

eventSource.addEventListener("customer_message", (e) => {
  const data = JSON.parse(e.data);
  appendAuditLog(`Mensaje al cliente: "${data.text.substring(0, 45)}..."`);
  loadInitialData();
});

eventSource.addEventListener("provider_briefing", (e) => {
  const data = JSON.parse(e.data);
  appendAuditLog(`Briefing enviado a ${data.providerName} (${data.channel})`);
  loadInitialData();
});

// Operator manual actions
window.manualAssign = async function(requestId) {
  const providerOptions = cachedProviders.map((p, i) => `${i + 1}: ${p.display_name} (${p.category})`).join("\n");
  const choice = prompt(`Selecciona proveedor para asignar a la solicitud:\n\n${providerOptions}`);
  if (!choice) return;

  const idx = parseInt(choice, 10) - 1;
  if (idx >= 0 && idx < cachedProviders.length) {
    const selectedProvider = cachedProviders[idx];
    try {
      await fetch("/api/admin/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, providerId: selectedProvider.id })
      });
      alert(`Asignado a ${selectedProvider.display_name}`);
      loadInitialData();
    } catch (err) {
      alert("Error al asignar proveedor.");
    }
  }
};

window.forceFallback = async function(requestId) {
  if (!confirm("¿Deseas forzar el envío del resultado del directorio público local?")) return;
  try {
    await fetch("/api/admin/fallback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId })
    });
    loadInitialData();
  } catch (err) {
    alert("Error al forzar fallback.");
  }
};

btnResetDb.addEventListener("click", async () => {
  if (!confirm("¿Deseas reiniciar la base de datos a su estado inicial de Louisville?")) return;
  try {
    await fetch("/api/admin/reset", { method: "POST" });
    alert("Base de datos reiniciada con éxito.");
    loadInitialData();
  } catch (err) {
    alert("Error al reiniciar.");
  }
});

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

loadInitialData();
