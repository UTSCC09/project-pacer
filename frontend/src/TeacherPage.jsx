import { useCallback, useState, useEffect, cloneElement, useRef } from "react";
import Peer from "simple-peer";
import CodeMirror from "@uiw/react-codemirror";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import EditorOptionsBar from "./components/EditorOptions";
import Toolbar from "@mui/material/Toolbar";
import Stack from "@mui/material/Stack";
import Storage from "./components/Storage";

import { upperPythonKeys, lowerPythonKeys, javaKeys } from "./_helpers";

import { EditorState, Compartment } from "@codemirror/state";
import { python, pythonLanguage } from "@codemirror/lang-python";
import { CompletionContext } from "@codemirror/autocomplete";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { java, javaLanguage } from "@codemirror/lang-java";
import { authenticationService, getAllRooms } from "./_services";
import TeacherRightMenu from "./components/TeacherRightMenu";
import runCode from "./_helpers/codeRunner";
// [kw]
import React from "react";
// import { socket } from "./_services";
import CodeExecutionResWidgit from "./components/CodeExecutionResWidgit";

// for file up/downloading (via fb):
import { storage } from "./_components/FireBase";
import { ref, uploadBytesResumable, getDownloadURL } from "@firebase/storage";

const drawerWidth = 200;
var sid = "";

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};


// for cloud sync (via fb) [experimental - TODO]:
let t = 0; // ns

// let StudentEditor = cloneElement(CodeMirror, {value:"", height:"600px", theme:"dark", hint:"true"})

function TeacherPage({ socket, curUser }) {
  const [code, setCode] = useState("");
  const [codePath, setCodePath] = useState("");
  const [codeFilename, setCodeFilename] = useState("");
  const [stuCode, setStuCode] = useState(() => "no student here");
  const [language, setLanguage] = useState(() => "javascript");
  const [displayStudent, setDisplayStudent] = useState(() => false);
  const [studentName, setStudentName] = useState(() => "");
  const [out, setOut] = useState(() => null);
  const [err, setErr] = useState(() => null);
  const [stuOut, setStuOut] = useState(() => null);
  const [stuErr, setStuErr] = useState(() => null);
  const [stuJoin, setStuJoin] = useState(() => {});
  const [connectedUsers, setConnectedUsers] = useState(() => []);
  const [callStream, setCallStream] = useState(() => null);
  const [receivingCall, setReceivingCall] = useState(() => false);
  const [caller, setCaller] = useState(() => "");
  const [callerSignal, setCallerSignal] = useState(() => null);
  const [callAccepted, setCallAccepted] = useState(() => false);

  const localAudio = useRef();
  const remoteAudio = useRef();

  let extensions = [javascript({ jsx: true })];
  if (language === "javascript") {
    extensions[0] = javascript({ jsx: true });
  } else if (language === "python") {
    extensions[0] = python();
    extensions[1] = globalPythonCompletions;
  } else {
    extensions[0] = java();
    extensions[1] = globalJavaScriptCompletions;
  }


  // for cloud sync (via fb) [experimental - TODO]:
  // useEffect(() => {
  //   setTimeout(() => {
  //     if (t == 1) {
  //       t = 0;
  //       const f = new File([code], codeFilename);
  //       uploadFile(f);
  //     } else {
  //       t++;
  //     }
  //   }, 1000);
  // });


  // for file uploading (via fb):
  const uploadFileFormHandler = (event) => {
    event.preventDefault();
    uploadFile(event.target[0].files[0]).then((res) => {
      res.file.text().then((code) => {
        setCode(code);
        setCodePath(res.codePath);
        setCodeFilename(res.file.name);
      });
    });
  };


  // for file uploading (via fb):
  const uploadFile = (f) => {
    return new Promise(function (res, rej) {
      if (!f) {
        console.log("Upload failed. Try a different file.");
        rej();
      }
      const cp = `/files/users/${authenticationService.currentUser.source._value.username}/${f.name}`;
      const fileStorageRef = ref(storage, cp);
      const uploadFileTaskStatus = uploadBytesResumable(fileStorageRef, f);
      uploadFileTaskStatus.on(
        "state_changed",
        (u) => {
          let p = 100;
          if (u.totalBytes > 0) {
            p = Math.round((u.bytesTransferred / u.totalBytes) * 100);
          }
        },
        (err) => {
          console.log(err);
          rej();
        },
        () => {
          // when the file is uploaded successfully:
          //getDownloadURL(uploadFileTaskStatus.snapshot.ref).then((url) => console.log(url));
          res({ file: f, codePath: cp });
        }
      );
    });
  };


  // for file downloading (via fb):
  const makeDownloadFileRequest = (url) => {
    return new Promise(function (res, rej) {
      let xhr = new XMLHttpRequest();
      // handle xhr response:
      xhr.responseType = "text";
      xhr.onload = (event) => {
        if (xhr.status == 200) {
          res({ code: xhr.response });
        } else {
          console.log(xhr.status);
          rej();
        }
      };
      xhr.onerror = () => {
        console.log(xhr.status);
        rej();
      };
      xhr.open("GET", url);
      xhr.send(); // is xhr onload async
    });
  };

  // for file downloading (via fb):
  const downloadFile = (fileLocation) => {
    const fileStorageRef = ref(storage, fileLocation);
    return getDownloadURL(fileStorageRef).then((url) =>
      makeDownloadFileRequest(url)
    );
  };


  useEffect(() => {
    if(!socket.id) socket.connect()

    console.log("[TeacherPage] socket id:", socket.id);

    socket.emit("set attributes", "teacher", curUser);

    socket.emit("onLecChange", code);

    socket.emit("teacher join");

    socket.on("connection broadcast", (SktId, role, curUser) => {
      if (connectedUsers.includes({ curUser, SktId })) {
        console.log(
          `[join broadcast]: user: ${curUser} already joined (socket id: ${SktId})`
        );
      } else {
        setConnectedUsers(eixstingUsers => [...eixstingUsers, { curUser, SktId }]);
        console.log(
          `[join broadcast]: new user: ${curUser} (socket id: ${SktId}) joined as ${role}`
        );
        // console.log([...connectedUsers]);
      }
    });

    socket.on("disconnection broadcast", (SktId, role, curUser) => {
      //console.log({ curUser, SktId });
      setConnectedUsers(eixstingUsers => {
        const userCopy = [...eixstingUsers];
        const idx = userCopy.findIndex((user) => user.SktId === SktId);
        if (idx >= 0) {
          console.log("clearing");
          userCopy.splice(idx, 1);
        }
        return userCopy
      });
      
      if(SktId) setDisplayStudent(false)
      console.log(
        `[disconnection broadcast]: ${role} - ${curUser} (socket id: ${SktId})`
      );
    });


    socket.on("student join", (sSktId, username) => {
      console.log(
        "[TeacherPage - student join] joining student socket id: ",
        sSktId,
        " and student name: ",
        username
      );
      setConnectedUsers(eixstingUsers => [...eixstingUsers, { curUser: username, SktId: sSktId }]);
      // todo: use stuJoin(username here) store joined sutdents to backend
      socket.emit("onLecChange", code);
      setStuJoin({ sSktId: username });
    });

    socket.on("fetch init", (code) => {
      // console.log("student code:",code)
      setStuCode(code);
    });

    socket.on("onChange", (value, id) => {
      // console.log("[onChange] value: " + value);
      // console.log("editor id " + sid);
      sid = id;
      setStuCode(value);
    });

    socket.on("no student", (msg) => {
      console.log("no student get called");
      sid = "";
      setStuCode(msg);
    });

    console.log("load teacher page complete");

    // for file downloading (via fb):
    if (code === "" && codePath === "" && codeFilename === "") {
      let cp = "/files/defaults/yteacher.txt";
      downloadFile(cp)
        .then((res) => {
          const f = new File([res.code], "whateveryouwant.txt");
          return uploadFile(f);
        })
        .then((res) => {
          res.file.text().then((code) => {
            setCode(code);
            setCodePath(res.codePath);
            setCodeFilename(res.file.name);
          });
        });
    } // for when code + codePath correspond to session, so an uploaded file can take over code slide

    socket.on("hey", (data) => {
      console.log("teacher new call intercepted")
      console.log(`caller is ${data.from}`)
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
      console.log(data.stream)
    })
  }, []);


  const onChange = (value, viewUpdate) => {
    socket.emit("onLecChange", value);
    setCode(value);
  };


  const onStuChange = (value, viewUpdate) => {
    const editor = viewUpdate.state.values[0].prevUserEvent;
    setStuCode(value);
    if (editor) socket.emit("onChange", value, sid);
  };


  const run = () => {
    console.log(code);
    const { out, err } = runCode(code, language);
    setOut(out);
    setErr(err);
  };


  const clearExecutionRes = () => {
    setOut(null);
    setErr(null);
  };


  const runStuCode = () => {
    console.log(stuCode);
    const { out, err } = runCode(stuCode, language);
    setStuOut(out);
    setStuErr(err);
  };


  const clearStuExecutionRes = () => {
    setStuOut(null);
    setStuErr(null);
  };

  const acceptCall = async () => {
    console.log("seting up call");
    const localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    setCallStream(localStream);
    if (localAudio.current) {
      localAudio.current.srcObject = localStream;
      console.log("done setting local stream")
    }
    console.log(callStream)
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      config: servers,
      stream: localStream,
    });
    peer.on("signal", data => {
      console.log("teacher call signal accepted")
      socket.emit("acceptCall", { signal: data, to: caller })
    })

    peer.on("stream", stream => {
      console.log("teacher remote call stream updated")
      remoteAudio.current.srcObject = stream;
    });

    peer.signal(callerSignal);
  }

  let LocalAudio;
  if (callStream) {
    console.log("local video updated")
    LocalAudio = (
      <audio playsInline muted ref={localAudio} autoPlay />
    );
  }

  let RemoteAudio;
  if (callAccepted) {
    console.log("remote video updated")
    RemoteAudio = (
      <audio playsInline ref={remoteAudio} autoPlay />
    );
  }

  let incomingCall;
  if (receivingCall) {
    incomingCall = (
      <div>
        <h1>{caller} is calling you</h1>
        <button onClick={acceptCall}>Accept</button>
      </div>
    )
  }

  return (
    <>
      <Box
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Grid container spacing={2}>
          {displayStudent ? (
            <Grid item xs={6}>
              <Grid
                container
                direction="column"
                alignItems="stretch"
                rowSpacing={1}
                columnSpacing={3}
              >
                <Grid item xs={12}>
                  <p>Code session for student {studentName}:</p>
                </Grid>
                {/* server display */}
                <Grid item xs={12}>
                  <CodeMirror
                    value={stuCode}
                    height="600px"
                    theme="dark"
                    extensions={extensions}
                    onChange={onStuChange}
                    hint="true"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Stack spacing={2} direction="row">
                    <Button onClick={runStuCode} variant="contained">
                      Run
                    </Button>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <CodeExecutionResWidgit
                    out={stuOut}
                    err={stuErr}
                    clear={clearStuExecutionRes}
                  />
                </Grid>
              </Grid>
            </Grid>
          ) : null}

          <Grid item xs={displayStudent ? 6 : 12}>
            <Grid
              container
              direction="column"
              alignItems="stretch"
              rowSpacing={4}
              columnSpacing={3}
            >
              <Grid item xs={12}>
                <EditorOptionsBar
                  language={language}
                  onLanguageChange={(e) => setLanguage(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <p>Client Screen (local):</p>
              </Grid>
              <Grid item xs={12}>
                {/* client display */}
                <CodeMirror
                  value={code}
                  height="600px"
                  theme="dark"
                  extensions={extensions}
                  onChange={onChange}
                  hint="true"
                />
              </Grid>
              <Grid item xs={12}>
                <Stack
                  spacing={3}
                  direction="row"
                  justifyContent="center"
                  alignItems="space-evenly"
                >
                  <Button onClick={run} variant="contained">
                    Run
                  </Button>
                  <Storage value={code}></Storage>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <form onSubmit={uploadFileFormHandler}>
                  <input type="file" className="input" />
                  <button type="submit">Upload</button>
                </form>
              </Grid>
              <Grid item xs={12}>
                <CodeExecutionResWidgit
                  out={out}
                  err={err}
                  clear={clearExecutionRes}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <TeacherRightMenu
        drawerWidth={drawerWidth}
        setDisplayStudent={setDisplayStudent}
        setStudentName={setStudentName}
        connectedUsers={connectedUsers}
        socket={socket}
      />
      <Stack className="hidden" direction="row">{LocalAudio}{RemoteAudio}</Stack>
      <Stack>
        {incomingCall}
      </Stack>
    </>
  );
}

function myPythonCompletions(context: CompletionContext) {
  let word = context.matchBefore(/\w*/);
  if (word.from == word.to && !context.explicit) return null;
  if (
    word.text[0] === word.text[0].toUpperCase() &&
    /^[a-zA-Z]+$/.test(word.text[0])
  ) {
    return {
      from: word.from,
      options: upperPythonKeys,
    };
  }
  return {
    from: word.from,
    options: lowerPythonKeys,
  };
}

function myJavaCompletions(context: CompletionContext) {
  let word = context.matchBefore(/\w*/);
  if (word.from == word.to && !context.explicit) return null;
  return {
    from: word.from,
    options: javaKeys,
  };
}

const globalPythonCompletions = pythonLanguage.data.of({
  autocomplete: myPythonCompletions,
});

const globalJavaScriptCompletions = javaLanguage.data.of({
  autocomplete: myJavaCompletions,
});

export default TeacherPage;
