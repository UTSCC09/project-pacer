const path = require("path");
const express = require("express");
const cors = require('cors');
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors())

const http = require("http");
const PORT = 8080;
const version = "1.0.0";

const Role = {
  Admin: 'Admin',
  User: 'User'    
}

let users = [
//   {
//     id: 1,
//     username: "admin",
//     password: "admin",
//     firstName: "Admin",
//     lastName: "User",
//     role: Role.Admin,
//   },
//   {
//     id: 2,
//     username: "user",
//     password: "user",
//     firstName: "Normal",
//     lastName: "User",
//     role: Role.User,
//   },
];

const saltRounds = 10;

app.get("/api", (req, res) => res.send({ version }));

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
      return res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
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
      return res.json(newUser)
    });
  }
);

app.post("/api/signout/", function (req, res) {
  console.log("hit signout endpoint")
  return res.json(null);
});

http.createServer(app).listen(PORT, function (err) {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
  console.log("backend setup");
});
