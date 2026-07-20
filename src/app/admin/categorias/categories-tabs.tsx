"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CategoriesWithCandidates } from "@/server/services/admin/categories";
import { CategoryCard } from "./category-card";
import { NewCategoryForm } from "./new-category-form";

export function CategoriesTabs({
  eventId,
  categories,
}: {
  eventId: string;
  categories: CategoriesWithCandidates;
}) {
  const [activeId, setActiveId] = useState(categories[0]?.id);
  const activeIndex = categories.findIndex((c) => c.id === activeId);
  const activeCategory = categories[activeIndex];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveId(category.id)}
            className={cn(
              "rounded-full border-2 border-ink px-4 py-2 text-sm font-bold transition-transform",
              category.id === activeId
                ? "bg-ink text-cream shadow-sticker-fuchsia"
                : "bg-white hover:-translate-x-[1px] hover:-translate-y-[1px]"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {activeCategory && (
        <CategoryCard
          category={activeCategory}
          isFirst={activeIndex === 0}
          isLast={activeIndex === categories.length - 1}
        />
      )}

      <NewCategoryForm eventId={eventId} />
    </div>
  );
}
