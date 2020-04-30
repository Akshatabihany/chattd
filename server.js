const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);




////mongo
const mongodb = require('mongodb');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.set('view engine', 'ejs')

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://atom:atom@cluster0-5i0bk.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });

client.connect(err => {
    const collection = client.db("atom").collection("users");
    console.log("sdf");
    // perform actions on the collection object
   client.close();
  });

app.get('/',(req,res) => {
    
    MongoClient.connect(uri,(err,db) => {
        if (err) throw err

        let dbo = db.db("atom")
        let query = {}

        dbo.collection("users").find(query).toArray((dbErr,result) => {
            if(dbErr) throw dbErr

            res.render('index',{'users' : result})

            db.close()
        })
    })
})

////mongo


app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';

io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    socket.emit('message', formatMessage(botName, 'Welcome to atom!'));

    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

// socket.on('msg', function(data){
//   let name = data.name;
//   let message = data.msg;

//   // Check for name and message
//   if(name == '' || message == ''){
//       // Send error status
//       sendStatus('Please enter a name and message');
//   } else {
//       // Insert message
//       chat.insert({name: name, message: message}, function(){
//           client.emit('output', [data]);

//           // Send status object
//           sendStatus({
//               message: 'Message sent',
//               clear: true
//           });
//       });
//   }
// });



const PORT = process.env.PORT || 3000;



server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
