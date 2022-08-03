const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require("express-session");
const { body, validationResult } = require("express-validator");

const firebaseConfig = {
  apiKey: "AIzaSyAtUPhMKwJxUDwQUPezFsojNPMn0gUkkoA",
  authDomain: "pacer-firebase-react-storage.firebaseapp.com",
  projectId: "pacer-firebase-react-storage",
  storageBucket: "pacer-firebase-react-storage.appspot.com",
  messagingSenderId: "915079763418",
  appId: "1:915079763418:web:c46f1f943da1071c59dce3",
};
const { initializeApp } = require("firebase/app");
const firebaseApp = initializeApp(firebaseConfig);
const {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} = require("firebase/firestore");
const fbfsdb = getFirestore(firebaseApp);

// const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
// io.use(wrap(sessionMiddleware));

// io.use((socket, next) => {
//   const session = socket.request.session;
//   if (session && session.username) {
//     next();
//   } else {
//     next(new Error("unauthorized"));
//   }
// });

const dotenv = require("dotenv");
dotenv.config();

const app = express();

const http = require("http");
const PORT = 8080;
const version = "1.0.0";

const DEFAULT_EXPIRATION = 7200;

const sessionMiddleware = session({
  secret: process.env.SECRET,
  saveUninitialized: false,
  resave: true,
  name: "pacer-session",
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // Two Hours
    sameSite: true,
    httpOnly: true,
  },
  // store: new RedisStore({ client: redisClient }),
  // store: new sessionStore({
  //   filename: "db/sessions.db",
  // }),
});

app.use(sessionMiddleware);

// [kw] socket setup
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const isAuthenticated = function (req, res, next) {
  if (!req.session.username) return res.status(401).json("access denied");
  next();
};

app.get("/api", (req, res) => res.send({ version }));

const Role = {
  Admin: "Admin",
  User: "User",
};

let users = [
  //   {
  //     id: 0,
  //     username: "admin",
  //     password: "admin",
  //     role: Role.Admin,
  //     roomHost: "teacher1"
  //   },
  //   {
  //     id: 0,
  //     username: "user",
  //     password: "user",
  //     role: Role.User,
  //     roomHost: "teacher1"
  //   },
];

let rooms = [
  //   {
  //     id: 120492783,
  //     host: "Jack",
  //     hasTeacher: false,
  //     roomName: "class1",
  //     users: [
  //      {
  //        id: 0,
  //        username: "Jack",
  //        role: Role.Admin,
  //      },
  //    ],
  //    peers: []
  //   },
];

const NewRoom = (function () {
  return function item(roomName, host, hasTeacher) {
    // todo-kw
    this.id = Date.now();
    this.host = host;
    this.hasTeacher = hasTeacher
    this.roomName = roomName;
    this.users = [];
  };
})();

const webhookRoutes = require("./routes/webhookRoutes");
const { json } = require("body-parser");
app.use("/api", webhookRoutes);

const saltRounds = 10;

app.get("/api/whoami", function (req, res) {
  const userName = req.session.username;
  if (!userName) return res.json(null);
  // BEFORE FB:
  const user = users.find((x) => x.username === userName);
  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    roomHost: user.roomHost,
  });
  // /// AFTER FB:
  // const collectionRef = collection(fbfsdb, "users");
  // // NOTE: there needs to be at least 1 document in the collection 'users' for the following to work:
  // getDocs(collectionRef).then((snapshot) => {
  //   let matchFound = 0;
  //   let matchsRole = "";
  //   let matchsId = -1;
  //   let matchsRoomHost = "";
  //   snapshot.docs.forEach((doc) => {
  //     if (doc.data().username == userName) {
  //       // MATCH FOUND:
  //       matchFound = 1;
  //       matchsRole = doc.data().role;
  //       matchsId = doc.data().id;
  //       matchsRoomHost = doc.data().roomHost;
  //     }
  //   });
  //   if (matchFound) {
  //     // MATCH FOUND:
  //     return res.json({
  //       id: matchsId,
  //       username: userName,
  //       role: matchsRole,
  //       roomHost: matchsRoomHost,
  //     });
  //   } else {
  //     // NO MATCH FOUND:
  //     return res.status(404).json("user: " + userName + " doesn't exist");
  //   }
  // }).catch(err => {
  //   return res.status(500).json(err.message);
  // });
});

app.patch(
  "/api/newUsername",
  [
    body("username")
      .not()
      .isEmpty()
      .withMessage("must be non-empty")
      .trim()
      .escape(),
    body("newUsername")
      .not()
      .isEmpty()
      .withMessage("must be non-empty")
      .trim()
      .escape(),
  ],
  function (req, res) {
    const username = req.body.username;
    const newUsername = req.body.newUsername;
    //// WORKS:
    const collectionRef = collection(fbfsdb, "users");
    // NOTE: there needs to be at least 1 document in the collection 'users' for the following to work:
    getDocs(collectionRef)
      .then((snapshot) => {
        let matchFound = 0;
        let docId = "";
        snapshot.docs.forEach((doc) => {
          if (doc.data().username == username) {
            // MATCH FOUND:
            matchFound = 1;
            docId = doc.id;
          }
        });
        if (matchFound) {
          // MATCH FOUND:
          const documentRef = doc(fbfsdb, "users", docId);
          updateDoc(documentRef, {
            username: newUsername,
          }).then(() => {
            return res.json({
              username: username,
              newUsername: newUsername,
            });
          });
        } else {
          // NO MATCH FOUND:
          return res.status(404).json("user: " + userName + " doesn't exist");
        }
      })
      .catch((err) => {
        return res.status(500).json(err.message);
      });
  }
);


app.post(
  "/api/signin",
  [
    body("username")
      .not()
      .isEmpty()
      .withMessage("must be non-empty")
      .trim()
      .escape(),
    body("password").not().isEmpty().withMessage("must be non-empty"),
  ],
  function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map((error) => {
          return { msg: error.msg };
        }),
      });
    }
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role;
    // BEFORE FB:
    const user = users.find((x) => x.username === username);
    if (!user) return res.status(401).json("invalid credentials");
    if (user && user.role !== role)
      return res.status(401).json("Incorrect role selected");
    bcrypt.compare(password, user.password, function (err, result) {
      if (err) return res.status(500).json(err);
      if (!result) {
        return res.status(401).json("invalid credentials");
      }
      req.session.username = username;
      req.session.role = role;
      return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        roomHost: user.roomHost,
      });
    });
    // /// AFTER FB:
    // const collectionRef = collection(fbfsdb, "users");
    // // NOTE: there needs to be at least 1 document in the collection 'users' for the following to work:
    // getDocs(collectionRef).then((snapshot) => {
    //   let matchFound = 0;
    //   let matchsRole = "";
    //   let matchsPassword = "";
    //   let matchsRoomHost = "";
    //   let matchsId = -1;
    //   snapshot.docs.forEach((doc) => {
    //     if (doc.data().username == username) {
    //       // MATCH FOUND 1/3:
    //       matchFound = 1;
    //       matchsRole = doc.data().role;
    //       matchsPassword = doc.data().password;
    //       matchsId = doc.data().id;
    //       matchsRoomHost = doc.data().roomHost;
    //     }
    //   });
    //   if (matchFound) {
    //     // MATCH FOUND 2/3:
    //     if (matchsRole == role) {
    //       // MATCH FOUND 3/3:
    //       bcrypt.compare(password, matchsPassword, function (err, result) {
    //         if (err) return res.status(500).json(err);
    //         if (!result) {
    //           return res.status(401).json("invalid credentials");
    //         }
    //         req.session.username = username;
    //         req.session.role = role;
    //         console.log(`session is : ${req.session.username}`);
    //         return res.json({
    //           id: matchsId,
    //           username: username,
    //           role: matchsRole,
    //           roomHost: matchsRoomHost
    //         });
    //       });
    //     } else {
    //       return res.status(401).json('Incorrect role selected');
    //     }
    //   } else {
    //     // NO MATCH FOUND:
    //     return res.status(401).json("invalid credentials");
    //   }
    // }).catch(err => {
    //   return res.status(500).json(err.message);
    // });
  }
);


app.post(
  "/api/signup/",
  [
    body("username")
      .not()
      .isEmpty()
      .withMessage("must be non-empty")
      .trim()
      .escape(),
    // Turn off password validation before final version
    // body(
    //   "password",
    //   "Password must at least 5 characters that includes one lowercase character, one uppercase character, a number, and a special character."
    // ).matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{5,}$/),
  ],
  function (req, res) {
    console.log("hit signup endpoint");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map((error) => {
          return { msg: error.msg };
        }),
      });
    }
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role;
    bcrypt.hash(password, saltRounds, function (err, hash) {
      if (err) return res.status(500).json(err);
      // BEFORE FB:
      const user = users.find((x) => x.username === username);
      if (user)
        return res.status(409).json("username " + username + " already exists");
      const newUser = {
        id: 0,
        username: username,
        password: hash,
        role: role,
        roomHost: null,
      };
      users.push(newUser);
      req.session.username = username;
      req.session.role = role;
      return res.json({
        id: 0,
        username: username,
        role: role,
        roomHost: null,
      });
      // // AFTER FB:
      // const collectionRef = collection(fbfsdb, "users");
      // // NOTE: there needs to be at least 1 document in the collection 'users' for the following to work:
      // getDocs(collectionRef).then((snapshot) => {
      //   let matchFound = 0;
      //   snapshot.docs.forEach((doc) => {
      //     if (doc.data().username == username) {
      //       // MATCH FOUND:
      //       matchFound = 1;
      //     }
      //   });
      //   if (matchFound) {
      //     // MATCH FOUND:
      //     return res.status(409).json("username " + username + " already exists");
      //   } else {
      //     // NO MATCH FOUND:
      //     addDoc(collectionRef, {
      //       id: 0,
      //       username: username,
      //       password: hash,
      //       role: role,
      //       roomHost: null
      //     }).then(() => {
      //       req.session.username = username;
      //       req.session.role = role;
      //       console.log(`session is : ${req.session.username}`);
      //       console.log("here");
      //       return res.json({
      //         id: 0,
      //         username: username,
      //         role: role,
      //         roomHost: null
      //       });
      //     });
      //   }
      // }).catch(err => {
      //   return res.status(500).json(err.message);
      // });
    });
  }
);


app.post("/api/signout/", function (req, res) {
  req.session.destroy(function (err) {
    if (err) return res.status(500).json(err);
  });
  res.clearCookie("pacer-session");
  return res.json(null);
});


app.post("/api/rooms/", isAuthenticated, function (req, res) {
  console.log("hit post room info endpoint");
  if (rooms.filter((room) => room.host === req.session.username).length > 0) {
    /* a room with specified host already exists */
    return res
      .status(409)
      .json("room with host" + req.session.username + " already exists");
  } else {
    const idx = users.findIndex((x) => x.username === req.session.username);
    const user = users[idx];
    const socketId = req.body.socketId;
    const room = new NewRoom(req.body.roomName, req.session.username, user.role === Role.Admin);
    const userInfo = {
      id: user.id,
      username: user.username,
      role: user.role,
      roomHost: user.roomHost,
      socketId,
    };
    room.users.push(userInfo)
    users[idx].roomHost = room.id;
    rooms.push(room);
    return res.json(room);
  }
});


app.get("/api/rooms/", isAuthenticated, function (req, res) {
  //TODO: adapt GET for pagination and firebase
  console.log(`from get rooms ${JSON.stringify(rooms)}`);
  return res.json(rooms);
});

app.patch("/api/rooms/:host/", isAuthenticated, function (req, res) {
  /* a room with specified host already exists */
  const room_idx = rooms.findIndex((room) => room.host === req.params.host);
  if (room_idx < 0)
    return res
      .status(404)
      .json(
        "Cannot update user info, room with host " +
          req.params.host +
          " not found."
      );
  const roomUsers = rooms[room_idx].users;
  if (
    roomUsers.filter((user) => user.username === req.session.username).length > 0
  ) {
    return res
      .status(409)
      .json("room " + req.params.host + " already has user " + req.session.username);
  }
  if (
    rooms[room_idx].hasTeacher && req.session.role === "Admin"
  ) {
    return res.status(409).json(`selected room already has a teacher`)
  }
  if (!rooms[room_idx].hasTeacher && req.session.role === "Admin") {
    rooms[room_idx].hasTeacher = true
  }
  const idx = users.findIndex((x) => x.username === req.session.username);
  const user = users[idx];
  try {
    const socketId = req.body.socketId;
    users[idx].roomHost = rooms[room_idx].id;
    const userInfo = {
      id: user.id,
      username: user.username,
      role: user.role,
      roomHost: rooms[room_idx].host,
      socketId,
    };
    rooms[room_idx].users.push(userInfo);
    return res.json(rooms[room_idx]);
  } catch (err) {
    return res.status(500).json(err);
  }
});


function deleteUserFromRoom(username) {
  const idx = users.findIndex((x) => x.username === username);
  let room_id = null;
  let isAdmin = false;
  if (idx >= 0) {
    room_id = users[idx].roomHost;
    users[idx].roomHost = null;
    isAdmin = users[idx].role === "Admin";
  }
  if (room_id) {
    const room_idx = rooms.findIndex((room) => room.id === room_id);
    if (room_idx >= 0) {
      const roomUsers = rooms[room_idx].users;
      const roomUserIdx = roomUsers.findIndex((x) => x.username === username);
      if (roomUserIdx >= 0) {
        rooms[room_idx].users.splice(roomUserIdx, 1);
        if (isAdmin) {
          rooms[room_idx].hasTeacher = false;
        }
      }
      if (rooms[room_idx].users.length === 0) {
        rooms.splice(room_idx, 1);
      }
    }
  }
}



// `Not Found` request handler
// app.use((req, res, next) => {
//   const error = new Error("Not Found");
//   error.status = 404;
//   throw error;
// });

// thrown erros handler
// app.use((error, req, res, next) => {
//   res.status(error.status || 500);
//   res.json({ message: error.message || 'Internal Server Error' });
// });
// io.use((socket, next) => {
//   const username = socket.handshake.auth.curUser;
//   if (!username) {
//     return next(new Error("invalid username"));
//   }
//   socket.username = username;
//   next();
// });



io.on('connection', async (socket) => {

  console.log("[Server] a user connected, socket id is :" + socket.id);
  
  // console.log("server current handshake user:", socket.handshake.auth.curUser);

  socket.on("set attributes", (role, curUser, roomId) => {
    socket.role = role;
    socket.username = curUser;
    socket.roomId = roomId;
    socket.join(roomId);
    if (role === 'teacher') {
      socket.pr = "";
      socket.sid = "";
    }
    socket.to(roomId).emit("connection broadcast", socket.id, role, curUser);
  });


  socket.on("room update", () =>{
    socket.broadcast.emit("room update");
  })


  socket.on('teacher join', (roomId) => {
    socket.join('teacher: ' + roomId);
    socket.to(roomId).emit('teacher join', socket.id);
  });


  socket.on("student join", (curUser, roomId) => {
    socket.to('teacher: ' + roomId).emit("student join", socket.id, curUser);
  });


  socket.on("teacher: execution", (out, err, roomId) => {
    socket.to(roomId).emit("teacher: execution", out, err);
  });


  socket.on("help request", (roomId) => {
    socket.to('teacher: ' + roomId).emit("help request", socket.id, socket.username);
  });


  socket.on("fetch init", (code, roomId) => {
    socket.to('teacher: ' + roomId).emit("fetch init", code, socket.id);
  });


  socket.on('fetch code', async (studentId, adminId, roomId) => {
    // fetch all sockets
    const sockets = await io.fetchSockets()
      .catch((err) => { console.error(err); });
    // find dispatched student
    if (sockets.filter(skt => skt.id === studentId).length > 0){
      socket.sid = studentId;
      socket.to(studentId).emit("fetch request");
    } else { // todo-kw : unnecessary logic - may remove this
      socket.to(adminId).emit("no student", "no student here");
    }
    // stop fetching previous student's code if no longer requested
    if(socket.pr) socket.to(socket.pr).emit("stop request");
    // update previous requested student info for next request
    socket.pr = studentId;
  });


  // todo-kw: delete unused arg
  socket.on("onChange", (value, id, roomId) => {
    socket.to(id).emit("onChange", value, socket.id);
  });


  socket.on('onLecChange', (value, roomId) => {
    socket.to(roomId).emit("onLecChange", value, socket.id);
  });


  // socket.on("stop request", sid => {
  //   socket.to(sid).emit("stop request");
  // });


  socket.on("joined chat", (roomId) => {
    const roomIdx = rooms.findIndex(room => String(room.id) === roomId)
    if (roomIdx >= 0) {
      if (rooms[roomIdx].peers) {
        rooms[roomIdx].peers.push(socket.id);
      } else {
        rooms[roomIdx].peers = [socket.id];
      }
      console.log(`joining room with peers ${rooms[roomIdx].peers}`)
      const usersInThisRoom = rooms[roomIdx].peers.filter(
        (id) => id !== socket.id
      );
      
      console.log(`all users in chat room ${usersInThisRoom}`)
      // usersInThisRoom.forEach((userSocket) => socket.to(userSocket).emit("all users", usersInThisRoom))
      io.to(roomId).emit("all users", usersInThisRoom)
    }
  });


  socket.on("sending signal", (payload) => {
    console.log(`target is ${payload.userTarget}, caller is ${payload.callerID}`)
    socket.to(payload.userTarget).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });


  socket.on("returning signal", (payload) => {
    console.log("receiving returned signal")
    socket.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  })


  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit('hey', {signal: data.signalData, from: data.from});
  })


  socket.on("acceptCall", (data) => {
      io.to(data.to).emit('callAccepted', data.signal);
  })


  socket.on("disconnect audio", (roomId) => {
    const roomIdx = rooms.findIndex(room => String(room.id) === roomId)
    if (roomIdx >= 0) {
      let peers = rooms[roomIdx].peers;
        if (peers) {
            peers = peers.filter(id => id !== socket.id);
            rooms[roomIdx].peers = peers;
            peers.forEach((peer) => {
              socket.to(peer).emit("user disconnected audio", socket.id)
            })
        }
    } 
  })


  socket.on("disconnect", (reason) => {
    // TODO: investigate why socket.username is occassionally undefined
    // if user is logging out, update room info, else ignore
    if (reason === "client namespace disconnect") 
      deleteUserFromRoom(socket.username);
    // broadcast disconnection to all other users in the room
    socket.to(socket.roomId).emit("disconnection broadcast", socket.id, socket.role, socket.username);
  });

});
// end of socket logic


server.listen(PORT, function (err) {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
  console.log("backend setup");
});
