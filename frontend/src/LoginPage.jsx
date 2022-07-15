import { useState, useEffect } from 'react';
import { authenticationService } from './_services';
import Box from "@mui/material/Box";
import Stack from '@mui/material/Stack';
import Button from "@mui/material/Button";
import { styled } from '@mui/material/styles';
import Radio, { RadioProps } from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Alert from '@mui/material/Alert';
import { history } from './_helpers';
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

let adminIdentified = false;

function LoginPage({isAdmin, setIsAdmin}) {
  const navigate = useNavigate();

  useEffect(() => {
    adminIdentified = false
    if (authenticationService.currentUserValue) { 
      console.log("already logged in")
      console.log(authenticationService.currentUserValue)
      console.log(authenticationService.currentUserValue.role)
      if (authenticationService.currentUserValue.role === "Admin") 
      navigate("/teacher", { replace: true });
      else navigate('/student', { replace: true });
    }
  }, []);

  const [showAlert, setShowAlert] = useState(false);
  const handleLogin = () => {
    if (!adminIdentified) {
        setShowAlert(true)
        return
    }
    // else {
    //     setShowAlert(false)
    //     setOpen(false);
    // }
    if (isAdmin) {
      console.log("logging as admin")
      authenticationService.login("admin", "admin")
      .then(
          user => {
              navigate("/teacher", { replace: true });
          },
          error => {
              console.log(error)
          }
      );
    } else {
      console.log("logging as student")
      authenticationService.login("user", "user")
      .then(
          user => {
              navigate("/student", { replace: true });
          },
          error => {
              console.log(error)
          }
      );
    }
  };

  const updateRole = (adminChange) => {
    adminIdentified = true;
    setIsAdmin(adminChange);

  }

  return (
    <Box display="flex" justifyContent="center" className="LoginBox">
        <Stack spacing={2}>
        {showAlert && <Alert severity="error">Select a role first!</Alert>}
        <FormControl>
          <p>Role Select:</p>
          <RadioGroup
            row
            aria-labelledby="role-select"
            name="role-select-group"
          >
            <FormControlLabel onChange={e => updateRole(true)} value={true} control={<BpRadio />} label="Teacher" />
            <FormControlLabel onChange={e => updateRole(false)} value={false} control={<BpRadio />} label="Student" />
          </RadioGroup>
        </FormControl>
        <Button 
          variant="contained"
          color="success"
          onClick={handleLogin}
          sx={{ color: "#fff" }}
        >
          SignIn
        </Button>
        </Stack>
    </Box>
  );
}

const BpIcon = styled('span')(({ theme }) => ({
    borderRadius: '50%',
    width: 16,
    height: 16,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 0 0 1px rgb(16 22 26 / 40%)'
        : 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
    backgroundColor: theme.palette.mode === 'dark' ? '#394b59' : '#f5f8fa',
    backgroundImage:
      theme.palette.mode === 'dark'
        ? 'linear-gradient(180deg,hsla(0,0%,100%,.05),hsla(0,0%,100%,0))'
        : 'linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))',
    '.Mui-focusVisible &': {
      outline: '2px auto rgba(19,124,189,.6)',
      outlineOffset: 2,
    },
    'input:hover ~ &': {
      backgroundColor: theme.palette.mode === 'dark' ? '#30404d' : '#ebf1f5',
    },
    'input:disabled ~ &': {
      boxShadow: 'none',
      background:
        theme.palette.mode === 'dark' ? 'rgba(57,75,89,.5)' : 'rgba(206,217,224,.5)',
    },
  }));
  
  const BpCheckedIcon = styled(BpIcon)({
    backgroundColor: '#137cbd',
    backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
    '&:before': {
      display: 'block',
      width: 16,
      height: 16,
      backgroundImage: 'radial-gradient(#fff,#fff 28%,transparent 32%)',
      content: '""',
    },
    'input:hover ~ &': {
      backgroundColor: '#106ba3',
    },
  });
  
  // Inspired by blueprintjs
  function BpRadio(props: RadioProps) {
    return (
      <Radio
        sx={{
          '&:hover': {
            bgcolor: 'transparent',
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
