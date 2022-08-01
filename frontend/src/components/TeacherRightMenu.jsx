import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import PersonIcon from "@mui/icons-material/Person";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Button, styled } from "@mui/material";
import { authenticationService, socket } from "../_services";
// [kw]
import React, { useEffect } from 'react';
import Notifications from './Notifications';

const CustomEntry = styled(ListItem)({
  backgroundColor: 'var(--color)',
  '& .MuiSlider-thumb': {
    [`&:hover, &.Mui-focusVisible`]: {
      boxShadow: '0px 0px 0px 8px var(--box-shadow)',
    },
    [`&.Mui-active`]: {
      boxShadow: '0px 0px 0px 14px var(--box-shadow)',
    },
  },
});

const connectedState = {
  '--color': '#4caf50',
  '--box-shadow': 'rgb(76, 175, 80, .16)',
};

const requestingHelpState = {
  '--color': '#FF8C00',
  '--box-shadow': 'rgb(76, 175, 80, .16)',
};

const defaultState = {
  '--color': '#FFF',
  '--box-shadow': 'rgb(25, 118, 210, .16)',
};


function TeacherRightMenu({ drawerWidth, setDisplayStudent, setStudentName, connectedUsers, setConnectedUsers, socket, roomId, setSocketFlag }) {
  console.log(connectedUsers)
  const [notificationToggle, setNotificationToggle] = React.useState(() => null);
  const [helpMsg, setHelpMsg] = React.useState(() => "default msg");
  const [userState, setUserState] = React.useState(() => {
    let res = {}
    connectedUsers.forEach(e => {
      res[e.SktId] = defaultState
    });
    console.log(res)
    return res
  });
  // const [isTriggered, setIsTriggered] = React.useState(() => "")

  // React.useEffect(() => {
  //   let timer = null
  //   if (isTriggered) {
  //     timer = setTimeout(() => {
  //       setUserState((next) => {
  //         if (next[isTriggered] === requestingHelpState) {
  //           next[isTriggered] = defaultState
  //           console.log("triggered")
  //           return next
  //         }
  //       })
  //       setIsTriggered(false)
  //     })
  //   }
  //   return () => clearTimeout(timer);
  // }, [isTriggered])


  React.useEffect(() => {
    // todo-kw: revisit
    // if (socket){
      socket.on("help request", (stuId, username) => {
        console.log(
          `[TeacherPage - help request] student [${username}] need help; student socket id: ${stuId} `
        );
        setUserState((existing) => {
          if (existing[stuId] !== connectedState) {
            existing[stuId] = requestingHelpState
            console.log(existing)
            // setIsTriggered(stuId)
          }
          return existing
        });
        const msg = `Help requested from ${username} with socket id ${stuId}`
        setHelpMsg(oldmsg => msg)
        setNotificationToggle(oldState => !oldState)
      });
    // }
  }, [])

  function loadStudentSession(studentName, studentCurSocket) {
    if (!socket.sid || socket.sid !== studentCurSocket){
      socket.on = true;
      console.log(`else right menu: ${socket.sid}`);
      setUserState((existing) => {
        Object.keys(existing).forEach(key => {
          existing[key] = defaultState;
        });
        existing[studentCurSocket] = connectedState
        console.log(existing)
        return existing
      });
      setDisplayStudent(true);
      // console.log(studentName);
      setStudentName(studentName);
      socket.emit("fetch code", studentCurSocket, socket.id, socket.userRoom);
    } else if (socket.on) {
      socket.on = false;
      setUserState((existing) => {
        existing[studentCurSocket] = defaultState
        return existing
      });
      setDisplayStudent(false);
    } else {
      socket.on = true;
      setUserState((existing) => {
        Object.keys(existing).forEach(key => {
          existing[key] = defaultState;
        });
        existing[studentCurSocket] = connectedState
        console.log(existing)
        return existing
      });
      setDisplayStudent(true);
    }
  }

  function logoutHandler(){
    socket.emit("disconnect audio", roomId)
    authenticationService.logout();
    setConnectedUsers([]);
    socket.removeAllListeners();
    socket.disconnect();
    setSocketFlag(false)
  }

  // function logoutHandler(){
  //   // socket.disconnect()
  //   // socket.emit("disconnection broadcast");
  //   authenticationService.logout();
  //   socket.disconnect()
  // }

  // useEffect(() => {
  //   console.log("current Socket Id:", socket.id)
  //   }, []
  // )
    
  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {connectedUsers.map((text, index) => (
          <CustomEntry key={text.SktId} style={userState[text.SktId]} disablePadding>
            <ListItemButton value={text.SktId} onClick={() => loadStudentSession(text.curUser, text.SktId, )}>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary={text.SktId} secondary={text.curUser}/>
            </ListItemButton>
          </CustomEntry>
        ))}
      </List>
      <Divider />
      {/* <List>
        {["Item5", "Item6", "Item7"].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List> */}
    </div>
  );

  return (
    <Box>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `100%` },
          ml: { sm: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" noWrap component="div">
            Pacer
          </Typography>
          <Button
            position="fixed"
            component="div"
            className="logoutButton"
            variant="contained"
            color="error"
            sx={{
              color: "#fff",
              zIndex: (theme) => theme.zIndex.drawer + 2,
            }}
            onClick={logoutHandler}
            //onClick={authenticationService.logout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          anchor="right"
          open
        >
          {drawer}
        </Drawer>
      </Box>
    <Notifications msg={helpMsg} variant="info" open={notificationToggle} />
    </Box>
  );
}

export default TeacherRightMenu;
