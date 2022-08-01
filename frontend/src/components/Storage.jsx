import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
// [kw]
import React from 'react';

function Storage({code, uploadFileFormHandler}) {
  function saveCode(e) {
    console.log(e.target.value)
    console.log("saved")
  }

  function loadCode() {
    console.log("loaded")
  }

  const handleFileUpload = (event) => {
    console.log("handleFileUpload");
  };

  return (
    <>
    <Button value={code.value} onClick={(e) => saveCode(e)} variant="contained">Save</Button>
    <input type="file" onChange={uploadFileFormHandler} />
    </>
  );
}

export default Storage