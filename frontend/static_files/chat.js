// --- OAuth Redirect token catch logic ---
const urlParams = new URLSearchParams(window.location.search);
const urlToken = urlParams.get("token");
if (urlToken) {
  localStorage.setItem("repomind_token", urlToken);
  window.history.replaceState({}, document.title, window.location.pathname);
}

const API_BASE = "http://localhost:8000";
let repoUrl = sessionStorage.getItem("repomind_url") || "";
let isStreaming = false;

// Session Chat History Array
let sessionQueries = [];
let activeQueryIndex = -1;

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Dom Ready check
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("repomind_token");
  const authBtn = document.getElementById("headerAuthBtn");
  if (token) {
    authBtn.textContent = "Sign Out";
    authBtn.href = "#";
    authBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("repomind_token");
      window.location.reload();
    });
  } else {
    authBtn.textContent = "Sign In";
    authBtn.href = "login.html";
  }

  checkSessionIngest();
});

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("repomind_token");
  const authBtn = document.getElementById("headerAuthBtn");
  if (token) {
    authBtn.textContent = "Sign Out";
    authBtn.href = "#";
    authBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("repomind_token");
      window.location.reload();
    });
  } else {
    authBtn.textContent = "Sign In";
    authBtn.href = "login.html";
  }

  checkSessionIngest();

  // ADD THIS LINE: Render the initial empty state (which contains your suggestions)
  renderQuestionList();
});

// --- Session initialization ---
function checkSessionIngest() {
  const queryRepo = urlParams.get("repo");
  if (queryRepo && queryRepo.startsWith("https://github.com/")) {
    repoUrl = queryRepo;
    sessionStorage.setItem("repomind_url", queryRepo);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (!repoUrl) {
    window.location.href = "index.html";
    return;
  }

  const parts = repoUrl.split("/");
  const owner = parts[parts.length - 2] || "owner";
  const repo = parts[parts.length - 1] || "repo";

  document.getElementById("sidebarRepoName").textContent = repo;
  document.getElementById("topbarSub").textContent = `${owner}/${repo}`;

  loadGithubMetadata(owner, repo);
  triggerCinematicIngest(repoUrl);
}

// --- Cosmic Constellation Galaxy Canvas Particles ---
const canvas = document.getElementById("galaxyCanvas");
const ctx = canvas.getContext("2d");

let particles = [];
const count = 75;
let mouse = { x: null, y: null };
let galaxyCenter = {
  x: window.innerWidth * 0.35,
  y: window.innerHeight * 0.5,
};

window.addEventListener("resize", resizeCanvas);
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  galaxyCenter = { x: canvas.width * 0.35, y: canvas.height * 0.5 };
}
resizeCanvas();

canvas.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener("mouseleave", () => {
  mouse.x = null;
  mouse.y = null;
});

class StarNode {
  constructor() {
    this.angle = Math.random() * Math.PI * 2;
    this.distance = Math.random() * (canvas.width * 0.28) + 40;
    this.radiusX = this.distance * (1.2 + Math.random() * 0.3);
    this.radiusY = this.distance * (0.6 + Math.random() * 0.2);
    this.speed = (Math.random() * 0.0004 + 0.0001) * (150 / this.distance);
    this.size = Math.random() * 1.8 + 0.5;
    this.pulse = Math.random() * Math.PI;
    this.pulseSpeed = Math.random() * 0.02 + 0.01;
    this.fileName = null;
    this.driftX = 0;
    this.driftY = 0;
  }
  update() {
    this.angle += this.speed;
    this.pulse += this.pulseSpeed;

    const baseX = galaxyCenter.x + Math.cos(this.angle) * this.radiusX;
    const baseY = galaxyCenter.y + Math.sin(this.angle) * this.radiusY;

    let targetDriftX = 0;
    let targetDriftY = 0;

    // Mouse attraction/drift calculation
    if (mouse.x !== null && mouse.y !== null) {
      let dx = mouse.x - baseX;
      let dy = mouse.y - baseY;
      let dist = Math.hypot(dx, dy);
      if (dist < 160) {
        const force = (160 - dist) / 160;
        targetDriftX = dx * force * 0.22;
        targetDriftY = dy * force * 0.22;
      }
    }

    // Smoothly interpolate drift towards target
    this.driftX += (targetDriftX - this.driftX) * 0.08;
    this.driftY += (targetDriftY - this.driftY) * 0.08;

    this.x = baseX + this.driftX;
    this.y = baseY + this.driftY;
  }
  draw() {
    ctx.beginPath();
    let alpha = 0.35 + Math.sin(this.pulse) * 0.2;

    if (this.fileName) {
      ctx.fillStyle = `rgba(217, 119, 6, ${alpha + 0.45})`;
      ctx.arc(this.x, this.y, this.size + 1.5, 0, Math.PI * 2);
      ctx.shadowColor = "var(--amber)";
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = `rgba(78, 93, 120, ${alpha})`;
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.shadowBlur = 0;
    }
    ctx.fill();
  }
}

function initConstellation() {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(new StarNode());
  }

  const files = [
    "main.py",
    "auth.py",
    "models.py",
    "README.md",
    "requirements.txt",
    "index.js",
    "package.json",
  ];
  files.forEach((f, idx) => {
    if (particles[idx]) {
      particles[idx].fileName = f;
      particles[idx].size = 3;
    }
  });
}
initConstellation();

function animateConstellation() {
  ctx.shadowBlur = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw connection lines
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();

    for (let j = i + 1; j < particles.length; j++) {
      let dx = particles[i].x - particles[j].x;
      let dy = particles[i].y - particles[j].y;
      let dist = Math.hypot(dx, dy);
      if (dist < 90) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(0, 180, 160, ${0.08 * (1 - dist / 90)})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(animateConstellation);
}
animateConstellation();

// Trigger node highlighting on files
function highlightConstellationNode(filename) {
  particles.forEach((node) => {
    if (node.fileName === filename) {
      node.pulseSpeed = 0.1;
      node.size = 5;
    }
  });
}

function resetConstellationNodes() {
  particles.forEach((node) => {
    if (node.fileName) {
      node.pulseSpeed = 0.02;
      node.size = 3;
    }
  });
}

// --- Ingestion Flow sequence logs ---
const logStages = [
  "stage_detect",
  "stage_clone",
  "stage_read",
  "stage_chunk",
  "stage_embed",
  "stage_ready",
];

function setScanStage(index, status) {
  const el = document.getElementById(logStages[index]);
  if (el) el.className = `stage-item ${status}`;
}

function logScanTelemetry(text) {
  const box = document.getElementById("scanTelemetry");
  box.innerHTML += `<br/>repomind@pipeline:~$ ${text}`;
  box.scrollTop = box.scrollHeight;
}

async function triggerCinematicIngest(url) {
  const overlay = document.getElementById("ingestOverlay");
  overlay.classList.add("visible");

  setScanStage(0, "active");
  logScanTelemetry("identify_repo: validating git signature");
  await delay(500);
  setScanStage(0, "done");

  setScanStage(1, "active");
  logScanTelemetry("clone_nodes: downloading index buffers");

  let isCompleted = false;
  let requestError = null;
  let data = null;

  const token = localStorage.getItem("repomind_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const ingestPromise = fetch(`${API_BASE}/ingest`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ repo_url: url }),
  }).then(async (res) => {
    const payload = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error(
          "Ingestion token missing. Authenticate to index new repositories.",
        );
      }
      throw new Error(payload.detail || "Cloning task failed.");
    }
    return payload;
  });

  (async () => {
    try {
      await delay(800);
      if (isCompleted) return;
      setScanStage(1, "done");
      setScanStage(2, "active");
      logScanTelemetry("metadata_parser: scanning README modules");

      await delay(1000);
      if (isCompleted) return;
      setScanStage(2, "done");
      setScanStage(3, "active");
      logScanTelemetry("chunk_system: generating code structure slices");
    } catch (e) {}
  })();

  try {
    data = await ingestPromise;
    isCompleted = true;
  } catch (err) {
    isCompleted = true;
    requestError = err;
  }

  if (requestError) {
    logScanTelemetry(`ABORT: pipeline terminated - ${requestError.message}`);
    await delay(1200);
    overlay.classList.remove("visible");
    showToast("error", requestError.message);

    if (requestError.message.includes("Authenticate")) {
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    }
    return;
  }

  setScanStage(1, "done");
  setScanStage(2, "done");
  setScanStage(3, "done");
  setScanStage(4, "active");
  logScanTelemetry(
    `vectorizer: generating embeddings for ${data.chunk_count || "N/A"} chunks`,
  );
  await delay(600);
  setScanStage(4, "done");

  setScanStage(5, "active");
  logScanTelemetry("qdrant_sync: optimizing vector map coordinates");
  await delay(500);
  setScanStage(5, "done");
  logScanTelemetry("workspace: network link stabilized");
  await delay(400);

  overlay.style.opacity = 0;
  setTimeout(() => {
    overlay.classList.remove("visible");
    overlay.style.opacity = 1;
  }, 500);

  updateLimitsUI();
}

async function loadGithubMetadata(owner, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (res.ok) {
      const meta = await res.json();
      document.getElementById("metaStars").textContent =
        `⭐ ${meta.stargazers_count.toLocaleString()}`;
      document.getElementById("sidebarLanguage").textContent =
        `Language: ${meta.language || "Multi-language"}`;
    }
  } catch (e) {}
}

// --- Limits and tokens widgets ---
async function updateLimitsUI() {
  const token = localStorage.getItem("repomind_token");
  const limitUserPlan = document.getElementById("limitUserPlan");
  const limitUsageFraction = document.getElementById("limitUsageFraction");
  const getMoreLimitsContainer = document.getElementById(
    "getMoreLimitsContainer",
  );

  const input = document.getElementById("questionInput");
  const submitBtn = document.getElementById("submitBtn");

  if (token) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        limitUserPlan.textContent = "Account Token";
        limitUsageFraction.textContent = `${user.chat_count} / ${user.chat_limit} used`;

        input.disabled = false;
        input.placeholder = "Search code module details…";
        submitBtn.textContent = "Analyze Module";
        getMoreLimitsContainer.style.display = "none";
        return;
      }
    } catch (e) {}
  }

  const today = new Date().toISOString().split("T")[0];
  let guestData = JSON.parse(
    localStorage.getItem("repomind_guest") || '{"date": "", "count": 0}',
  );
  if (guestData.date !== today) {
    guestData = { date: today, count: 0 };
  }

  const used = guestData.count;
  const left = Math.max(0, 5 - used);

  limitUserPlan.textContent = "Guest Token";
  limitUsageFraction.textContent = `${used} / 5 used`;
  getMoreLimitsContainer.style.display = "block";

  if (left <= 0) {
    input.disabled = true;
    input.placeholder = "Daily free query limits reached. Sign in to continue.";
    submitBtn.textContent = "Sign In to Continue";
    submitBtn.onclick = () => {
      window.location.href = "login.html";
    };
  } else {
    input.disabled = false;
    input.placeholder = "Search code module details…";
    submitBtn.textContent = "Analyze Module";
  }
}

// --- Spatial File Code Viewer Logic ---
const MOCK_CODES = {
  "main.py": `<span class="keyword">from</span> fastapi <span class="keyword">import</span> FastAPI, Depends, HTTPException
<span class="keyword">from</span> fastapi.middleware.cors <span class="keyword">import</span> CORSMiddleware
<span class="keyword">from</span> .auth <span class="keyword">import</span> get_current_user

app = <span class="function">FastAPI</span>(title=<span class="string">"RepoMind API"</span>, version=<span class="string">"1.0.0"</span>)

app.<span class="function">add_middleware</span>(
    CORSMiddleware,
    allow_origins=[<span class="string">"*"</span>],
    allow_credentials=<span class="keyword">True</span>,
    allow_methods=[<span class="string">"*"</span>],
    allow_headers=[<span class="string">"*"</span>],
)

<span class="keyword">@app.get</span>(<span class="string">"/"</span>)
<span class="keyword">def</span> <span class="function">read_root</span>():
    <span class="keyword">return</span> {<span class="string">"status"</span>: <span class="string">"online"</span>, <span class="string">"service"</span>: <span class="string">"repomind-core"</span>}

<span class="keyword">@app.post</span>(<span class="string">"/chat"</span>)
<span class="keyword">async def</span> <span class="function">chat_endpoint</span>(payload: dict, user = <span class="function">Depends</span>(get_current_user)):
    <span class="keyword">return</span> {<span class="string">"message"</span>: <span class="string">"Streaming connection established."</span>}`,

  "auth.py": `<span class="keyword">import</span> jwt
<span class="keyword">from</span> datetime <span class="keyword">import</span> datetime, timedelta
<span class="keyword">from</span> fastapi <span class="keyword">import</span> Security, HTTPException
<span class="keyword">from</span> fastapi.security <span class="keyword">import</span> HTTPBearer, HTTPAuthorizationCredentials

security = <span class="function">HTTPBearer</span>()
SECRET_KEY = <span class="string">"repomind_secret_vault_9012"</span>
ALGORITHM = <span class="string">"HS256"</span>

<span class="keyword">def</span> <span class="function">create_access_token</span>(data: dict):
    to_encode = data.<span class="function">copy</span>()
    expire = datetime.<span class="function">utcnow</span>() + <span class="function">timedelta</span>(days=<span class="number">7</span>)
    to_encode.<span class="function">update</span>({<span class="string">"exp"</span>: expire})
    <span class="keyword">return</span> jwt.<span class="function">encode</span>(to_encode, SECRET_KEY, algorithm=ALGORITHM)

<span class="keyword">def</span> <span class="function">get_current_user</span>(credentials: HTTPAuthorizationCredentials = <span class="function">Security</span>(security)):
    token = credentials.credentials
    <span class="keyword">try</span>:
        payload = jwt.<span class="function">decode</span>(token, SECRET_KEY, algorithms=[ALGORITHM])
        <span class="keyword">return</span> payload
    <span class="keyword">except</span> jwt.PyJWTError:
        <span class="keyword">raise</span> <span class="function">HTTPException</span>(status_code=<span class="number">401</span>, detail=<span class="string">"Session invalid"</span>)`,

  "models.py": `<span class="keyword">from</span> pydantic <span class="keyword">import</span> BaseModel, EmailStr, HttpUrl
<span class="keyword">from</span> typing <span class="keyword">import</span> Optional, List

<span class="keyword">class</span> <span class="function">UserRegister</span>(BaseModel):
    email: EmailStr
    password: str

<span class="keyword">class</span> <span class="function">UserLogin</span>(BaseModel):
    email: EmailStr
    password: str`,

  "README.md": `<span class="comment"># RepoMind — Codebase AI Workspace</span>

RepoMind is a dashboard that lets developers talk to their codebase.
By cloning, chunking, and indexing logic modules inside a semantic space,
you get fast architectural queries, trace charts, and instant context mapping.

<span class="keyword">## Core Architecture</span>
- <span class="string">Backend</span>: FastAPI / Uvicorn server
- <span class="string">Database</span>: Qdrant Vector database
- <span class="string">AI Engines</span>: Groq Llama-3 & Gemini 1.5 Pro`,

  "requirements.txt": `fastapi&gt;=0.100.0
uvicorn[standard]&gt;=0.22.0
pydantic[email]&gt;=2.0
pyjwt&gt;=2.7.0`,
};

function openFileViewer(filename) {
  const pane = document.getElementById("editorPane");
  const editorTitle = document.getElementById("editorFilename");
  const gutter = document.getElementById("editorGutter");
  const codeBlock = document.getElementById("editorCodeBlock");

  pane.classList.add("open");
  editorTitle.textContent = filename;

  document
    .querySelectorAll(".pill-cloud .cite-pill")
    .forEach((el) => el.classList.remove("active"));
  const pill = document.getElementById(`pill_${filename.replace(".", "_")}`);
  if (pill) pill.classList.add("active");

  highlightConstellationNode(filename);

  let content = MOCK_CODES[filename];
  if (!content) {
    content = `<span class="comment">// Mock code viewer for ${filename}</span>\n<span class="keyword">class</span> <span class="function">CodeContext</span>:\n    file = <span class="string">"${filename}"</span>\n    state = <span class="string">"indexed"</span>`;
  }
  codeBlock.innerHTML = content;

  const lines = content.split("\n").length;
  let gutterHtml = "";
  for (let i = 1; i <= lines; i++) {
    gutterHtml += `${i}<br/>`;
  }
  gutter.innerHTML = gutterHtml;
}

function closeEditor() {
  document.getElementById("editorPane").classList.remove("open");
  document
    .querySelectorAll(".pill-cloud .cite-pill")
    .forEach((el) => el.classList.remove("active"));
  resetConstellationNodes();
}

function askSuggestion(question) {
  if (isStreaming) return;
  const input = document.getElementById("questionInput");
  input.value = question;
  autoResize();
  handleChat();
}

// --- Master-Detail Question Rendering ---
function renderQuestionList() {
  const listContainer = document.getElementById("queryListContainer");
  if (sessionQueries.length === 0) {
    listContainer.innerHTML = `
          <div class="suggestions-box">
            <div class="suggestions-title">💡 Suggested Queries</div>
            <div class="suggestion-item" onclick="askSuggestion('Explain the overall architecture and folder structure.')">
              <span class="suggestion-bullet">⚡</span> Explain the overall architecture and folder structure.
            </div>
            <div class="suggestion-item" onclick="askSuggestion('Where is the main entry point and how is the app initialized?')">
              <span class="suggestion-bullet">⚡</span> Where is the main entry point and how is the app initialized?
            </div>
            <div class="suggestion-item" onclick="askSuggestion('What are the core dependencies and external integrations?')">
              <span class="suggestion-bullet">⚡</span> What are the core dependencies and external integrations?
            </div>
          </div>
        `;
    return;
  }

  listContainer.innerHTML = "";
  sessionQueries.forEach((q, idx) => {
    const item = document.createElement("div");
    const isDisabled = isStreaming && idx !== activeQueryIndex;
    item.className = `query-item ${idx === activeQueryIndex ? "active" : ""} ${isDisabled ? "disabled" : ""}`;
    item.onclick = () => {
      if (isStreaming) return;
      selectQuery(idx);
    };

    const timeStr = new Date().toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    item.innerHTML = `
          <div class="query-item-text">${escapeHtml(q.question)}</div>
          <div class="query-item-meta">
            <span>Query #${idx + 1}</span>
            <span>${timeStr}</span>
          </div>
        `;
    listContainer.appendChild(item);
  });
}

function selectQuery(index) {
  if (isStreaming) return;
  activeQueryIndex = index;
  renderQuestionList();
  closeEditor(); // Close editor when switching questions to show dossier

  const dossierPanel = document.getElementById("dossierPanel");
  dossierPanel.classList.remove("hidden");

  const q = sessionQueries[index];
  const preview = document.getElementById("dossierQuestionPreview");
  preview.textContent = q.question;
  preview.title = q.question;

  const body = document.getElementById("dossierBody");
  body.className = "dossier-body";
  body.innerHTML = marked.parse(
    q.response || "*Retrieving response details...*",
  );
  body.scrollTop = 0;

  // Render syntax highlights and copy buttons
  highlightAndAddCopyButtons();

  // Update pills
  renderCitations(q.files);
}

function clearSessionQueries() {
  if (isStreaming) return;
  sessionQueries = [];
  activeQueryIndex = -1;
  renderQuestionList();
  closeEditor();
  document.getElementById("dossierPanel").classList.add("hidden");
  showToast("success", "✓", "Session queries cleared.");
}

function renderCitations(files) {
  const cloud = document.getElementById("relevantFilesCloud");
  resetConstellationNodes();

  if (files && files.length > 0) {
    cloud.innerHTML = "";
    files.forEach((f) => {
      const pill = document.createElement("span");
      pill.className = "cite-pill";
      pill.id = `pill_${f.replace(".", "_")}`;
      pill.textContent = f;
      pill.onclick = () => openFileViewer(f);
      cloud.appendChild(pill);

      highlightConstellationNode(f);
    });
  } else {
    cloud.innerHTML = `<span style="font-size:11px; color:var(--muted); font-family:var(--mono);">No modules loaded in context.</span>`;
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function highlightAndAddCopyButtons() {
  const dossierBody = document.getElementById("dossierBody");
  if (!dossierBody) return;

  const preBlocks = dossierBody.querySelectorAll("pre");
  preBlocks.forEach((pre) => {
    if (pre.dataset.processed === "true") return;
    pre.dataset.processed = "true";
    pre.style.position = "relative";

    const code = pre.querySelector("code");
    if (!code) return;

    // Create copy button
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-code-btn";
    copyBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        `;
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        copyBtn.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Copied!
            `;
        copyBtn.classList.add("copied");
        setTimeout(() => {
          copyBtn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              `;
          copyBtn.classList.remove("copied");
        }, 2000);
      } catch (err) {
        console.error("Failed to copy code: ", err);
      }
    };
    pre.appendChild(copyBtn);

    // Simple client side regex highlighting for key patterns if it's code
    let raw = code.innerHTML;
    if (
      raw.includes("def ") ||
      raw.includes("import ") ||
      raw.includes("const ") ||
      raw.includes("function ") ||
      raw.includes("class ") ||
      raw.includes("return ") ||
      raw.includes("var ")
    ) {
      // comments
      raw = raw.replace(/(#.*|\/\/.*)/g, '<span class="comment">$1</span>');
      // keywords
      raw = raw.replace(
        /\b(def|class|import|from|return|const|let|var|function|async|await|if|else|for|while|try|except|catch|finally|import|from|as|in|is|not|and|or|true|false|None|null)\b/g,
        '<span class="keyword">$1</span>',
      );
      // strings
      raw = raw.replace(
        /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
        '<span class="string">$1</span>',
      );

      code.innerHTML = raw;
    }
  });
}

// --- Streaming dossier chat flow ---
async function handleChat() {
  const input = document.getElementById("questionInput");
  const question = input.value.trim();
  const submitBtn = document.getElementById("submitBtn");

  if (submitBtn.textContent.includes("Sign In")) {
    window.location.href = "login.html";
    return;
  }

  if (!question || isStreaming) return;

  const token = localStorage.getItem("repomind_token");

  // Guest counter check
  if (!token) {
    const today = new Date().toISOString().split("T")[0];
    let guestData = JSON.parse(
      localStorage.getItem("repomind_guest") || '{"date": "", "count": 0}',
    );
    if (guestData.date !== today) {
      guestData = { date: today, count: 0 };
    }
    if (guestData.count >= 5) {
      updateLimitsUI();
      return;
    }
    guestData.count += 1;
    localStorage.setItem("repomind_guest", JSON.stringify(guestData));
    updateLimitsUI();
  }

  input.value = "";
  autoResize();

  // Push to session questions history
  const newQuery = { question: question, response: "", files: [] };
  sessionQueries.push(newQuery);
  activeQueryIndex = sessionQueries.length - 1;

  // Update lists
  renderQuestionList();
  selectQuery(activeQueryIndex);

  // Force Left Body to Streaming State
  const body = document.getElementById("dossierBody");
  body.className = "dossier-body streaming-summary";

  submitBtn.disabled = true;
  submitBtn.textContent = "Analyzing Codebase...";
  isStreaming = true;

  let rawText = "";
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ repo_url: repoUrl, question }),
    });

    if (!res.ok) {
      const err = await res.json();
      body.className = "dossier-body";
      body.innerHTML = `<span style="color:var(--red)">Compilation Error: ${err.detail || "Context unavailable."}</span>`;
      sessionQueries[activeQueryIndex].response = body.innerHTML;
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      rawText += decoder.decode(value, { stream: true });
      body.innerHTML = marked.parse(rawText);
      highlightAndAddCopyButtons();
      body.scrollTop = body.scrollHeight;
    }

    sessionQueries[activeQueryIndex].response = rawText;
    parseDossierCitations(rawText);
  } catch (err) {
    body.className = "dossier-body";
    body.innerHTML = `<span style="color:var(--red)">Network failure: ${err.message}</span>`;
    sessionQueries[activeQueryIndex].response = body.innerHTML;
  } finally {
    body.classList.remove("streaming-summary");
    submitBtn.disabled = false;
    isStreaming = false;
    highlightAndAddCopyButtons();
    renderQuestionList();
    updateLimitsUI();
  }
}

function parseDossierCitations(text) {
  const fileRegex =
    /\b([a-zA-Z0-9_\-\.]+\.(?:py|js|ts|jsx|tsx|java|cpp|h|md))\b/g;
  const matches = text.match(fileRegex) || [];
  const uniqueFiles = [...new Set(matches)].filter(
    (f) => f.includes(".") && !/^\d+\.\d+$/.test(f),
  );

  sessionQueries[activeQueryIndex].files = uniqueFiles;
  renderCitations(uniqueFiles);
}

function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleChat();
  }
}

function autoResize() {
  const t = document.getElementById("questionInput");
  t.style.height = "auto";
  t.style.height = Math.min(t.scrollHeight, 80) + "px";
}

document.getElementById("questionInput").addEventListener("input", autoResize);

// --- Toast notifier ---
let toastTimer = null;
function showToast(type, text) {
  const toast = document.getElementById("toast");
  toast.querySelector("#toastText").textContent = text;
  toast.className = `toast ${type} show`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = `toast ${type}`;
  }, 4500);
}
