import { useState, useEffect } from "react";
import { authenticationService } from "./_services";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Radio, { RadioProps } from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import Alert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import React from "react";
import { Input, InputLabel } from "@mui/material";

let adminIdentified = false;

function LoginPage({ curUser, isAdmin, roomId, setIsAdmin, socket }) {
  const [username, setUsername] = useState(() => "");
  const [password, setPassword] = useState(() => "");
  const [showAlert, setShowAlert] = useState("");
  const navigate = useNavigate();

  function updateUserName(e) {
    setUsername(e.target.value);
  }

  function updatePassword(e) {
    setPassword(e.target.value);
  }

  useEffect(() => {
    adminIdentified = false;
    if (curUser) {
      if (roomId) {
        if (isAdmin) navigate("/teacher", { replace: true });
        else navigate("/student", { replace: true });
      } else {
        navigate("/rooms", { replace: true });
      }
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!adminIdentified) {
      setShowAlert("Select a role first!");
      return;
    }
    if (isAdmin) {
      authenticationService.signin(
        username,
        password,
        "Admin",
        function (err) {
          if (err) return setShowAlert(String(err));
          if (!socket.connected) {
            socket.connect();
          }
          navigate("/rooms", { replace: true });
        }
      );
    } else {
      authenticationService.signin(
        username,
        password,
        "User",
        function (err) {
          if (err) return setShowAlert(String(err));
          if (!socket.connected) {
            socket.connect();
          }
          navigate("/rooms", { replace: true });
        }
      );
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (!adminIdentified) {
      setShowAlert("Select a role first!");
      return;
    }
    if (isAdmin) {
      authenticationService.signup(
        username,
        password,
        "Admin",
        function (err) {
          if (err) return setShowAlert(String(err));
          if (!socket.connected) {
            socket.connect();
          }
          navigate("/rooms", { replace: true });
        }
      );
    } else {
      authenticationService.signup(
        username,
        password,
        "User",
        function (err) {
          if (err) return setShowAlert(String(err));
          if (!socket.connected) {
            socket.connect();
          }
          navigate("/rooms", { replace: true });
        }
      );
    }
  };

  const updateRole = (adminChange) => {
    adminIdentified = true;
    setIsAdmin(adminChange);
  };

  return (
    <Box display="flex" justifyContent="center" className="LoginBox">
      <Stack spacing={2}>
        {showAlert && <Alert severity="error">{showAlert}</Alert>}
        <form className="loginForm">
          <Stack spacing={2}>
            <FormControl required>
              <InputLabel htmlFor="username">User</InputLabel>
              <Input
                id="username"
                name="username"
                value={username}
                autoFocus
                onChange={updateUserName}
              />
            </FormControl>
            <FormControl required>
              <InputLabel htmlFor="password">Password</InputLabel>
              <Input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={updatePassword}
              />
            </FormControl>
            <FormControl required>
              <p>Login/Signup As:</p>
              <RadioGroup
                row
                aria-labelledby="role-select"
                name="role-select-group"
              >
                <FormControlLabel
                  onChange={(e) => updateRole(true)}
                  value={true}
                  control={<BpRadio />}
                  label="Teacher"
                />
                <FormControlLabel
                  onChange={(e) => updateRole(false)}
                  value={false}
                  control={<BpRadio />}
                  label="Student"
                />
              </RadioGroup>
            </FormControl>
            <Box
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
            >
              <Button
                variant="contained"
                type="submit"
                color="success"
                onClick={handleLogin}
                sx={{ color: "#fff" }}
              >
                SignIn
              </Button>
              <Button
                variant="contained"
                type="submit"
                color="success"
                onClick={handleSignup}
                sx={{ color: "#fff" }}
              >
                SignUp
              </Button>
            </Box>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
}

const BpIcon = styled("span")(({ theme }) => ({
  borderRadius: "50%",
  width: 16,
  height: 16,
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 0 0 1px rgb(16 22 26 / 40%)"
      : "inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)",
  backgroundColor: theme.palette.mode === "dark" ? "#394b59" : "#f5f8fa",
  backgroundImage:
    theme.palette.mode === "dark"
      ? "linear-gradient(180deg,hsla(0,0%,100%,.05),hsla(0,0%,100%,0))"
      : "linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))",
  ".Mui-focusVisible &": {
    outline: "2px auto rgba(19,124,189,.6)",
    outlineOffset: 2,
  },
  "input:hover ~ &": {
    backgroundColor: theme.palette.mode === "dark" ? "#30404d" : "#ebf1f5",
  },
  "input:disabled ~ &": {
    boxShadow: "none",
    background:
      theme.palette.mode === "dark"
        ? "rgba(57,75,89,.5)"
        : "rgba(206,217,224,.5)",
  },
}));

const BpCheckedIcon = styled(BpIcon)({
  backgroundColor: "#137cbd",
  backgroundImage:
    "linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))",
  "&:before": {
    display: "block",
    width: 16,
    height: 16,
    backgroundImage: "radial-gradient(#fff,#fff 28%,transparent 32%)",
    content: '""',
  },
  "input:hover ~ &": {
    backgroundColor: "#106ba3",
  },
});

// Inspired by blueprintjs
function BpRadio(props: RadioProps) {
  return (
    <Radio
      sx={{
        "&:hover": {
          bgcolor: "transparent",
        },
      }}
      disableRipple
      color="default"
      checkedIcon={<BpCheckedIcon />}
      icon={<BpIcon />}
      {...props}
    />
  );
}

export default LoginPage;
