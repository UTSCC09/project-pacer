import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
// [kw]
import React from 'react';

function EditorOptionsBar({language, onLanguageChange}) {
    return (
        <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Language</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={language}
              label="Language"
              onChange={onLanguageChange}
            >
              <MenuItem value={"javascript"}>Javascript</MenuItem>
              <MenuItem value={"python"}>Python</MenuItem>
              <MenuItem value={"java"}>Java</MenuItem>
            </Select>
          </FormControl>
      );
}

export default EditorOptionsBar