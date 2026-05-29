import { FormEvent, useState } from "react";
import { Link } from "react-router";
import { requestPasswordReset } from "../../api/auth";
import { ApiError } from "../../api/errors";
import AuthPageLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import PageMeta from "../../components/common/PageMeta";

export default function ResetPassword() {
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
    <AuthPageLayout>
      <PageMeta title="Reset password | TwoFStock" description="Request a password reset link" />
      <div className="flex flex-col flex-1 w-full max-w-md mx-auto justify-center">
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

        <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}
