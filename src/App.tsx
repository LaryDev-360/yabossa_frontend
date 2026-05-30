import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import {
  RouteErrorBoundary,
  RouteLoadingFallback,
} from "./components/common/RouteFallback";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./auth/ProtectedRoute";
import GuestRoute from "./auth/GuestRoute";
import EmailVerifiedRoute from "./auth/EmailVerifiedRoute";

const ResetPassword = lazy(() => import("./pages/AuthPages/ResetPassword"));
const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const SignUp = lazy(() => import("./pages/AuthPages/SignUp"));
const VerifyEmail = lazy(() => import("./pages/AuthPages/VerifyEmail"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));
const AppLayout = lazy(() => import("./layout/AppLayout"));
const Home = lazy(() => import("./pages/Dashboard/Home"));
const UserProfiles = lazy(() => import("./pages/UserProfiles"));
const ShopsPage = lazy(() => import("./pages/Shops/ShopsPage"));
const ShopLocationsPage = lazy(() => import("./pages/Shops/ShopLocationsPage"));
const CategoriesPage = lazy(() => import("./pages/Catalog/CategoriesPage"));
const ProductsPage = lazy(() => import("./pages/Catalog/ProductsPage"));
const Videos = lazy(() => import("./pages/UiElements/Videos"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));
const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const Calendar = lazy(() => import("./pages/Calendar"));
const BasicTables = lazy(() => import("./pages/Tables/BasicTables"));
const FormElements = lazy(() => import("./pages/Forms/FormElements"));
const Blank = lazy(() => import("./pages/Blank"));

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <RouteErrorBoundary>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Public: must work when logged in and with uid/token from email (not behind GuestRoute). */}
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<GuestRoute />}>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route element={<EmailVerifiedRoute />}>
                <Route element={<AppLayout />}>
                  <Route index path="/" element={<Home />} />
                  <Route path="/profile" element={<UserProfiles />} />
                  <Route path="/shops" element={<ShopsPage />} />
                  <Route path="/shops/:shopId/locations" element={<ShopLocationsPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/blank" element={<Blank />} />
                  <Route path="/form-elements" element={<FormElements />} />
                  <Route path="/basic-tables" element={<BasicTables />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/avatars" element={<Avatars />} />
                  <Route path="/badge" element={<Badges />} />
                  <Route path="/buttons" element={<Buttons />} />
                  <Route path="/images" element={<Images />} />
                  <Route path="/videos" element={<Videos />} />
                  <Route path="/line-chart" element={<LineChart />} />
                  <Route path="/bar-chart" element={<BarChart />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </Router>
  );
}
