import { getActiveEvent } from "@/server/services/admin/categories";
import { getParticipantsWithSessions } from "@/server/services/admin/participants";
import { ParticipantItem } from "./participant-item";
import { NewParticipantForm } from "./new-participant-form";
import { BulkEmailButton } from "./bulk-email-button";
import { ImportParticipantsForm } from "./import-participants-form";

export default async function AdminParticipantesPage() {
  const event = await getActiveEvent();
  const participants = await getParticipantsWithSessions(event.id);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 bg-cream p-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Emails</h1>
        <p className="mt-1 text-neutral-400">
          {event.name} — {participants.length} participante(s)
        </p>
      </div>

      <BulkEmailButton eventId={event.id} />

      <ImportParticipantsForm eventId={event.id} />

      <div className="flex flex-col gap-3">
        {participants.map((participant) => (
          <ParticipantItem key={participant.id} participant={participant} />
        ))}
      </div>

      <NewParticipantForm eventId={event.id} />
    </main>
  );
}
