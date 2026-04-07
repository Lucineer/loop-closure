interface Env { LOOP_KV: KVNamespace; DEEPSEEK_API_KEY?: string; }

const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*; frame-ancestors 'none';";

function json(data: unknown, s = 200) { return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json', ...CSP } }); }

async function callLLM(key: string, system: string, user: string, model = 'deepseek-chat', max = 1500): Promise<string> {
  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: max, temperature: 0.6 })
  });
  return (await resp.json()).choices?.[0]?.message?.content || '';
}

function stripFences(t: string): string {
  t = t.trim();
  while (t.startsWith('```')) { t = t.split('\n').slice(1).join('\n'); }
  while (t.endsWith('```')) { t = t.slice(0, -3).trim(); }
  return t;
}

interface LoopStep { vessel: string; action: string; status: string; result?: string; error?: string; }
interface Loop { id: string; goal: string; status: string; steps: LoopStep[]; created: string; updated: string; iteration: number; }

function getLanding(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Loop Closure — Cocapn</title><style>
body{font-family:system-ui,sans-serif;background:#0a0a0f;color:#e0e0e0;margin:0;min-height:100vh}
.container{max-width:800px;margin:0 auto;padding:40px 20px}
h1{color:#22c55e;font-size:2.2em}a{color:#22c55e;text-decoration:none}
.sub{color:#8A93B4;margin-bottom:2em}
.card{background:#16161e;border:1px solid #2a2a3a;border-radius:12px;padding:24px;margin:20px 0}
.card h3{color:#22c55e;margin:0 0 12px 0}
.btn{background:#22c55e;color:#0a0a0f;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold}
.btn:hover{background:#16a34a}
textarea{width:100%;background:#0a0a0f;color:#e0e0e0;border:1px solid #2a2a3a;border-radius:8px;padding:12px;box-sizing:border-box;font-family:monospace}
.step{display:flex;align-items:flex-start;gap:12px;margin:8px 0;padding:12px;background:#0a1a0a;border-radius:8px;border-left:3px solid #22c55e}
.step .num{color:#22c55e;font-weight:bold;font-size:1.3em;min-width:28px}
.step .status{font-size:.75em;padding:1px 6px;border-radius:4px}
.status-pending{background:#64748b;color:#fff}.status-running{background:#f59e0b;color:#0a0a0f}
.status-done{background:#22c55e;color:#0a0a0f}.status-error{background:#ef4444;color:#fff}
.loop{background:#1a1a2a;padding:16px;border-radius:8px;margin:12px 0;border-left:3px solid #22c55e}
.arrow{color:#8A93B4;font-size:1.5em;margin-left:4px}
</style></head><body><div class="container">
<h1>🔄 Loop Closure</h1><p class="sub">Close the fleet loop: goal → decompose → execute → monitor → evolve → retry.</p>
<div class="card"><h3>Start a Loop</h3>
<textarea id="goal" rows="2" placeholder="Describe your fleet goal..."></textarea>
<div style="margin-top:12px"><button class="btn" onclick="startLoop()">Start Loop</button></div></div>
<div id="loops" class="card"><h3>Active Loops</h3><p style="color:#8A93B4">Loading...</p></div>
<script>
async function load(){try{const r=await fetch('/api/loops');const l=await r.json();const el=document.getElementById('loops');
if(!l.length){el.innerHTML='<h3>Active Loops</h3><p style="color:#8A93B4">No loops running.</p>';return;}
el.innerHTML='<h3>Active Loops ('+l.length+')</h3>'+l.map(x=>'<div class="loop"><strong>'+x.goal.substring(0,80)+'</strong><br><span style="color:#8A93B4">Iteration '+x.iteration+' · '+x.status+' · '+x.steps.length+' steps</span>'+
(x.steps.map((s,i)=>'<div class="step"><span class="num">'+(i+1)+'</span><div><strong>'+s.vessel+'</strong> <span class="status status-'+(s.status==='done'?'done':s.status==='error'?'error':s.status==='running'?'running':'pending')+'">'+s.status+'</span><br><span style="color:#8A93B4;font-size:.9em">'+s.action+'</span>'+(s.error?'<br><span style="color:#ef4444">'+s.error+'</span>':'')+'</div></div>').join(''))+
'</div>').join('');}catch(e){}}
async function startLoop(){const g=document.getElementById('goal').value.trim();if(!g)return;
const btn=document.querySelector('.btn');btn.textContent='Starting...';btn.disabled=true;
const r=await fetch('/api/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal:g})});
const result=await r.json();
if(result.error)alert(result.error);else{alert('Loop #'+result.id+' started');document.getElementById('goal').value='';load();}
btn.textContent='Start Loop';btn.disabled=false;}
load();
</script>
<div style="text-align:center;padding:24px;color:#475569;font-size:.75rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> · <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>
</div></body></html>`;
}

const FLEET_ENDPOINTS: Record<string, string> = {
  'epiphany-engine': 'https://epiphany-engine.casey-digennaro.workers.dev',
  'flow-forge': 'https://flow-forge.casey-digennaro.workers.dev',
  'fleet-immune': 'https://fleet-immune.casey-digennaro.workers.dev',
  'skill-evolver': 'https://skill-evolver.casey-digennaro.workers.dev',
  'context-compactor': 'https://context-compactor.casey-digennaro.workers.dev',
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/health') return json({ status: 'ok', vessel: 'loop-closure' });
    if (url.pathname === '/vessel.json') return json({ name: 'loop-closure', type: 'cocapn-vessel', version: '1.0.0', description: 'Meta-orchestrator that closes the fleet loop: decompose, execute, monitor, evolve', fleet: 'https://the-fleet.casey-digennaro.workers.dev', capabilities: ['loop-closure', 'meta-orchestration', 'adaptive-retry'] });

    if (url.pathname === '/api/loops') return json((await env.LOOP_KV.get('loops', 'json') as Loop[] || []).slice(0, 10));

    if (url.pathname === '/api/start' && req.method === 'POST') {
      const { goal } = await req.json() as { goal: string };
      if (!goal || !env.DEEPSEEK_API_KEY) return json({ error: 'goal and API key required' }, 400);

      const loop: Loop = { id: Date.now().toString(), goal: goal.substring(0, 500), status: 'planning', steps: [], created: new Date().toISOString(), updated: new Date().toISOString(), iteration: 1 };

      // Step 1: Decompose via epiphany-engine
      loop.steps.push({ vessel: 'epiphany-engine', action: 'Decomposing goal into sub-problems...', status: 'running' });
      try {
        const epResp = await fetch(`${FLEET_ENDPOINTS['epiphany-engine']}/api/problem`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: goal })
        });
        const epData = await epResp.json();
        loop.steps[loop.steps.length - 1].status = 'done';
        loop.steps[loop.steps.length - 1].result = `${epData.subproblems?.length || 0} sub-problems`;
      } catch (e) {
        loop.steps[loop.steps.length - 1].status = 'error';
        loop.steps[loop.steps.length - 1].error = String(e);
        loop.status = 'error';
      }

      // Step 2: Generate workflow via flow-forge
      loop.steps.push({ vessel: 'flow-forge', action: 'Generating vessel workflow...', status: 'running' });
      try {
        const ffResp = await fetch(`${FLEET_ENDPOINTS['flow-forge']}/api/forge`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal })
        });
        const ffData = await ffResp.json();
        loop.steps[loop.steps.length - 1].status = 'done';
        loop.steps[loop.steps.length - 1].result = `${ffData.steps?.length || 0} workflow steps`;
      } catch (e) {
        loop.steps[loop.steps.length - 1].status = 'error';
        loop.steps[loop.steps.length - 1].error = String(e);
      }

      loop.status = 'active';
      const loops = await env.LOOP_KV.get('loops', 'json') as Loop[] || [];
      loops.unshift(loop);
      if (loops.length > 30) loops.length = 30;
      await env.LOOP_KV.put('loops', JSON.stringify(loops));
      return json({ id: loop.id, steps: loop.steps, status: loop.status });
    }

    if (url.pathname === '/api/report' && req.method === 'POST') {
      const { loopId, vessel, action, status, result, error } = await req.json() as { loopId: string; vessel: string; action: string; status: string; result?: string; error?: string };
      const loops = await env.LOOP_KV.get('loops', 'json') as Loop[] || [];
      const loop = loops.find((l: Loop) => l.id === loopId);
      if (!loop) return json({ error: 'not found' }, 404);
      loop.steps.push({ vessel, action: action.substring(0, 200), status: status || 'pending', result: result?.substring(0, 200), error: error?.substring(0, 200) });
      loop.updated = new Date().toISOString();
      await env.LOOP_KV.put('loops', JSON.stringify(loops));
      return json({ logged: true });
    }

    if (url.pathname === '/api/evolve' && req.method === 'POST') {
      const { loopId, error } = await req.json() as { loopId: string; error: string };
      if (!env.DEEPSEEK_API_KEY) return json({ error: 'no API key' }, 400);
      const loops = await env.LOOP_KV.get('loops', 'json') as Loop[] || [];
      const loop = loops.find((l: Loop) => l.id === loopId);
      if (!loop) return json({ error: 'not found' }, 404);
      loop.steps.push({ vessel: 'skill-evolver', action: 'Proposing fix for error...', status: 'running' });
      try {
        const seResp = await fetch(`${FLEET_ENDPOINTS['skill-evolver']}/api/propose`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pattern: error, category: 'error-recovery', target: 'fleet' })
        });
        const seData = await seResp.json();
        loop.steps[loop.steps.length - 1].status = 'done';
        loop.steps[loop.steps.length - 1].result = seData.name || 'skill proposed';
        loop.iteration++;
      } catch (e) {
        loop.steps[loop.steps.length - 1].status = 'error';
        loop.steps[loop.steps.length - 1].error = String(e);
      }
      await env.LOOP_KV.put('loops', JSON.stringify(loops));
      return json({ evolved: true });
    }

    return new Response(getLanding(), { headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Content-Security-Policy': CSP } });
  }
};
