
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
  redirectTo?: string;
}

export const AuthGuard = ({ redirectTo = "/auth" }: AuthGuardProps) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // You could replace this with a loading spinner
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return currentUser ? <Outlet /> : <Navigate to={redirectTo} replace />;
};

export const PublicOnlyRoute = ({ redirectTo = "/dashboard" }: AuthGuardProps) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return !currentUser ? <Outlet /> : <Navigate to={redirectTo} replace />;
};
