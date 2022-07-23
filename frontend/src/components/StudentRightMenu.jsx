import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import HelpIcon from '@mui/icons-material/SupportAgent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Button } from '@mui/material';
import { authenticationService } from '../_services';
// [kw]
import React from 'react';
import Notifications from './Notifications';

// function StudentRightMenu({drawerWidth}) {
function StudentRightMenu({drawerWidth, socket}) {

  const [notificationToggle, setNotificationToggle] = React.useState(() => null);

  function requestHelp() {
    console.log("help requested")
    socket.emit("help request");
    setNotificationToggle(!notificationToggle)
  }

  function logoutHandler(){
    socket.emit("disconnection broadcast");
    authenticationService.logout();
  }

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem key='Request Help' disablePadding>
          <ListItemButton onClick={() => requestHelp()}>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary='Request Help' />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box>
      
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `100%` },
          ml: { sm: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" noWrap component="div">
            Pacer
          </Typography>
          <Button position="fixed" component="div" className="logoutButton"
          variant="contained"
          color="error"
          sx={{
            color: "#fff",
            zIndex: (theme) => theme.zIndex.drawer + 2,
          }}
          onClick={logoutHandler}
          // onClick={authenticationService.logout}

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
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          anchor="right"
          open
        >
          {drawer}
        </Drawer>
      </Box>
    <Notifications msg="Help Requested!" variant="success" open={notificationToggle} />
    </Box>
  );
}

export default StudentRightMenu
