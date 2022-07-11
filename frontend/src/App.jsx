import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
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
import { upperPythonKeys, lowerPythonKeys, javaKeys } from './components/pythonAutoCompleteLib'

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

function App() {
  const [code, setCode] = useState("console.log('hello world!');")
  const [language, setLanguage] = React.useState('javascript');

  let editorLanguage = new Compartment

  const handleLanguageChange = React.useCallback((e) => {
    console.log('value:', e.target.value);
    setLanguage(e.target.value)
  }, []);

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
    <div>
    <FormControl fullWidth>
      <InputLabel id="demo-simple-select-label">Language</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={language}
        label="Language"
        onChange={handleLanguageChange}
      >
        <MenuItem value={"javascript"}>Javascript</MenuItem>
        <MenuItem value={"python"}>Python</MenuItem>
        <MenuItem value={"java"}>Java</MenuItem>
      </Select>
    </FormControl>
      <CodeMirror
      value={code}
      height="200px"
      theme="dark"
      extensions={extensions}
      onChange={onChange}
      hint="true"
      />
    
    </div>
  );
}

export default App;
