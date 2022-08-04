import React from "react";
import { Navigate } from "react-router-dom";

import { history } from "../_helpers";

function PrivateRoute({ isAllowed, redirectPath = "/login", children }) {

  if (!isAllowed) {
    // not logged in so redirect to login page with the return url
    return <Navigate to={redirectPath} state={{ from: history.location }} />;
  }

  return children;
}

export { PrivateRoute };
