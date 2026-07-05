import { useEffect } from "react";
import Button from "./button/Button";

interface ImageLightboxProps {
  images: { id: string; url: string; label?: string }[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  previousLabel: string;
  nextLabel: string;
  closeLabel: string;
  counterLabel: string;
}

export default function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  previousLabel,
  nextLabel,
  closeLabel,
  counterLabel,
}: ImageLightboxProps) {
  const current = images[index];
  const hasPrevious = index > 0;
  const hasNext = index < images.length - 1;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft" && hasPrevious) {
        onIndexChange(index - 1);
      } else if (event.key === "ArrowRight" && hasNext) {
        onIndexChange(index + 1);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasNext, hasPrevious, index, onClose, onIndexChange]);

  if (!current) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={current.label ?? counterLabel}
    >
      <div
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3 text-white">
          <p className="text-sm">{counterLabel}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm hover:bg-white/10"
          >
            {closeLabel}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          {hasPrevious && (
            <button
              type="button"
              onClick={() => onIndexChange(index - 1)}
              className="absolute left-0 z-10 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/70"
              aria-label={previousLabel}
            >
              ‹
            </button>
          )}

          <img
            src={current.url}
            alt=""
            className="max-h-[calc(100vh-8rem)] w-full rounded-2xl object-contain"
          />

          {hasNext && (
            <button
              type="button"
              onClick={() => onIndexChange(index + 1)}
              className="absolute right-0 z-10 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/70"
              aria-label={nextLabel}
            >
              ›
            </button>
          )}
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <Button type="button" size="sm" variant="outline" disabled={!hasPrevious} onClick={() => onIndexChange(index - 1)}>
            {previousLabel}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={!hasNext} onClick={() => onIndexChange(index + 1)}>
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
