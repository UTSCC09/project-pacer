import Button from "@mui/material/Button";
import React from "react";

function Storage({ uploadFileFormHandler }) {
  return (
    <>
      <Button
        onChange={uploadFileFormHandler}
        variant="contained"
        component="label"
      >
        Upload
        <input type="file" hidden />
      </Button>
    </>
  );
}

export default Storage;
