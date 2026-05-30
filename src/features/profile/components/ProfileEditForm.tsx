import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import type { User } from "../../../api/types";
import { ApiError, getFieldError } from "../../../api/errors";
import { useAuth } from "../../../auth/AuthContext";
import { useTranslation } from "../../../i18n/I18nContext";
import { updateProfile, type UpdateProfilePayload } from "../api";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";

interface ProfileEditFormProps {
  user: User;
}

export default function ProfileEditForm({ user }: ProfileEditFormProps) {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user.full_name);
  const [businessName, setBusinessName] = useState(user.merchant?.business_name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(
    user.merchant?.phone_number ?? user.cashier?.phone_number ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFullName(user.full_name);
    setBusinessName(user.merchant?.business_name ?? "");
    setPhoneNumber(user.merchant?.phone_number ?? user.cashier?.phone_number ?? "");
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const payload: UpdateProfilePayload = { full_name: fullName.trim() };

    if (user.role === "MERCHANT") {
      payload.business_name = businessName.trim();
      payload.phone_number = phoneNumber.trim();
    } else if (user.role === "CASHIER") {
      payload.phone_number = phoneNumber.trim();
    }

    try {
      await updateProfile(payload);
      await refreshUser();
      setMessage(t("profile.updateSuccess"));
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
        setError(t("profile.updateErrorGeneric"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
        {t("profile.personalInfoTitle")}
      </h4>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{t("profile.personalInfoSubtitle")}</p>

      {!user.email_verified_at && (
        <div className="mb-5">
          <Alert
            variant="warning"
            title={t("profile.verifyEmailTitle")}
            message={t("profile.verifyEmailMessage")}
          />
          <Link
            to="/verify-email"
            className="inline-block mt-2 text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            {t("profile.verifyEmailLink")}
          </Link>
        </div>
      )}

      {message && (
        <div className="mb-5">
          <Alert variant="success" title={t("profile.updateSuccessTitle")} message={message} />
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Alert variant="error" title={t("profile.updateErrorTitle")} message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <Label>
              {t("profile.fullName")} <span className="text-error-500">{t("common.required")}</span>
            </Label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting}
              error={Boolean(fieldErrors.full_name)}
              hint={fieldErrors.full_name}
              required
            />
          </div>

          <div className="lg:col-span-2">
            <Label>{t("common.email")}</Label>
            <Input type="email" value={user.email} disabled />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{t("profile.emailReadOnly")}</p>
          </div>

          {user.role === "MERCHANT" && (
            <div className="lg:col-span-2">
              <Label>
                {t("profile.businessName")}{" "}
                <span className="text-error-500">{t("common.required")}</span>
              </Label>
              <Input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={isSubmitting}
                error={Boolean(fieldErrors.business_name)}
                hint={fieldErrors.business_name}
                required
              />
            </div>
          )}

          {(user.role === "MERCHANT" || user.role === "CASHIER") && (
            <div className="lg:col-span-2">
              <Label>{t("profile.phoneNumber")}</Label>
              <Input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isSubmitting}
                error={Boolean(fieldErrors.phone_number)}
                hint={fieldErrors.phone_number}
                placeholder={t("profile.phonePlaceholder")}
              />
            </div>
          )}

          {user.role === "CASHIER" && user.cashier && (
            <div className="lg:col-span-2">
              <Label>{t("profile.assignedShop")}</Label>
              <Input type="text" value={user.cashier.shop_name} disabled />
            </div>
          )}

          {user.role === "ADMIN" && user.admin && (
            <div className="lg:col-span-2">
              <Label>{t("profile.adminLevel")}</Label>
              <Input
                type="text"
                value={
                  user.admin.is_super_admin ? t("profile.superAdmin") : t("profile.standardAdmin")
                }
                disabled
              />
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? t("profile.saving") : t("profile.saveChanges")}
          </Button>
        </div>
      </form>
    </div>
  );
}
