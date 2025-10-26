import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../Hook/UserContext";

export default function PrivateRoute({ children }) {
  const { user } = useContext(UserContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
