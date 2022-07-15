import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import "./App.css";
import {
  history,
  Role,
} from "./_helpers";
import { authenticationService } from "./_services";
import { PrivateRoute } from "./_components";

import StudentPage from "./StudentPage";

import LoginPage from "./LoginPage";
import { CssBaseline } from "@mui/material";
import TeacherPage from "./TeacherPage";

function logout() {
  authenticationService.logout();
  history.push("/login");
}

function App() {
  const [curUser, setCurUser] = useState(() => null);
  const [isAdmin, setIsAdmin] = useState(() => false);

  useEffect(() => {
    authenticationService.currentUser.subscribe((x) => {
      setCurUser(x);
      setIsAdmin(x && x.role === Role.Admin);
    });
  }, []);

  return (
    <BrowserRouter history={history}>
      <CssBaseline>
        <Routes>
          <Route
            path="/student"
            element={
              <PrivateRoute isAllowed={!!curUser && !isAdmin}>
                <StudentPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <PrivateRoute isAllowed={!!curUser && isAdmin}>
                <TeacherPage />
              </PrivateRoute>
            }
          />
          <Route
            exact
            path="/login"
            element={
              <LoginPage
                isAdmin={isAdmin}
                setIsAdmin={(e) => setIsAdmin(e)}
              />
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </CssBaseline>
    </BrowserRouter>
  );
}

export default App;
