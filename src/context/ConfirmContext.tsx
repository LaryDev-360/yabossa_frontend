import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ConfirmModal, { type ConfirmVariant } from "../components/common/ConfirmModal";
import { useTranslation } from "../i18n/I18nContext";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

type PendingConfirm = ConfirmOptions & { resolve: (value: boolean) => void };

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const next: PendingConfirm = { ...options, resolve };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  const close = useCallback((result: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    current?.resolve(result);
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  const variant = pending?.variant ?? "default";
  const defaultConfirmLabel =
    variant === "danger"
      ? t("confirm.delete")
      : variant === "warning"
        ? t("confirm.proceed")
        : t("confirm.confirm");

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && (
        <ConfirmModal
          isOpen
          title={pending.title ?? t("confirm.title")}
          message={pending.message}
          confirmLabel={pending.confirmLabel ?? defaultConfirmLabel}
          cancelLabel={pending.cancelLabel ?? t("common.cancel")}
          variant={variant}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx;
}
