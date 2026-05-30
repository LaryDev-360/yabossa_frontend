import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { requestEmailOtp, verifyEmailOtp } from "../../api/auth";
import { ApiError } from "../../api/errors";
import { useAuth } from "../../auth/AuthContext";
import { isEmailVerified } from "../../auth/emailVerification";
import AuthPageLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import PageMeta from "../../components/common/PageMeta";

export default function VerifyEmail() {
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
        setError("Could not send verification code.");
      }
    } finally {
      setIsSending(false);
    }
  }, [email]);

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
        setError("Verification failed. Please try again.");
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
      <PageMeta title="Verify email | TwoFStock" description="Confirm your email with a one-time code" />
      <div className="flex flex-col flex-1 w-full max-w-md mx-auto justify-center lg:w-1/2">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Verify your email
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          We sent a verification code to <strong className="text-gray-800 dark:text-white/90">{email}</strong>.
          Enter it below to finish setting up your account.
        </p>

        {info && !error && (
          <div className="mb-5">
            <Alert variant="info" title="Code sent" message={info} />
          </div>
        )}
        {error && (
          <div className="mb-5">
            <Alert variant="error" title="Something went wrong" message={error} />
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="space-y-5">
            <div>
              <Label>
                Verification code <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
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
              {isVerifying ? "Verifying…" : "Verify email"}
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
            {isSending ? "Sending…" : "Resend code"}
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("/signin", { replace: true });
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Sign out and use another account
          </button>
        </div>
      </div>
    </AuthPageLayout>
  );
}
