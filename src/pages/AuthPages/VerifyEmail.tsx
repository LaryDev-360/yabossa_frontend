import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { requestEmailOtp, verifyEmailOtp } from "../../api/auth";
import { ApiError } from "../../api/errors";
import { useAuth } from "../../auth/AuthContext";
import { isEmailVerified } from "../../auth/emailVerification";
import { useTranslation } from "../../i18n/I18nContext";
import AuthPageLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import PageMeta from "../../components/common/PageMeta";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const sentOnMount = useRef(false);

  const [code, setCode] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const email = user?.email ?? "";

  const sendCode = useCallback(async () => {
    if (!email) {
      return;
    }
    setError(null);
    setIsSending(true);
    try {
      const res = await requestEmailOtp(email);
      setInfo(res.detail);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("verifyEmail.errorSend"));
      }
    } finally {
      setIsSending(false);
    }
  }, [email, t]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (isEmailVerified(user)) {
      navigate("/", { replace: true });
      return;
    }
    if (sentOnMount.current) {
      return;
    }
    sentOnMount.current = true;
    void sendCode();
  }, [user, navigate, sendCode]);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);
    try {
      await verifyEmailOtp(email, code.trim());
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("verifyEmail.errorVerify"));
      }
    } finally {
      setIsVerifying(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <AuthPageLayout>
      <PageMeta title={t("verifyEmail.pageTitle")} description={t("verifyEmail.pageDescription")} />
      <div className="flex flex-col flex-1 w-full max-w-md mx-auto justify-center lg:w-1/2">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          {t("verifyEmail.title")}
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {t("verifyEmail.intro", { email })}
        </p>

        {info && !error && (
          <div className="mb-5">
            <Alert variant="info" title={t("verifyEmail.codeSentTitle")} message={info} />
          </div>
        )}
        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("verifyEmail.errorTitle")} message={error} />
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="space-y-5">
            <div>
              <Label>
                {t("verifyEmail.codeLabel")}{" "}
                <span className="text-error-500">{t("common.required")}</span>
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={t("verifyEmail.codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                disabled={isVerifying}
                required
                minLength={4}
              />
            </div>
            <Button
              className="w-full"
              size="sm"
              type="submit"
              disabled={isVerifying || code.trim().length < 4}
            >
              {isVerifying ? t("verifyEmail.submitting") : t("verifyEmail.submit")}
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-3 mt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => void sendCode()}
            disabled={isSending}
            className="text-sm font-medium text-brand-500 hover:text-brand-600 disabled:opacity-50 dark:text-brand-400"
          >
            {isSending ? t("verifyEmail.resending") : t("verifyEmail.resend")}
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("/signin", { replace: true });
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {t("verifyEmail.signOutOther")}
          </button>
        </div>
      </div>
    </AuthPageLayout>
  );
}
