# ⚔️ Placement Quest — GitHub-Powered DSA Progress Tracker

**Placement Quest** is a high-aesthetic, ultra-lightweight, zero-backend web dashboard engineered to help software engineering candidates stay disciplined, track problem mastery, and conquer coding assessments (e.g., Infosys OA).

---

## 🌟 Key Features

* **Zero Backend & Zero Database**: Runs 100% in the browser using static HTML5, CSS3, Vanilla JavaScript, and JSON data files (`/data/*.json` + `localStorage`).
* **Linear / Raycast / GitHub Inspired Aesthetics**: Dark mode only, glassmorphism cards, glowing status pills, smooth micro-animations, and modern typography (`Outfit`, `Inter`, `JetBrains Mono`).
* **GitHub Contribution Heatmap**: Visual contribution grid tracking daily study sessions, problems solved, and hours invested.
* **Infosys 45-Problem Hit List**: Pre-loaded with 45 curated problems split across 4 strategic phases (Q1 Easy/Med, Q2 Greedy & Intervals, Q3 DP, Q4 Graphs & Trees).
* **XP & Leveling System**: Earn XP for solving problems, completing Java/OOP study sessions, and winning Boss Battles. Watch your Level and Tier title upgrade smoothly with animated progress bars.
* **Automatic Badge Unlocks**: 10+ achievements (First Blood, HashMap Master, Sliding Window Expert, DP Survivor, Boss Slayer, Placement Ready, etc.) unlocked dynamically.
* **3-Hour Boss Battle Mocks**: Simulated timed mock assessments scheduled every 5th day with +500 XP rewards.
* **Daily Reflection Journal**: Log daily insights, mistakes, and tomorrow's focus in JSON format.
* **Pattern Library**: Overview & progress trackers for 12 foundational DSA patterns.
* **JSON Import & Export**: One-click full backup and restore.

---

## 📁 Project Structure

```
placement-quest/
│
├── index.html          # Main Hero & Daily Mission Dashboard
├── roadmap.html        # 45 Problems Hit List with filters & notes
├── achievements.html   # Trophy & Badge showcase
├── stats.html          # Analytics, mastery breakdown & OA cutoff projection
├── patterns.html       # 12 Core DSA Pattern Library
├── journal.html        # 3-field Daily Reflection Log
├── settings.html       # Daily targets, JSON import/export & deployment settings
│
├── css/
│   └── styles.css      # Dark mode glassmorphism design system
│
├── js/
│   ├── store.js        # Core state manager (localStorage + JSON fallback engine)
│   ├── app.js          # Shared navbar, toasts & level-up modal engine
│   ├── progress.js     # Dashboard hero, checklist & heatmap renderer
│   ├── roadmap.js      # Roadmap filtering, search & notes editor
│   ├── achievements.js # Dynamic badge calculation & trophy grid
│   ├── stats.js        # Analytics calculation & package cutoff projector
│   ├── patterns.js     # Pattern completion progress bars
│   ├── journal.js      # Daily journal entry logger
│   └── settings.js     # Goal configuration & data backup handlers
│
├── data/
│   ├── roadmap.json    # 45 Problems data with LC links, patterns & XP rewards
│   ├── progress.json   # Default user state, goals & heatmap logs
│   └── achievements.json # Badge definitions & unlock criteria
│
└── README.md
```

---

## 🚀 How to Run Locally

Because this project is built using native web technologies, no installation or npm packages are required!

1. Open `index.html` directly in any web browser (Chrome, Firefox, Edge, Safari).
2. Alternatively, run a lightweight local dev server (e.g. VS Code Live Server or `npx serve .`).

---

## 🌐 Deploy to GitHub Pages (Step-by-Step)

To deploy this tracker live on the web for free:

### Step 1: Initialize Git and Commit Code
Inside the `placement-quest` folder:

```bash
git init
git add .
git commit -m "Initial commit: Placement Quest DSA Progress Tracker"
```

### Step 2: Add Remote and Push to GitHub
```bash
git remote add origin https://github.com/geeky-rish/code-tracker.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub: `https://github.com/geeky-rish/code-tracker`
2. Navigate to **Settings** → **Pages** (on the left sidebar).
3. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
4. Select branch **`main`** and folder **`/ (root)`**, then click **Save**.
5. Your live app will be published at: `https://geeky-rish.github.io/code-tracker/` in ~1 minute!
