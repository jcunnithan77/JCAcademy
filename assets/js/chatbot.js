// ──────────────────────────────────────────────
// AI CHATBOT & SELECTION ASSISTANT
// ──────────────────────────────────────────────

let aiChatHistory = [];
let currentSelectionContext = "";

document.addEventListener("DOMContentLoaded", () => {
    initAIChatbot();
});

function initAIChatbot() {
    // Load saved provider
    const savedProvider = localStorage.getItem("ml_ai_provider") || "openai";
    const providerEl = document.getElementById("ai-provider-select");
    if (providerEl) {
        providerEl.value = savedProvider;
    }

    // Load saved key for provider
    onProviderChange(false);

    // Listen for selection inside content workspace
    const contentBox = document.getElementById("content-container");
    const popover = document.getElementById("ai-selection-popover");

    if (contentBox && popover) {
        document.addEventListener("selectionchange", () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text.length > 3 && contentBox.contains(selection.anchorNode)) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                popover.style.display = "flex";
                popover.style.top = `${rect.top + window.scrollY - 45}px`;
                popover.style.left = `${Math.max(10, rect.left + rect.width / 2 - 80)}px`;
                currentSelectionContext = text;
            } else {
                // Delay hiding slightly when clicking inside popover
                setTimeout(() => {
                    if (!popover.matches(":hover")) {
                        popover.style.display = "none";
                    }
                }, 150);
            }
        });
    }
}

function onProviderChange(showToastMsg = true) {
    const providerEl = document.getElementById("ai-provider-select");
    if (!providerEl) return;
    const provider = providerEl.value;
    localStorage.setItem("ml_ai_provider", provider);
    
    const inputEl = document.getElementById("ai-api-key-input");
    if (inputEl) {
        if (provider === "ollama") {
            inputEl.placeholder = "No Key needed for Ollama";
            inputEl.disabled = true;
            inputEl.style.opacity = "0.5";
            inputEl.value = "";
            updateKeyStatus(true);
        } else if (provider === "gemini") {
            inputEl.placeholder = "AIza...";
            inputEl.disabled = false;
            inputEl.style.opacity = "1";
        } else if (provider === "groq") {
            inputEl.placeholder = "gsk_...";
            inputEl.disabled = false;
            inputEl.style.opacity = "1";
        } else if (provider === "anthropic") {
            inputEl.placeholder = "sk-ant-...";
            inputEl.disabled = false;
            inputEl.style.opacity = "1";
        } else if (provider === "deepseek") {
            inputEl.placeholder = "sk-... (DeepSeek)";
            inputEl.disabled = false;
            inputEl.style.opacity = "1";
        } else {
            inputEl.placeholder = "sk-... (OpenAI)";
            inputEl.disabled = false;
            inputEl.style.opacity = "1";
        }
        
        if (provider !== "ollama") {
            const providerKey = localStorage.getItem(`ml_ai_api_key_${provider}`) || localStorage.getItem("ml_ai_api_key") || "";
            inputEl.value = providerKey;
            updateKeyStatus(!!providerKey);
        }
    }
    if (showToastMsg) {
        showToast(`🤖 Switched to ${provider.toUpperCase()} provider`);
    }
}

function saveApiKey() {
    const inputEl = document.getElementById("ai-api-key-input");
    const providerEl = document.getElementById("ai-provider-select");
    const provider = providerEl ? providerEl.value : "openai";
    
    if (provider === "ollama") {
        showToast("✅ Ollama runs locally without an API Key!");
        return;
    }
    
    if (!inputEl) return;
    const key = inputEl.value.trim();
    if (key) {
        localStorage.setItem(`ml_ai_api_key_${provider}`, key);
        localStorage.setItem("ml_ai_api_key", key); // fallback for legacy
        updateKeyStatus(true);
        showToast(`✅ ${provider.toUpperCase()} API Key Saved!`);
    } else {
        localStorage.removeItem(`ml_ai_api_key_${provider}`);
        updateKeyStatus(false);
        showToast(`⚠️ ${provider.toUpperCase()} API Key Removed`);
    }
}

function updateKeyStatus(hasKey) {
    const inputEl = document.getElementById("ai-api-key-input");
    if (inputEl) {
        inputEl.style.borderColor = hasKey ? "#10b981" : "rgba(255,255,255,0.1)";
    }
}

function showToast(msg) {
    let toast = document.getElementById("ai-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "ai-toast";
        toast.className = "ai-toast";
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

function toggleAIChatDrawer(forceOpen = null) {
    const drawer = document.getElementById("ai-chat-drawer");
    if (!drawer) return;

    const isOpen = drawer.classList.contains("open");
    let shouldOpen = false;
    if (forceOpen === true || (!isOpen && forceOpen === null)) {
        shouldOpen = true;
    }

    if (shouldOpen) {
        drawer.classList.add("open");
        document.body.classList.add("ai-drawer-open");
    } else {
        drawer.classList.remove("open");
        document.body.classList.remove("ai-drawer-open");
    }
}

function askAIAboutSelection() {
    const popover = document.getElementById("ai-selection-popover");
    if (popover) popover.style.display = "none";

    if (!currentSelectionContext) return;

    toggleAIChatDrawer(true);

    // Set context preview in drawer
    const ctxBox = document.getElementById("ai-context-preview");
    const ctxText = document.getElementById("ai-context-text");
    if (ctxBox && ctxText) {
        ctxBox.style.display = "block";
        ctxText.innerText = currentSelectionContext.length > 120 ? currentSelectionContext.substring(0, 120) + "..." : currentSelectionContext;
    }

    // Automatically trigger explanation
    sendAIMessage(`Please explain this concept from the ML course in detail:\n\n"${currentSelectionContext}"`);
}

function clearSelectionContext() {
    currentSelectionContext = "";
    const ctxBox = document.getElementById("ai-context-preview");
    if (ctxBox) ctxBox.style.display = "none";
}

function sendQuickPrompt(type) {
    let prompt = "";
    const ctx = currentSelectionContext || getActiveSectionTitle();

    switch (type) {
        case "explain":
            prompt = `Explain the concept of "${ctx}" in simple, intuitive terms suitable for an ML engineering student.`;
            break;
        case "code":
            prompt = `Provide a clean, production-ready Python/ML code snippet demonstrating "${ctx}" with detailed comments.`;
            break;
        case "interview":
            prompt = `Give me 3 top technical interview questions and comprehensive answers regarding "${ctx}".`;
            break;
        case "debug":
            prompt = `What are common bugs, edge cases, and performance gotchas when implementing "${ctx}" in production?`;
            break;
    }
    sendAIMessage(prompt);
}

function getActiveSectionTitle() {
    const titleEl = document.getElementById("header-section-title");
    return titleEl ? titleEl.innerText : "Machine Learning Fundamentals";
}

let lastUserPrompt = "";

async function sendAIMessage(customText = null) {
    const inputEl = document.getElementById("ai-chat-input");
    const text = customText || (inputEl ? inputEl.value.trim() : "");
    if (!text) return;

    lastUserPrompt = text;
    const providerEl = document.getElementById("ai-provider-select");
    const provider = providerEl ? providerEl.value : (localStorage.getItem("ml_ai_provider") || "openai");
    
    const apiKey = localStorage.getItem(`ml_ai_api_key_${provider}`) || localStorage.getItem("ml_ai_api_key") || (document.getElementById("ai-api-key-input") ? document.getElementById("ai-api-key-input").value.trim() : "");

    if (!apiKey && provider !== "ollama") {
        appendChatMessage("assistant", `⚠️ **Missing API Key:** Please enter and save your API Key for **${provider.toUpperCase()}** at the top of the dashboard before asking questions!`);
        toggleAIChatDrawer(true);
        return;
    }

    if (inputEl && !customText) inputEl.value = "";

    // Append user message
    appendChatMessage("user", text);

    // Show loading bubble
    const loadingId = appendChatMessage("assistant", `⏳ *AI Tutor (${provider.toUpperCase()}) is thinking...*`, true);

    try {
        let aiResponse = "";
        if (provider === "gemini" || (provider === "openai" && apiKey.startsWith("AIza"))) {
            aiResponse = await callGeminiAPI(apiKey, text);
        } else if (provider === "groq" || (provider === "openai" && apiKey.startsWith("gsk_"))) {
            aiResponse = await callOpenAICompatibleAPI(apiKey, text, "https://api.groq.com/openai/v1/chat/completions", "llama-3.3-70b-versatile", "Groq");
        } else if (provider === "deepseek") {
            aiResponse = await callOpenAICompatibleAPI(apiKey, text, "https://api.deepseek.com/chat/completions", "deepseek-chat", "DeepSeek");
        } else if (provider === "anthropic") {
            aiResponse = await callAnthropicAPI(apiKey, text);
        } else if (provider === "ollama") {
            aiResponse = await callOllamaAPI(text);
        } else {
            // Default: OpenAI
            aiResponse = await callOpenAICompatibleAPI(apiKey, text, "https://api.openai.com/v1/chat/completions", "gpt-4o-mini", "OpenAI");
        }

        updateChatMessage(loadingId, aiResponse);
    } catch (err) {
        updateChatMessage(loadingId, `❌ **Error connecting to ${provider.toUpperCase()}:** ${err.message}`);
    }
}

async function callGeminiAPI(apiKey, prompt) {
    const fullPrompt = `You are a world-class AI Mentor & Lead Technical Instructor coaching a student studying: "${getActiveSectionTitle()}".
${currentSelectionContext ? `\n--- ENCLOSED STUDENT SELECTION ---\n"${currentSelectionContext}"\n----------------------------------\n` : ""}

Student Query: "${prompt}"

Your guidance guidelines:
1. Provide a rigorous, intuitive explanation tailored to the active curriculum context.
2. Provide clean, well-commented code snippets or structural formulas if applicable.
3. Conclude with a clear, actionable summary insight.`;

    const candidateModels = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-pro"
    ];

    let lastError = null;

    for (const model of candidateModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: fullPrompt }]
                    }]
                })
            });
            const data = await response.json();
            if (!data.error) {
                return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text received.";
            }
            lastError = data.error.message;
        } catch (e) {
            lastError = e.message;
        }
    }

    try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listRes.json();
        if (listData.models && listData.models.length > 0) {
            const validModel = listData.models.find(m => 
                m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent") && m.name.includes("gemini")
            ) || listData.models.find(m => 
                m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
            );

            if (validModel) {
                const cleanModelName = validModel.name.replace("models/", "");
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`;
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: fullPrompt }]
                        }]
                    })
                });
                const data = await response.json();
                if (!data.error) {
                    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text received.";
                }
                lastError = data.error.message;
            }
        }
    } catch (e) {
        lastError = e.message || lastError;
    }

    throw new Error(lastError || "Could not find a supported Gemini model for generateContent with this API key.");
}

async function callOpenAICompatibleAPI(apiKey, prompt, endpoint = "https://api.openai.com/v1/chat/completions", model = "gpt-4o-mini", providerName = "OpenAI") {
    if (apiKey.startsWith("gsk_") && endpoint.includes("openai.com")) {
        endpoint = "https://api.groq.com/openai/v1/chat/completions";
        model = "llama-3.3-70b-versatile";
        providerName = "Groq";
    }

    const messages = [
        {
            role: "system",
            content: `You are a world-class AI Mentor teaching the course module: ${getActiveSectionTitle()}. Provide rigorous, clean Markdown explanations.`
        },
        {
            role: "user",
            content: currentSelectionContext ? `Enclosed Selected Content: "${currentSelectionContext}"\n\nQuestion: ${prompt}` : prompt
        }
    ];

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.7
        })
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message || `${providerName} API Error`);
    }
    return data.choices?.[0]?.message?.content || "No response received.";
}

async function callAnthropicAPI(apiKey, prompt) {
    const systemPrompt = `You are a world-class AI Mentor teaching the course module: ${getActiveSectionTitle()}. Provide rigorous, clean Markdown explanations.`;
    const userContent = currentSelectionContext ? `Enclosed Selected Content: "${currentSelectionContext}"\n\nQuestion: ${prompt}` : prompt;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 2048,
            system: systemPrompt,
            messages: [
                { role: "user", content: userContent }
            ],
            temperature: 0.7
        })
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message || "Anthropic API Error");
    }
    return data.content?.[0]?.text || "No response received from Anthropic.";
}

async function callOllamaAPI(prompt) {
    const systemPrompt = `You are a world-class AI Mentor teaching the course module: ${getActiveSectionTitle()}. Provide rigorous, clean Markdown explanations.`;
    const userContent = currentSelectionContext ? `Enclosed Selected Content: "${currentSelectionContext}"\n\nQuestion: ${prompt}` : prompt;

    try {
        const response = await fetch("http://localhost:11434/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent }
                ],
                temperature: 0.7
            })
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message || "Ollama API Error");
        }
        return data.choices?.[0]?.message?.content || "No response received from local Ollama.";
    } catch (e) {
        throw new Error("Could not connect to local Ollama on http://localhost:11434. Make sure Ollama is running locally and has CORS enabled (set environment variable OLLAMA_ORIGINS=*).");
    }
}

function appendChatMessage(role, text, isTemporary = false) {
    const historyBox = document.getElementById("ai-chat-messages");
    if (!historyBox) return null;

    const msgId = "msg-" + Math.random().toString(36).substring(2, 9);
    const msgDiv = document.createElement("div");
    msgDiv.id = msgId;
    msgDiv.className = `ai-msg ${role}`;

    msgDiv.innerHTML = formatMarkdown(text);
    historyBox.appendChild(msgDiv);
    historyBox.scrollTop = historyBox.scrollHeight;

    return msgId;
}

function updateChatMessage(msgId, newText) {
    const msgDiv = document.getElementById(msgId);
    if (msgDiv) {
        msgDiv.innerHTML = formatMarkdown(newText);
        
        if (!newText.startsWith("❌")) {
            const btnBox = document.createElement("div");
            btnBox.style.marginTop = "14px";
            btnBox.style.paddingTop = "10px";
            btnBox.style.borderTop = "1px dashed rgba(255,255,255,0.15)";
            
            const saveBtn = document.createElement("button");
            saveBtn.className = "ai-save-note-btn";
            saveBtn.style.background = "rgba(16, 185, 129, 0.2)";
            saveBtn.style.color = "#34d399";
            saveBtn.style.border = "1px solid rgba(16, 185, 129, 0.4)";
            saveBtn.style.padding = "6px 14px";
            saveBtn.style.borderRadius = "6px";
            saveBtn.style.cursor = "pointer";
            saveBtn.style.fontSize = "0.82rem";
            saveBtn.style.fontWeight = "600";
            saveBtn.innerHTML = "➕ Add to Section Study Notes";
            saveBtn.onclick = () => saveAINoteToSection(lastUserPrompt || "AI Tutor Explanation", newText, saveBtn);
            
            btnBox.appendChild(saveBtn);
            msgDiv.appendChild(btnBox);
        }

        const historyBox = document.getElementById("ai-chat-messages");
        if (historyBox) historyBox.scrollTop = historyBox.scrollHeight;
    }
}

async function saveAINoteToSection(title, content, btnElement) {
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = "⏳ Saving to JSON...";
    }
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const targetFile = urlParams.get('file') || urlParams.get('course') || urlParams.get('json');
        
        const res = await fetch("/api/save_ai_note", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                file: targetFile,
                section_id: typeof activeSectionId !== "undefined" ? activeSectionId : null,
                title: title.length > 60 ? title.substring(0, 60) + "..." : title,
                content: content
            })
        });
        
        if (res.ok) {
            const data = await res.json();
            if (btnElement) {
                btnElement.innerHTML = "✅ Saved to JSON!";
                btnElement.style.background = "rgba(16, 185, 129, 0.4)";
            }
            showToast("✅ AI Note Saved to Section JSON!");
            
            if (typeof window.courseData !== "undefined" && typeof activeSectionId !== "undefined") {
                const sec = window.courseData.find(c => c.id === activeSectionId);
                if (sec) {
                    sec.ai_notes = data.notes;
                    if (typeof setSectionActive === "function") {
                        setSectionActive(activeSectionId);
                    }
                }
            }
        } else {
            throw new Error("Server returned status " + res.status);
        }
    } catch (e) {
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = "❌ Save Failed - Retry";
        }
        showToast("❌ Could not save note: " + e.message);
    }
}

function formatMarkdown(text) {
    if (!text) return "";
    // Simple formatting for bold, code blocks, bullet points, and newlines
    let html = text
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    return html;
}

function clearAIChatHistory() {
    const historyBox = document.getElementById("ai-chat-messages");
    if (historyBox) {
        historyBox.innerHTML = `
            <div class="ai-welcome">
                <span class="ai-welcome-icon">⚡</span>
                <h4>ML Bootcamp AI Tutor Ready</h4>
                <p>Highlight any text in the tutorial or ask questions directly below for instant deep-dives, code snippets, and explanations!</p>
            </div>
        `;
    }
}

// ──────────────────────────────────────────────
// SIDEBAR SHRINK / EXPAND
// ──────────────────────────────────────────────
function toggleSidebar() {
    const sidebar = document.getElementById("main-sidebar");
    const btn = document.getElementById("sidebar-toggle-btn");
    if (!sidebar) return;
    const collapsed = sidebar.classList.toggle("collapsed");
    if (btn) btn.title = collapsed ? "Expand sidebar" : "Shrink sidebar";
    localStorage.setItem("ml_sidebar_collapsed", collapsed ? "1" : "0");
}

// Restore sidebar state on load
(function restoreSidebarState() {
    if (localStorage.getItem("ml_sidebar_collapsed") === "1") {
        const sidebar = document.getElementById("main-sidebar");
        if (sidebar) sidebar.classList.add("collapsed");
    }
})();

// ──────────────────────────────────────────────
// AI DRAWER: EXPAND / SHRINK TOGGLE
// ──────────────────────────────────────────────
const AI_DRAWER_DEFAULT_WIDTH = 440;
const AI_DRAWER_EXPANDED_WIDTH = Math.min(820, Math.round(window.innerWidth * 0.55));

let _aiDrawerExpanded = false;

function expandAIDrawer() {
    const drawer = document.getElementById("ai-chat-drawer");
    const btn = document.querySelector(".ai-expand-btn");
    if (!drawer) return;

    _aiDrawerExpanded = !_aiDrawerExpanded;
    const newWidth = _aiDrawerExpanded ? AI_DRAWER_EXPANDED_WIDTH : AI_DRAWER_DEFAULT_WIDTH;

    _setAIDrawerWidth(newWidth);
    if (btn) btn.textContent = _aiDrawerExpanded ? "⤡" : "⤢";
    if (btn) btn.title = _aiDrawerExpanded ? "Shrink panel" : "Expand panel";
}

function _setAIDrawerWidth(px) {
    document.documentElement.style.setProperty("--ai-drawer-width", px + "px");
    document.documentElement.style.setProperty("--ai-drawer-open-width", px + "px");
    // Also save for restore
    localStorage.setItem("ml_ai_drawer_width", px);
}

// Restore AI drawer width on load
(function restoreAIDrawerWidth() {
    const saved = parseInt(localStorage.getItem("ml_ai_drawer_width"), 10);
    if (saved && saved >= 320 && saved <= window.innerWidth * 0.9) {
        _setAIDrawerWidth(saved);
    }
})();

// ──────────────────────────────────────────────
// AI DRAWER: DRAG-TO-RESIZE (left edge handle)
// ──────────────────────────────────────────────
(function initAIDrawerResize() {
    const handle = document.getElementById("ai-drawer-resize-handle");
    const drawer = document.getElementById("ai-chat-drawer");
    if (!handle || !drawer) return;

    let startX = 0;
    let startWidth = 0;
    let isDragging = false;

    handle.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX;
        startWidth = drawer.offsetWidth;
        handle.classList.add("dragging");

        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";

        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        // Dragging left = wider, dragging right = narrower
        const delta = startX - e.clientX;
        const newWidth = Math.max(320, Math.min(Math.round(window.innerWidth * 0.85), startWidth + delta));
        _setAIDrawerWidth(newWidth);
    });

    document.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        handle.classList.remove("dragging");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    });
})();
