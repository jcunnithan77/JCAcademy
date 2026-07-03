# 🚀 Universal Multi-Tutorial ML & AI Hub (Docker Deployable)

This containerized deployment solution serves all your tutorial folders from a single, stunning glassmorphism dashboard. It automatically detects and hosts multiple tutorial directories mounted from your host system.

## 🌟 Key Features
- **Zero-Config Discovery**: Automatically detects any folder inside `D:\JC\Personal\Study\ML\courses` (e.g., `01 - Python...`, `02 - Agentic AI...`, `Python Mega Project...`).
- **Interactive UI Launching**: If a folder contains `tutorial_dashboard.html`, it launches directly into the interactive study guide.
- **Raw File Browsing**: For folders without a dashboard, it provides clean, auto-generated file indexes to browse notebooks, zip files, and transcripts.
- **Lightweight & Fast**: Built on Python 3.11 Slim with minimal footprint.

---

## 🛠️ How to Deploy (Docker Compose)

1. Open your terminal in this directory (`docker-portal`):
   ```bash
   cd "D:\JC\Personal\Study\ML\courses\docker-portal"
   ```

2. Build and launch the container in the background:
   ```bash
   docker compose up -d --build
   ```

3. Open your web browser and navigate to:
   👉 **http://localhost:8080**

You will see your custom multi-course portal listing all 10+ course directories ready for exploration!

---

## 💻 Testing Locally without Docker

If you want to test the server directly using Python without launching Docker:
```bash
python server.py
```
Then open **http://localhost:8080** in your browser.
