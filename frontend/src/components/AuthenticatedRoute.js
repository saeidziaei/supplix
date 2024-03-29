import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../lib/contextLib";

export default function AuthenticatedRoute({ children }) {
  
  const { pathname, search } = useLocation();
  const { authenticatedUser } = useAppContext();

  if (!authenticatedUser) {

    return <Navigate to={`/login?redirect=${pathname}${search}`} />;
  }
  return children;
}