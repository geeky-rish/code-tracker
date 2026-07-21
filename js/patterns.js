/**
 * Placement Quest - Pattern Library Engine
 */

const PATTERN_METADATA = [
  { name: "Arrays & Hashing", icon: "🗝️", desc: "Lookup complement with HashMap, frequency arrays, bucket sort." },
  { name: "Prefix Sum", icon: "📊", desc: "Track running cumulative sum to answer subarray queries in O(1)." },
  { name: "Two Pointers", icon: "👈👉", desc: "Move inward or outward on sorted structures to find pairs in O(n)." },
  { name: "Sliding Window", icon: "🪟", desc: "Maintain variable or fixed window bound to track continuous subarray state." },
  { name: "Binary Search", icon: "🔍", desc: "Divide search space in half each iteration with lo/hi/mid template." },
  { name: "Stack", icon: "🥞", desc: "LIFO order for bracket matching and monotonic sequence tracking." },
  { name: "Heap", icon: "⛰️", desc: "Priority Queue to efficiently query min/max K elements in O(log K)." },
  { name: "Greedy", icon: "🎯", desc: "Make locally optimal choice at each step (Infosys Q2 favorite!)." },
  { name: "Intervals", icon: "📐", desc: "Sort by start/end time to merge or keep non-overlapping intervals." },
  { name: "DP", icon: "🌋", desc: "Break into subproblems: Fibonacci, 0/1 Knapsack, 2D Grid, LCS." },
  { name: "Graphs", icon: "🕸️", desc: "DFS/BFS flood fill, multi-source BFS, topological sort." },
  { name: "Trees", icon: "🌳", desc: "Recursion, binary search tree bounds, BFS level order traversal." }
];

document.addEventListener('DOMContentLoaded', async () => {
  const checkStore = setInterval(() => {
    if (window.appStore && window.appStore.isInitialized) {
      clearInterval(checkStore);
      initPatterns();
    }
  }, 50);
});

function initPatterns() {
  const store = window.appStore;
  const container = document.getElementById('patterns-grid');
  if (!container) return;

  container.innerHTML = PATTERN_METADATA.map(meta => {
    const problems = store.roadmap.filter(p => p.pattern.toLowerCase().includes(meta.name.toLowerCase()));
    const total = problems.length;
    const solved = problems.filter(p => p.status === 'completed').length;
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

    return `
      <div class="pattern-card">
        <div class="pattern-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">${meta.icon}</span>
            <span class="pattern-title">${meta.name}</span>
          </div>
          <span class="pattern-pct">${pct}%</span>
        </div>

        <p style="font-size: 0.83rem; color: var(--text-muted); margin-bottom: 12px;">${meta.desc}</p>

        <div class="pattern-progress-track">
          <div class="pattern-progress-fill" style="width: ${pct}%;"></div>
        </div>

        <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-dim); margin-bottom: 8px; text-transform: uppercase;">
          Target Problems (${solved}/${total}):
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${problems.map(p => `
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; padding: 4px 8px; background: rgba(255,255,255,0.02); border-radius: 4px;">
              <a href="${p.url}" target="_blank" style="color: var(--text-main); text-decoration: none; display: flex; align-items: center; gap: 6px;">
                ${p.isCore ? '🎯 ' : ''}#${p.id} ${p.title}
              </a>
              <span style="font-size: 0.8rem;">${p.status === 'completed' ? '✅' : '☐'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}
