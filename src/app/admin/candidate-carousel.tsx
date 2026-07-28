type CarouselCandidate = {
  id: string;
  name: string;
  photoUrl: string | null;
};

export function CandidateCarousel({
  candidates,
}: {
  candidates: CarouselCandidate[];
}) {
  if (candidates.length === 0) return null;

  // Duplicamos la lista para que el bucle del scroll sea continuo.
  const track = [...candidates, ...candidates];

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-ink bg-white py-6 shadow-sticker-ink">
      <div className="flex w-max animate-marquee gap-6 px-6 hover:[animation-play-state:paused]">
        {track.map((candidate, i) => (
          <div
            key={`${candidate.id}-${i}`}
            className="flex w-20 flex-col items-center gap-2"
          >
            {candidate.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={candidate.photoUrl}
                alt={candidate.name}
                className="h-16 w-16 rounded-full border-2 border-ink object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-cream font-display font-bold">
                {candidate.name.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-center text-xs font-bold">{candidate.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
