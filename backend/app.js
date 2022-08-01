const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require("express-session");
// const Redis = require("redis")
let RedisStore = require("connect-redis")(session);
const { body, validationResult } = require("express-validator");
// generate uuid
// const uuidv4 = require("uuid/v4");

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

// const { createClient } = require("redis")
// let redisClient = createClient({ legacyMode: true })
// redisClient.connect().catch(console.error)

// const sessionStore = require("nedb-session-store")(session);

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

// const redisClient = Redis.createClient()
// redisClient.connect();

const DEFAULT_EXPIRATION = 7200;

const sessionMiddleware = session({
  secret: process.env.SECRET,
  saveUninitialized: false,
  resave: false,
  name: "pacer-session",
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // Two Hours
    sameSite: true,
  },
  sameSite: true,
  httpOnly: true,
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
const { SocketClosedUnexpectedlyError } = require("redis");
const { json } = require("body-parser");
app.use("/api", webhookRoutes);

const saltRounds = 10;

app.get("/api/whoami", function (req, res) {
  console.log(`load user session is : ${req.session.username}`);
  const userName = req.session.username;
  if (!userName) return res.json(null);
  // BEFORE FB:
  const user = users.find((x) => x.username === userName);
  console.log(user)
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
    console.log("hit login endpoint");
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
      console.log(`session is : ${req.session.username}`);
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
      console.log(`session is : ${req.session.username}`);
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
  console.log("hit signout endpoint");
  console.log("deleting");
  // redisClient.del(req.session.username)
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
    console.log("setting");
    console.log(req.body.socketId);
    const socketId = req.body.socketId;
    // redisClient.setEx(user.username, DEFAULT_EXPIRATION, socketId)
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
  console.log("hit get all rooms endpoint");
  // console.log(`rooms ${rooms}`);
  return res.json(rooms);
});

// todo-kw
app.get("/api/rooms/:host/", isAuthenticated, function (req, res) {
  console.log("hit get room info endpoint");
  // console.log(`rooms ${rooms}`);
  const room = rooms.find((room) => room.host === req.params.host);
  if (room) {
    /* a room with specified host already exists */
    return res.json(room);
  } else {
    return res
      .status(404)
      .json("Room with host " + req.params.host + " not found.");
  }
});

app.patch("/api/rooms/:host/", isAuthenticated, function (req, res) {
  console.log("hit update room info endpoint");
  /* a room with specified host already exists */
  console.log(rooms);
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
    console.log("conflicted");
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
  console.log("getting");
  try {
    // let socketId = await redisClient.get(user.username)
    // if (!socketId) {
    //   console.log("failed")
    const socketId = req.body.socketId;
    // console.log(socketId)
    // redisClient.setEx(user.username, DEFAULT_EXPIRATION, socketId)
    // }
    users[idx].roomHost = rooms[room_idx].id;
    const userInfo = {
      id: user.id,
      username: user.username,
      role: user.role,
      roomHost: rooms[room_idx].host,
      socketId,
    };
    rooms[room_idx].users.push(userInfo);
    console.log(rooms);
    return res.json(rooms[room_idx]);
  } catch (err) {
    return res.status(500).json(err);
  }
});

app.delete("/api/rooms/:host/", isAuthenticated, function (req, res) {
  console.log("hit delete room info endpoint");
  rooms = rooms.map((room) => {
    if (room.host === req.params.host) {
      const roomUsers = room.users;
      if (
        roomUsers.filter((user) => user.username === req.session.username)
          .length === 0
      ) {
        return res
          .status(409)
          .json(
            "user info not found while trying to delete: " +
              req.session.username
          );
      }
      const idx = roomUsers.findIndex(
        (user) => user.username === req.session.username
      );
      const userIdx = users.findIndex(
        (x) => x.username === req.session.username
      );
      users[userIdx].roomHost = null;
      if (idx >= 0) {
        console.log("clearing");
        roomUsers.splice(idx, 1);
        return { ...room, users: roomUsers };
      }
      return res.status(500).json("this error is impossible");
    }
  });
  return res
    .status(404)
    .json(
      "Cannot delete user info, room with host " +
        req.params.host +
        " not found."
    );
});

function deleteUserFromRoom(username) {
  console.log("deleting user " + username + " from rooms");
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
      console.log(room_idx);
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
      console.log(rooms);
    }
  }
}

// function deleteUserFromRoom(username, roomId) {
//   console.log("deleting user " + username + " from rooms");
//   const idx = users.findIndex((x) => x.username === username);
//   let host = null;
//   let isAdmin = false;

//   if (idx >= 0) {
//     host = users[idx].roomHost;
//     users[idx].roomHost = null;
//     isAdmin = users[idx].role === "Admin";
//   }
  
//   if (host) {
//     const room_idx = rooms.findIndex((room) => room.host === host);
//     if (room_idx >= 0) {
//       console.log(room_idx);
//       const roomUsers = rooms[room_idx].users;
//       const roomUserIdx = roomUsers.findIndex((x) => x.username === username);
//       if (roomUserIdx >= 0) {
//         rooms[room_idx].users.splice(roomUserIdx, 1);
//         if (isAdmin) {
//           rooms[room_idx].hasTeacher = false;
//         }
//       }
//       if (rooms[room_idx].users.length === 0) {
//         rooms.splice(room_idx, 1);
//       }
//       console.log(rooms);
//     }
//   }
// }


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

// socket io
// var prevRequest = '';
io.on('connection', async (socket) => {
  // socket.join("room1");
  // console.log("[Server] joined room: " + socket.rooms); // Set { <socket.id>, "room1" }
  console.log("[Server] a user connected, socket id is :" + socket.id);
  // const count = io.engine.clientsCount;
  // console.log("[server count]:", count);

  socket.on("room update", () =>{
    socket.broadcast.emit("room update", "received");
  })

  socket.on("set attributes", (role, curUser, roomId) => {
    socket.role = role;
    socket.username = curUser;
    socket.roomId = roomId;
    socket.join(roomId);
    console.log("rooms", socket.rooms);
    if (role === 'teacher') {
      socket.pr = "";
      socket.sid = "";
    }
    // socket.broadcast.emit("connection broadcast", socket.id, role, curUser);
    socket.to(roomId).emit("connection broadcast", socket.id, role, curUser);
  });

  //new
  socket.on('teacher join', (roomId) => {
    socket.join('teacher: ' + roomId);
    // socket.broadcast.emit('teacher join', socket.id);
    socket.to(roomId).emit('teacher join', socket.id);

  });

  socket.on("student join", (curUser, roomId) => {
    console.log("student join");
    socket.to('teacher: ' + roomId).emit("student join", socket.id, curUser);
  });

  socket.on("onChange", (value, id, roomId) => {
    console.log("onChange");
    socket.to(id).emit("onChange", value, socket.id);
  });


  socket.on('onLecChange', (value, roomId) => {
    // socket.broadcast.emit("onLecChange", value, socket.id);
    socket.to(roomId).emit("onLecChange", value, socket.id);
  });

  socket.on('fetch code', async (studentId, adminId, roomId) => {
    const sockets = await io.fetchSockets()
      .catch((err) => { console.error(err); });

    if (sockets.filter(skt => skt.id === studentId).length > 0){
      socket.sid = studentId;
      socket.to(studentId).emit("fetch request");
    } else {
      socket.to(adminId).emit("no student", "no student here");
    }

    if(socket.pr) socket.to(socket.pr).emit("stop request");

    socket.pr = studentId;
  });

  socket.on("joined chat", (roomId) => {
    const roomIdx = rooms.findIndex(room => String(room.id) === roomId)
    console.log(rooms)
    console.log(roomId)
    console.log(roomIdx)
    if (roomIdx >= 0) {
      if (rooms[roomIdx].peers) {
        // const length = users[roomIdx].peers.length;
        // if (length === 4) {
        //     socket.emit("room full");
        //     return;
        // }
        rooms[roomIdx].peers.push(socket.id);
      } else {
        rooms[roomIdx].peers = [socket.id];
      }
      console.log(`joining room with peers ${rooms[roomIdx].peers}`)
      const usersInThisRoom = rooms[roomIdx].peers.filter(
        (id) => id !== socket.id
      );
      
      console.log(`all users in chat room ${usersInThisRoom}`)
      socket.emit("all users", usersInThisRoom);
    }
  });

  // socket.on("joined chat", (roomId) => {
  //   const roomID = rooms.findIndex(room => room.id === roomId);
  //   console.log(`joining room with peers ${rooms[roomID].peers}`);
  //   if (rooms[roomID].peers) {
  //     // const length = users[roomID].peers.length;
  //     // if (length === 4) {
  //     //     socket.emit("room full");
  //     //     return;
  //     // }
  //     rooms[roomID].peers.push(socket.id);
  //   } else {
  //     rooms[roomID].peers = [socket.id];
  //   }
  //   const usersInThisRoom = rooms[roomID].peers.filter(
  //     (id) => id !== socket.id
  //   );
    
  //   console.log(`all users in chat room ${usersInThisRoom}`)
  //   socket.emit("all users", usersInThisRoom);
  // });


  socket.on("sending signal", (payload) => {
    console.log("sending signal")
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

  socket.on("disconnect audio", (roomId) => {
    console.log("disconnect audio")
    console.log(roomId)
    const roomIdx = rooms.findIndex(room => String(room.id) === roomId)
    if (roomIdx >= 0) {
      let peers = rooms[roomIdx].peers;
        console.log(`peers: ${peers}`)
        if (peers) {
            peers = peers.filter(id => id !== socket.id);
            rooms[roomIdx].peers = peers;
        }
        peers.forEach((peer) => {
          socket.to(peer).emit("user disconnected audio", socket.id)
        })
    } 
  })
    

  socket.on("fetch init", (code, roomId) => {
    socket.to('teacher: ' + roomId).emit("fetch init", code, socket.id);
  });


  socket.on("help request", (roomId) => {
    socket.to('teacher: ' + roomId).emit("help request", socket.id, socket.username);
  });


  socket.on("disconnect", (reason) => {
    var activeUsers = new Set();
    var socketLeft = io.sockets.adapter.rooms;
    var clients = io.sockets.adapter.rooms[socket.roomId];
    activeUsers.add(clients);
    console.log("active Users", activeUsers);
    console.log(`disconnection socketLeft ${JSON.stringify(socketLeft)} ${JSON.stringify(clients)}`);
    if(!socketLeft){
      console.log(`disconnection reach disconnection point`);
      socket.emit("room update");
    }
    // if user is logging out, update room info, else ignore
    console.log("deleting");
    // TODO: investigate why socket.username is occassionally undefined
    console.log(socket.username);
    // if (socket.username) redisClient.del(socket.username)
    if (reason === "client namespace disconnect")
      deleteUserFromRoom(socket.username);

    socket.to(socket.roomId).emit("disconnection broadcast", socket.id, socket.role, socket.username);
    console.log(`[disconnected] user: ${socket.id} reason: ${reason}`);
  });


  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit('hey', {signal: data.signalData, from: data.from});
  })

  socket.on("acceptCall", (data) => {
      io.to(data.to).emit('callAccepted', data.signal);
  })
});

server.listen(PORT, function (err) {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
  console.log("backend setup");
});
