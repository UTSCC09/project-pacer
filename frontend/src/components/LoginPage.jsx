import { useState } from 'react';
import Backdrop from "@mui/material/Backdrop";
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

function LoginPage({ open, setOpen, role, setRole }) {

  const [showAlert, setShowAlert] = useState(false);
  const handleLogin = () => {
    if (!role) {
        console.log("here")
        setShowAlert(true)
    }
    else {
        setShowAlert(false)
        setOpen(false);
    }
  };
  const handleToggle = () => {
    setOpen(!open);
  };

  const updateRole = (role) => {
    console.log(role)
    setRole(role);
  }

  return (
    <Box display="flex" justifyContent="flex-end">
      <Button
        variant="contained"
        color="error"
        onClick={handleToggle}
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 2,
          mr: 3,
          mt: 1.5,
        }}
      >
        Logout
      </Button>
      <Backdrop
        sx={{
          bgcolor: "secondary.main",
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 2,
        }}
        open={open}
      >
        
        
        <Stack spacing={2}>
        {showAlert && <Alert severity="error">Select a role first!</Alert>}
        <FormControl>
          <p>Role Select:</p>
          <RadioGroup
            row
            aria-labelledby="role-select"
            name="role-select-group"
          >
            <FormControlLabel onChange={e => updateRole(e.target.value)} value="teacher" control={<BpRadio />} label="Teacher" />
            <FormControlLabel onChange={e => updateRole(e.target.value)} value="student" control={<BpRadio />} label="Student" />
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
      </Backdrop>
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
