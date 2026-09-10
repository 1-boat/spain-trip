// Cloudflare Pages Function: /api/todos
// KV binding required: TODOS_KV (在 Pages 项目 Settings → Bindings 里绑定一个 KV namespace)

const KEY = 'todos';

function normalize(raw) {
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === 'object' && p.done && typeof p.done === 'object' && !Array.isArray(p.done)) {
      return { done: p.done };
    }
  } catch (e) { /* fallthrough */ }
  return { done: {} };
}

export async function onRequestGet({ env }) {
  if (!env.TODOS_KV) return Response.json({ done: {}, warn: 'kv-binding-missing' }, { headers: noStore() });
  const raw = await env.TODOS_KV.get(KEY);
  return Response.json(raw ? normalize(raw) : { done: {} }, { headers: noStore() });
}

async function save({ request, env }) {
  if (!env.TODOS_KV) return Response.json({ error: 'kv-binding-missing' }, { status: 500, headers: noStore() });
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return Response.json({ error: 'bad json' }, { status: 400, headers: noStore() });
  }
  const done = {};
  const src = (body && body.done) || {};
  for (const k of Object.keys(src)) {
    if (typeof src[k] === 'boolean') done[k] = src[k];
  }
  await env.TODOS_KV.put(KEY, JSON.stringify({ done }));
  return Response.json({ done }, { headers: noStore() });
}

function noStore() { return { 'Cache-Control': 'no-store' }; }

export const onRequestPut = save;
export const onRequestPost = save;
