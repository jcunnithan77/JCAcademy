// ──────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────
let courseData = typeof window.courseData !== 'undefined' ? window.courseData : [];
let activeSectionId = null;
let progressState = {};

function loadProgress() {
    const saved = localStorage.getItem("mlBootcampProgress");
    if (saved) {
        progressState = JSON.parse(saved);
    } else {
        courseData.forEach(item => { progressState[item.id] = false; });
    }
    updateProgressBar();
}

function saveProgress() {
    localStorage.setItem("mlBootcampProgress", JSON.stringify(progressState));
    updateProgressBar();
}

function updateProgressBar() {
    const keys = Object.keys(progressState);
    if (keys.length === 0) return;
    
    const done = keys.filter(k => progressState[k]).length;
    const pct = Math.round((done / keys.length) * 100);
    
    document.getElementById("progress-percent").innerText = `${pct}%`;
    document.getElementById("progress-fill").style.width = `${pct}%`;
}

function toggleProgressOfActive() {
    progressState[activeSectionId] = !progressState[activeSectionId];
    saveProgress();
    renderMenu();
}

function toggleProgressId(id, event) {
    event.stopPropagation();
    progressState[id] = event.target.checked;
    saveProgress();
}

function filterMenu() {
    const q = document.getElementById("search-bar").value.toLowerCase();
    document.querySelectorAll(".menu-item").forEach(item => {
        item.style.display = item.innerText.toLowerCase().includes(q) ? "flex" : "none";
    });
}

function getFileIcon(type) {
    switch(type) {
        case 'ipynb': return '📓';
        case 'pdf': return '📄';
        case 'vtt': return '💬';
        case 'zip': return '🗜️';
        case 'csv': return '📊';
        default: return '📁';
    }
}

function renderFiles(files) {
    if (!files || files.length === 0) return '';
    let html = '<div class="files-container">';
    files.forEach(f => {
        html += `
            <a href="${f.path}" target="_blank" class="file-link type-${f.type}">
                <span>${getFileIcon(f.type)}</span>
                ${f.name}
            </a>
        `;
    });
    html += '</div>';
    return html;
}

function setSectionActive(id) {
    activeSectionId = id;
    
    // Update sidebar UI
    document.querySelectorAll(".menu-item").forEach(el => {
        el.classList.toggle("active", el.getAttribute("data-id") === id);
    });
    
    const data = courseData.find(d => d.id === id);
    if (!data) return;
    
    // Update header
    document.getElementById("header-section-title").innerText = `${data.num}: ${data.title}`;
    
    // Update content area
    const ws = document.getElementById("content-container");
    const fileCount = data.files ? data.files.length : 0;
    
    ws.innerHTML = `
        <div class="section-container active">
            <div class="section-hero">
                <span class="badge">${data.num}</span>
                <h1>${data.title}</h1>
                <p>${data.overview}</p>
                <div class="hero-actions" style="margin-top:24px;">
                    <button class="resources-toggle-btn" onclick="openResourcesModal('${data.id}')">
                        <span>📦</span> Open Session Resources (${fileCount} files)
                    </button>
                </div>
            </div>
            ${data.content || data.details || ''}
            ${renderSavedAINotes(data.ai_notes)}
        </div>
    `;
    ws.scrollTop = 0;
}

function toggleNoteExpand(noteId, btn) {
    const noteEl = document.getElementById(noteId);
    if (!noteEl) return;
    if (noteEl.style.display === "none" || !noteEl.style.display) {
        noteEl.style.display = "block";
        if (btn) btn.innerHTML = "🔼 Collapse";
    } else {
        noteEl.style.display = "none";
        if (btn) btn.innerHTML = "🔽 Expand";
    }
}

function renderSavedAINotes(notes) {
    if (!notes || notes.length === 0) return '';
    let html = `
        <div class="saved-ai-notes-section" style="margin-top: 40px; padding-top: 24px; border-top: 2px dashed rgba(16, 185, 129, 0.3);">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:18px;">
                <span style="font-size:1.5rem; background:rgba(16,185,129,0.15); padding:8px; border-radius:10px; border:1px solid rgba(16,185,129,0.3);">🤖</span>
                <div>
                    <h3 style="font-family:'Outfit',sans-serif; font-size:1.3rem; color:#34d399; margin:0;">Saved Vajre Insights & Study Notes</h3>
                    <span style="font-size:0.85rem; color:#94a3b8;">Insights copied and saved directly into this section's JSON</span>
                </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:16px;">
    `;
    notes.forEach((note, idx) => {
        const noteId = `ai-saved-note-${idx}`;
        const formatted = typeof formatMarkdown === "function" ? formatMarkdown(note.content) : note.content.replace(/\n/g, '<br>');
        const noteTitle = note.title || 'Vajre Insight';
        const safeTitle = noteTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        html += `
            <div class="ai-note-tile card" style="background:rgba(15,23,42,0.85); border:1px solid rgba(16,185,129,0.35); border-radius:14px; padding:20px; box-shadow:0 8px 24px rgba(0,0,0,0.3);">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size:1.3rem;">💡</span>
                        <div>
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <h4 style="color:#f8fafc; font-size:1.05rem; font-weight:600; margin:0;">${noteTitle}</h4>
                                <button onclick="renameSavedAINote(${idx}, '${safeTitle}')" title="Rename Note Title" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); padding:3px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; transition:all 0.2s; display:flex; align-items:center; gap:4px;">
                                    ✏️ Rename
                                </button>
                                <button onclick="toggleEditSavedAINote(${idx})" title="Edit & Update Note Content" style="background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.3); padding:3px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; transition:all 0.2s; display:flex; align-items:center; gap:4px;">
                                    📝 Edit / Update
                                </button>
                                <button onclick="deleteSavedAINote(${idx})" title="Delete Saved Note" style="background:rgba(248,113,113,0.15); color:#f87171; border:1px solid rgba(248,113,113,0.3); padding:3px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; transition:all 0.2s; display:flex; align-items:center; gap:4px;">
                                    🗑️ Delete
                                </button>
                            </div>
                            <span style="font-size:0.75rem; color:#34d399; background:rgba(16,185,129,0.15); padding:3px 8px; border-radius:12px; border:1px solid rgba(16,185,129,0.3); display:inline-block; margin-top:6px;">Copied to JSON</span>
                        </div>
                    </div>
                    <button onclick="toggleNoteExpand('${noteId}', this)" style="background:rgba(16,185,129,0.2); color:#34d399; border:1px solid rgba(16,185,129,0.4); padding:8px 16px; border-radius:8px; cursor:pointer; font-size:0.85rem; font-weight:600; transition:all 0.2s;">
                        🔽 Expand
                    </button>
                </div>
                <div id="${noteId}" class="note-expand-body" style="display:none; margin-top:16px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.1); color:#e2e8f0; font-size:0.95rem; line-height:1.6;">
                    ${formatted}
                </div>
                <div id="ai-saved-note-edit-${idx}" class="note-edit-body" style="display:none; margin-top:16px; padding:16px; background:rgba(15,23,42,0.95); border:1px solid #38bdf8; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.4);">
                    <label style="display:block; font-size:0.8rem; color:#94a3b8; margin-bottom:4px; font-weight:600;">Note Title:</label>
                    <input type="text" id="ai-note-edit-title-${idx}" value="${safeTitle}" style="width:100%; background:#1e293b; color:#f8fafc; border:1px solid rgba(255,255,255,0.2); padding:8px 12px; border-radius:6px; font-size:0.95rem; font-family:'Inter',sans-serif; margin-bottom:12px; outline:none; box-sizing:border-box;">
                    <label style="display:block; font-size:0.8rem; color:#94a3b8; margin-bottom:4px; font-weight:600;">Note Content (Markdown / Text):</label>
                    <textarea id="ai-note-edit-content-${idx}" rows="8" style="width:100%; background:#1e293b; color:#e2e8f0; border:1px solid rgba(255,255,255,0.2); padding:10px 12px; border-radius:6px; font-size:0.9rem; font-family:'JetBrains Mono',monospace; line-height:1.5; outline:none; box-sizing:border-box; resize:vertical;">${note.content || ''}</textarea>
                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px;">
                        <button onclick="toggleEditSavedAINote(${idx})" style="background:rgba(255,255,255,0.1); color:#94a3b8; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:600; transition:all 0.2s;">
                            ✕ Cancel
                        </button>
                        <button onclick="updateSavedAINote(${idx})" style="background:#10b981; color:#ffffff; border:none; padding:8px 20px; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:700; box-shadow:0 4px 12px rgba(16,185,129,0.3); transition:all 0.2s; display:flex; align-items:center; gap:6px;">
                            💾 Update Note
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    html += `
            </div>
        </div>
    `;
    return html;
}

function toggleEditSavedAINote(idx) {
    const editEl = document.getElementById(`ai-saved-note-edit-${idx}`);
    const viewEl = document.getElementById(`ai-saved-note-${idx}`);
    if (!editEl) return;
    
    if (editEl.style.display === "none" || !editEl.style.display) {
        editEl.style.display = "block";
        if (viewEl) viewEl.style.display = "none";
    } else {
        editEl.style.display = "none";
    }
}

async function updateSavedAINote(idx) {
    const titleInput = document.getElementById(`ai-note-edit-title-${idx}`);
    const contentInput = document.getElementById(`ai-note-edit-content-${idx}`);
    if (!titleInput || !contentInput) return;
    
    const newTitle = titleInput.value.trim();
    const newContent = contentInput.value;
    
    if (!newTitle) {
        alert("Note title cannot be empty.");
        return;
    }
    
    await manageAINoteAction(idx, "update", { title: newTitle, content: newContent });
}

async function renameSavedAINote(idx, oldTitle) {
    const newTitle = prompt("Enter new title for this study note:", oldTitle);
    if (newTitle === null || newTitle.trim() === "" || newTitle.trim() === oldTitle) return;
    
    await manageAINoteAction(idx, "rename", { title: newTitle.trim() });
}

async function deleteSavedAINote(idx) {
    if (!confirm("Are you sure you want to delete this saved study note?")) return;
    
    await manageAINoteAction(idx, "delete", {});
}

async function manageAINoteAction(idx, action, extraData = {}) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const targetFile = urlParams.get('file') || urlParams.get('course') || urlParams.get('json');
        
        const res = await fetch("/api/manage_ai_note", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                file: targetFile,
                section_id: typeof activeSectionId !== "undefined" ? activeSectionId : null,
                index: idx,
                action: action,
                ...extraData
            })
        });
        
        if (res.ok) {
            const data = await res.json();
            if (typeof showToast === "function") {
                let msg = "✅ Note updated successfully!";
                if (action === "rename") msg = "✅ Note renamed successfully!";
                if (action === "delete") msg = "🗑️ Note deleted successfully!";
                showToast(msg);
            }
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
            alert("Failed to " + action + " note.");
        }
    } catch (e) {
        console.error("Error managing note:", e);
        alert("Error: " + e.message);
    }
}


function openResourcesModal(id) {
    const data = courseData.find(d => d.id === id);
    if (!data) return;
    
    const modalTitle = document.getElementById("modal-title");
    const modalFiles = document.getElementById("modal-files-list");
    const modalOverlay = document.getElementById("resources-modal");
    
    if (modalTitle) modalTitle.innerText = `Resources — Section ${data.num}: ${data.title}`;
    if (modalFiles) {
        if (!data.files || data.files.length === 0) {
            modalFiles.innerHTML = '<p class="tb">No resources available for this session.</p>';
        } else {
            modalFiles.innerHTML = renderFiles(data.files);
        }
    }
    if (modalOverlay) modalOverlay.classList.add("active");
}

function closeResourcesModal() {
    const modalOverlay = document.getElementById("resources-modal");
    if (modalOverlay) modalOverlay.classList.remove("active");
}

// Global escape key to close modal
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeResourcesModal();
});


function renderMenu() {
    const mc = document.getElementById("menu-container");
    mc.innerHTML = "";
    courseData.forEach(item => {
        const el = document.createElement("div");
        el.className = `menu-item ${item.id === activeSectionId ? "active" : ""}`;
        el.setAttribute("data-id", item.id);
        el.onclick = () => setSectionActive(item.id);
        
        el.innerHTML = `
            <input type="checkbox" class="menu-checkbox" ${progressState[item.id] ? "checked" : ""} onclick="toggleProgressId('${item.id}', event)">
            <div class="menu-item-text">
                <span class="menu-item-num">Section ${item.num}</span>
                <span class="menu-item-title">${item.title}</span>
            </div>
        `;
        mc.appendChild(el);
    });
}

async function uploadHeaderTutorial(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (typeof showToast === "function") showToast("⏳ Uploading " + file.name + "...");
            const res = await fetch('/api/upload_tutorial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    data: data
                })
            });
            const resp = await res.json();
            if (resp.success) {
                if (typeof showToast === "function") showToast("✅ Tutorial Uploaded!");
                setTimeout(() => {
                    window.location.href = '?file=' + encodeURIComponent(resp.filename);
                }, 500);
            } else {
                throw new Error(resp.error || "Upload failed");
            }
        } catch (err) {
            alert("❌ Could not upload tutorial: " + err.message);
        }
    };
    reader.readAsText(file);
}

// Initialise App
window.onload = async () => {
    if (!courseData || courseData.length === 0) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const targetJson = urlParams.get('file') || urlParams.get('course') || urlParams.get('json');
            
            async function fetchFirstOk(urls) {
                for (const url of urls) {
                    try {
                        const r = await fetch(url);
                        if (r.ok) return r;
                    } catch (e) {}
                }
                return null;
            }

            let res;
            if (targetJson) {
                res = await fetchFirstOk([
                    `Courses/${targetJson}`,
                    `courses/${targetJson}`,
                    `cources/${targetJson}`,
                    targetJson
                ]);
            } else {
                res = await fetchFirstOk([
                    'course_data.json',
                    'Courses/01 - Python, Data Science & ML Bootcamp.json',
                    'courses/01 - Python, Data Science & ML Bootcamp.json',
                    'cources/01 - Python, Data Science & ML Bootcamp.json',
                    'assets/js/course_data.json'
                ]);
            }
            if (res && res.ok) {
                courseData = await res.json();
                window.courseData = courseData;
            } else {
                throw new Error(`HTTP ${res ? res.status : 'Not Found'}`);
            }
        } catch (err) {
            console.error("Failed to fetch course_data.json:", err);
            const cc = document.getElementById("content-container");
            if (cc) {
                cc.innerHTML = `<div style="padding: 40px; text-align: center; color: #f43f5e;">
                    <h3>⚠️ Course Data Not Found</h3>
                    <p>Could not load course_data.json for this course directory.</p>
                </div>`;
            }
            return;
        }
    }

    if (courseData && courseData.length > 0) {
        activeSectionId = courseData[0].id;
        loadProgress();
        renderMenu();
        const defaultId = courseData.find(c => c.id === "s03") ? "s03" : courseData[0].id;
        setSectionActive(defaultId);
        
        const searchBar = document.getElementById("search-bar");
        if (searchBar) {
            searchBar.addEventListener('keyup', filterMenu);
        }

        try {
            const jsonsRes = await fetch('/api/course_jsons');
            if (jsonsRes.ok) {
                const jsons = await jsonsRes.json();
                const container = document.getElementById("tutorial-selector-container");
                const select = document.getElementById("tutorial-select");
                if (container && select && jsons.length > 0) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const currentFile = urlParams.get('file') || urlParams.get('course') || urlParams.get('json') || jsons[0].filename;
                    select.innerHTML = jsons.map(j => `<option value="${j.filename}" ${j.filename === currentFile ? 'selected' : ''}>📚 ${j.title}</option>`).join('');
                    container.style.display = "flex";
                }
            }
        } catch (e) {
            console.warn("Could not load tutorial list:", e);
        }
    }
};
