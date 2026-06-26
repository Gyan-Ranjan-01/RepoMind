const API_BASE = "http://localhost:8000";

// Token catch redirect
const urlParams = new URLSearchParams(window.location.search);
const urlToken = urlParams.get("token");
if (urlToken) {
  localStorage.setItem("repomind_token", urlToken);
  window.history.replaceState({}, document.title, window.location.pathname);
  handleSuccessRedirect();
}

function handleSuccessRedirect() {
  const repoUrl = sessionStorage.getItem("repomind_url");
  if (repoUrl) {
    window.location.href = `chat.html?repo=${encodeURIComponent(repoUrl)}`;
  } else {
    window.location.href = "index.html";
  }
}

// --- Dynamic Mockup Pipeline Animation Loop ---
document.addEventListener("DOMContentLoaded", () => {
  const nodes = document.querySelectorAll(".graph-nodes .graph-node");
  if (nodes.length === 3) {
    let stage = 0;

    function updatePipeline() {
      nodes.forEach((node, idx) => {
        const line = node.querySelector(".graph-line");
        const status = node.lastElementChild;

        if (idx < stage) {
          node.className = "graph-node done";
          if (line) line.className = "graph-line";
          if (status) status.textContent = "✓";
        } else if (idx === stage) {
          node.className = "graph-node active";
          if (line) line.className = "graph-line active";
          if (status) {
            if (idx === 0) status.textContent = "Cloning...";
            else if (idx === 1) status.textContent = "Scanning...";
            else if (idx === 2) status.textContent = "Injecting...";
          }
        } else {
          node.className = "graph-node";
          if (line) line.className = "graph-line";
          if (status) status.textContent = "Waiting";
        }
      });

      stage = (stage + 1) % 4;

      let delay = 1800;
      if (stage === 0) {
        nodes.forEach((node) => {
          node.className = "graph-node done";
          const line = node.querySelector(".graph-line");
          if (line) line.className = "graph-line";
          const status = node.lastElementChild;
          if (status) status.textContent = "✓";
        });
        delay = 2800;
      }
      setTimeout(updatePipeline, delay);
    }

    setTimeout(updatePipeline, 1000);
  }
});

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const btn = document.getElementById("submitBtn");
  const errEl = document.getElementById("errorMsg");

  btn.disabled = true;
  btn.textContent = "Registering Account...";
  errEl.style.display = "none";

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.detail || "Registration failed");

    localStorage.setItem("repomind_token", data.token);
    handleSuccessRedirect();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Sign Up";
  }
});
