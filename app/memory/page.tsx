import { MemoryView } from "@/components/memory/MemoryView";

export default async function MemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { p, view } = await searchParams;
  return <MemoryView initialPersonId={typeof p === "string" ? p : null} familyView={view === "family"} />;
}
