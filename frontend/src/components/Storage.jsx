import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
// [kw]
import React from 'react';


function Storage(code) {
    function saveCode(e) {
        console.log(e.target.value)
        console.log("saved")
    }
    
    function loadCode() {
        console.log("loaded")
    }
    
    return (
        <>
        <Button value={code.value} onClick={(e) => saveCode(e)} variant="contained">Save</Button>
        <Button onClick={loadCode} variant="contained">Load</Button>
        </>
    );
  }

export default Storage