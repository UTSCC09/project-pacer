const path = require("path");
const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const http = require("http");
const PORT = 3000;
const version = '1.0.0';

app.get('/', (req, res) => res.send({ version }));

http.createServer(app).listen(PORT, function (err) {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
  console.log("backend setup")
});