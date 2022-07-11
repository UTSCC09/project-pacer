import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import './App.css';
import { useState } from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

function App() {
  const [code, setCode] = useState("console.log('hello world!');")
  const [language, setLanguage] = React.useState('javascript');

  const handleLanguageChange = React.useCallback((e) => {
    console.log('value:', e.target.value);
    setLanguage(e.target.value)
  }, []);

  const onChange = React.useCallback((value, viewUpdate) => {
    console.log('value:', value);
    setCode(value)
  }, []);

  let extensions = []
  if (language === "javascript") {
    extensions.push(javascript({ jsx: true }))
  } else {
    extensions.push(python())
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
