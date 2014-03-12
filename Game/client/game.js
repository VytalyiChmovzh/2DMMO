window.addEventListener('load', onWindowLoad);

function onWindowLoad() {
    //Start point
    //Setting up Quintus

    var Q = window.Q = Quintus({development: true})
        .include('Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX, Audio')
        .setup('game')
        .controls(true).touch();

    var DIRECTION;

    //Setting up constants
    DIRECTION = {
        LEFT: 'left',
        RIGHT: 'right'
    };

    Q.SPRITE_PLAYER = 1;
    Q.SPRITE_GROUND = 2;
    Q.SPRITE_PLATFORM = 4;

    //Setting up sprites
    Q.Sprite.extend('Player', {
        init: function(p) {
            this._super(p, {
                name: 'Player1',
                sheet: 'player',
                direction: DIRECTION.LEFT,
                type: Q.SPRITE_PLAYER,
                jumpSpeed: -400,
                collisionMask: Q.SPRITE_DEFAULT | Q.SPRITE_GROUND | Q.SPRITE_PLATFORM
            });

            this.add('2d, platformerControls');
        }
    });

    //Setting up stage
    Q.scene('level1', function(stage) {
        Q.stageTMX('level1.tmx', stage);
        stage.insert(new Q.Player({x: 500, y: 100 }));
    });

    //Load resources
    Q.loadTMX('level1.tmx, player.png, player.json', function() {
        Q.compileSheets('player.png', 'player.json');
        Q.stageScene('level1');
    });

}