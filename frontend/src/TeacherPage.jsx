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
import { authenticationService, getAllRooms, getRoomByHost } from "./_services";
import TeacherRightMenu from "./components/TeacherRightMenu";
import runCode from "./_helpers/codeRunner";
// [kw]
import React from "react";
// import { socket } from "./_services";
import CodeExecutionResWidgit from "./components/CodeExecutionResWidgit";
import "./CodePage.css";


// for file up/downloading (via fb):
import { storage } from "./_components/FireBase";
import { ref, uploadBytesResumable, getDownloadURL } from "@firebase/storage";

const drawerWidth = 200;
var sid = "";

// for cloud sync (via fb) [experimental - TODO]:
let t = 0; // ns

// let StudentEditor = cloneElement(CodeMirror, {value:"", height:"600px", theme:"dark", hint:"true"})

function TeacherPage({ socket, curUser, userRoom }) {
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
  const [callSystemInited, setCallSystemInited] = useState(() => false);
  const [callInprogress, setCallInprogress] = useState(() => false);
  const [peers, setPeers] = useState(() => []);

  const localAudio = useRef();
  const remoteAudio = useRef();
  const peersRef = useRef([]);

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

  const Audio = ({peer}) => {
    const ref = useRef();

    useEffect(() => {
        peer.on("stream", stream => {
            console.log("this is streaming")
            console.log(`stream is ${stream}`)
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <audio playsInline autoPlay ref={ref} />
      );
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
    async function fetchRoomInfoByHost(host) {
      const roomInfo = await getRoomByHost(host);
      if (roomInfo.err) console.log(roomInfo.err);
      else {
        console.log(roomInfo.res);
        // remove current user from the list of users for later code
        let cleanedUsers = [];
        if (roomInfo.res.users) {
            cleanedUsers = roomInfo.res.users.filter(
            (user) => user.socketId !== socket.id
          );
        }
        setConnectedUsers(cleanedUsers);
      }
    }

    // if(!socket.id) socket.connect() 

    console.log("[TeacherPage] socket id:", socket.id);

    socket.emit("set attributes", "teacher", curUser);

    socket.emit("onLecChange", code);

    socket.emit("teacher join");

    socket.on("connection broadcast", (SktId, role, curUser) => {
      // if (connectedUsers.includes({ curUser, SktId })) {
      //   console.log(
      //     `[join broadcast]: user: ${curUser} already joined (socket id: ${SktId})`
      //   );
      // } else {
        setConnectedUsers(eixstingUsers => [...eixstingUsers, { curUser, SktId }]);
        console.log(
          `[join broadcast]: new user: ${curUser} (socket id: ${SktId}) joined as ${role}`
        );
        // console.log([...connectedUsers]);
      // }
    });

    socket.on("disconnection broadcast", (SktId, role, curUser) => {
      //console.log({ curUser, SktId });
      setConnectedUsers(eixstingUsers => {
        const userCopy = [...eixstingUsers];
        const idx = userCopy.findIndex((user) => user.socketId === SktId);
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

  }, []);

  useEffect(() => {
    if (callSystemInited) {
      console.log("initing call system")
      socket.on("all users", (users) => {
        console.log(users)
        const peers = [];
        users.forEach((userId) => {
          console.log(`stream is ${callStream}`)
          const peer = createPeer(userId, socket.id, callStream);
          peersRef.current.push({
            peerID: userId,
            peer,
          });
          peers.push(peer);
        });
        console.log(`peers are ${peers}`)
        setPeers(peers);
      });

      socket.on("user joined", (payload) => {
        console.log("user joined")
        console.log(`stream is ${callStream}`)
        const peer = addPeer(payload.signal, payload.callerID, callStream);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
        });

        setPeers((users) => [...users, peer]);
      });

      socket.on("receiving returned signal", (payload) => {
        console.log("receiving returned signal")
        console.log(peersRef.current)
        console.log(payload.id)
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        console.log(item)
        item.peer.signal(payload.signal);
      });
    }
  }, [callSystemInited])


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

  const setupCall = async () => {
    if (!callInprogress) {
      console.log("seting up call");
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      console.log("hardware setup complete");
      setCallStream(localStream);
      setCallSystemInited(true);
      if (localAudio.current) {
        localAudio.current.srcObject = localStream;
        console.log("done setting local stream");
      }
      socket.emit("joined chat", userRoom);
      setCallInprogress(true);
    } else {
      console.log("closing call");
      
      setCallInprogress(false);
    }
  };

  function createPeer(userTarget, callerID, stream) {
    console.log(`stream is ${stream}`)
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      console.log(
        `student call initiated. Calling from ${socket.id} to ${userTarget}`
      );
      socket.emit("sending signal", { userTarget, callerID, signal });
    });
    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    console.log(`stream is ${stream}`)
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });
    peer.on("signal", (signal) => {
      socket.emit("returning signal", { signal, callerID });
    });
    peer.signal(incomingSignal);

    return peer;
  }


  const clearStuExecutionRes = () => {
    setStuOut(null);
    setStuErr(null);
  };

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
      <Stack direction="row">
      <audio playsInline muted ref={localAudio} autoPlay />
        {peers.map((peer, index) => {
          return <Audio key={index} peer={peer} />;
        })}
      </Stack>
      <button className="call-button" onClick={() => setupCall()}>
        {callInprogress ? "Disconnect" : "Call"}
      </button>
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
