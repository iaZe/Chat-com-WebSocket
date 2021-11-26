const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

const ChatBot = 'OpenBOT';

io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);
        socket.emit('message', formatMessage(ChatBot, 'Você está conectado, bem-vindo!'));
        socket.broadcast.to(user.room).emit('message', formatMessage(ChatBot, `${user.username} foi conectado`));

        io.to(user.room).emit('roomUsers', { room: user.room, users: getRoomUsers(user.room)});
    });

    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(ChatBot, `${user.username} saiu`));

            io.to(user.room).emit('roomUsers', {room: user.room, users: getRoomUsers(user.room)});
        }
    });
});

const porta = 3000 || process.env.PORT;

server.listen(porta, () => console.log(`Servidor online na porta ${porta}`));