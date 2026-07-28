import {
  getActiveEvent,
  getCategoriesWithCandidates,
} from "@/server/services/admin/categories";
import { CategoriesTabs } from "./categories-tabs";

export default async function AdminCategoriasPage() {
  const event = await getActiveEvent();
  const categories = await getCategoriesWithCandidates(event.id);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 bg-cream p-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          Categorías y candidatos
        </h1>
        <p className="mt-1 text-neutral-400">{event.name}</p>
      </div>

      <CategoriesTabs eventId={event.id} categories={categories} />
    </main>
  );
}
