import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ApiError, getFieldError } from "../../api/errors";
import { useAuth } from "../../auth/AuthContext";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import Alert from "../ui/alert/Alert";

export default function SignUpForm() {
  const { registerMerchant } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!acceptedTerms) {
      setError("Please accept the terms to create an account.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerMerchant({
        email: email.trim(),
        password,
        passwordConfirm,
        fullName: fullName.trim(),
        businessName: businessName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      });
      navigate("/", { replace: true });
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
        setError("Unable to register. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to sign in
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Register merchant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create your TwoFStock merchant account and start your trial.
            </p>
          </div>

          {error && (
            <div className="mb-5">
              <Alert variant="error" title="Registration failed" message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <Label>
                  Full name<span className="text-error-500">*</span>
                </Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  disabled={isSubmitting}
                  error={Boolean(fieldErrors.full_name)}
                  hint={fieldErrors.full_name}
                  required
                />
              </div>
              <div>
                <Label>
                  Business name<span className="text-error-500">*</span>
                </Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your shop or company"
                  disabled={isSubmitting}
                  error={Boolean(fieldErrors.business_name)}
                  hint={fieldErrors.business_name}
                  required
                />
              </div>
              <div>
                <Label>
                  Email<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  disabled={isSubmitting}
                  error={Boolean(fieldErrors.email)}
                  hint={fieldErrors.email}
                  required
                />
              </div>
              <div>
                <Label>Phone number</Label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Optional"
                  disabled={isSubmitting}
                  error={Boolean(fieldErrors.phone_number)}
                  hint={fieldErrors.phone_number}
                />
              </div>
              <div>
                <Label>
                  Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={isSubmitting}
                    error={Boolean(fieldErrors.password)}
                    hint={fieldErrors.password}
                    required
                    minLength={8}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>
              <div>
                <Label>
                  Confirm password<span className="text-error-500">*</span>
                </Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repeat password"
                  disabled={isSubmitting}
                  error={Boolean(fieldErrors.password_confirm)}
                  hint={fieldErrors.password_confirm}
                  required
                  minLength={8}
                />
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  className="w-5 h-5 mt-0.5"
                  checked={acceptedTerms}
                  onChange={setAcceptedTerms}
                />
                <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                  I agree to the terms of service and privacy policy.
                </p>
              </div>
              <div>
                <Button className="w-full" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account…" : "Create merchant account"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
