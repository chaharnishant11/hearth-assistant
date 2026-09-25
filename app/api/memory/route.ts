import { connection } from "next/server";
import { forgetFact, forgetPerson, getPersonById, listPeople } from "@/lib/store";

async function view(requested: string | null) {
  const people = (await listPeople()).map((p) => ({
    id: p.id,
    name: p.name,
    conversations: p.conversations,
    lastAt: p.last_at ? new Date(p.last_at).toISOString() : null,
  }));
  const id = requested && people.some((p) => p.id === requested) ? requested : people[0]?.id;
  return { people, person: id ? ((await getPersonById(id)) ?? null) : null };
}

export async function GET(request: Request) {
  await connection();
  return Response.json(await view(new URL(request.url).searchParams.get("p")));
}

type Action =
  | { action: "forget-fact"; personId: string; factId: string }
  | { action: "forget-person"; personId: string };

export async function POST(request: Request) {
  const body = (await request.json()) as Action;
  if (body.action === "forget-fact") {
    await forgetFact(body.personId, body.factId);
    return Response.json(await view(body.personId));
  }
  if (body.action === "forget-person") {
    await forgetPerson(body.personId);
    return Response.json(await view(null));
  }
  return Response.json({ error: "Unknown action" }, { status: 400 });
}
