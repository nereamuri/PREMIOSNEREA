"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import type {
  CeremonyCategory,
  CeremonyPerson,
  CeremonyPodiumRank,
} from "@/server/services/admin/ceremony";

type Phase = "intro" | "nominees" | "revealed" | "end";

export function CeremonyView({
  eventName,
  categories,
}: {
  eventName: string;
  categories: CeremonyCategory[];
}) {
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");

  const category = categories[categoryIndex];
  const isLastCategory = categoryIndex === categories.length - 1;

  function goNext() {
    if (phase === "intro") {
      setPhase(categories.length > 0 ? "nominees" : "end");
    } else if (phase === "nominees") {
      setPhase("revealed");
    } else if (phase === "revealed") {
      if (isLastCategory) {
        setPhase("end");
      } else {
        setCategoryIndex((i) => i + 1);
        setPhase("nominees");
      }
    }
  }

  function goBack() {
    if (phase === "nominees") {
      if (categoryIndex === 0) {
        setPhase("intro");
      } else {
        setCategoryIndex((i) => i - 1);
        setPhase("revealed");
      }
    } else if (phase === "revealed") {
      setPhase("nominees");
    } else if (phase === "end") {
      setPhase("revealed");
    }
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowRight" || e.code === "Enter") {
        e.preventDefault();
        goNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, categoryIndex]);

  if (phase === "intro") {
    return (
      <DarkScreen>
        <p className="text-lg text-cream/60">Modo ceremonia</p>
        <h1 className="font-display text-5xl font-bold">{eventName}</h1>
        <p className="text-xl text-cream/70">
          Es hora de conocer a los ganadores 🎉
        </p>
        <AdvanceButton onClick={goNext}>Comenzar</AdvanceButton>
      </DarkScreen>
    );
  }

  if (phase === "end") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream p-8 text-center">
        <div className="rounded-3xl border-[2.5px] border-ink bg-white p-8 shadow-sticker-fuchsia">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nereapremios.png"
            alt="Premios Nerea"
            className="mx-auto h-40 w-40 object-contain"
          />
        </div>
        <h1 className="font-display text-4xl font-bold">
          ¡Enhorabuena a todos los ganadores!
        </h1>
        <button
          type="button"
          onClick={() => {
            setCategoryIndex(0);
            setPhase("intro");
          }}
          className="rounded-full border-2 border-ink px-6 py-2 font-display font-bold"
        >
          Reiniciar
        </button>
      </main>
    );
  }

  if (!category) return null;

  return (
    <DarkScreen>
      <p className="text-lg text-cream/60">
        Categoría {categoryIndex + 1} de {categories.length}
      </p>
      <h1 className="font-display text-4xl font-bold">{category.name}</h1>

      {phase === "nominees" && (
        <>
          <div className="flex max-w-4xl flex-wrap justify-center gap-6">
            {category.nominees.map((nominee) => (
              <NomineeCard key={nominee.id} person={nominee} />
            ))}
          </div>
          <AdvanceButton onClick={goNext}>Revelar podio 🥁</AdvanceButton>
        </>
      )}

      {phase === "revealed" && (
        <>
          {category.podium.length === 0 ? (
            <p className="font-display text-2xl font-bold text-cream/80">
              Todavía no hay votos suficientes en esta categoría.
            </p>
          ) : (
            <div key={category.id} className="relative w-full py-6">
              <Confetti seed={category.id} />
              <Podium podium={category.podium} />
            </div>
          )}
          <AdvanceButton onClick={goNext}>
            {isLastCategory ? "Ver resultados finales" : "Siguiente categoría"}
          </AdvanceButton>
        </>
      )}

      <p className="mt-2 text-sm text-cream/40">
        → o espacio para avanzar · ← para volver
      </p>
    </DarkScreen>
  );
}

function DarkScreen({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-ink p-8 text-center text-cream">
      {children}
    </main>
  );
}

function AdvanceButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 rounded-full bg-cream px-10 py-4 font-display text-xl font-bold text-ink shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      {children}
    </button>
  );
}

function NomineeCard({ person }: { person: CeremonyPerson }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <PersonPhoto person={person} sizeClass="h-20 w-20" />
      <div>
        <p className="font-display font-bold">{person.name}</p>
        {person.department && (
          <p className="text-sm text-cream/60">{person.department}</p>
        )}
      </div>
    </div>
  );
}

function PersonPhoto({
  person,
  sizeClass,
}: {
  person: CeremonyPerson;
  sizeClass: string;
}) {
  if (person.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={person.photoUrl}
        alt={person.name}
        className={`${sizeClass} rounded-full border-2 border-cream object-cover`}
      />
    );
  }
  return (
    <div
      className={`flex ${sizeClass} items-center justify-center rounded-full border-2 border-cream bg-ink font-display font-bold text-cream`}
    >
      {person.name.charAt(0).toUpperCase()}
    </div>
  );
}

// Puestos 2-1-3 de izquierda a derecha, como un podio real. El 1º entra el
// último y más rebotón; 2º y 3º entran antes, más discretos.
const RANK_CONFIG: Record<
  1 | 2 | 3,
  { pedestal: string; photoSize: string; nameSize: string; delay: number }
> = {
  2: { pedestal: "h-20", photoSize: "h-20 w-20", nameSize: "text-base", delay: 0.2 },
  1: { pedestal: "h-32", photoSize: "h-32 w-32", nameSize: "text-2xl", delay: 0.9 },
  3: { pedestal: "h-12", photoSize: "h-16 w-16", nameSize: "text-sm", delay: 0 },
};

function Podium({ podium }: { podium: CeremonyPodiumRank[] }) {
  const byRank = new Map(podium.map((p) => [p.rank, p]));
  const order: Array<1 | 2 | 3> = [2, 1, 3];

  return (
    <div className="flex w-full max-w-4xl flex-wrap items-end justify-center gap-6">
      {order.map((rank) => {
        const group = byRank.get(rank);
        if (!group) return null;
        return <PodiumColumn key={rank} group={group} config={RANK_CONFIG[rank]} />;
      })}
    </div>
  );
}

function PodiumColumn({
  group,
  config,
}: {
  group: CeremonyPodiumRank;
  config: (typeof RANK_CONFIG)[1 | 2 | 3];
}) {
  const isWinner = group.rank === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", bounce: 0.55, duration: 0.7, delay: config.delay }}
      className="flex flex-col items-center gap-3"
    >
      <div className="flex flex-wrap items-end justify-center gap-4">
        {group.people.map((person) => (
          <motion.div
            key={person.id}
            animate={isWinner ? { y: [0, -18, 0] } : undefined}
            transition={
              isWinner
                ? {
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 0.4,
                    ease: "easeInOut",
                    delay: config.delay + 0.8,
                  }
                : undefined
            }
            className="flex flex-col items-center gap-1"
          >
            <PersonPhoto person={person} sizeClass={config.photoSize} />
            <p className={`font-display font-bold ${config.nameSize}`}>
              {person.name}
            </p>
            {person.department && (
              <p className="text-xs text-cream/60">{person.department}</p>
            )}
          </motion.div>
        ))}
      </div>
      <div
        className={`flex w-28 items-center justify-center rounded-t-2xl border-[2.5px] border-ink bg-cream ${config.pedestal} shadow-sticker-fuchsia`}
      >
        <p className="font-display text-3xl font-bold text-ink">{group.rank}</p>
      </div>
    </motion.div>
  );
}

function Confetti({ seed }: { seed: string }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 32 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.8 + Math.random() * 1.4,
      rotate: Math.random() * 360 - 180,
      isFuchsia: i % 2 === 0,
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }));
  }, [seed]);

  return (
    <div className="pointer-events-none absolute inset-0 -top-20 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: "120vh", rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          className={`absolute h-3 w-3 rounded-sm ${p.isFuchsia ? "bg-fuchsia" : "bg-cream"}`}
          style={{ left: `${p.left}%`, top: 0 }}
        />
      ))}
    </div>
  );
}
