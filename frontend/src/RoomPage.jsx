import React from "react";
import {
  authenticationService,
  createNewRoom,
  getAllRooms,
  joinRoom,
} from "./_services";
import "./RoomPage.css";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
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
import DataSaverOffIcon from "@mui/icons-material/DataSaverOff";
import DataSaverOnIcon from "@mui/icons-material/DataSaverOn";
import { useNavigate } from "react-router-dom";

function RoomPage({ curUser, isAdmin, userRoom, setUserRoom, socket }) {
  const [roomInfo, setRoomInfo] = React.useState(() => null);
  const [loadRoomsComplete, setLoadRoomsComplete] = React.useState(() => false);
  const [roomName, setRoomName] = React.useState(() => "");
  const [open, setOpen] = React.useState(() => false);
  const [showAlert, setShowAlert] = React.useState(() => "");
  const [joinedRoom, setJoinedRoom] = React.useState(() => false);
  const navigate = useNavigate();

  function udpateRoomName(e) {
    setRoomName(e.target.value);
  }

  function logoutHandler() {
    authenticationService.logout();
    socket.disconnect();
  }

  async function selectRoom(host) {
    console.log(`joining ${host}`);
    const res = await joinRoom(host, socket.id);
    if (res.err) setShowAlert(res.err);
    else {
      console.log("loading room done")
      setJoinedRoom(true)
      setUserRoom(host);
    }
  }

  React.useEffect(() => {
    async function fetchRoomInfo() {
      const rooms = await getAllRooms();
      if (rooms.err) setShowAlert(rooms.err);
      else setRoomInfo(rooms.res);
      setLoadRoomsComplete(true);
    }
    fetchRoomInfo();
  }, []);

  React.useEffect(() => {
    if (joinedRoom) {
      console.log("join complete");
      if (isAdmin) navigate("/teacher", { replace: true });
      else navigate("/student", { replace: true });
      setJoinedRoom(false)
    }
  }, [joinedRoom])

  const onCreateNewRoom = () => {
    console.log(roomName);
    const res = createNewRoom(roomName, socket.id);
    if (res.err) setShowAlert(res.err);
    else {
      setUserRoom(curUser);
      if (isAdmin) navigate("/teacher", { replace: true });
      else navigate("/student", { replace: true });
    }
    setOpen(false);
  };

  const handleToggle = () => {
    console.log("toggled");
    setRoomName("");
    setOpen(!open);
  };
  //TODO: merge get room into one method with pagination and return an object that includes the total number of rooms

  if (loadRoomsComplete) {
    // console.log(roomInfo);
    return (
      <Box display="flex" className="room-container">
        <Stack spacing={4} sx={{alignItems: "center" }}>
          <p className="title">Rooms</p>
          {showAlert && <Alert variant="filled" severity="error">{showAlert}</Alert>}
          <Box
            display="flex"
            justifyContent="center"
            sx={{ bgcolor: "background.paper" }}
          >
            <List>
              {roomInfo.map((room, index) => (
                <ListItem key={room.host} sx={{ backgroundColor: "#C6DEFF", my: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        width: "100px"
                      }}
                      className="room-item"
                    >
                      <ListItemIcon
                        fontSize="large"
                        sx={{ justifyContent: "center" }}
                      >
                        {room.hasTeacher ? (
                          <DataSaverOnIcon />
                        ) : (
                          <DataSaverOffIcon />
                        )}
                      </ListItemIcon>
                      <p className="room-occupancy-text">
                        {" "}
                        {room.hasTeacher ? "class in progress" : "waiting"}
                      </p>
                    </Box>
                    <ListItemText primary={room.roomName} secondary={room.host} sx={{mr: "10px", flexGrow: 2}}/>
                    <ListItemButton
                      className="room-btn"
                      value={room.host}
                      sx={{ backgroundColor: "#CB6D51", maxWidth: "70px", borderRadius: "8px"}}
                      onClick={() => selectRoom(room.host)}
                    >
                      Join
                    </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
          <Button variant="contained" onClick={handleToggle} className="btn">
            Create New Room
          </Button>
          <Button variant="contained" onClick={logoutHandler} className="btn">
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
