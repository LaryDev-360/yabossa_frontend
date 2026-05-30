import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { confirmPasswordReset, requestPasswordReset } from "../../api/auth";
import { ApiError, getFieldError } from "../../api/errors";
import { useTranslation } from "../../i18n/I18nContext";
import AuthPageLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import PageMeta from "../../components/common/PageMeta";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";

function useResetLinkParams() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";
  return useMemo(
    () => ({
      uid,
      token,
      isConfirmMode: Boolean(uid && token),
    }),
    [uid, token],
  );
}

function RequestResetForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const res = await requestPasswordReset(email.trim());
      setMessage(res.detail);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("resetPassword.errorGeneric"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
        {t("resetPassword.requestTitle")}
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {t("resetPassword.requestSubtitle")}
      </p>

      {message && (
        <div className="mb-5">
          <Alert variant="success" title={t("resetPassword.successTitle")} message={message} />
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Alert variant="error" title={t("resetPassword.errorTitle")} message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <Label>{t("common.email")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("resetPassword.emailPlaceholder")}
              disabled={isSubmitting}
              required
            />
          </div>
          <Button className="w-full" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("resetPassword.sending") : t("resetPassword.sendLink")}
          </Button>
        </div>
      </form>
    </>
  );
}

function ConfirmResetForm({ uid, token }: { uid: string; token: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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
      const res = await confirmPasswordReset({
        uid,
        token,
        new_password: password,
        new_password_confirm: passwordConfirm,
      });
      setMessage(res.detail);
      setTimeout(() => navigate("/signin", { replace: true }), 2000);
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
        setError(t("resetPassword.confirmErrorGeneric"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
        {t("resetPassword.confirmTitle")}
      </h1>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {t("resetPassword.confirmSubtitle")}
      </p>
      <p className="mb-6 text-xs text-gray-500 dark:text-gray-400">{t("resetPassword.mailHint")}</p>

      {message && (
        <div className="mb-5">
          <Alert
            variant="success"
            title={t("resetPassword.updatedTitle")}
            message={t("resetPassword.updatedMessage", { detail: message })}
          />
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Alert variant="error" title={t("resetPassword.confirmErrorTitle")} message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <Label>
              {t("resetPassword.newPassword")}{" "}
              <span className="text-error-500">{t("common.required")}</span>
            </Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("resetPassword.newPasswordPlaceholder")}
              disabled={isSubmitting || Boolean(message)}
              error={Boolean(fieldErrors.new_password)}
              hint={fieldErrors.new_password}
              required
              minLength={8}
            />
          </div>
          <div>
            <Label>
              {t("resetPassword.confirmPassword")}{" "}
              <span className="text-error-500">{t("common.required")}</span>
            </Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder={t("resetPassword.confirmPasswordPlaceholder")}
              disabled={isSubmitting || Boolean(message)}
              error={Boolean(fieldErrors.new_password_confirm)}
              hint={fieldErrors.new_password_confirm}
              required
              minLength={8}
            />
          </div>
          <Button
            className="w-full"
            size="sm"
            type="submit"
            disabled={isSubmitting || Boolean(message)}
          >
            {isSubmitting ? t("resetPassword.saving") : t("resetPassword.updatePassword")}
          </Button>
        </div>
      </form>
    </>
  );
}

export default function ResetPassword() {
  const { t } = useTranslation();
  const { uid, token, isConfirmMode } = useResetLinkParams();

  return (
    <AuthPageLayout>
      <PageMeta
        title={isConfirmMode ? t("resetPassword.pageTitleConfirm") : t("resetPassword.pageTitleRequest")}
        description={t("resetPassword.pageDescription")}
      />
      <div className="flex flex-col flex-1 w-full max-w-md mx-auto justify-center lg:w-1/2">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        {isConfirmMode ? (
          <ConfirmResetForm uid={uid} token={token} />
        ) : (
          <RequestResetForm />
        )}

        <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
            {t("common.backToSignIn")}
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}
