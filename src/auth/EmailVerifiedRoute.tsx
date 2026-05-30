import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext";
import { isEmailVerified } from "./emailVerification";

/**
 * Blocks app routes until the user has verified their email (OTP).
 */
export default function EmailVerifiedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user && !isEmailVerified(user)) {
    return <Navigate to="/verify-email" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
