const path = require("path");
const express = require("express");
const cors = require('cors');
const bcrypt = require("bcrypt");
const session = require("express-session");
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
const PORT = 3000;
const version = "1.0.0";

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
    origin: "*",
    credentials: true
  }
})


const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(cors({
  origin: "*",
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
//   },
//   {
//     id: 0,
//     username: "user",
//     password: "user",
//     role: Role.User,
//   },
];

const webhookRoutes = require('./routes/webhookRoutes');
app.use('/api', webhookRoutes);

const saltRounds = 10;

app.get("/api/whoami", function (req, res) {
  console.log(`load user session is : ${req.session.username}`)
  const userName = req.session.username;
  if (!userName) return res.json(null);
  const user = users.find(x => x.username === userName);
  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
});;
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
      return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
    });
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
  req.session.destroy(function (err) {
    if (err) return res.status(500).json(err);
  });
  res.clearCookie("pacer-session");
  return res.json(null);
});

// `Not Found` request handler
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  throw error;
});


// thrown erros handler
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({ message: error.message || 'Internal Server Error' });
});

// socket io
var prevRequest = '';
io.on('connection', async (socket) => {
  // const sockets = await io.fetchSockets();
  // console.log("[server fetchSockets]:", sockets);
  // console.log("[Server] current room: " + socket.rooms); // Set { <socket.id> }
  // socket.join("room1");
  // console.log("[Server] joined room: " + socket.rooms); // Set { <socket.id>, "room1" }
  console.log('[Server] a user connected, socket id is :' + socket.id);
  const count = io.engine.clientsCount;
  console.log("[server count]:", count);


  socket.on('set attributes', (role, curUser) => {
    // socket.createTime = Date();
    socket.role = role;
    socket.username = curUser;
    // socket.broadcast.emit("join broadcast", socket.id, role, curUser);
    socket.broadcast.emit("connection broadcast", socket.id, role, curUser);
    // if(role == 'admin') socket.join('teacher');
    // console.log("[Server] - set attributes: ", socket.id, socket.role);
  });


  socket.on('teacher join', () => {
    socket.join('teacher');
    socket.broadcast.emit('teacher join', socket.id)
  });

  // socket.on('student join', tSktId => {
  //   socket.to(tSktId).emit('student join', socket.id);
  // });

  socket.on('student join', (curUser) => {
    socket.to('teacher').emit('student join', socket.id, curUser);
  });


  socket.on('onChange', (value, id) => {
    console.log("[Server] - onChange:  " + value + " || from Socket: " + socket.id);
    socket.to(id).emit("onChange", value, socket.id);
  });


  socket.on('onLecChange', value => {
    // console.log("[Server] - onLecChange:  " + value + " || from Socket: " + socket.id);
    socket.broadcast.emit("onLecChange", value, socket.id);
  });


  socket.on('fetch code', async (studentId, adminId) => {

    const sockets = await io.fetchSockets()
      .catch((err) => { console.error(err); });
    
    // console.log("[Server] - fetch code:  " + value);
    // console.log("[Server] - fetch code: length  " + sockets.length)
    // console.log("[Server] - fetch code: adminId  " + adminId)

    if (sockets.filter(skt => skt.id === studentId).length > 0){
      console.log("[Server] - fetch code: studentId  " + studentId);
      socket.to(studentId).emit("fetch request", adminId);
    } else {
      console.log("[Server] - fetch code: no such student with id " + studentId)
      socket.to(adminId).emit('no student',"no student here");
    }

    if (prevRequest){
      socket.to(prevRequest).emit("stop request");
    } 
    
    prevRequest = studentId;

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit('hey', {signal: data.signalData, from: data.from});
    })

    socket.on("acceptCall", (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
    })
    // socket.to(studentId).emit("fetch request", adminId);
  });

  socket.on("fetch init", code => {
    socket.to('teacher').emit("fetch init", code);
  });

  socket.on("help request", () => {
    socket.to('teacher').emit("help request", socket.id, socket.username);
  });



  socket.on("disconnection broadcast", () => {
    socket.broadcast.emit("disconnection broadcast", socket.id, socket.role, socket.username);
  });

  socket.on('disconnect', () => {
    // socket.broadcast.emit("disconnection broadcast", socket.id, socket.role, socket.username);
    console.log('user disconnected ', socket.id);
  });
});


server.listen(PORT, function (err) {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
  console.log("backend setup");
});
