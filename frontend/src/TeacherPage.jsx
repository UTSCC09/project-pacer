import { useCallback, useState, useEffect, cloneElement, useRef } from "react";
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
import { authenticationService } from "./_services";
import TeacherRightMenu from "./components/TeacherRightMenu";
import runCode from "./_helpers/codeRunner";
// [kw]
import React from "react";
// import { socket } from "./_services";
import CodeExecutionResWidgit from "./components/CodeExecutionResWidgit";


const drawerWidth = 200;
var sid = "";

function TeacherPage({ uploadFileFormHandler, socket, curUser }) {
// function TeacherPage({ uploadFileFormHandler }) {
  const [code, setCode] = useState(() => "console.log('Welcome to class!');");
  const [stuCode, setStuCode] = useState(() => "no student here");
  const [language, setLanguage] = useState(() => "javascript");
  const [displayStudent, setDisplayStudent] = useState(() => false);
  const [studentName, setStudentName] = useState(() => "");
  const [out, setOut] = useState(() => null);
  const [err, setErr] = useState(() => null);
  const [stuOut, setStuOut] = useState(() => null);
  const [stuErr, setStuErr] = useState(() => null);
  // stuJoin {'socket id': 'student name', ...}
  // todo: use stuJoin store joined sutdents to backend
  const [stuJoin, setStuJoin] = useState(() => {});


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
  //   socket.emit("set attributes", 'teacher', curUser);
  //   console.log("[Teacher Page]: now it is loaded");
  // }, []);


  useEffect(() => {

    // socket.on("connect", () => {
    //   console.log("[New Client - teacher] Open - socket.id: " + socket.id);
    //   console.log(
    //     "[New Client - teacher] Check connection: " + socket.connected
    //   );
    // });
    console.log("[TeacherPage] socket id:", socket.id)

    socket.emit("set attributes", 'teacher', curUser);

    socket.emit("onLecChange", code);

    socket.emit('teacher join');

    // socket.emit("connection broadcast",'user', curUser );

    socket.on("connection broadcast", (SktId, role, curUser) => {
      console.log(`[join broadcast]: new user: ${curUser} (socket id: ${SktId}) joined as ${role}`);
    });

    socket.on("disconnection broadcast", (SktId, role, curUser) => {
      console.log(`[disconnection broadcast]: ${role} - ${curUser} (socket id: ${SktId})`);
    });


    // socket.on("student join", sSktId => {
    socket.on("student join", (sSktId, username) => {
      console.log("[TeacherPage - student join] joining student socket id: ",sSktId, " and student name: ", username);
      // todo: use stuJoin(username here) store joined sutdents to backend
      socket.emit("onLecChange", code);
      setStuJoin({sSktId: username});
    });

    socket.on("fetch init", (code) => {
      // console.log("student code:",code)
      setStuCode(code);
    });

    socket.on("help request", (stuId, username) => {
      // todo: data for help request implementation
      console.log(`[TeacherPage - help request] student [${username}] need help; student socket id: ${stuId} `)
    });


    socket.on("onChange", (value, id) => {
      console.log("[onChange] value: " + value);
      console.log("editor id " + sid);
      sid = id;
      setStuCode(value);
    });

    socket.on("no student", (msg) => {
      console.log("no student get called");
      sid = "";
      setStuCode(msg);
    });

    console.log("load teacher page complete");
  }, []);


  const onChange = (value, viewUpdate) => {
    console.log("value:", value);
    socket.emit("onLecChange", value);
    setCode(value)
  };


  const onStuChange = (value, viewUpdate) => {
    const editor = viewUpdate.state.values[0].prevUserEvent;
    if (editor) socket.emit("onChange", value, sid);
  };


  const run = () => {
    console.log(code)
    const { out, err } = runCode(code, language);
    setOut(out);
    setErr(err);
  };


  const clearExecutionRes = () => {
    setOut(null);
    setErr(null);
  };


  const runStuCode = () => {
    console.log(stuCode)
    const { out, err } = runCode(stuCode, language);
    setStuOut(out);
    setStuErr(err);
  };


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
                <Stack spacing={2} direction="row">
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
      />
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
