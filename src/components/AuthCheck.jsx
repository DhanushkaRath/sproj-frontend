import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export default function AuthCheck({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  return children;
} 