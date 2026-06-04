import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { AlertHexaIcon, InfoIcon } from "../../icons";

export type ConfirmVariant = "danger" | "warning" | "default";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantIcon = {
  danger: AlertHexaIcon,
  warning: AlertHexaIcon,
  default: InfoIcon,
} as const;

const variantIconClass = {
  danger: "text-error-500 bg-error-50 dark:bg-error-500/15",
  warning: "text-warning-600 bg-warning-50 dark:bg-warning-500/15",
  default: "text-brand-500 bg-brand-50 dark:bg-brand-500/15",
} as const;

const confirmButtonClass = {
  danger:
    "bg-error-500 text-white shadow-theme-xs hover:bg-error-600 disabled:bg-error-300",
  warning:
    "bg-warning-500 text-white shadow-theme-xs hover:bg-warning-600 disabled:opacity-60",
  default: "",
} as const;

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const Icon = variantIcon[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      showCloseButton={false}
      backdrop="light"
      className="max-w-md m-4 shadow-xl ring-1 ring-gray-200 dark:ring-gray-800"
    >
      <div className="p-6 lg:p-8">
        <div className="flex gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${variantIconClass[variant]}`}
          >
            <Icon className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          {variant === "default" ? (
            <Button type="button" size="sm" onClick={onConfirm} disabled={isLoading}>
              {confirmLabel}
            </Button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition ${confirmButtonClass[variant]}`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
