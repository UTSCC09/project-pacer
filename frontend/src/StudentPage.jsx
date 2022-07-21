import { useCallback, useState, useEffect } from "react";
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
// import { socket } from "./_services";
import CodeExecutionResWidgit from "./components/CodeExecutionResWidgit";

const drawerWidth = 200;

var request = false;
var adminId = "";

// function StudentPage({ uploadFileFormHandlers, socket }) {
function StudentPage({ uploadFileFormHandler, socket, curUser }) {
  const [code, setCode] = useState(() => "console.log('hello world!');");
  const [language, setLanguage] = useState(() => "javascript");
  const [flag, setFlag] = useState(() => false);
  const [lecCode, setLecCode] = useState(
    () => "console.log('hello students!');"
  );
  const [out, setOut] = useState(() => null);
  const [err, setErr] = useState(() => null);

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
  


  // useEffect(() => {
  //   socket.emit("set attributes", "student", curUser);
  // },[]);


  useEffect(() => {
    // socket.on("connect", () => {
    //   console.log("[Client - student] Open - socket.id: " + socket.id);
    //   console.log("[Client - student] Check connection: " + socket.connected);
    // });

    console.log("[StudentPage] socket id:", socket.id)

    socket.emit("set attributes", "student", curUser);

    socket.volatile.emit('student join', curUser);


    socket.on("connection broadcast", (SktId, role, curUser) => {
      // todo: here is the data for webRTC implementation
      console.log(`connection broadcast: new user: ${curUser} (socket id: ${SktId}) joined as ${role}`);
    });

    socket.on("disconnection broadcast", (SktId, role, curUser) => {
      console.log(`disconnection broadcast: ${role} - ${curUser} (socket id: ${SktId})`);
    });

    socket.on("teacher join", (tSktId) => {
      // todo-kw: revisit this setting
      adminId = tSktId;
      socket.emit('student join', curUser);
      console.log("[StudentPage - teacher join] join request from student: ", socket.id);
    });

    socket.on("fetch request", (Id) => {
      request = true;
      setFlag(true)
      adminId = Id;
      // socket.emit("fetch init", code);
      console.log("emitted code", code);
      // console.log("request received, ready!!", code);
    });

    socket.on("stop request", () => {
      request = false;
      setFlag(false)
      adminId = "";
      console.log("Thanks for the help!!", request, adminId);
    });

    socket.on("onChange", (value, adminId) => {
      if (request) setCode(value);
    });

    socket.on("onLecChange", (value, id) => {
      console.log(`from student page: before teacher's code ${lecCode}`)
      setLecCode(value);
      console.log(`from student page: teacher's code ${lecCode}`)
    });

    console.log("load student page complete");
  }, []);

  useEffect(() => {
      socket.emit("fetch init", code);
  },[flag])




  const onChange = (value, viewUpdate) => {
    // console.log("value:", value);
    const editor = viewUpdate.state.values[0].prevUserEvent;

    if (request && editor) {
      socket.emit("onChange", value, adminId);
    }
    setCode(value);
  };


  // socket.on("onLecChange", (value, id) => {
  //   setLecCode(value);
  // });


  const run = () => {
    const { out, err } = runCode(code, language);
    setOut(out);
    setErr(err);
  };


  const clearExecutionRes = () => {
    setOut(null);
    setErr(null);
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
      <StudentRightMenu drawerWidth={drawerWidth} socket={socket} />
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
