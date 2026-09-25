import { connection } from "next/server";
import { addLiveAlert, clearCheckIns, getDashboard, saveProfile, setCallStatus } from "@/lib/store";
import type { Profile } from "@/lib/types";

export async function GET() {
  await connection();
  return Response.json(await getDashboard());
}

type Action =
  | { action: "reset" }
  | { action: "call"; callActive?: boolean; calmMode?: boolean }
  | { action: "alert"; reason: string; quote: string; translation?: string }
  | { action: "profile"; profile: Profile };

export async function POST(request: Request) {
  const body = (await request.json()) as Action;

  switch (body.action) {
    case "reset":
      await clearCheckIns();
      break;
    case "call":
      await setCallStatus({
        ...(body.callActive !== undefined && { callActive: body.callActive }),
        ...(body.calmMode !== undefined && { calmMode: body.calmMode }),
      });
      break;
    case "alert":
      await addLiveAlert({
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        reason: body.reason,
        quote: body.quote,
        translation: body.translation ?? null,
      });
      break;
    case "profile":
      await saveProfile(body.profile);
      break;
    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  return Response.json(await getDashboard());
}
