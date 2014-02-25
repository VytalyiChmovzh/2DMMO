var io = require('socket.io').listen(1112);

io.sockets.on('connection', function(socket) {
    socket.on('move', function(playerData) {
        console.log(playerData);
    });
})