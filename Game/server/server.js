var io = require('socket.io').listen(3333),
    utils = {
        objectToArray: function(object) {
            var item,
                array = [];

            for(item in object) {
                if (object.hasOwnProperty(item)) {
                    array.push(object[item]);
                }
            }

            return array;
        }
    },
    players = {};

//Start point. Connection
io.sockets.on('connection', function(socket) {
    socket.on('player:move', function(data) {
        if (players[data.id]){
            players[data.id].x = data.x;
            players[data.id].y = data.y;
        }

        io.sockets.emit('player:move', data);
    });

    socket.on('player:joined', function(data) {
        socket.emit('players:list', utils.objectToArray(players));

        if (!players[data.id]) {
            players[data.id] = data;
        }
        io.sockets.emit('player:joined', data);
    });

    socket.on('disconnect', function() {
        io.sockets.emit('player:left', {id: socket.id});
        delete players[socket.id];
    });
});