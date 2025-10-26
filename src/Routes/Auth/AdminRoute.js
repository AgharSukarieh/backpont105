import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../Hook/UserContext";

function AdminRoute({ children }) {
  const { user } = useContext(UserContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "Admin") {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}

export default AdminRoute;
