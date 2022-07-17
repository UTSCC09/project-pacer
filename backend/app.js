const path = require("path");
const express = require("express");
const app = express();

const http = require("http");
const PORT = 8080;
const version = '1.0.0';

// [kw] socket setup
const server = http.createServer(app);
const { Server } = require('socket.io')
// const cors = require('cors')
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000"
  }
})

const bodyParser = require("body-parser");
app.use(bodyParser.json());


app.get('/api', (req, res) => res.send({ version }));

// [kw] socket io

const socketMeta = {length: 0, aIdx: -1}
var prevRequest = '';

io.on('connection', async (socket) => {
  console.log("================================")
  // socketMeta.length++;


  const count = io.engine.clientsCount;
  console.log("[server count]:", count);

  // const sockets = await io.fetchSockets();
  // console.log("[server fetchSockets]:", sockets);


  console.log('[Server] a user connected, socket id is :' + socket.id);
  console.log("[Server] current room: " + socket.rooms); // Set { <socket.id> }
  socket.join("room1");
  console.log("[Server] joined room: " + socket.rooms); // Set { <socket.id>, "room1" }


  socket.on('set attributes', role => {
    // if (socket.role == 'admin') aInx
    socket.role = role;
    socket.createTime = Date();
    console.log("[Server] - set attributes: ", socket.id, socket.role, socket.createTime);
  });


  socket.on('onChange', (value, id) => {
    console.log("[Server] - onChange:  " + value + " || from Socket: " + socket.id);
    socket.to(id).emit("onChange", value, socket.id);
  });


  socket.on('onLecChange', value => {
    console.log("[Server] - onLecChange:  " + value + " || from Socket: " + socket.id);
    socket.broadcast.emit("onLecChange", value, socket.id);
  });


  socket.on('fetch code', async (value, adminId) => {

    const sockets = await io.fetchSockets()
      .catch((err) => { console.error(err); });
    
    console.log("[Server] - fetch code:  " + value);
    console.log("[Server] - fetch code: length  " + sockets.length)
    console.log("[Server] - fetch code: adminId  " + adminId)
    console.log(sockets[0].id,sockets[0].role,
       sockets[1].id,sockets[1].role,
        sockets[2].id,sockets[2].role,
        sockets[3].id,sockets[3].role);

    var studentId = '';
    var count = 0;

    if (value < sockets.length){
      // if (sockets[value - 1].role == 'user'){
      //   studentId = sockets[value - 1].id
      // } else {
      //   studentId = sockets[value].id
      // }
      // console.log("[Server] - fetch code: studentId  " + studentId)
      // socket.to(studentId).emit("fetch request", adminId);
      sockets.forEach((skt) => {
        if ( skt.role == 'user' && ++count == value){
          studentId = skt.id;
        } 
      });
      console.log("[Server] - fetch code: studentId  " + studentId);
      socket.to(studentId).emit("fetch request", adminId);
    } else {
      console.log("[Server] - fetch code: no such student")
      socket.to(adminId).emit('no student',"no student here");
    }

    if (prevRequest){
      socket.to(prevRequest).emit("stop request");
      // socket.to(adminId).emit("no student", "no student here");
    } 
    
    prevRequest = studentId;
    

    // socket.to(studentId).emit("fetch request", adminId);

  });

  // socket.on("close student", id => {
  //   socket.to(id).emit("close student");
  // });



  socket.on('disconnect', () => {
    // if(socket.role === "admin") socketMeta.aIdx = -1;
    // socketMeta.length--;
    console.log('user disconnected ', socket.id);
  });

});
// end of socket io


server.listen(PORT, function (err) {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
  console.log("backend setup")
});