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
import "./CodePage.css";


// for file up/downloading (via fb):
import { storage } from "./_components/FireBase";
import { ref, uploadBytesResumable, getDownloadURL } from "@firebase/storage";
import { display } from "@mui/system";

const drawerWidth = 200;
// for cloud sync (via fb) [experimental - TODO]:
let t = 0; //ns


function TeacherPage({ socket, curUser, userRoom }) {
  // code mirror config
  const [language, setLanguage] = useState(() => "javascript");
  const [displayStudent, setDisplayStudent] = useState(() => false);
  // code display and transmission
  const [code, setCode] = useState("");
  const [stuCode, setStuCode] = useState(() => "no student here");
  // execution
  const [out, setOut] = useState(() => null);
  const [err, setErr] = useState(() => null);
  const [stuOut, setStuOut] = useState(() => null);
  const [stuErr, setStuErr] = useState(() => null);
  // save and load
  const [codePath, setCodePath] = useState("");
  const [codeFilename, setCodeFilename] = useState("");
  // audio call
  // const [stuJoin, setStuJoin] = useState(() => {});
  const [studentName, setStudentName] = useState(() => "");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [callStream, setCallStream] = useState(() => null);
  const [callSystemInited, setCallSystemInited] = useState(() => false);
  const [callInprogress, setCallInprogress] = useState(() => false);
  const [peers, setPeers] = useState(() => []);

  const localAudio = useRef();
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
  // todo-kw: uncomment this
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

    // if(!socket.id) socket.connect() 

    socket.emit("set attributes", "teacher", curUser);

    // socket.emit("onLecChange", code);

    socket.emit("teacher join");

    socket.on("connection broadcast", (SktId, role, curUser) => {
      // add newly connected student
      if (connectedUsers.includes({ curUser, SktId })) {
        console.log(
          `[join broadcast]: user: ${curUser} already joined (socket id: ${SktId})`
        );
      // } else if( role === 'student') { // new
      } else { // new
        setConnectedUsers(eixstingUsers => [...eixstingUsers, { curUser, SktId }]);
        console.log(
          `[join broadcast]: new user: ${curUser} (socket id: ${SktId}) joined as ${role}`
        );
      }
      // init remote window on student's end
      setDisplayStudent(display => {
        // emit teacher's code if not on review mode
        if (!display){
          setCode(currentCode => {
            socket.emit("onLecChange", currentCode);
            return currentCode;
          });
        } else { // emit student's code if on review mode
          setStuCode(curStuCode => {
            socket.emit("onLecChange", curStuCode);
            return curStuCode;
          })
        }
        return display;
      });

    });

    socket.on("disconnection broadcast", (SktId, role, curUser, curSid) => {
      setConnectedUsers(eixstingUsers => {
        const userCopy = [...eixstingUsers];
        const idx = userCopy.findIndex((user) => user.SktId === SktId);
        if (idx >= 0) {
          console.log("clearing");
          userCopy.splice(idx, 1);
        }
        return userCopy
      });
    
      if(SktId === curSid) {
        setDisplayStudent(false);
        socket.sid = "";
      }

      console.log(`[disconnection broadcast]: ${role} - ${curUser} (socket id: ${SktId})`);
    });

    socket.on("student join", (sSktId, username) => {
      console.log(
        "[TeacherPage - student join] joining student socket id: ", sSktId,
        " and student name: ", username
      );
      // add connected student
      if (!connectedUsers.includes({ curUser: username, sSktId }))
        setConnectedUsers(eixstingUsers => [...eixstingUsers, { curUser: username, SktId: sSktId }]);
      // init teacher code on student's window
      socket.emit("onLecChange", code)
    });

    socket.on("fetch init", (code, sid) => {
      socket.sid = sid;
      socket.on = true;

      setStuCode(() => {
        socket.emit("onLecChange", code);
        return code;
      });
    });

    socket.on("onChange", (value, id) => {
      setStuCode(() => {
        socket.emit("onLecChange", value);
        return value;
      });
    });

    // todo-kw: revisit this function - may be useless given current logic
    socket.on("no student", (msg) => {
      socket.sid = "";
      socket.on = true;
      setStuCode(msg);
    });

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

    console.log("load teacher page complete");
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


  // new
  useEffect(() => {
    if(!displayStudent) socket.emit("onLecChange", code);
    
    if(displayStudent) socket.emit("onLecChange", stuCode);
    
  },[displayStudent]);


  const onChange = (value, viewUpdate) => {
    if (!displayStudent) socket.emit("onLecChange", value);
    setCode(value);
  };


  const onStuChange = (value, viewUpdate) => {
    const editor = viewUpdate.state.values[0].prevUserEvent;
    if (editor) {
      socket.emit("onChange", value, socket.sid);
      socket.emit("onLecChange", value);
    }
    setStuCode(value);
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
        connectedUsers={connectedUsers.filter((user) => user.curUser !== curUser)}
        setConnectedUsers={setConnectedUsers}
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
