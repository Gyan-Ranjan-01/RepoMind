// Auth Header Pill Loading and Typewriter Animation
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("repomind_token");
  const authNav = document.getElementById("authNav");

  if (token) {
    authNav.innerHTML = `
        <a href="analyze.html" class="npill">Ingestion Hub</a>
        <a href="chat.html" class="npill" style="border-color: var(--amber); color: var(--amber);">Active Workspace</a>
        <a href="#" onclick="logout()" style="color: var(--red); border-color: rgba(220,38,38,0.2);" class="npill">Sign out</a>
      `;
  } else {
    authNav.innerHTML = `
        <a href="login.html" class="npill">Sign In</a>
        <a href="signup.html" style="background: var(--amber); color: #fff; border-color: var(--amber);" class="npill">Sign Up</a>
      `;
  }

  // --- Terminal Typewriter Logic ---
  const termBody = document.getElementById("heroTerminalBody");
  if (termBody) {
    const lines = [
      '<span class="code-comment"># repomind-core engine initialized</span>',
      "<br/>",
      '<span class="code-keyword">import</span> repomind <span class="code-keyword">as</span> rm',
      "<br/>",
      'workspace = rm.<span class="code-func">index</span>(<span class="code-string">"github.com/user/fastapi-app"</span>)',
      'query = <span class="code-string">"Where is the JWT token verified?"</span>',
      "<br/>",
      '<span class="code-func">print</span>(workspace.<span class="code-func">ask</span>(query))',
      '<span style="color: var(--amber); opacity: 0.9;">>> Analyzing 142 files...</span>',
      '<span style="color: var(--green); font-weight: 600;">>> Found in app/api/auth.py (Lines 45-62)</span>',
    ];

    let lineIdx = 0;
    termBody.innerHTML = '<span class="typing-cursor"></span>';
    const cursor = termBody.querySelector(".typing-cursor");

    function typeHtml(element, htmlString, speed, callback) {
      let tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlString;
      let nodes = Array.from(tempDiv.childNodes);
      let nodeIndex = 0;

      function processNextNode() {
        if (nodeIndex >= nodes.length) {
          if (callback) callback();
          return;
        }
        let node = nodes[nodeIndex];
        if (node.nodeType === Node.TEXT_NODE) {
          let text = node.textContent;
          let charIndex = 0;
          let textNode = document.createTextNode("");
          element.appendChild(textNode);

          function typeChar() {
            if (charIndex < text.length) {
              textNode.textContent += text[charIndex++];
              setTimeout(typeChar, speed);
            } else {
              nodeIndex++;
              processNextNode();
            }
          }
          typeChar();
        } else {
          let cloned = node.cloneNode(false);
          element.appendChild(cloned);
          typeHtml(cloned, node.innerHTML, speed, () => {
            nodeIndex++;
            processNextNode();
          });
        }
      }
      processNextNode();
    }

    function typeNextLine() {
      if (lineIdx < lines.length) {
        const lineStr = lines[lineIdx];
        const div = document.createElement("div");

        if (lineStr === "<br/>") {
          div.style.height = "0.8em";
          termBody.insertBefore(div, cursor);
          lineIdx++;
          setTimeout(typeNextLine, 150);
        } else {
          termBody.insertBefore(div, cursor);
          let speed = 25;
          if (lineIdx >= 8) speed = 10; // Faster outputs for status prints

          typeHtml(div, lineStr, speed, () => {
            lineIdx++;
            let delay = 350;
            if (lineIdx === 8) delay = 1000; // Analyzing delay
            if (lineIdx === 9) delay = 1200; // Result search delay
            setTimeout(typeNextLine, delay);
          });
        }
      }
    }
    setTimeout(typeNextLine, 800);
  }
});

function logout() {
  localStorage.removeItem("repomind_token");
  window.location.reload();
}
