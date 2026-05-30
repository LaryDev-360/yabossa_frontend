import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { confirmPasswordReset, requestPasswordReset } from "../../api/auth";
import { ApiError, getFieldError } from "../../api/errors";
import AuthPageLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import PageMeta from "../../components/common/PageMeta";

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
        setError("Unable to send reset instructions. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
        Reset password
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Enter your account email. If it exists, we will send reset instructions.
      </p>

      {message && (
        <div className="mb-5">
          <Alert variant="success" title="Check your email" message={message} />
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Alert variant="error" title="Request failed" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              disabled={isSubmitting}
              required
            />
          </div>
          <Button className="w-full" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
        </div>
      </form>
    </>
  );
}

function ConfirmResetForm({ uid, token }: { uid: string; token: string }) {
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
        setError("Unable to reset password. Please request a new link.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
        Choose a new password
      </h1>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Enter your new password below. This link can only be used once.
      </p>
      <p className="mb-6 text-xs text-gray-500 dark:text-gray-400">
        If your mail app shows a security warning, use <strong>Open in browser</strong> and ensure
        the dev app is running at <code className="text-brand-500">localhost:5173</code>.
      </p>

      {message && (
        <div className="mb-5">
          <Alert variant="success" title="Password updated" message={`${message} Redirecting to sign in…`} />
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Alert variant="error" title="Reset failed" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <Label>
              New password <span className="text-error-500">*</span>
            </Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={isSubmitting || Boolean(message)}
              error={Boolean(fieldErrors.new_password)}
              hint={fieldErrors.new_password}
              required
              minLength={8}
            />
          </div>
          <div>
            <Label>
              Confirm password <span className="text-error-500">*</span>
            </Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Repeat password"
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
            {isSubmitting ? "Saving…" : "Update password"}
          </Button>
        </div>
      </form>
    </>
  );
}

export default function ResetPassword() {
  const { uid, token, isConfirmMode } = useResetLinkParams();

  return (
    <AuthPageLayout>
      <PageMeta
        title={isConfirmMode ? "Set new password | TwoFStock" : "Reset password | TwoFStock"}
        description="Reset your TwoFStock password"
      />
      <div className="flex flex-col flex-1 w-full max-w-md mx-auto justify-center lg:w-1/2">
        {isConfirmMode ? (
          <ConfirmResetForm uid={uid} token={token} />
        ) : (
          <RequestResetForm />
        )}

        <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}
