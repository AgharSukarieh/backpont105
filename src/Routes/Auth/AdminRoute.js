import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../Hook/UserContext";

function AdminRoute({ children }) {
  const { user } = useContext(UserContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // التحقق من role (Admin, admin, ADMIN)
  const userRole = user?.role || user?.session?.role || localStorage.getItem("role");
  const isAdmin = userRole === "Admin" || 
                 userRole === "admin" || 
                 userRole === "ADMIN" ||
                 userRole?.toLowerCase() === "admin";
  
  if (!isAdmin) {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}

export default AdminRoute;
