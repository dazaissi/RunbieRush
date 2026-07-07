var layoutSize = {
    w: 1024,
    h: 768
};

var X_POSITION;
var Y_POSITION;
var relativeSize;

var config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: [
        TA_scnMenu,
        // TA_scnPlay,
        // TA_scnGameOver
    ]
};

var game = new Phaser.Game(config);

