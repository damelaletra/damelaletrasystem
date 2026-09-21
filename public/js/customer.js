const chatMessages = document.getElementById("chat-messages");
const customerInput = document.getElementById("customer-input");
const sendBtn = document.getElementById("send-btn");

// Ephemeral conversation ID
let conversationRef = localStorage.getItem("dml_conversation_ref");
if (!conversationRef) {
  conversationRef = "customer-web-" + Math.floor(Math.random() * 1000000);
  localStorage.setItem("dml_conversation_ref", conversationRef);
}

// Connect to Server-Sent Events (SSE) for real-time updates
const eventSource = new EventSource("/api/events");

eventSource.addEventListener("customer_message", (e) => {
  const data = JSON.parse(e.data);
  if (data.conversationRef === conversationRef) {
    appendDmlBubble(data.text, data);
  }
});

function appendUserBubble(text) {
  const div = document.createElement("div");
  div.className = "chat-bubble bubble-user";
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendDmlBubble(text, meta = {}) {
  const div = document.createElement("div");
  div.className = "chat-bubble bubble-dml dml-highlight";
  
  // Format linebreaks and markdown-like bold
  const formatted = text.replace(/\n/g, "<br>").replace(/\*([^\*]+)\*/g, "<strong>$1</strong>");
  div.innerHTML = formatted;

  if (meta.promptConfirmation) {
    const btnContainer = document.createElement("div");
    btnContainer.className = "bubble-action-buttons";

    const yesBtn = document.createElement("button");
    yesBtn.className = "btn-bubble-confirm";
    yesBtn.textContent = "? Sí, conéctame ahora";
    yesBtn.onclick = () => {
      btnContainer.remove();
      sendMessage("Sí, conéctame por favor");
    };

    const noBtn = document.createElement("button");
    noBtn.className = "btn-bubble-decline";
    noBtn.textContent = "Buscar otro";
    noBtn.onclick = () => {
      btnContainer.remove();
      sendMessage("No, prefiero buscar otra opción");
    };

    btnContainer.appendChild(yesBtn);
    btnContainer.appendChild(noBtn);
    div.appendChild(btnContainer);
  }

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage(text) {
  const msg = (text || customerInput.value).trim();
  if (!msg) return;

  appendUserBubble(msg);
  customerInput.value = "";

  try {
    const res = await fetch("/api/customer/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        conversationRef: conversationRef,
        channel: "WEB"
      })
    });
    const data = await res.json();
    if (!data.success && data.error) {
      appendDmlBubble("Ocurrió un error al procesar tu solicitud: " + data.error);
    }
  } catch (err) {
    appendDmlBubble("Error de conexión con la red DML.");
  }
}

sendBtn.addEventListener("click", () => sendMessage());
customerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Example chips
document.querySelectorAll(".chip-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const text = btn.getAttribute("data-text");
    customerInput.value = text;
    sendMessage(text);
  });
});
