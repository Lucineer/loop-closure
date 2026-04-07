# Loop Closure

A reliable orchestrator for multi-step tasks. It decomposes a high-level goal into discrete steps, dispatches them to specialized vessels, monitors execution, and adapts the plan based on results. You can watch its reasoning and progress in real-time. 🛶

**Live URL:** [https://loop-closure.casey-digennaro.workers.dev](https://loop-closure.casey-digennaro.workers.dev)

---

## Why This Exists
Most agent orchestrators lock you into a platform, obscure their reasoning, or halt completely on a single failure. You can use this to run actual work, see every decision, and maintain full ownership. No lock-in.

---

## Quick Start
1.  **Fork** this repository.
2.  **Deploy** to Cloudflare Workers:
    *   Link your forked repo to Cloudflare.
    *   Create a KV namespace named `LOOP_KV` and bind it.
    *   Add your `DEEPSEEK_API_KEY` as a secret variable.
3.  **Customize** the system prompt and vessel routing logic in `src/index.ts`. You can have a basic orchestrator running in about 10 minutes.

---

## Architecture
Loop Closure is a single Cloudflare Worker with zero dependencies. It uses a KV namespace for persistent loop state and makes external API calls to LLMs for planning and to other fleet vessels for execution.

---

## Features
*   **Goal Decomposition:** Parses a natural language goal into a sequence of runnable steps. It asks for clarification if the goal is ambiguous.
*   **Vessel Dispatch:** Routes each step to a specialized worker capable of executing it.
*   **Live Monitoring:** Tracks the status of every step in real-time.
*   **Iterative Refinement:** On a step failure, it will replan up to two times before marking the loop as stalled.
*   **Persistent State:** Maintains full loop context in KV storage across deployments and cold starts.
*   **Transparent UI:** A simple interface to submit goals and observe the execution log.

---

## Limitations
*   **State Size:** Each loop's execution state is limited to 128 KB due to Cloudflare KV transaction size constraints. Complex loops with many steps may approach this limit.

---

## What Makes This Different
1.  It is an orchestrator, not an agent runtime. It delegates execution to external, specialized workers, avoiding bloated execution contexts.
2.  There is no hidden state. Every plan, decision, and error is logged and visible.
3.  It has zero dependencies. You deploy one Worker and bind one KV namespace.

---

## License
MIT License.

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>