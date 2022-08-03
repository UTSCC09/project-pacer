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
import PeopleIcon from "@mui/icons-material/People";
import { useNavigate } from "react-router-dom";

function RoomPage({
  curUser,
  isAdmin,
  setUserRoom,
  setRoomId,
  socket,
  setSocketFlag,
}) {
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
    socket.removeAllListeners();
    socket.disconnect();
    setSocketFlag(false);
    authenticationService.logout();
  }

  async function selectRoom(host, id) {
    const res = await joinRoom(host, socket.id);
    if (res.err) setShowAlert(res.err);
    else {
      socket.emit("room update");
      setRoomId(String(id));
      setJoinedRoom(true);
      setUserRoom(host);
    }
  }
  async function fetchRoomInfo() {
    const rooms = await getAllRooms();
    if (rooms.err) setShowAlert(rooms.err);
    else
      setRoomInfo((init) => {
        return rooms.res;
      });
    setLoadRoomsComplete(true);
  }

  React.useEffect(() => {
    fetchRoomInfo();

    try {
      socket.on("room update", () => {
        fetchRoomInfo();
      });
    } catch (error) {
      window.location.reload();
    }
  }, []);

  React.useEffect(() => {
    if (joinedRoom) {
      if (isAdmin) navigate("/teacher", { replace: true });
      else navigate("/student", { replace: true });
      setJoinedRoom(false);
    }
  }, [joinedRoom]);

  const onCreateNewRoom = async () => {
    const res = await createNewRoom(roomName, socket.id);
    if (res.err) setShowAlert(res.err);
    else {
      // update room list to all other online users
      socket.emit("room update");
      setUserRoom(curUser);
      setRoomId(JSON.stringify(res["res"]["id"]));
      if (isAdmin) navigate("/teacher", { replace: true });
      else navigate("/student", { replace: true });
    }
    setOpen(false);
  };

  const handleToggle = () => {
    setRoomName("");
    setOpen(!open);
  };

  if (loadRoomsComplete) {
    return (
      <Box display="flex" className="room-container">
        <Stack spacing={4} sx={{ alignItems: "center" }}>
          <p className="title">Rooms</p>
          {showAlert && (
            <Alert variant="filled" severity="error">
              {showAlert}
            </Alert>
          )}
          <Box
            display="flex"
            justifyContent="center"
            sx={{ bgcolor: "background.paper" }}
          >
            <List>
              {roomInfo.map((room) => (
                <ListItem
                  key={room.host}
                  sx={{ backgroundColor: "#C6DEFF", my: 2 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      width: "80px",
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
                  <ListItemText
                    primary={"Name: " + room.roomName}
                    secondary={"Host: " + room.host}
                    sx={{ mr: "10px", flexGrow: 1 }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      width: "70px",
                    }}
                    className="room-item"
                  >
                    <ListItemIcon
                      fontSize="large"
                      sx={{ justifyContent: "center" }}
                    >
                      <PeopleIcon />
                    </ListItemIcon>
                    <p className="room-occupancy-text">{room.users.length}</p>
                  </Box>
                  <ListItemButton
                    className="room-btn"
                    value={room.host}
                    sx={{
                      backgroundColor: "#CB6D51",
                      maxWidth: "70px",
                      borderRadius: "8px",
                    }}
                    onClick={() => selectRoom(room.host, room.id)}
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
