// menu scene
class TA_scnMenu extends Phaser.Scene {
    constructor() {
        super('TA_scnMenu');
    }

    preload() {
        this.load.image('bg', '/assets/bg.png');
        this.load.image('title', '/assets/title.png');
        this.load.image('buttonplay', '/assets/btnplay.png');
    }

    create() {
        X_POSITION = {
            LEFT: 0,
            CENTER: game.canvas.width / 2,
            RIGHT: game.canvas.width
        };

        Y_POSITION = {
            TOP: 0,
            CENTER: game.canvas.height / 2,
            BOTTOM: game.canvas.height
        };

        relativeSize = {
            w: (game.canvas.width - layoutSize.w) / 2,
            h: (game.canvas.height - layoutSize.h) / 2
        };

        this.add.image(X_POSITION.CENTER, Y_POSITION.CENTER, 'bg');

       this.add.image(X_POSITION.CENTER, Y_POSITION.CENTER - 180, 'title');

        var buttonPlay = this.add.image(
            X_POSITION.CENTER,
            Y_POSITION.CENTER + 180,
            'buttonplay'
        );

        buttonPlay.setInteractive();

        buttonPlay.on('pointerover', function (pointer) {
            this.setTint(0x44ff44);
        }, buttonPlay);

        buttonPlay.on('pointerout', function (pointer) {
            this.clearTint();
        }, buttonPlay); 

        buttonPlay.on('pointerdown', function (pointer) {
            this.setTint(0xff0000);
        }, buttonPlay);

        buttonPlay.on('pointerup', function (pointer) {
            this.scene.start('TA_scnPlay');
        }, this);
    }
}