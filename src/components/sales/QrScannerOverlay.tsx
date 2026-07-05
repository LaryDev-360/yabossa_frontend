import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import Button from "../ui/button/Button";
import { useTranslation } from "../../i18n/I18nContext";

interface QrScannerOverlayProps {
  onDecode: (text: string) => void;
  onClose: () => void;
}

export default function QrScannerOverlay({ onDecode, onClose }: QrScannerOverlayProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserQRCodeReader();
    let active = true;
    let stopControls: { stop: () => void } | null = null;

    void (async () => {
      try {
        stopControls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (!result || !active) {
              return;
            }
            active = false;
            onDecode(result.getText());
            stopControls?.stop();
          },
        );
      } catch {
        if (active) {
          setError(t("sales.scanCameraError"));
        }
      }
    })();

    return () => {
      active = false;
      stopControls?.stop();
    };
  }, [onDecode, t]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-gray-900">
        <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("sales.scanQrTitle")}
        </h3>
        {error ? (
          <p className="mb-4 text-sm text-error-500">{error}</p>
        ) : (
          <video ref={videoRef} className="mb-4 w-full rounded-lg bg-black aspect-video" muted />
        )}
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
