import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          Unauthorized Access
        </h1>
        <p className="text-gray-600">
          You don't have permission to access this page.
        </p>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="destructive" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
