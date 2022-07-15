import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import Storage from './components/Storage';
import { upperPythonKeys, lowerPythonKeys, javaKeys } from './bin/pythonAutoCompleteLib'
import {EditorState, Compartment} from "@codemirror/state"
import { python, pythonLanguage } from '@codemirror/lang-python';
import {CompletionContext} from "@codemirror/autocomplete";
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { java, javaLanguage } from '@codemirror/lang-java'
import './App.css';
import { useState } from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import EditorOptionsBar from './components/EditorOptions';
import RightMenu from './components/RightMenu';
import LoginPage from './components/LoginPage';
import { CssBaseline } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';

import { storage } from "./firebase";
import { ref } from "@firebase/storage"
import { ref as fileStorageRef, uploadBytesResumable, getDownloadURL } from "@firebase/storage";

const drawerWidth = 240;




function App() {
  const [code, setCode] = useState(() => "console.log('hello world!');");
  const [role, setRole] = useState(() => "");
  const [openLogin, setOpenLogin] = useState(() => role !== "");
  const [language, setLanguage] = React.useState(() => 'javascript');

  // for Firebase:
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
        f.text().then((text) => setCode(text));
      }
    );
  };

  let editorLanguage = new Compartment

  const onChange = React.useCallback((value, viewUpdate) => {
    console.log('value:', value);
    setCode(value)
  }, []);

  let extensions = [javascript({ jsx: true })]
  if (language === "javascript") {
    extensions[0] = javascript({ jsx: true })
  } else if (language === "python") {
    extensions[0] = python()
    extensions[1] = globalPythonCompletions
  } else {
    extensions[0] = java()
    extensions[1] = globalJavaScriptCompletions
  }
  return (
    <CssBaseline>
      <LoginPage open={openLogin} setOpen={e => setOpenLogin(e)} role={role} setRole={e => setRole(e)}/>
      <Box sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Grid container rowSpacing={0.5} columnSpacing={3}>
          <Grid item xs={12}><p>Currently logged in as {role}:</p></Grid>
          <Grid item xs={5}>
              <p>Server Screen (remote):</p>
              {/* server display */}
              <CodeMirror
                value=""
                height="600px"
                theme="dark"
                hint="true"
              />
            </Grid>
          <Grid item xs={7}>
            <Grid item xs={12}>
              <EditorOptionsBar language={language} onLanguageChange={e => setLanguage(e.target.value)} />
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
              <Storage value={code}></Storage>
          </Grid>

          </Grid>
        </Grid>
      </Box>
      <RightMenu drawerWidth={drawerWidth} />

      <form onSubmit={uploadFileFormHandler}>
        <input type="file" className="input" />
        <button type="submit">Upload</button>
      </form>

    </CssBaseline>
  );
}

function myPythonCompletions(context: CompletionContext) {
  let word = context.matchBefore(/\w*/)
  if (word.from == word.to && !context.explicit)
    return null
  if (word.text[0] === word.text[0].toUpperCase() && /^[a-zA-Z]+$/.test(word.text[0])) {
    return {
      from: word.from,
      options: upperPythonKeys
    }
  }
  return {
    from: word.from,
    options: lowerPythonKeys
  }
}

function myJavaCompletions(context: CompletionContext) {
  let word = context.matchBefore(/\w*/)
  if (word.from == word.to && !context.explicit)
    return null
  return {
    from: word.from,
    options: javaKeys
  }
}

const globalPythonCompletions = pythonLanguage.data.of({
  autocomplete: myPythonCompletions
})

const globalJavaScriptCompletions = javaLanguage.data.of({
  autocomplete: myJavaCompletions
})

export default App;
