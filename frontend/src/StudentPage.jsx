import { useCallback, useState, useEffect, useRef } from "react";
import Peer from "simple-peer";
import CodeMirror from "@uiw/react-codemirror";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Stack from "@mui/material/Stack";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import EditorOptionsBar from "./components/EditorOptions";
import Toolbar from "@mui/material/Toolbar";
import StudentRightMenu from "./components/StudentRightMenu";
import Storage from "./components/Storage";
import CallIcon from "@mui/icons-material/Call";
import CloseIcon from '@mui/icons-material/Close';

// for file up/downloading (via fb):
import { storage } from "./_components/FireBase";
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject, getMetadata } from "@firebase/storage";
import { upperPythonKeys, lowerPythonKeys, javaKeys } from "./_helpers";

import { EditorState, Compartment } from "@codemirror/state";
import { python, pythonLanguage } from "@codemirror/lang-python";
import { CompletionContext } from "@codemirror/autocomplete";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { java, javaLanguage } from "@codemirror/lang-java";
import { authenticationService } from "./_services";
import runCode from "./_helpers/codeRunner";

import React from "react";
// import { socket } from "./_services";
import CodeExecutionResWidgit from "./components/CodeExecutionResWidgit";
import "./CodePage.css";

const drawerWidth = 200;
// for cloud sync (via fb) [experimental - TODO]:
let t = 0; // ns

function StudentPage({ socket, curUser, roomId, setSocketFlag }) {
  // code mirror config
  const [language, setLanguage] = useState(() => "javascript");
  // code display and transmission
  // like a cache: keeping this since downloading & uploading the file on each update is very inefficient
  const [code, setCode] = useState(() => "");
  const [lecCode, setLecCode] = useState(() => "console.log('hello students!');");
  const [flag, setFlag] = useState(() => false);
  // execution
  const [out, setOut] = useState(() => null);
  const [err, setErr] = useState(() => null);
  const [teaOut, setTeaOut] = useState(() => null);
  const [teaErr, setTeaErr] = useState(() => null);
  // save and load
  const [codePath, setCodePath] = useState(""); // set init val to ""
  const [codeFilename, setCodeFilename] = useState("");
  // audio call
  const [callStream, setCallStream] = useState(() => null);
  const [callSystemInited, setCallSystemInited] = useState(() => false);
  const [callInprogress, setCallInprogress] = useState(() => false);
  const [peers, setPeers] = useState(() => []);
  const [codeSaved, setCodeSaved] = useState(() => false);


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
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <audio playsInline autoPlay ref={ref} />
    );
  }

  // for cloud sync (via fb) [experimental - TODO]:
  // todo-kw: uncomment this
  useEffect(() => {
    if (!codeSaved) {
      const f = new File([code], codeFilename);
      uploadFile(f);
      setCodeSaved(true)
      setTimeout(() => {
        setCodeSaved(false)
      }, 2000);
    }
  }, [code]);


  // for file downloading (via fb):
  // const loadCode = () => {
  //   downloadFile(codePath).then((res) => {
  //     // new
  //     if (flag) socket.emit("onChange", res.code, socket.tid, roomId);
  //     setCode(res.code);
  //   });
  // }

  // for file uploading (via fb):
  // const saveCode = () => {
  //   const f = new File([code], codeFilename);
  //   uploadFile(f);
  // }

  // for file maintenance (via fb):
  const getOldestOfTwoInUsersFileDir = () => {
    return new Promise(function (res, rej) {
      const cp = `/files/users/${authenticationService.currentUser.source._value.username}`;
      const fileStorageRef = ref(storage, cp);
      listAll(fileStorageRef).then(function(files) {
        const userFiles = [];
        files.items.forEach(function(fileRef) {
          userFiles.push(fileRef);
        });
        if (userFiles.length == 2) {
          const cp2 = `/files/users/${authenticationService.currentUser.source._value.username}/${userFiles[0].name}`;
          const fileStorageRef2 = ref(storage, cp2);
          getMetadata(fileStorageRef2).then((metadata1) => {
            const cp3 = `/files/users/${authenticationService.currentUser.source._value.username}/${userFiles[1].name}`;
            const fileStorageRef3 = ref(storage, cp3);
            getMetadata(fileStorageRef3).then((metadata2) => {
              const d0 = new Date(metadata1.timeCreated);
              const d1 = new Date(metadata2.timeCreated);
              if (d0 <= d1) {
                res({ fileName: userFiles[0].name });
              } else {
                res({ fileName: userFiles[1].name });
              }
            }).catch((err2) => {
              console.log(err2);
              rej();
            });
          }).catch((err1) => {
            console.log(err1);
            rej();
          });
        } else {
          console.log("Seek adminastrive assistance."); // user has unexpected files in their folder
          rej();
        }
      }).catch(function(err) {
        console.log(err);
        rej();
      });
    });
  };
  
  // for file maintenance (via fb) (deletes the oldest of the 2 files in a user's dir):
  const refreshUsersFileDir = () => {
    return new Promise(function (res, rej) {
      const cp = `/files/users/${authenticationService.currentUser.source._value.username}`;
      const fileStorageRef = ref(storage, cp);
      listAll(fileStorageRef).then(function(files) {
        const userFiles = [];
        files.items.forEach(function(fileRef) {
          userFiles.push(fileRef);
        });
        if (userFiles.length == 2) {
          getOldestOfTwoInUsersFileDir().then((r) => {
            const cp2 = `/files/users/${authenticationService.currentUser.source._value.username}/${r.fileName}`;
            const fileStorageRef2 = ref(storage, cp2);
            deleteObject(fileStorageRef2).then(() => {
              res();
            }).catch((err2) => {
              console.log(err2);
              rej();
            });
          }).catch((err1) => {
            console.log(err1);
            rej();
          });
        } else {
          console.log("Seek adminastrive assistance."); // user has unexpected files in their folder
          rej();
        }
      }).catch(function(err) {
        console.log(err);
        rej();
      });
    });
  };

  // for file uploading (via fb):
  const uploadFileFormHandler = (event) => {
    event.preventDefault();
    uploadFile(event.target.files[0]).then((res) => {
      res.file.text().then((code) => {
        console.log(`[FILE] - reached 197 ${code}`);
        if (flag) socket.emit("onChange", code, socket.tid, roomId);
        setCode(code);
        setCodePath(res.codePath);
        setCodeFilename(res.file.name);
        refreshUsersFileDir();
      });
    });
  };

  // for file maintenance (via fb):
  const getOnlyFilesName = () => {
    return new Promise(function (res, rej) {
      const cp = `/files/users/${authenticationService.currentUser.source._value.username}`;
      const fileStorageRef = ref(storage, cp);
      listAll(fileStorageRef).then(function(files) {
        const userFiles = [];
        files.items.forEach(function(fileRef) {
          userFiles.push(fileRef);
        });
        if (userFiles.length == 1) {
          res({ fileName: userFiles[0].name, codePath: userFiles[0]._location.path });
        } else {
          console.log("Seek adminastrive assistance."); // user has unexpected files in their folder
          rej();
        }
      }).catch(function(err) {
        console.log(err);
        rej();
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

  // for file maintenance (via fb):
  const usersFileDirIsEmpty = () => {
    return new Promise(function (res, rej) {
      const cp = `/files/users/${authenticationService.currentUser.source._value.username}`;
      const fileStorageRef = ref(storage, cp);
      listAll(fileStorageRef).then(function(files) {
        const userFiles = [];
        files.items.forEach(function(fileRef) {
          userFiles.push(fileRef);
        });
        if (userFiles.length == 0) {
          res(true);
        } else {
          res(false);
        }
      }).catch(function(err) {
        console.log(err);
        rej();
      });
    });
  };

  useEffect(() => {

    socket.emit("set attributes", "student", curUser, roomId);

    socket.on("connection broadcast", (SktId, role, curUser) => {
    });

    socket.on("disconnection broadcast", (SktId, role, curUser, curSid) => {
      if (role === 'teacher') socket.tid = "";
      const itemIdx = peersRef.current.findIndex((p) => p.peerID === SktId);
        if (itemIdx >= 0) {
          peersRef.current[itemIdx].peer.removeAllListeners();
          peersRef.current[itemIdx].peer.destroy();
          peersRef.current.splice(itemIdx, 1)
          setPeers((users) => {
            const peerIdx = users.findIndex((p) => p === SktId);
            return users.splice(peerIdx, 1)
          });
        } 
      console.log(`disconnection broadcast: ${role} - ${curUser} (socket id: ${SktId})`);
    });

    socket.on("teacher join", (tid) => {
      socket.tid = tid;
      socket.emit('student join', curUser, roomId);
    });

    socket.on("fetch request", () => {
      setFlag(true);
    });

    socket.on("stop request", () => {
      setFlag(false);
    });

    socket.on("onChange", (value, tid) => {
      setFlag(flag => {
        if (flag) setCode(value);
        return flag;
      });
    });

    socket.on("onLecChange", (value, tid) => {
      if(!socket.tid) socket.tid = tid;
      setLecCode(value);
    });

    socket.on("teacher: execution", (out, err) => {
      setTeaOut(out);
      setTeaErr(err);
    });

    // for file downloading (via fb):
    if (code === "" && codePath === "" && codeFilename === "") {
      usersFileDirIsEmpty().then((res) => {
        if (res) {
          let cp = "/files/defaults/ystudent.txt";
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
        } else {
          getOnlyFilesName().then((res) => {
            downloadFile(res.codePath).then((res2) => {
              setCode(res2.code);
              setCodePath(res.codePath);
              setCodeFilename(res.fileName);
            });
          })
        }
      });
    }

  }, []);


  useEffect(() => {
    if(flag)
      socket.emit("fetch init", code, roomId);
  }, [flag])


  useEffect(() => {
    if (callSystemInited) {
      console.log("initing call system")
      socket.on("all users", (users) => {
        const peers = [];
        users.forEach((userId) => {
          if (userId !== socket.id) {
            const peer = createPeer(userId, socket.id, callStream);
            peersRef.current.push({
              peerID: userId,
              peer,
            });
          peers.push(peer);
          }
            
        });
        console.log(`peers are ${peers}`)
        setPeers(peers);
      });

      socket.on("user joined", (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, callStream);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
        });

        setPeers((users) => [...users, peer]);
      });

      socket.on("receiving returned signal", (payload) => {
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });

      socket.on("user disconnected audio", (socketId) => {
        const itemIdx = peersRef.current.findIndex((p) => p.peerID === socketId);
        if (itemIdx >= 0) {
          peersRef.current[itemIdx].peer.removeAllListeners();
          peersRef.current[itemIdx].peer.destroy();
          peersRef.current.splice(itemIdx, 1)
          setPeers((users) => {
            const peerIdx = users.findIndex((p) => p === socketId);
            return users.splice(peerIdx, 1)
          }); 
        }
      })
    }
  }, [callSystemInited])


  const onChange = (value, viewUpdate) => {
    const editor = viewUpdate.state.values[0].prevUserEvent;
    if (flag && editor) socket.emit("onChange", value, socket.tid, roomId);

    setCode(value);
  };


  const run = async () => {
    const { out, err } = await runCode(code, language);
    setOut(out);
    setErr(err);
  };


  const clearExecutionRes = () => {
    setOut(null);
    setErr(null);
  };

  const setupCall = async () => {
    if (!callInprogress) {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      setCallStream(localStream);
      setCallSystemInited(true);
      if (localAudio.current) {
        localAudio.current.srcObject = localStream;
      }
      socket.emit("joined chat", String(roomId));
      setCallInprogress(true);
    } else {
      setCallStream(null);
      if (localAudio.current) {
        localAudio.current.srcObject = null;
      }
      setCallInprogress(false);
      peersRef.current = []
      setPeers([])
      socket.emit("disconnect audio", String(roomId))
    }
  };


  function createPeer(userTarget, callerID, stream) {
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

    peer.on('close', () => {
      console.log("initiator closed")
    })

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning signal", { signal, callerID });
    });

    peer.on('close', () => {
      console.log("new peer closed")
    })

    peer.signal(incomingSignal);

    return peer;
  }

  let LocalAudio;
  if (callStream) {
    LocalAudio = <audio playsInline muted ref={localAudio} autoPlay />;
  }

  const clearTeaExecutionRes = () => {
    setTeaOut(null);
    setTeaErr(null);
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
          <Grid item xs={6}>
          <Stack
              direction="column"
              spacing={2}
              sx={{maxWidth: "100%"}}
            >
              <Grid item xs={12}>
                <p>Teacher Screen:</p>
              </Grid>
              <Grid item xs={12}>
                <CodeMirror
                  value={lecCode}
                  height="600px"
                  theme="dark"
                  extensions={extensions}
                  hint="true"
                  readOnly="true"
                />
              </Grid>
              <Grid item xs={12}>
                  <CodeExecutionResWidgit
                    out={teaOut}
                    err={teaErr}
                    clear={clearTeaExecutionRes}
                  />
              </Grid>
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Stack
              direction="column"
              spacing={2}
              sx={{maxWidth: "100%"}}
            >
              <Grid item xs={12}>
                <EditorOptionsBar
                  language={language}
                  onLanguageChange={(e) => setLanguage(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <p>Student Screen:</p>
              </Grid>
              <Grid item xs={12}>
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
                  sx={{maxWidth: "100%"}}
                >
                  {language==="java" ? null : 
                  <Button onClick={run} variant="contained">
                    Run
                  </Button>
                  }
                  <Storage uploadFileFormHandler={uploadFileFormHandler}></Storage>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <CodeExecutionResWidgit
                  out={out}
                  err={err}
                  clear={clearExecutionRes}
                />
              </Grid>
            </Stack>
          </Grid>
        </Grid>
      </Box>
      <StudentRightMenu drawerWidth={drawerWidth} 
                        socket={socket}
                        roomId={roomId}
                        setSocketFlag={setSocketFlag} />
      <Stack direction="row">
        {LocalAudio}
        {peers.map((peer, index) => {
          return <Audio key={index} peer={peer} />;
        })}
      </Stack>
      <button className="call-button" onClick={() => setupCall()}>
        {callInprogress ? <CloseIcon fontSize="large"/> : <CallIcon fontSize="large"/>}
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

export default StudentPage;
