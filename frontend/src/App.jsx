import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import React from "react";
import { socket } from "./_services";

import "./App.css";
import { history, Role } from "./_helpers";
import { authenticationService, getCurrentUser } from "./_services";
import { PrivateRoute } from "./_components";

import StudentPage from "./StudentPage";

import LoginPage from "./LoginPage";
import { CssBaseline } from "@mui/material";
import TeacherPage from "./TeacherPage";

import { storage } from "./_components/FireBase";
import { ref } from "@firebase/storage";
import { ref as uploadBytesResumable, getDownloadURL } from "@firebase/storage";
import RoomPage from "./RoomPage";

function App() {
  const [curUser, setCurUser] = useState(() => "");
  const [roomId, setRoomId] = useState(() => "");
  const [isAdmin, setIsAdmin] = useState(() => "");
  const [loadingComplete, setLoadingComplete] = useState(() => false);
  const [socketFlag, setSocketFlag] = useState(() => false);

  useEffect(async () => {
    if (!socketFlag) {
      if (!socket.connected) await socket.connect();
      setSocketFlag(true);
    }
  }, [socketFlag]);

  useEffect(() => {
    async function fetchUserInfo() {
      await authenticationService.currentUser.subscribe((x) => {
        setCurUser(x ? x.username : null);
        setRoomId(x ? x.roomHost : "");
        setIsAdmin(x && x.role === Role.Admin);
        setLoadingComplete(true);
      });
    }
    fetchUserInfo();
  }, []);

  if (loadingComplete) {
    return (
      <BrowserRouter history={history}>
        <SnackbarProvider maxSnack={3}>
        <CssBaseline>
          <Routes>
            <Route
              path="/student"
              element={
                <PrivateRoute isAllowed={!!curUser && !isAdmin && !!String(roomId)}>
                  <StudentPage socket={socket}
                               curUser={curUser}
                               roomId={String(roomId)}
                               setSocketFlag={(e) => setSocketFlag(e)}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/teacher"
              element={
                <PrivateRoute isAllowed={!!curUser && isAdmin && !!String(roomId)}>
                  {/* <TeacherPage fileUploadHandler={uploadFileFormHandler}/> */}
                  <TeacherPage  socket={socket}
                                curUser={curUser}
                                roomId={String(roomId)}
                                setSocketFlag={(e) => setSocketFlag(e)}
                  />
                </PrivateRoute>
              }
            />
            <Route
              exact
              path="/rooms"
              element={
                <PrivateRoute isAllowed={!!curUser && !roomId}>
                   <RoomPage
                      curUser={curUser}
                      isAdmin={isAdmin}
                      setRoomId={(e) => setRoomId(e)}
                      socket={socket}
                      setSocketFlag={(e) => setSocketFlag(e)}
                    />
                </PrivateRoute>
              }
            />
            <Route
              exact
              path="/login"
              element={
                <LoginPage
                  curUser={curUser}
                  isAdmin={isAdmin}
                  roomId={roomId}
                  setIsAdmin={(e) => setIsAdmin(e)}
                  socket={socket}
                />
              }
            />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </CssBaseline>
        </SnackbarProvider>
      </BrowserRouter>
    );
  } else {
    return <p>fetching user data</p>;
  }
}

export default App;
