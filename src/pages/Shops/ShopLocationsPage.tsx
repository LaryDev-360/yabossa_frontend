import { Navigate, useParams } from "react-router";

/** Legacy route — redirects to inline locations on the shops page. */
export default function ShopLocationsPage() {
  const { shopId = "" } = useParams();
  if (!shopId) {
    return <Navigate to="/shops" replace />;
  }
  return <Navigate to={`/shops?shop=${shopId}`} replace />;
}
