import { useEffect } from "react";
import Button from "./button/Button";

interface UndoToastProps {
  message: string;
  undoLabel: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export default function UndoToast({
  message,
  undoLabel,
  onUndo,
  onDismiss,
  durationMs = 3000,
}: UndoToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 z-[99999] flex -translate-x-1/2 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <span className="text-sm text-gray-800 dark:text-white/90">{message}</span>
      <Button type="button" size="sm" variant="outline" onClick={onUndo}>
        {undoLabel}
      </Button>
    </div>
  );
}
