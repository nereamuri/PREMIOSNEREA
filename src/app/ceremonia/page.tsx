import { getActiveEvent } from "@/server/services/admin/categories";
import { getCeremonyData } from "@/server/services/admin/ceremony";
import { CeremonyView } from "./ceremony-view";

export default async function CeremoniaPage() {
  const event = await getActiveEvent();
  const categories = await getCeremonyData(event.id);

  return <CeremonyView eventName={event.name} categories={categories} />;
}
