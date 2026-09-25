import { CallScreen } from "@/components/call/CallScreen";
import { getCompanion } from "@/lib/companions";

export default async function CallPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { c } = await searchParams;
  const companion = getCompanion(typeof c === "string" ? c : undefined);
  // Keyed so switching companions starts a fresh call screen.
  return <CallScreen key={companion.id} companionId={companion.id} />;
}
