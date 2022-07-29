const path = require("path");
const express = require("express");
const cors = require('cors');
const bcrypt = require("bcrypt");
const session = require("express-session");
// const Redis = require("redis")
let RedisStore = require("connect-redis")(session)
const { body, validationResult } = require("express-validator");

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

const DEFAULT_EXPIRATION = 7200

const sessionMiddleware = session({
  secret: process.env.SECRET,
  saveUninitialized: false,
  resave: false,
  name: "pacer-session",
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // Two Hours
    sameSite: true,
  },
  sameSite:true,
  httpOnly:true
  // store: new RedisStore({ client: redisClient }),
  // store: new sessionStore({
  //   filename: "db/sessions.db",
  // }),
})

app.use(
  sessionMiddleware
)


// [kw] socket setup
const server = http.createServer(app);
const { Server } = require('socket.io')
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
})


const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

const isAuthenticated = function (req, res, next) {
  if (!req.session.username) return res.status(401).json("access denied");
  next();
};

app.get('/api', (req, res) => res.send({ version }));

const Role = {
  Admin: 'Admin',
  User: 'User'    
}

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
//   },
]

const NewRoom = (function () {
  return function item(roomName, host, user) {
    this.host = host;
    this.hasTeacher = user.role === Role.Admin;
    this.roomName = roomName;
    this.users = [user];
  };
})();

const webhookRoutes = require('./routes/webhookRoutes');
app.use('/api', webhookRoutes);

const saltRounds = 10;

app.get("/api/whoami", function (req, res) {
  console.log(`load user session is : ${req.session.username}`)
  const userName = req.session.username;
  if (!userName) return res.json(null);
  const user = users.find(x => x.username === userName);
  // find the socket id
  console.log("getting")
  // redisClient.get(user.username, (err, socketId) => {
  //   if (err) return res.status(500).json(err)
  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    roomHost: user.roomHost,
    // socketId
  });
  // });
});

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
    console.log("hit login endpoint")
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

    const user = users.find(x => x.username === username);
    console.log("getting")
    if (!user) return res.status(401).json("invalid credentials");
    if (user && user.role !== role) return res.status(401).json('Incorrect role selected');
    bcrypt.compare(password, user.password, function (err, result) {
      if (err) return res.status(500).json(err);
      if (!result) {
        return res.status(401).json("invalid credentials");
      }
      req.session.username = username;
      req.session.role = role;
      console.log(`session is : ${req.session.username}`)
      // redisClient.get(user.username, (err, socketId) => {
      //   if (err) return res.status(500).json(err)
      return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        roomHost: user.roomHost,
        // socketId
      });
      // });
    });
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
    console.log("hit signup endpoint")
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
      const user = users.find(x => x.username === username);
      if (user) return res.status(409).json("username " + username + " already exists");
      const newUser = {
        id: 0,
        username: username,
        password: hash,
        role: role,
        roomHost: null
      }
      users.push(newUser)
      req.session.username = username;
      req.session.role = role;
      console.log(`session is : ${req.session.username}`)
      console.log("here")
      return res.json({
        id: 0,
        username: username,
        role: role
      })
    });
  }
);

app.post("/api/signout/", isAuthenticated, function (req, res) {
  console.log("hit signout endpoint")
  console.log("deleting")
  // redisClient.del(req.session.username)
  req.session.destroy(function (err) {
    if (err) return res.status(500).json(err);
  });
  res.clearCookie("pacer-session");
  return res.json(null);
});

app.post("/api/rooms/", isAuthenticated, function (req, res) {
  console.log("hit post room info endpoint")
  const idx = users.findIndex(x => x.username === req.session.username);
  const user = users[idx]
  console.log("setting")
  console.log(req.body.socketId)
  const socketId = req.body.socketId
  // redisClient.setEx(user.username, DEFAULT_EXPIRATION, socketId)
  users[idx].roomHost = user.username
  const userInfo = {
    id: user.id,
    username: user.username,
    role: user.role,
    socketId
  }
  if (rooms.filter(room => room.host === user.username).length > 0) {
    /* a room with specified host already exists */
    return res.status(409).json("room with host" + user.username + " already exists");
  } else {
    const room = new NewRoom(req.body.roomName, req.session.username, userInfo);
    rooms.push(room)
    return res.json(room)
  }
})

app.get("/api/rooms/", isAuthenticated, function (req, res) {
  //TODO: adapt GET for pagination and firebase
  console.log("hit get all rooms endpoint")
  return res.json(rooms)
})

app.get("/api/rooms/:host/", isAuthenticated, function (req, res) {
  console.log("hit get room info endpoint")
  const room =  rooms.find(room => room.host === req.params.host)
  if (room) {
    /* a room with specified host already exists */
    return res.json(room)
  } else {
    return res.status(404).json("Room with host " + req.params.host + " not found.");
  }
})

app.patch("/api/rooms/:host/", isAuthenticated, async function (req, res) {
  console.log("hit update room info endpoint");
  /* a room with specified host already exists */
  console.log(rooms)
  const room_idx = rooms.findIndex(room => room.host === req.params.host);
  if (room_idx < 0) return res.status(404).json("Cannot update user info, room with host " + req.params.host + " not found.");
  const roomUsers = rooms[room_idx].users
  if (roomUsers.filter(user => user.username === req.session.username).length > 0) {
    console.log("conflicted")
    return res.status(409).json("room already has user " + req.session.username);
  } 
  const idx = users.findIndex(x => x.username === req.session.username);
  const user = users[idx]
  console.log("getting")
  try {
    // let socketId = await redisClient.get(user.username)
    // if (!socketId) {
    //   console.log("failed")
    const socketId = req.body.socketId
      // console.log(socketId)
      // redisClient.setEx(user.username, DEFAULT_EXPIRATION, socketId)
    // }
    users[idx].roomHost = rooms[room_idx].host
    const userInfo = {
      id: user.id,
      username: user.username,
      role: user.role,
      roomHost: user.roomHost,
      socketId
    };
    rooms[room_idx].users.push(userInfo)
    console.log(rooms)
    return res.json(rooms[room_idx])
  } catch (err) {
    return res.status(500).json(err)
  }
})

app.delete("/api/rooms/:host/", isAuthenticated, function (req, res) {
  console.log("hit delete room info endpoint")
  rooms = rooms.map(room => {
    if (room.host === req.params.host) {
      const roomUsers = room.users
      if (roomUsers.filter(user => user.username === req.session.username).length === 0) {
        return res.status(409).json("user info not found while trying to delete: " + req.session.username);
      }
      const idx = roomUsers.findIndex((user) => user.username === req.session.username);
      const userIdx = users.findIndex(x => x.username === req.session.username);
      users[userIdx].roomHost =null
      if (idx >= 0) {
        console.log("clearing");
        roomUsers.splice(idx, 1);
        return {...room, users: roomUsers}
      }
      return res.status(500).json("this error is impossible")
    }
  })
  return res.status(404).json("Cannot delete user info, room with host " + req.params.host + " not found.");
})

function deleteUserFromRoom(username) {
  console.log("deleting user " + username + " from rooms");
  const idx = users.findIndex(x => x.username === username);
  let host = null
  if (idx >= 0) {
    host = users[idx].roomHost
    users[idx].roomHost = null
  }
  if (host) {
    const room_idx = rooms.findIndex(room => room.host === host);
    if (room_idx >= 0) {
      console.log(room_idx)
      const roomUsers = rooms[room_idx].users;
      const roomUserIdx = roomUsers.findIndex(x => x.username === username);
      if (roomUserIdx >= 0) {
        rooms[room_idx].users.splice(roomUserIdx, 1);
      }
      if (rooms[room_idx].users.length === 0) {
        rooms.splice(room_idx, 1)
      }
      console.log(rooms)
    }
  }
}

// `Not Found` request handler
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  throw error;
});

// thrown erros handler
// app.use((error, req, res, next) => {
//   res.status(error.status || 500);
//   res.json({ message: error.message || 'Internal Server Error' });
// });

// socket io
var prevRequest = '';
io.on('connection', async (socket) => {
  // const sockets = await io.fetchSockets();
  // console.log("[server fetchSockets]:", sockets);
  // console.log("[Server] current room: " + socket.rooms); // Set { <socket.id> }
  // socket.join("room1");
  // console.log("[Server] joined room: " + socket.rooms); // Set { <socket.id>, "room1" }
  console.log('[Server] a user connected, socket id is :' + socket.id);
  // const count = io.engine.clientsCount;
  // console.log("[server count]:", count);


  socket.on('set attributes', (role, curUser) => {
    socket.role = role;
    socket.username = curUser;
    console.log("setting")
    // redisClient.setEx(curUser, DEFAULT_EXPIRATION, socket.id)
    socket.broadcast.emit("connection broadcast", socket.id, role, curUser);
  });


  socket.on('teacher join', () => {
    socket.join('teacher');
    console.log('teacher join')
    socket.broadcast.emit('teacher join', socket.id)
  });


  socket.on('student join', (curUser) => {
    console.log('student join')
    socket.to('teacher').emit('student join', socket.id, curUser);
  });


  socket.on('onChange', (value, id) => {
    console.log('onChange')
    socket.to(id).emit("onChange", value, socket.id);
  });


  socket.on('onLecChange', value => {
    console.log('onLecChange')
    socket.broadcast.emit("onLecChange", value, socket.id);
  });

  socket.on("callUser", (data) => {
    console.log(`calling user ${data.userToCall}`)
    socket.to(data.userToCall).emit('hey', {signal: data.signalData, from: data.from, stream: data.stream});
  })

  socket.on("acceptCall", (data) => {
    console.log(`accepting call from ${data.to}`)
    socket.to(data.to).emit('callAccepted', data.signal);
  })

  socket.on('fetch code', async (studentId, adminId) => {
    console.log(`fetch code`)
    const sockets = await io.fetchSockets()
      .catch((err) => { console.error(err); });
    
    if (sockets.filter(skt => skt.id === studentId).length > 0){
      socket.to(studentId).emit("fetch request", adminId);
    } else {
      socket.to(adminId).emit('no student',"no student here");
    }

    if (prevRequest){
      socket.to(prevRequest).emit("stop request");
    } 
    
    prevRequest = studentId;

  });


  socket.on("fetch init", code => {
    socket.to('teacher').emit("fetch init", code);
  });


  socket.on("help request", () => {
    socket.to('teacher').emit("help request", socket.id, socket.username);
  });

  socket.on('disconnect', (reason) => {
    // const count = io.of("/").sockets.size - 1;
    const count = io.of("/").sockets.size;
    // if user is logging out, update room info, else ignore
    console.log("deleting")
    // TODO: investigate why socket.username is occassionally undefined
    console.log(socket.username)
    // if (socket.username) redisClient.del(socket.username)
    if (reason === "client namespace disconnect") deleteUserFromRoom(socket.username);
    socket.broadcast.emit("disconnection broadcast", socket.id, socket.role, socket.username);
    console.log(`[disconnected] user: ${socket.id} reason: ${reason}`);
  });
});


server.listen(PORT, function (err) {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
  console.log("backend setup");
});
