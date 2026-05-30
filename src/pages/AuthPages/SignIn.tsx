import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";
import { useTranslation } from "../../i18n/I18nContext";

export default function SignIn() {
  const { t } = useTranslation();

  return (
    <>
      <PageMeta title={t("signIn.pageTitle")} description={t("signIn.pageDescription")} />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
