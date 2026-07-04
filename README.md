# 🚀 Universal Multi-Tutorial ML & AI Hub (Docker Deployable)

This containerized deployment solution serves all your interactive JSON masterclasses from a single, stunning glassmorphism dashboard. It automatically detects and hosts structured tutorial curricula from the `Courses/` directory.

## 🌟 Key Features
- **Zero-Config JSON Discovery**: Automatically detects any structured course JSON inside `Courses/` (e.g., `01 - Python...json`, `market_profile_tutorial_data.json`).
- **Interactive UI & AI Tutor**: Launches directly into an interactive study guide featuring video summaries, code notebooks, resources, and AI tutor notes.
- **Standalone & Portable**: Self-contained Docker deployment without needing external host directory mounts or raw folder browsing.
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
