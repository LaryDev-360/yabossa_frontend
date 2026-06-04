import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./auth/AuthContext.tsx";
import { SubscriptionProvider } from "./context/SubscriptionContext.tsx";
import { I18nProvider } from "./i18n/I18nContext.tsx";
import { ConfirmProvider } from "./context/ConfirmContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <ConfirmProvider>
        <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <AppWrapper>
              <App />
            </AppWrapper>
          </SubscriptionProvider>
        </AuthProvider>
        </ThemeProvider>
      </ConfirmProvider>
    </I18nProvider>
  </StrictMode>,
);
