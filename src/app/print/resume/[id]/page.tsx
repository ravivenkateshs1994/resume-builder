import { getExportSession } from "@/lib/exportSessions";
import PrintClient from "./PrintClient";

export default async function PrintResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getExportSession(id);

  return (
    <PrintClient
      serverData={session?.resumeData ?? null}
      serverTemplate={session?.selectedTemplate ?? null}
      serverAccentColor={session?.templateAccentColor ?? null}
    />
  );
}