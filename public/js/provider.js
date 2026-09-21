const providerSelect = document.getElementById("provider-select");
const phoneMessages = document.getElementById("phone-messages");
const phoneInput = document.getElementById("phone-input");
const phoneSendBtn = document.getElementById("phone-send-btn");
const providerBadge = document.getElementById("provider-badge");

let currentProviderId = providerSelect.value;
let currentPendingRequestId = null;

// Connect to SSE stream
const eventSource = new EventSource("/api/events");

eventSource.addEventListener("provider_briefing", (e) => {
  const data = JSON.parse(e.data);
  if (data.providerId === currentProviderId) {
    currentPendingRequestId = data.requestId;
    appendIncomingMessage(data.text, data);
  }
});

function appendIncomingMessage(text, meta = {}) {
  const div = document.createElement("div");
  div.className = "wa-bubble-incoming";
  div.innerHTML = `<strong>?? NUEVA SOLICITUD DML:</strong><br>${text.replace(/\n/g, "<br>")}`;
  phoneMessages.appendChild(div);
  phoneMessages.scrollTop = phoneMessages.scrollHeight;
}

function appendOutgoingMessage(text) {
  const div = document.createElement("div");
  div.className = "wa-bubble-outgoing";
  div.textContent = text;
  phoneMessages.appendChild(div);
  phoneMessages.scrollTop = phoneMessages.scrollHeight;
}

async function sendProviderReply(text) {
  const msg = (text || phoneInput.value).trim();
  if (!msg) return;

  appendOutgoingMessage(msg);
  phoneInput.value = "";

  try {
    const res = await fetch("/api/provider/response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: currentProviderId,
        response: msg,
        requestId: currentPendingRequestId
      })
    });
    const data = await res.json();
    console.log("[PROVIDER SIM] Sent response:", data);
  } catch (err) {
    console.error("[PROVIDER SIM] Error sending response:", err);
  }
}

phoneSendBtn.addEventListener("click", () => sendProviderReply());
phoneInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendProviderReply();
});

// Quick reply buttons
document.querySelectorAll(".btn-quick-reply").forEach(btn => {
  btn.addEventListener("click", () => {
    const reply = btn.getAttribute("data-reply");
    sendProviderReply(reply);
  });
});

providerSelect.addEventListener("change", () => {
  currentProviderId = providerSelect.value;
  phoneMessages.innerHTML = `
    <div class="wa-bubble-incoming">
      ?? Has cambiado al perfil de <strong>${providerSelect.options[providerSelect.selectedIndex].text}</strong>.<br>
      Esperando solicitudes dirigidas a este proveedor...
    </div>
  `;
});
