import os
import json
import urllib.parse
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler

# Set base directory for courses
COURSES_DIR = os.environ.get("COURSES_DIR", os.path.abspath(".."))
PORT = int(os.environ.get("PORT", 8585))

# Ensure standard MIME types are loaded
mimetypes.init()
mimetypes.add_type("text/vtt", ".vtt")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/json", ".json")

PORTAL_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Multi-Tutorial ML & AI Hub</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚀</text></svg>">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0b0f19;
            --card-bg: rgba(30, 41, 59, 0.7);
            --border: rgba(255, 255, 255, 0.1);
            --primary: #6366f1;
            --primary-hover: #4f46e5;
            --accent: #38bdf8;
            --text: #f8fafc;
            --text-mut: #94a3b8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', sans-serif;
            background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, var(--bg) 80%);
            color: var(--text);
            min-height: 100vh;
            padding: 40px 20px;
        }
        header {
            max-width: 1200px;
            margin: 0 auto 40px auto;
            text-align: center;
        }
        h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 2.8rem;
            font-weight: 700;
            background: linear-gradient(135deg, #a5b4fc, #38bdf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 12px;
        }
        p.subtitle {
            color: var(--text-mut);
            font-size: 1.15rem;
            max-width: 600px;
            margin: 0 auto 24px auto;
        }
        .search-box {
            max-width: 500px;
            margin: 0 auto;
            position: relative;
        }
        .search-box input {
            width: 100%;
            padding: 14px 20px;
            border-radius: 12px;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid var(--border);
            color: white;
            font-size: 1rem;
            outline: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .search-box input:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
        }
        .grid {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 24px;
        }
        .card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 24px;
            backdrop-filter: blur(12px);
            transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .card:hover {
            transform: translateY(-6px);
            border-color: rgba(99, 102, 241, 0.5);
            box-shadow: 0 12px 30px rgba(99, 102, 241, 0.15);
        }
        .card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        .icon {
            font-size: 2rem;
            background: rgba(99, 102, 241, 0.15);
            width: 54px;
            height: 54px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .badge {
            font-size: 0.75rem;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .badge.ready { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
        .badge.folder { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
        h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.3rem;
            font-weight: 600;
            color: #fff;
            margin-bottom: 8px;
            line-height: 1.4;
        }
        .stats {
            display: flex;
            gap: 16px;
            color: var(--text-mut);
            font-size: 0.85rem;
            margin-bottom: 20px;
        }
        .btn {
            display: inline-block;
            text-align: center;
            padding: 12px 20px;
            border-radius: 10px;
            background: linear-gradient(135deg, var(--primary), #4338ca);
            color: white;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        .btn:hover {
            background: linear-gradient(135deg, var(--primary-hover), #3730a3);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .btn.secondary {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid var(--border);
        }
        .btn.secondary:hover {
            background: rgba(51, 65, 85, 0.8);
            border-color: var(--text-mut);
        }
    </style>
</head>
<body>
    <header>
        <h1>🚀 Universal AI Bootcamp Hub</h1>
        <p class="subtitle">Select any course directory below to launch its interactive study guide dashboard or browse raw materials.</p>
        <div class="search-box">
            <input type="text" id="search" placeholder="Search across course folders..." onkeyup="filterCourses()">
        </div>
    </header>

    <div class="grid" id="course-grid">
        <p style="color:var(--text-mut); grid-column: 1/-1; text-align:center;">Scanning mounted course directories...</p>
    </div>

    <script>
        let allItems = [];

        async function fetchCourses() {
            try {
                const [jsonsRes, coursesRes] = await Promise.all([
                    fetch('/api/course_jsons').catch(() => ({ json: () => [] })),
                    fetch('/api/courses').catch(() => ({ json: () => [] }))
                ]);
                const jsons = await jsonsRes.json();
                const dirs = await coursesRes.json();

                allItems = [
                    ...jsons.map(j => ({
                        name: j.title,
                        filename: j.filename,
                        is_json: true,
                        subdirs: 'JSON',
                        files: 'Tutorial'
                    })),
                    ...dirs.map(d => ({
                        ...d,
                        is_json: false
                    }))
                ];
                renderCourses(allItems);
            } catch (err) {
                document.getElementById('course-grid').innerHTML = `<p style="color:#ef4444; grid-column: 1/-1; text-align:center;">Error loading courses: ${err.message}</p>`;
            }
        }

        function renderCourses(courses) {
            const grid = document.getElementById('course-grid');
            if (courses.length === 0) {
                grid.innerHTML = `<p style="color:var(--text-mut); grid-column: 1/-1; text-align:center;">No course directories found.</p>`;
                return;
            }
            grid.innerHTML = courses.map(c => {
                if (c.is_json) {
                    return `
                        <div class="card" data-title="${c.name.toLowerCase()}">
                            <div>
                                <div class="card-header">
                                    <div class="icon">📚</div>
                                    <span class="badge ready" style="background:#059669;">JSON Tutorial</span>
                                </div>
                                <h3>${c.name}</h3>
                                <div class="stats">
                                    <span>⚡ Interactive Course</span>
                                    <span>📄 ${c.filename}</span>
                                </div>
                            </div>
                            <a href="/tutorial_dashboard.html?file=${encodeURIComponent(c.filename)}" target="_blank" class="btn">
                                Launch Tutorial ↗
                            </a>
                        </div>
                    `;
                }
                return `
                    <div class="card" data-title="${c.name.toLowerCase()}">
                        <div>
                            <div class="card-header">
                                <div class="icon">${c.has_dashboard ? '⚡' : '📁'}</div>
                                <span class="badge ${c.has_dashboard ? 'ready' : 'folder'}">${c.has_dashboard ? 'Interactive UI' : 'Raw Folder'}</span>
                            </div>
                            <h3>${c.name}</h3>
                            <div class="stats">
                                <span>📂 ${c.subdirs} Sections</span>
                                <span>📄 ${c.files} Files</span>
                            </div>
                        </div>
                        <a href="/courses/${encodeURIComponent(c.name)}/${c.has_dashboard ? 'tutorial_dashboard.html' : ''}" target="_blank" class="btn ${c.has_dashboard ? '' : 'secondary'}">
                            ${c.has_dashboard ? 'Launch Dashboard ↗' : 'Browse Folder ↗'}
                        </a>
                    </div>
                `;
            }).join('');
        }

        function filterCourses() {
            const q = document.getElementById('search').value.toLowerCase();
            const filtered = allItems.filter(c => c.name.toLowerCase().includes(q));
            renderCourses(filtered);
        }

        fetchCourses();
    </script>
</body>
</html>
"""

class PortalHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = urllib.parse.unquote(parsed.path)
        
        if path == "/" or path == "/index.html":
            local_idx = os.path.join(os.path.abspath("."), "index.html")
            if os.path.exists(local_idx):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                with open(local_idx, "rb") as f:
                    self.wfile.write(f.read())
                return
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(PORTAL_HTML.encode("utf-8"))
            return
            
        if path == "/api/courses":
            courses = []
            if os.path.exists(COURSES_DIR):
                for item in sorted(os.listdir(COURSES_DIR)):
                    full_p = os.path.join(COURSES_DIR, item)
                    if os.path.isdir(full_p) and not item.startswith(".") and item != "docker-portal":
                        subdirs = len([d for d in os.listdir(full_p) if os.path.isdir(os.path.join(full_p, d))])
                        files_c = sum(len(f) for r, d, f in os.walk(full_p))
                        courses.append({
                            "name": item,
                            "has_dashboard": True,
                            "subdirs": subdirs,
                            "files": files_c
                        })
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(courses).encode("utf-8"))
            return
            
        if path == "/api/course_jsons":
            json_files = []
            for c_folder in ("Courses", "cources"):
                c_dir = os.path.join(os.path.abspath("."), c_folder)
                if os.path.exists(c_dir):
                    for f in sorted(os.listdir(c_dir)):
                        if f.endswith(".json"):
                            title = f[:-5]
                            json_files.append({"filename": f, "title": title, "folder": c_folder})
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(json_files).encode("utf-8"))
            return
            
        if path.startswith("/courses/"):
            rel_path = path[len("/courses/"):].lstrip("/")
            file_path = os.path.join(COURSES_DIR, rel_path)
            parts = rel_path.split("/")
            course_name = parts[0] if parts else ""
            course_dir = os.path.join(COURSES_DIR, course_name)
            sub_path = "/".join(parts[1:]) if len(parts) > 1 else ""
            
            # If directory requested, auto-redirect or serve index
            if os.path.isdir(file_path):
                dash_path = os.path.join(file_path, "tutorial_dashboard.html")
                common_dash = os.path.join(COURSES_DIR, "01 - Python, Data Science & ML Bootcamp", "tutorial_dashboard.html")
                if os.path.exists(dash_path):
                    file_path = dash_path
                elif os.path.exists(common_dash):
                    file_path = common_dash
                else:
                    self.send_response(200)
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.end_headers()
                    listing = f"<h2>Directory Listing: {rel_path}</h2><ul>"
                    for p in sorted(os.listdir(file_path)):
                        listing += f'<li><a href="/courses/{rel_path}/{p}">{p}</a></li>'
                    listing += "</ul>"
                    self.wfile.write(listing.encode("utf-8"))
                    return

            # Check if course_data.json is requested
            if sub_path in ("course_data.json", "assets/js/course_data.json"):
                if os.path.exists(file_path) and os.path.isfile(file_path):
                    pass # Will be served below
                else:
                    # Dynamically generate course_data.json for this course directory
                    sections = []
                    if os.path.exists(course_dir):
                        for item in sorted(os.listdir(course_dir)):
                            sub_dir = os.path.join(course_dir, item)
                            if os.path.isdir(sub_dir) and not item.startswith(".") and item != "assets":
                                files = []
                                for r, _, fs in os.walk(sub_dir):
                                    for fname in sorted(fs):
                                        ext = fname.split(".")[-1].lower() if "." in fname else ""
                                        if ext in {"vtt", "pdf", "ipynb", "py", "zip", "csv"}:
                                            rp = os.path.relpath(os.path.join(r, fname), course_dir).replace("\\", "/")
                                            files.append({"name": fname, "path": rp, "type": ext})
                                sid = "s" + item[:2] if len(item) >= 2 and item[:2].isdigit() else "s_" + str(len(sections)+1)
                                snum = item[:2] if len(item) >= 2 and item[:2].isdigit() else str(len(sections)+1)
                                stitle = item[5:] if len(item) > 5 and item[2:5] == " - " else item
                                sections.append({
                                    "id": sid,
                                    "num": snum,
                                    "title": stitle,
                                    "overview": f"Comprehensive study module for {stitle}.",
                                    "content": f'<h2 class="sh">{stitle}</h2><div class="card" style="margin-top:16px;"><h3>Module Overview</h3><p class="tb">Explore the interactive lecture materials, notebooks, and reference files for <strong>{stitle}</strong>.</p></div>',
                                    "read_mins": 15,
                                    "files": files,
                                    "vtt": sum(1 for f in files if f["type"] == "vtt"),
                                    "pdf": sum(1 for f in files if f["type"] == "pdf"),
                                    "nb": sum(1 for f in files if f["type"] == "ipynb"),
                                    "py": sum(1 for f in files if f["type"] == "py")
                                })
                    if not sections:
                        sections.append({
                            "id": "s01", "num": "01", "title": course_name, "overview": "Course Overview",
                            "content": f'<h2 class="sh">{course_name}</h2><p class="tb">Welcome to {course_name}.</p>',
                            "read_mins": 5, "files": []
                        })
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps(sections, indent=4).encode("utf-8"))
                    return

            # Fallback to common assets if requested file does not exist locally
            if not os.path.exists(file_path):
                common_fallback = os.path.join(COURSES_DIR, "01 - Python, Data Science & ML Bootcamp", sub_path)
                if os.path.exists(common_fallback) and os.path.isfile(common_fallback):
                    file_path = common_fallback
                        
            if os.path.exists(file_path) and os.path.isfile(file_path):
                content_type, _ = mimetypes.guess_type(file_path)
                if not content_type:
                    content_type = "application/octet-stream"
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.end_headers()
                with open(file_path, "rb") as f:
                    self.wfile.write(f.read())
                return
                
        # Serve files directly from the current server directory (docker-portal)
        local_rel = urllib.parse.unquote(path.lstrip("/"))
        if local_rel == "tutorial_dashboard.html":
            local_path = os.path.join(os.path.abspath("."), "tutorial_dashboard.html")
            if os.path.exists(local_path):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                with open(local_path, "rb") as f:
                    self.wfile.write(f.read())
                return
        elif local_rel in ("course_data.json", "assets/js/course_data.json"):
            for c_folder in ("Courses", "cources"):
                c_dir = os.path.join(os.path.abspath("."), c_folder)
                if os.path.exists(c_dir):
                    jsons = [f for f in sorted(os.listdir(c_dir)) if f.endswith(".json")]
                    if jsons:
                        j_path = os.path.join(c_dir, jsons[0])
                        self.send_response(200)
                        self.send_header("Content-Type", "application/json; charset=utf-8")
                        self.end_headers()
                        with open(j_path, "rb") as f:
                            self.wfile.write(f.read())
                        return
        else:
            local_path = os.path.join(os.path.abspath("."), local_rel)
            if os.path.exists(local_path) and os.path.isfile(local_path):
                content_type, _ = mimetypes.guess_type(local_path)
                if not content_type:
                    content_type = "application/octet-stream"
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.end_headers()
                with open(local_path, "rb") as f:
                    self.wfile.write(f.read())
                return

        self.send_response(404)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"404 Not Found")

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/save_ai_note":
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                try:
                    data = json.loads(post_data.decode('utf-8'))
                    target_file = data.get("file")
                    section_id = data.get("section_id")
                    note_title = data.get("title", "AI Insight")
                    note_content = data.get("content", "")

                    j_path = None
                    for c_folder in ("Courses", "cources"):
                        c_dir = os.path.join(os.path.abspath("."), c_folder)
                        if os.path.exists(c_dir):
                            if target_file and os.path.exists(os.path.join(c_dir, target_file)):
                                j_path = os.path.join(c_dir, target_file)
                                break
                            jsons = [f for f in sorted(os.listdir(c_dir)) if f.endswith(".json")]
                            if jsons:
                                j_path = os.path.join(c_dir, jsons[0])
                                break
                    
                    if j_path and os.path.exists(j_path):
                        with open(j_path, "r", encoding="utf-8") as f:
                            course_json = json.load(f)
                        
                        target_sec = None
                        for sec in course_json:
                            if sec.get("id") == section_id:
                                target_sec = sec
                                break
                        if not target_sec and course_json:
                            target_sec = course_json[0]
                            
                        if target_sec:
                            if "ai_notes" not in target_sec:
                                target_sec["ai_notes"] = []
                            target_sec["ai_notes"].append({
                                "title": note_title,
                                "content": note_content
                            })
                            
                            with open(j_path, "w", encoding="utf-8") as f:
                                json.dump(course_json, f, indent=4)
                                
                            self.send_response(200)
                            self.send_header("Content-Type", "application/json")
                            self.end_headers()
                            self.wfile.write(json.dumps({"success": True, "notes": target_sec["ai_notes"]}).encode("utf-8"))
                            return
                except Exception as e:
                    self.send_response(500)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
                    return
        elif parsed.path == "/api/upload_tutorial":
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                try:
                    data = json.loads(post_data.decode('utf-8'))
                    filename = data.get("filename")
                    course_data = data.get("data")
                    
                    if not filename or not course_data:
                        raise ValueError("Missing filename or course data payload")
                        
                    if not filename.endswith(".json"):
                        filename += ".json"
                        
                    clean_name = os.path.basename(filename)
                    c_dir = os.path.join(os.path.abspath("."), "Courses")
                    os.makedirs(c_dir, exist_ok=True)
                    
                    target_path = os.path.join(c_dir, clean_name)
                    with open(target_path, "w", encoding="utf-8") as f:
                        json.dump(course_data, f, indent=4)
                        
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "filename": clean_name,
                        "message": f"Successfully uploaded {clean_name}"
                    }).encode("utf-8"))
                    return
                except Exception as e:
                    self.send_response(500)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
                    return

        self.send_response(404)
        self.end_headers()

def run():
    print(f"Starting Multi-Tutorial Hub on port {PORT}...")
    print(f"Serving courses from directory: {COURSES_DIR}")
    server = HTTPServer(("0.0.0.0", PORT), PortalHandler)
    server.serve_forever()

if __name__ == "__main__":
    run()
