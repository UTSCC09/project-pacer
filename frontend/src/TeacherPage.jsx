import { useCallback, useState, useEffect, cloneElement, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Box from '@mui/material/Box';
import Button from "@mui/material/Button";
import Grid from '@mui/material/Grid';
import EditorOptionsBar from './components/EditorOptions';
import Toolbar from '@mui/material/Toolbar';
import Storage from './components/Storage';

import { upperPythonKeys, lowerPythonKeys, javaKeys } from './_helpers';

import {EditorState, Compartment} from "@codemirror/state"
import { python, pythonLanguage } from '@codemirror/lang-python';
import {CompletionContext} from "@codemirror/autocomplete";
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { java, javaLanguage } from '@codemirror/lang-java'
import { authenticationService } from './_services';
import TeacherRightMenu from './components/TeacherRightMenu';

const drawerWidth = 240;


// let StudentEditor = cloneElement(CodeMirror, {value:"", height:"600px", theme:"dark", hint:"true"})

function TeacherPage() {
  const [code, setCode] = useState(() => "console.log('hello world!');");
  const [language, setLanguage] = useState(() => 'javascript');
  const [displayStudent, setDisplayStudent] = useState(() => false);
  const [studentName, setStudentName] = useState(() => "")

  const studentEditorRef = useRef()

  useEffect(() => {
    const studentEditor = studentEditorRef.current
    console.log(studentEditor)
    }, [studentName])

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

  const onChange = useCallback((value, viewUpdate) => {
    console.log('value:', value);
    setCode(value)
  }, []);


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
        <Grid container rowSpacing={0.5} columnSpacing={3}>
          {displayStudent ? <Grid item xs={5}>
            <p>Code session for student {studentName}:</p>
            {/* server display */}
            <CodeMirror ref={studentEditorRef} value="abc" height="600px" theme="dark" hint="true" />
          </Grid> : null}
          <Grid item xs={displayStudent ? 7 : 12}>
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
              <Storage value={code}></Storage>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <TeacherRightMenu drawerWidth={drawerWidth} setDisplayStudent={setDisplayStudent} setStudentName={setStudentName} />
    </>
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

export default TeacherPage;