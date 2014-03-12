window.addEventListener('load', onWindowLoad);

function onWindowLoad() {
    //Start point
    //Setting up Quintus

    var Q = window.Q = Quintus({development: true})
        .include('Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX, Audio')
        .setup('game')
        .controls(true).touch();

    var DIRECTION,
        SKINS,
        SOCKET_ADDRESS = '127.0.0.1',
        SOCKET_PORT = '3333',
        SOCKET = io.connect(SOCKET_ADDRESS + ':' + SOCKET_PORT),
        utils;

    //Setting up constants
    DIRECTION = {
        LEFT: 'left',
        RIGHT: 'right'
    };

    SKINS = {
        BLUE: 'player_blue.png',
        RED: 'player_red.png',
        ALL: function() {
            var skin,
                result = '';

            for(skin in this) {
                if (skin === 'ALL'){
                    continue;
                }

                result += ',' + this[skin];
            }

            return result;
        }
    };

    Q.SPRITE_PLAYER = 1;
    Q.SPRITE_GROUND = 2;
    Q.SPRITE_PLATFORM = 4;

    //Setting up utility
    utils = {
       getEnemyPlayerById: function(id) {
           var i, j, enemyPlayers = Q('EnemyPlayer').items;

           for(i=0, j=enemyPlayers.length; i<j; i++) {
               if (enemyPlayers[i].p.id === id){
                   return enemyPlayers[i];
               }
           }

           return null;
       },
       getEnemyNickNameById: function(id) {
           var i, j, enemyNickNames = Q('EnemyNickname').items;

           for(i=0, j=enemyNickNames.length; i<j; i++) {
               if (enemyNickNames[i].p.id === id){
                   return enemyNickNames[i];
               }
           }

           return null;
       }
    };

    //Setting up sprites
    Q.Sprite.extend('Player', {
        init: function(p) {
            this._super(p, {
                id: SOCKET.socket.sessionid,
                name: 'You',
                asset: p.skin,
                direction: DIRECTION.RIGHT,
                type: Q.SPRITE_PLAYER,
                lastPushToServer: new Date().getTime(),
                jumpSpeed: -450,
                collisionMask: Q.SPRITE_DEFAULT | Q.SPRITE_GROUND | Q.SPRITE_PLATFORM
            });

            this.add('2d, platformerControls');
            SOCKET.emit('player:joined', this.p);
        },
        step: function(dt) {
            if (Q.inputs['left'] && this.p.direction === DIRECTION.RIGHT) {
                this.p.flip = 'x';
                this.p.direction = DIRECTION.LEFT;
            }

            if (Q.inputs['right'] && this.p.direction === DIRECTION.LEFT) {
                this.p.flip = null;
                this.p.direction = DIRECTION.RIGHT;
            }

            if ((new Date().getTime() - this.p.lastPushToServer) > 16) {
                this.p.lastPushToServer = new Date().getTime();
                SOCKET.emit('player:move', {id: this.p.id, x: this.p.x, y:this.p.y });
            }

            if (Q('PlayerNickname').length === 0) {
                Q.stage().insert(new Q.PlayerNickname({
                    label: this.p.name,
                    x: this.p.x,
                    y: this.p.y,
                    color: '#000'
                }));
            }

            Q('PlayerNickname').first().p.x = this.p.x;
            Q('PlayerNickname').first().p.y = this.p.y - 20;
        }
    });

    Q.Sprite.extend('EnemyPlayer', {
        init: function(p) {
            this._super(p, {});
        }
    });

    //Setting up GUI
    Q.UI.Text.extend('PlayerNickname', {
        init: function(p) {
            this._super(p, {});
            this.fontString = '400 12px arial';
        }
    });

    Q.UI.Text.extend('EnemyNickname', {
        init: function(p) {
            this._super(p, {});
            this.fontString = '100 10px arial'
        }
    });

    //Setting up stage
    Q.scene('level1', function(stage) {
        var player;

        Q.stageTMX('level1.tmx', stage);
        player = new Q.Player({x: 500, y: 100, skin: SKINS.RED });

        stage.insert(player);
    });

    //Load resources and start the game
    Q.loadTMX('level1.tmx' + SKINS.ALL(), function() {
        Q.stageScene('level1');
    });

    //Setting up socket events
    SOCKET.on('player:joined', onNewPlayer);
    SOCKET.on('player:left', onPlayerLeft);
    SOCKET.on('player:move', onPlayerMove);
    SOCKET.on('players:list', onPlayersList);

    //Socket callbacks
    function onNewPlayer(data){
        if (Q('Player').first().p.id === data.id) {
            return;
        }

        Q.stage().insert(new Q.EnemyPlayer(data));
        /*Q.stage().insert(new Q.EnemyNickname({
            id: data.id,
            label: data.id,
            x: data.x,
            y: data.y,
            color: '#000'
        }));*/
    }

    function onPlayerMove(data) {
        var player = utils.getEnemyPlayerById(data.id),
            enemyNickName;

        if (player === null) {
            return;
        }

        player.p.x = data.x;
        player.p.y = data.y;
    }

    function onPlayersList(list){
        var i, j;

        for(i=0, j=list.length;i<j;i++){
            Q.stage().insert(new Q.EnemyPlayer(list[i]));
           /* Q.stage().insert(new Q.EnemyNickname({
                id: list[i].id,
                label: list[i].id,
                x: list[i].x,
                y: list[i].y,
                color: '#000'
            }));*/
        }
    }

    function onPlayerLeft(data) {

    }

}