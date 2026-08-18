import { env } from "cloudflare:workers";

const choices = ["tecnologia", "humanas", "sustentabilidad", "autonomia", "global"];

async function ensureSchema() {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voter_id TEXT NOT NULL,
    choice TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`).run();
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_voter_id ON votes(voter_id)").run();
}

export async function GET() {
  try {
    await ensureSchema();
    const result = await env.DB.prepare("SELECT choice, COUNT(*) AS total FROM votes GROUP BY choice").all<{ choice: string; total: number }>();
    const totals: Record<string, number> = Object.fromEntries(choices.map((choice) => [choice, 0]));
    result.results.forEach((row) => { if (choices.includes(row.choice)) totals[row.choice] = Number(row.total); });
    return Response.json({ totals, count: Object.values(totals).reduce((a, b) => a + b, 0) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "No fue posible consultar la votación." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { voterId, choice } = await request.json() as { voterId?: string; choice?: string };
    if (!voterId || voterId.length > 80 || !choice || !choices.includes(choice)) return Response.json({ error: "Voto inválido." }, { status: 400 });
    await ensureSchema();
    await env.DB.prepare(`INSERT INTO votes (voter_id, choice, created_at) VALUES (?, ?, unixepoch())
      ON CONFLICT(voter_id) DO UPDATE SET choice = excluded.choice, created_at = excluded.created_at`).bind(voterId, choice).run();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "No fue posible registrar el voto." }, { status: 500 });
  }
}
