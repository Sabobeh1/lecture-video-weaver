
import { Navigate } from "react-router-dom";

const Index = () => {
  // Redirect to dashboard as this is the main page
  return <Navigate to="/dashboard" replace />;
};

export default Index;
