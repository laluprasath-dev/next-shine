import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AdminProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading, userRole } = useAuth();

  if (loading || (user && userRole === null)) return null;

  if (!user) return <Navigate to="/admin/login" replace />;

  if (userRole !== "ADMIN") return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default AdminProtectedRoute;
