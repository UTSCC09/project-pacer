import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
// [kw]
import React from 'react';

function Storage({saveCode, loadCode, uploadFileFormHandler}) {
    return (
        <>
        <Button onClick={saveCode} variant="contained">Save</Button>
        <Button onClick={loadCode} variant="contained">Load</Button>
        <Button onChange={uploadFileFormHandler} variant="contained" component="label">
          Upload<input type="file" hidden/>
        </Button>
        </>
    );
  }

  const handleFileUpload = (event) => {
    console.log("handleFileUpload");
  };

  return (
    <Stack>
    <Button value={code.value} onClick={(e) => saveCode(e)} variant="contained">Save</Button>
    <input type="file" onChange={uploadFileFormHandler} />
    </Stack>
  );
}

export default Storage