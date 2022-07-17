import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
// [kw]
import React from 'react';

import "./App.css";
import {
  history,
  Role,
} from "./_helpers";
import { authenticationService, getCurrentUser, webhookService } from "./_services";
import { PrivateRoute } from "./_components";

import StudentPage from "./StudentPage";

import LoginPage from "./LoginPage";
import { CssBaseline } from "@mui/material";
import TeacherPage from "./TeacherPage";

import { storage } from "./_components/FireBase";
import { ref } from "@firebase/storage"
import { ref as fileStorageRef, uploadBytesResumable, getDownloadURL } from "@firebase/storage";

function logout() {
  authenticationService.logout();
  history.push("/login");
}

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
  const [isAdmin, setIsAdmin] = useState(() => "");
  const [loadingComplete, setLoadingComplete] = useState(() => false);

  useEffect(() => {
    async function fetchUserInfo() {
      const user = await getCurrentUser()
      console.log(user)
      // setCurUser(user.username)
      // setIsAdmin(user.role)
      // console.log(curUser)
      await authenticationService.currentUser.subscribe((x) => {
        console.log(x)
        setCurUser(x ? x.username : null);
        setIsAdmin(x && x.role === Role.Admin);
      });
      setLoadingComplete(true)
    }
    fetchUserInfo()
  }, []);

  if (loadingComplete) {
    console.log(curUser)
    console.log(isAdmin)
    return (
      <BrowserRouter history={history}>
        <CssBaseline>
          <Routes>
            <Route
              path="/student"
              element={
                <PrivateRoute isAllowed={!!curUser && !isAdmin}>
                  <StudentPage fileUploadHandler={uploadFileFormHandler}/>
                </PrivateRoute>
              }
            />
            <Route
              path="/teacher"
              element={
                <PrivateRoute isAllowed={!!curUser && isAdmin}>
                  <TeacherPage fileUploadHandler={uploadFileFormHandler}/>
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
                  setIsAdmin={(e) => setIsAdmin(e)}
                />
              }
            />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </CssBaseline>
      </BrowserRouter>
    );
  } else {
    return (<p>fetching user data</p>)
  }
}

export default App;
