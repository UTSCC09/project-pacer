import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import React from "react";
import { useSnackbar } from "notistack";

function Notifications({ msg, variant, open }) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  React.useEffect(() => {
    if (open !== null) {
      enqueueSnackbar(msg, {
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
        autoHideDuration: 3000,
        variant: variant,
        action: (key) => (
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => closeSnackbar(key)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        ),
      });
    }
  }, [open]);

  return <></>;
}

export default Notifications;
