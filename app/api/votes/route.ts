import { Redis } from "@upstash/redis";

const choices = ["tecnologia", "humanas", "sustentabilidad", "autonomia", "global"];
const votesKey = "radar-2030:votes";
const resetKey = "radar-2030:reset-at";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("Upstash Redis no está configurado.");
  }
  return new Redis({ url, token });
}

export async function GET() {
  try {
    const totals: Record<string, number> = Object.fromEntries(choices.map((choice) => [choice, 0]));
    const votes = await getRedis().hgetall<Record<string, string>>(votesKey) ?? {};
    Object.values(votes).forEach((choice) => {
      if (choices.includes(choice)) totals[choice] += 1;
    });
    const resetAt = await getRedis().get<string>(resetKey);
    return Response.json({ totals, count: Object.values(totals).reduce((a, b) => a + b, 0), resetAt }, { headers: { "Cache-Control": "no-store" } });
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

export async function DELETE(request: Request) {
  try {
    const { key } = await request.json() as { key?: string };
    if (!process.env.VOTE_RESET_KEY || key !== process.env.VOTE_RESET_KEY) {
      return Response.json({ error: "Clave incorrecta." }, { status: 401 });
    }
    const redis = getRedis();
    const resetAt = Date.now().toString();
    await redis.del(votesKey);
    await redis.set(resetKey, resetAt);
    return Response.json({ ok: true, resetAt });
  } catch (error) {
    console.error("[votes:delete]", error);
    return Response.json({ error: "No fue posible reiniciar la votación." }, { status: 500 });
  }
}
