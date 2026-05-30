import { FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { ApiError, getFieldError } from "../../../api/errors";
import { useAuth } from "../../../auth/AuthContext";
import { useTranslation } from "../../../i18n/I18nContext";
import { changePassword } from "../api";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";

export default function ChangePasswordForm() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const res = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      setMessage(res.detail);
      await logout();
      setTimeout(
        () =>
          navigate("/signin", {
            replace: true,
            state: { passwordChanged: true, detail: res.detail },
          }),
        1500,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        const next: Record<string, string> = {};
        for (const key of Object.keys(err.fieldErrors)) {
          const msg = getFieldError(err.fieldErrors, key);
          if (msg) {
            next[key] = msg;
          }
        }
        setFieldErrors(next);
      } else {
        setError(t("profile.passwordChangeErrorGeneric"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
        {t("profile.securityTitle")}
      </h4>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{t("profile.securitySubtitle")}</p>

      {message && (
        <div className="mb-5">
          <Alert
            variant="success"
            title={t("profile.passwordChangedTitle")}
            message={t("profile.passwordChangedMessage", { detail: message })}
          />
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Alert variant="error" title={t("profile.passwordChangeErrorTitle")} message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 max-w-xl">
          <div>
            <Label>
              {t("profile.currentPassword")}{" "}
              <span className="text-error-500">{t("common.required")}</span>
            </Label>
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting || Boolean(message)}
              error={Boolean(fieldErrors.current_password)}
              hint={fieldErrors.current_password}
              required
            />
          </div>

          <div>
            <Label>
              {t("profile.newPassword")}{" "}
              <span className="text-error-500">{t("common.required")}</span>
            </Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting || Boolean(message)}
              error={Boolean(fieldErrors.new_password)}
              hint={fieldErrors.new_password}
              minLength={8}
              required
            />
          </div>

          <div>
            <Label>
              {t("profile.confirmNewPassword")}{" "}
              <span className="text-error-500">{t("common.required")}</span>
            </Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              disabled={isSubmitting || Boolean(message)}
              error={Boolean(fieldErrors.new_password_confirm)}
              hint={fieldErrors.new_password_confirm}
              minLength={8}
              required
            />
          </div>
        </div>

        <div className="mt-6">
          <Button type="submit" size="sm" disabled={isSubmitting || Boolean(message)}>
            {isSubmitting ? t("profile.changingPassword") : t("profile.changePassword")}
          </Button>
        </div>
      </form>
    </div>
  );
}
