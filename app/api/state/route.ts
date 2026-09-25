import { connection } from "next/server";
import { addLiveAlert, getState, resetState, saveProfile, setCallStatus } from "@/lib/store";
import type { Profile } from "@/lib/types";

export async function GET() {
  await connection();
  return Response.json(getState());
}

type Action =
  | { action: "reset" }
  | { action: "call"; callActive?: boolean; calmMode?: boolean }
  | { action: "alert"; reason: string; quote: string; translation?: string }
  | { action: "profile"; profile: Profile; sampleHistory: boolean };

export async function POST(request: Request) {
  const body = (await request.json()) as Action;

  switch (body.action) {
    case "reset":
      resetState();
      break;
    case "call":
      setCallStatus({
        ...(body.callActive !== undefined && { callActive: body.callActive }),
        ...(body.calmMode !== undefined && { calmMode: body.calmMode }),
      });
      break;
    case "alert":
      addLiveAlert({
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        reason: body.reason,
        quote: body.quote,
        translation: body.translation ?? null,
      });
      break;
    case "profile":
      saveProfile(body.profile, body.sampleHistory);
      break;
    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  return Response.json(getState());
}
