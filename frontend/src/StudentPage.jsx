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
import CallIcon from '@mui/icons-material/Call';

import { upperPythonKeys, lowerPythonKeys, javaKeys } from "./_helpers";

import { EditorState, Compartment } from "@codemirror/state";
import { python, pythonLanguage } from "@codemirror/lang-python";
import { CompletionContext } from "@codemirror/autocomplete";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { java, javaLanguage } from "@codemirror/lang-java";
import { authenticationService } from "./_services";
import runCode from "./_helpers/codeRunner";
// [kw]
import React from "react";
import { socket } from "./_services";
import CodeExecutionResWidgit from "./components/CodeExecutionResWidgit";
import "./StudentPage.css";

const drawerWidth = 200;

var request = false;
var adminId = "";

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

function StudentPage({ uploadFileFormHandler }) {
  const [code, setCode] = useState(() => "console.log('hello world!');");
  const [language, setLanguage] = useState(() => "javascript");
  const [lecCode, setLecCode] = useState(
    () => "console.log('hello students!');"
  );
  const [out, setOut] = useState(() => null);
  const [err, setErr] = useState(() => null);
  const [callStream, setCallStream] = useState(() => null);
  const [receivingCall, setReceivingCall] = useState(() => false);
  const [caller, setCaller] = useState(() => "");
  const [callerSignal, setCallerSignal] = useState(() => null);
  const [callAccepted, setCallAccepted] = useState(() => false);

  const localVideo = useRef();
  const remoteVideo = useRef();

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

  // const onChange = useCallback((value, viewUpdate) => {
  //   console.log('value:', value);
  //   const editor = viewUpdate.state.values[0].prevUserEvent

  //   setCode(value)

  //   if (request && editor){
  //     socket.emit('onChange', value, adminId)
  //   }

  // }, []);

  // [kw]
  useEffect(() => {
    socket.on("connect", () => {
      console.log("[Client - student] Open - socket.id: " + socket.id);
      console.log("[Client - student] Check connection: " + socket.connected);
    });

    socket.on("fetch request", (Id) => {
      request = true;
      adminId = Id;
      // socket.emit('onChange',code, Id)
      console.log("request received, ready!!", code);
    });

    socket.on("stop request", () => {
      request = false;
      adminId = "";
      // socket.emit("close student", adminId)
      console.log("Thanks for the help!!", request, adminId);
    });

    socket.on("onChange", (value, adminId) => {
      if (request) setCode(value);
    });

    socket.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    })

    console.log("load student page complete");
  }, []);

  useEffect(() => {
    socket.emit("set attributes", "user");
  });

  const onChange = (value, viewUpdate) => {
    console.log("value:", value);
    const editor = viewUpdate.state.values[0].prevUserEvent;

    if (request && editor) {
      socket.emit("onChange", value, adminId);
    }
    setCode(value);
  };

  socket.on("onLecChange", (value, id) => {
    setLecCode(value);
  });
  // end of [kw]

  const run = () => {
    const { out, err } = runCode(code, language);
    setOut(out);
    setErr(err);
  };

  const clearExecutionRes = () => {
    setOut(null);
    setErr(null);
  };

  const setupCall = async (teacherSocketId) => {
    console.log(teacherSocketId)
    console.log("seting up call")
    const localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    console.log("hardware setup complete")
    setCallStream(localStream)
    if (localVideo.current) {
      localVideo.current.srcObject = localStream;
    }
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: callStream
    })
    
    peer.on("signal", data => {
      socket.emit("callUser", {userToCall: teacherSocketId, signalData: data, from: "yourID"}) //yourID
    })

    peer.on("stream", stream => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = stream;
      }
    })

    socket.on("callAccepted", signal => {
      setCallAccepted(true);
      peer.signal(signal);
    })
  }

  const acceptCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      config: servers,
      stream: callStream,
    });
    peer.on("signal", data => {
      socket.emit("acceptCall", { signal: data, to: caller })
    })

    peer.on("stream", stream => {
      remoteVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
  }

  let LocalVideo;
  if (callStream) {
    LocalVideo = (
      <video playsInline muted ref={localVideo} autoPlay />
    );
  }

  let RemoteVideo;
  if (callAccepted) {
    RemoteVideo = (
      <video playsInline ref={remoteVideo} autoPlay />
    );
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
          <Grid item xs={6}>
            <Grid
              container
              direction="column"
              alignItems="stretch"
              rowSpacing={1}
              columnSpacing={3}
            >
              <Grid item xs={12}>
                <p>Server Screen (remote):</p>
              </Grid>
              {/* server display */}
              {/* <CodeMirror value="" height="600px" theme="dark" hint="true" /> */}
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
            </Grid>
          </Grid>
          <Grid item xs={6}>
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
      <StudentRightMenu drawerWidth={drawerWidth} />
      <Stack direction="row">{LocalVideo}{RemoteVideo}</Stack>
      <button className="call-button" onClick={() => setupCall("testid")}>Call</button>
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
