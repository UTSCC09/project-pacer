import { useCallback, useState } from 'react';
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
import StudentRightMenu from './components/StudentRightMenu';
import Storage from './components/Storage';

import { upperPythonKeys, lowerPythonKeys, javaKeys } from './_helpers';

import {EditorState, Compartment} from "@codemirror/state"
import { python, pythonLanguage } from '@codemirror/lang-python';
import {CompletionContext} from "@codemirror/autocomplete";
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { java, javaLanguage } from '@codemirror/lang-java'
import { authenticationService } from './_services';

const drawerWidth = 240;

function StudentPage({uploadFileFormHandler}) {
  const [code, setCode] = useState(() => "console.log('hello world!');");
  const [language, setLanguage] = useState(() => 'javascript');

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
          <Grid item xs={5}>
            <p>Server Screen (remote):</p>
            {/* server display */}
            <CodeMirror value="" height="600px" theme="dark" hint="true" />
          </Grid>
          <Grid item xs={7}>
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
            <Grid item xs={12}>
            <form onSubmit={uploadFileFormHandler}>
                <input type="file" className="input" />
                <button type="submit">Upload</button>
            </form>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <StudentRightMenu drawerWidth={drawerWidth} />
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

export default StudentPage;