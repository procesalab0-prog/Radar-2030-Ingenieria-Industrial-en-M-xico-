import { Redis } from "@upstash/redis";

const choices = ["tecnologia", "humanas", "sustentabilidad", "autonomia", "global"];
const votesKey = "radar-2030:votes";

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Upstash Redis no está configurado.");
  }
  return Redis.fromEnv();
}

export async function GET() {
  try {
    const totals: Record<string, number> = Object.fromEntries(choices.map((choice) => [choice, 0]));
    const votes = await getRedis().hgetall<Record<string, string>>(votesKey) ?? {};
    Object.values(votes).forEach((choice) => {
      if (choices.includes(choice)) totals[choice] += 1;
    });
    return Response.json({ totals, count: Object.values(totals).reduce((a, b) => a + b, 0) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[votes:get]", error);
    return Response.json({ error: "No fue posible consultar la votación." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { voterId, choice } = await request.json() as { voterId?: string; choice?: string };
    if (!voterId || voterId.length > 80 || !choice || !choices.includes(choice)) return Response.json({ error: "Voto inválido." }, { status: 400 });
    await getRedis().hset(votesKey, { [voterId]: choice });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[votes:post]", error);
    return Response.json({ error: "No fue posible registrar el voto." }, { status: 500 });
  }
}
