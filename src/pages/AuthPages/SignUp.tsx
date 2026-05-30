import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";
import { useTranslation } from "../../i18n/I18nContext";

export default function SignUp() {
  const { t } = useTranslation();

  return (
    <>
      <PageMeta title={t("signUp.pageTitle")} description={t("signUp.pageDescription")} />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
