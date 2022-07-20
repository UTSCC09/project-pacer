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
import { Button } from "@mui/material";
import { authenticationService, socket } from "../_services";
// [kw]
import React, { useEffect } from 'react';

function getConnectedStudents() {
    return ["Student1", "Student2", "Student3", "Student4"]
}


function TeacherRightMenu({ drawerWidth, setDisplayStudent, setStudentName }) {
  const [notificationToggle, setNotificationToggle] = React.useState(() => null);

  function requestHelp() {
    console.log("help requested")
    setNotificationToggle(!notificationToggle)
  }

  function loadStudentSession(studentName) {
      setDisplayStudent(true)
      console.log(studentName)
      setStudentName(studentName)
      socket.emit("fetch code", parseInt(studentName.at(-1)), socket.id)
  }


  // useEffect(() => {
  //   console.log("current Socket Id:", socket.id)
  //   }, []
  // )
    
  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {getConnectedStudents().map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton value={text} onClick={() => loadStudentSession(text)}>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
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
            onClick={authenticationService.logout}
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
    </Box>
  );
}

export default TeacherRightMenu;
