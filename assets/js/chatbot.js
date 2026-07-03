// ──────────────────────────────────────────────
// AI CHATBOT & SELECTION ASSISTANT
// ──────────────────────────────────────────────

let aiChatHistory = [];
let currentSelectionContext = "";

document.addEventListener("DOMContentLoaded", () => {
    initAIChatbot();
});

function initAIChatbot() {
    // Load saved key
    const savedKey = localStorage.getItem("ml_ai_api_key");
    const inputEl = document.getElementById("ai-api-key-input");
    if (savedKey && inputEl) {
        inputEl.value = savedKey;
        updateKeyStatus(true);
    }

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

function saveApiKey() {
    const inputEl = document.getElementById("ai-api-key-input");
    if (!inputEl) return;
    const key = inputEl.value.trim();
    if (key) {
        localStorage.setItem("ml_ai_api_key", key);
        updateKeyStatus(true);
        showToast("✅ API Key Saved Successfully!");
    } else {
        localStorage.removeItem("ml_ai_api_key");
        updateKeyStatus(false);
        showToast("⚠️ API Key Removed");
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
    const apiKey = localStorage.getItem("ml_ai_api_key") || (document.getElementById("ai-api-key-input") ? document.getElementById("ai-api-key-input").value.trim() : "");

    if (!apiKey) {
        appendChatMessage("assistant", "⚠️ **Missing API Key:** Please enter and save your Gemini or OpenAI API Key at the top of the dashboard before asking questions!");
        toggleAIChatDrawer(true);
        return;
    }

    if (inputEl && !customText) inputEl.value = "";

    // Append user message
    appendChatMessage("user", text);

    // Show loading bubble
    const loadingId = appendChatMessage("assistant", "⏳ *AI Tutor is thinking...*", true);

    try {
        let aiResponse = "";
        if (apiKey.startsWith("AIza")) {
            aiResponse = await callGeminiAPI(apiKey, text);
        } else {
            aiResponse = await callOpenAICompatibleAPI(apiKey, text);
        }

        updateChatMessage(loadingId, aiResponse);
    } catch (err) {
        updateChatMessage(loadingId, `❌ **Error connecting to AI Tutor:** ${err.message}`);
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

async function callOpenAICompatibleAPI(apiKey, prompt) {
    let endpoint = "https://api.openai.com/v1/chat/completions";
    let model = "gpt-4o-mini";

    if (apiKey.startsWith("gsk_")) {
        endpoint = "https://api.groq.com/openai/v1/chat/completions";
        model = "llama-3.3-70b-versatile";
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
        throw new Error(data.error.message || "OpenAI/Groq API Error");
    }
    return data.choices?.[0]?.message?.content || "No response received.";
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
