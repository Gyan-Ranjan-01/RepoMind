const API_BASE = "https://repomind-pxft.onrender.com";
let toastTimer = null;
let currentPreviewUrl = "";

// Auth Header Pill Loading
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("repomind_token");
  const authNav = document.getElementById("authNav");

  if (token) {
    authNav.innerHTML = `
        <a href="chat.html" class="npill">Active Workspace</a>
        <a href="#" onclick="logout()" style="color: var(--red); border-color: rgba(220,38,38,0.3);" class="npill">Log out</a>
      `;
  } else {
    authNav.innerHTML = `
        <a href="login.html" class="npill">Sign In</a>
        <a href="signup.html" style="border-color: var(--amber); color: var(--amber);" class="npill">Sign Up</a>
      `;
  }
});

function logout() {
  localStorage.removeItem("repomind_token");
  window.location.reload();
}

// --- Dynamic Repository Preview via GitHub API ---
const repoInput = document.getElementById("repoUrl");
repoInput.addEventListener("input", debounce(handleUrlPreview, 400));

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

async function handleUrlPreview() {
  const url = repoInput.value.trim();
  if (!url) {
    hidePreview();
    return;
  }

  const match = url.match(
    /https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/,
  );
  if (!match) {
    hidePreview();
    return;
  }

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");
  const cleanUrl = `https://github.com/${owner}/${repo}`;

  if (cleanUrl === currentPreviewUrl) return;
  currentPreviewUrl = cleanUrl;

  showLoadingPreview(owner, repo);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
    );
    if (!response.ok) throw new Error("Repository not found");
    const data = await response.json();

    document.getElementById("repoAvatar").src = data.owner.avatar_url;
    document.getElementById("repoTitle").textContent = data.name;
    document.getElementById("repoOwner").textContent = data.owner.login;
    document.getElementById("repoLang").textContent =
      data.language || "Multi-language";
    document.getElementById("repoStars").textContent =
      data.stargazers_count.toLocaleString();
    document.getElementById("repoVis").textContent = data.private
      ? "Private"
      : "Public";

    const updatedDate = new Date(data.updated_at).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
    document.getElementById("repoUpdated").textContent = updatedDate;
  } catch (e) {
    document.getElementById("repoAvatar").src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d97706' stroke-width='2'%3E%3Cpath d='M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22'%3E%3C/path%3E%3C/svg%3E";
    document.getElementById("repoTitle").textContent = repo;
    document.getElementById("repoOwner").textContent = owner;
    document.getElementById("repoLang").textContent = "Auto-detecting";
    document.getElementById("repoStars").textContent = "—";
    document.getElementById("repoVis").textContent = "Public";
    document.getElementById("repoUpdated").textContent = "Recent";
  }
}

function showLoadingPreview(owner, repo) {
  const card = document.getElementById("repoPreviewCard");
  card.classList.add("visible");
  document.getElementById("repoTitle").textContent = repo;
  document.getElementById("repoOwner").textContent =
    `${owner} (fetching details...)`;
  document.getElementById("repoLang").textContent = "Loading...";
  document.getElementById("repoStars").textContent = "...";
  document.getElementById("repoVis").textContent = "Public";
  document.getElementById("repoUpdated").textContent = "...";
}

function hidePreview() {
  currentPreviewUrl = "";
  const card = document.getElementById("repoPreviewCard");
  card.classList.remove("visible");
}

// --- Terminal Animations & Logger ---
const terminalBody = document.getElementById("terminalBody");

function clearTerminal() {
  terminalBody.innerHTML = "";
}

function appendTerminalLine(
  text,
  type = "info",
  animate = true,
  isInput = false,
) {
  const line = document.createElement("div");
  line.className = "terminal-line";

  if (isInput) {
    line.innerHTML = `<span class="terminal-prompt">repomind@pipeline:~$</span><span class="terminal-log"></span>`;
  } else {
    let prefix = "";
    if (type === "info")
      prefix = '<span style="color:var(--muted)">[INFO]</span> ';
    if (type === "done")
      prefix = '<span style="color:var(--green)">[DONE]</span> ';
    if (type === "error")
      prefix = '<span style="color:var(--red)">[ERROR]</span> ';
    line.innerHTML = `<span class="terminal-log">${prefix}</span>`;
  }

  terminalBody.appendChild(line);
  const logEl = line.querySelector(".terminal-log");

  if (animate) {
    let index = 0;
    const textToType = text;
    logEl.innerHTML += '<span class="terminal-cursor"></span>';
    const cursor = logEl.querySelector(".terminal-cursor");

    const timer = setInterval(() => {
      if (index < textToType.length) {
        cursor.insertAdjacentText("beforebegin", textToType[index]);
        index++;
        terminalBody.scrollTop = terminalBody.scrollHeight;
      } else {
        clearInterval(timer);
        cursor.remove();
      }
    }, 15);
  } else {
    logEl.innerHTML += text;
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }
}

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function handleIngest() {
  const input = document.getElementById("repoUrl");
  const url = input.value.trim();
  const btn = document.getElementById("analyzeBtn");

  if (!url) {
    showToast("error", "⚠", "Please paste a GitHub URL first.");
    return;
  }
  if (!url.startsWith("https://github.com/")) {
    input.value = "";
    showToast("error", "✕", "Only public GitHub URLs are supported.");
    return;
  }

  const match = url.match(
    /https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/,
  );
  const repoTitle = match ? match[2].replace(/\.git$/, "") : "codebase";
  const primaryLanguage = document.getElementById("repoLang").textContent;
  sessionStorage.setItem(
    "repomind_lang",
    primaryLanguage === "Loading..." || primaryLanguage === "—"
      ? "Auto-detecting"
      : primaryLanguage,
  );

  btn.disabled = true;
  input.disabled = true;
  const terminalContainer = document.getElementById("terminalContainer");
  terminalContainer.classList.add("visible");
  clearTerminal();

  // Start UI simulated logs parallelly
  appendTerminalLine(`analyze ${url}`, "info", true, true);
  await delay(800);
  appendTerminalLine(
    "Resolving repo layout from GitHub workspace endpoint...",
    "info",
  );
  await delay(600);

  let isRequestDone = false;
  let requestError = null;
  let responseData = null;

  // API Header Setup
  const token = localStorage.getItem("repomind_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Fire actual ingest request
  const ingestPromise = fetch(`${API_BASE}/ingest`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ repo_url: url }),
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Repo not indexed. Please log in to index it!");
      }
      throw new Error(data.detail || "Ingestion request rejected by server.");
    }
    return data;
  });

  // Run dynamic typewriter lines while index completes
  (async () => {
    try {
      appendTerminalLine(
        `Cloning git repository references for target: ${repoTitle}...`,
        "info",
      );
      await delay(1000);
      if (isRequestDone) return;
      appendTerminalLine(
        "Extracting code tree metadata & README.md documentation...",
        "info",
      );
      await delay(1200);
      if (isRequestDone) return;
      appendTerminalLine(
        "Building structural abstract syntax tree bounds...",
        "info",
      );
      await delay(1200);
      if (isRequestDone) return;
      appendTerminalLine(
        "Parsing module imports and building external graph layers...",
        "info",
      );
      await delay(1000);
      if (isRequestDone) return;
      appendTerminalLine(
        "Starting chunking: parsing codebase files into 600-token blocks...",
        "info",
      );
    } catch (e) {}
  })();

  try {
    responseData = await ingestPromise;
    isRequestDone = true;
  } catch (err) {
    isRequestDone = true;
    requestError = err;
  }

  if (requestError) {
    appendTerminalLine(
      `Index process aborted. Reason: ${requestError.message}`,
      "error",
    );
    await delay(800);

    btn.disabled = false;
    input.disabled = false;
    input.focus();
    showToast("error", "✕", requestError.message);

    if (requestError.message.includes("log in")) {
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    }
    return;
  }

  // Success Sequence Terminal Prints
  if (responseData.status === "cached") {
    appendTerminalLine(
      "Codebase cache hit! Vector spaces already loaded inside Qdrant database.",
      "done",
    );
    await delay(500);
  } else {
    appendTerminalLine(
      `Successfully tokenized codebase files. File count: ${responseData.file_count || "N/A"}.`,
      "done",
    );
    await delay(600);
    appendTerminalLine(
      "Generating embedding tokens via Gemini neural interface...",
      "info",
    );
    await delay(800);
    appendTerminalLine(
      `Embedded ${responseData.chunk_count || "N/A"} chunks. Initializing index trees...`,
      "done",
    );
    await delay(600);
  }

  appendTerminalLine(
    "Optimizing vector retrieval nodes in Qdrant store...",
    "info",
  );
  await delay(700);
  appendTerminalLine(
    "Workspace indices linked successfully! Connection channels open.",
    "done",
  );
  await delay(500);
  appendTerminalLine("Redirecting to RepoMind workspace session...", "info");

  const msg =
    responseData.status === "cached"
      ? "Already indexed — opening chat."
      : `Indexed ${responseData.file_count} files · ${responseData.chunk_count} chunks.`;
  showToast("success", "✓", msg);

  sessionStorage.setItem("repomind_url", url);
  setTimeout(() => {
    window.location.href = "chat.html";
  }, 1500);
}

function showToast(type, icon, text) {
  const toast = document.getElementById("toast");
  document.getElementById("toastIcon").textContent = icon;
  document.getElementById("toastText").textContent = text;
  toast.className = `toast ${type} show`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = `toast ${type}`;
  }, 4500);
}

document.getElementById("repoUrl").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleIngest();
});
