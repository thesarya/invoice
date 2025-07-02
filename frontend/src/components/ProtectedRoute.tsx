import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
};

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (requiredRole && userRole !== requiredRole) {
      navigate("/unauthorized");
      return;
    }
  }, [user, userRole, requiredRole, navigate]);

  if (!user || (requiredRole && userRole !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
