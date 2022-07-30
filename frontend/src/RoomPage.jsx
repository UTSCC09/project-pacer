import React from "react";
import { authenticationService, createNewRoom, getAllRooms, joinRoom } from "./_services";
import "./RoomPage.css";
import Box from "@mui/material/Box";
import {
  Backdrop,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
} from "@mui/material";
import DataSaverOffIcon from '@mui/icons-material/DataSaverOff';
import DataSaverOnIcon from '@mui/icons-material/DataSaverOn';
import { useNavigate } from "react-router-dom";

function RoomPage({ curUser, isAdmin, userRoom, setUserRoom, socket }) {
  const [roomInfo, setRoomInfo] = React.useState(() => null);
  const [loadRoomsComplete, setLoadRoomsComplete] = React.useState(() => false);
  const [roomName, setRoomName] = React.useState(() => "");
  const [open, setOpen] = React.useState(() => false);
  const navigate = useNavigate();

  function udpateRoomName(e) {
    setRoomName(e.target.value);
  }

  function logoutHandler(){
    authenticationService.logout();
    socket.disconnect()
  }

  function selectRoom(host) {
    console.log(`joining ${host}`)
    joinRoom(host, socket.id)
    setUserRoom(host)
    console.log("join complete")
    if (isAdmin) 
        navigate("/teacher", { replace: true });
        else navigate('/student', { replace: true });
  }

  React.useEffect(() => {
    async function fetchRoomInfo() {
      const rooms = await getAllRooms();
      setRoomInfo(rooms);
      console.log(rooms);
      setLoadRoomsComplete(true);
    }
    fetchRoomInfo();
  }, []);

  const onCreateNewRoom = () => {
    console.log(roomName);
    createNewRoom(roomName, socket.id);
    setOpen(false);
    setUserRoom(curUser)
    if (isAdmin)
        navigate("/teacher", { replace: true });
        else navigate('/student', { replace: true });
  };

  const handleToggle = () => {
    console.log("toggled");
    setRoomName("")
    setOpen(!open);
  };

  //   console.log("here");
  //   console.log(curUser);
  //   console.log(isAdmin);
  //   console.log(userRoom);
  //   console.log(socket);
  //   console.log(roomInfo);
  //TODO: merge get room into one method with pagination and return an object that includes the total number of rooms

  if (loadRoomsComplete) {
    // console.log(roomInfo);
    return (
      <Box display="flex" className="room-container">
        <Stack spacing={4}>
          <p className="title">Rooms</p>
          <Box
            display="flex"
            justifyContent="center"
            sx={{ bgcolor: "background.paper" }}
          >
            <List>
              {roomInfo.map((room, index) => (
                <ListItem key={room.host} sx={{ backgroundColor: "#ebf1f5" }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <ListItemIcon fontSize="large" sx={{ justifyContent: 'center' }}>
                      {room.hasTeacher ? <DataSaverOnIcon /> : <DataSaverOffIcon />}
                    </ListItemIcon>
                    <p className="room-occupancy-text"> {room.hasTeacher ? "class in progress" : "waiting"}</p>
                  </Box>
                  <ListItemText primary={room.roomName} secondary={room.host} />
                  <ListItemButton
                    value={room.host}
                    sx={{ backgroundColor: "#30404d", ml: "30px" }}
                    onClick={() => selectRoom(room.host)}
                  >
                    Join
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
          <Button variant="contained" onClick={handleToggle}>
            Create New Room
          </Button>
          <Button variant="contained" onClick={logoutHandler}>
              Logout
          </Button>
        </Stack>
        <Backdrop
          sx={{
            bgcolor: "secondary.main",
            color: "#fff",
            zIndex: (theme) => theme.zIndex.drawer + 2,
          }}
          open={open}
          className="room-container"
        >
          <Stack spacing={3}>
            <p> Enter room name:</p>
            <TextField
              id="outlined-basic"
              label="class name"
              variant="outlined"
              value={roomName}
              onChange={udpateRoomName}
            />
            <Button variant="contained" onClick={onCreateNewRoom}>
              Confirm
            </Button>
            <Button variant="contained" onClick={handleToggle}>
              Return
            </Button>
          </Stack>
        </Backdrop>
      </Box>
    );
  } else {
    return <p>fetching room data</p>;
  }
}

export default RoomPage;
