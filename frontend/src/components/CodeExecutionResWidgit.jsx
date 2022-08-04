import * as React from "react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Stack from "@mui/material/Stack";

function CodeExecutionResWidgit({ out, err, clear }) {
  return (
    <Stack spacing={2}>
      {out ? (
        <Alert onClose={() => clear()} variant="filled" severity="success">
          <AlertTitle>Result:</AlertTitle>
          {out}
        </Alert>
      ) : null}
      {err ? (
        <Alert onClose={() => clear()} variant="filled" severity="error">
          <AlertTitle>Error:</AlertTitle>
          {err}
        </Alert>
      ) : null}
    </Stack>
  );
}

export default CodeExecutionResWidgit;
