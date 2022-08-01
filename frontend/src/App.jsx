import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { SnackbarProvider } from 'notistack';
// [kw]
import React from 'react';
import { socket } from "./_services";

import "./App.css";
import {
  history,
  Role,
} from "./_helpers";
import { authenticationService, getCurrentUser } from "./_services";
import { PrivateRoute } from "./_components";

import StudentPage from "./StudentPage";

import LoginPage from "./LoginPage";
import { CssBaseline } from "@mui/material";
import TeacherPage from "./TeacherPage";

import { storage } from "./_components/FireBase";
import { ref } from "@firebase/storage"
import { ref as fileStorageRef, uploadBytesResumable, getDownloadURL } from "@firebase/storage";
import RoomPage from "./RoomPage";

const uploadFileFormHandler = (event) => {
  event.preventDefault();
  const file = event.target[0].files[0];
  uploadFile(file);
};

const uploadFile = (f) => {
  if (!f) {
    console.log('Upload failed. Try a different file.');
  }
  const fileStorageRef = ref(storage, `/files/${f.name}`);
  const uploadFileTaskStatus = uploadBytesResumable(fileStorageRef, f);
  uploadFileTaskStatus.on(
    "state_changed",
    (u) => {
      let p = 100;
      if (u.totalBytes > 0) {
        p = Math.round((u.bytesTransferred / u.totalBytes) * 100);
      }
    },
    (err) => console.log(err),
    () => {
      // when the file is uploaded successfully:
      getDownloadURL(uploadFileTaskStatus.snapshot.ref)
        .then((url) => console.log(url));
      f.text().then((text) => console.log(text));
    }
  );
};

function logout() {
  authenticationService.logout();
  history.push("/login");
}

// let subscriber = null
// let endpoint = null
// webhookService.subscribe("classtest", (err, res) => {
//   if (err) console.log(err);
//   console.log(res)
//   subscriber = res.id
//   webhookService.addEndpoint(subscriber, "http://localhost:8080/webhook/helprequesttest", ["help.requested"], (err, res) => {
//     if (err) console.log(err);
//     console.log(res)
//     endpoint = res.id
//   })
// })


function App() {
  const [curUser, setCurUser] = useState(() => "");
  const [roomId, setRoomId] = useState(() => "");
  const [userRoom, setUserRoom] = useState(() => null)
  const [isAdmin, setIsAdmin] = useState(() => "");
  const [loadingComplete, setLoadingComplete] = useState(() => false);

  if(!socket.connected){
    socket.connect()
    console.log(`APP - current socket id: ${socket.id}, ${socket.connected}`)
  } else {
    console.log(`APP - current socket id: ${socket.id}, ${socket.connected}`)
  }
  // socket.on("connect", () => {
  //   // if(!socket.id) socket.connect()
  //   console.log("[form App]socket.id: " ,socket.connected, socket.id);
  // }, []);

  // student sync
  // console.log("[form App]socket.id: " ,socket.connected, socket.id);

  useEffect(() => {
    async function fetchUserInfo() {
      const user = await getCurrentUser()
      console.log(user)
      await authenticationService.currentUser.subscribe((x) => {
        console.log(x)
        setCurUser(x ? x.username : null);
        setUserRoom(x ? x.roomHost : null);
        setRoomId(x ? x.roomHost : "");
        setIsAdmin(x && x.role === Role.Admin);
        setLoadingComplete(true)
      });
    }
    fetchUserInfo()
  }, []);

  if (loadingComplete) {
    console.log(curUser)
    console.log(isAdmin)
    console.log(userRoom)
    return (
      <BrowserRouter history={history}>
        <SnackbarProvider maxSnack={3}>
        <CssBaseline>
          <Routes>
            <Route
              path="/student"
              element={
                <PrivateRoute isAllowed={!!curUser && !isAdmin && !!userRoom}>
                  <StudentPage socket={socket}
                               curUser={curUser}
                               userRoom={userRoom}
                               roomId={String(roomId)}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/teacher"
              element={
                <PrivateRoute isAllowed={!!curUser && isAdmin && !!userRoom}>
                  {/* <TeacherPage fileUploadHandler={uploadFileFormHandler}/> */}
                  <TeacherPage  socket={socket} 
                                curUser={curUser}
                                userRoom={userRoom}
                                roomId={String(roomId)}
                  />
                </PrivateRoute>
              }
            />
            <Route
              exact
              path="/rooms"
              element={
                <PrivateRoute isAllowed={!!curUser && !userRoom}>
                  <RoomPage
                    curUser={curUser}
                    isAdmin={isAdmin}
                    userRoom={userRoom}
                    setUserRoom={(e) => setUserRoom(e)}
                    setRoomId={(e) => setRoomId(e)}
                    socket={socket}
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
                  userRoom={userRoom}
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
    return (<p>fetching user data</p>)
  }
}

export default App;
