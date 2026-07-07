class TA_scnGameOver extends Phaser.Scene {
  constructor() {
    super("TA_scnGameOver");
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalCoins = data.coins || 0;
  }

  create() {
  //  audio kalah
    if (this.cache.audio.exists("kalah")) {
      this.sound.play("kalah", {
        volume: 0.7
      });
    }

   
    if (this.cache.audio.exists("ambience")) {
      const ambience = this.sound.get("ambience");
      if (ambience && ambience.isPlaying) {
        ambience.stop();
      }
    }

  //  bg
    if (this.textures.exists("bgSky")) {
      this.add.image(0, 0, "bgSky")
        .setOrigin(0)
        .setDisplaySize(WIDTH, HEIGHT);
    } else {
      this.cameras.main.setBackgroundColor("#87CEEB");
    }

    if (this.textures.exists("bgCloud")) {
      const cloudH = this.textures.get("bgCloud").getSourceImage().height;

      this.add.tileSprite(0, 0, WIDTH, cloudH, "bgCloud")
        .setOrigin(0)
        .setAlpha(0.9);
    }

    if (this.textures.exists("bgTrees")) {
      const treeH = this.textures.get("bgTrees").getSourceImage().height;

      this.add.tileSprite(0, HEIGHT, WIDTH, treeH, "bgTrees")
        .setOrigin(0, 1);
    }

    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.35).setOrigin(0);

  // gem over
    this.add.text(WIDTH / 2, 75, "GAME OVER", {
      fontFamily: "font",
      fontSize: "60px",
      color: "#ff5252",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    // score
    const scorePanel = this.add.container(WIDTH / 2, 210);
    let panelBg;

    if (this.textures.exists("btn_highscore")) {
      panelBg = this.add.image(0, 0, "btn_highscore")
        .setDisplaySize(360, 120);
    } else if (this.textures.exists("btn")) {
      panelBg = this.add.image(0, 0, "btn")
        .setDisplaySize(360, 120);
    } else {
      panelBg = this.add.rectangle(0, 0, 360, 120, 0x111111, 0.75);
    }

    const scoreText = this.add.text(0, -32, "Skor: " + this.finalScore, {
      fontFamily: "font",
      fontSize: "30px",
      color: "#ffca28",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    const bestText = this.add.text(0, 4, "Skor Tertinggi: " + GameState.bestScore, {
      fontFamily: "font",
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const coinText = this.add.text(0, 36, "Koin: " + this.finalCoins, {
      fontFamily: "font",
      fontSize: "18px",
      color: "#ffffff ",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    scorePanel.add([panelBg, scoreText, bestText, coinText]);

    //button
    const createButtonWithIcon = (x, y, config) => {
      const {
        backgroundKey = "btn",
        iconKey = null,
        label = "",
        callback = () => {},

        bgWidth = 280,
        bgHeight = 64,

        iconSize = 30,
        iconX = -82,
        labelX = 18,

        labelStyle = {
          fontSize: "22px",
          fontFamily: "font",
          fontStyle: "bold",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 4
        }
      } = config;

      const container = this.add.container(x, y);

      const shadow = this.add.image(6, 7, backgroundKey)
        .setTint(0x000000)
        .setAlpha(0.28)
        .setDisplaySize(bgWidth, bgHeight);

      const bg = this.add.image(0, 0, backgroundKey)
        .setDisplaySize(bgWidth, bgHeight);

      container.add([shadow, bg]);

      let hasIcon = false;

      if (iconKey && this.textures.exists(iconKey)) {
        const icon = this.add.image(iconX, 0, iconKey)
          .setDisplaySize(iconSize, iconSize);

        container.add(icon);
        hasIcon = true;
      }

      const textX = hasIcon ? labelX : 0;

      const labelText = this.add.text(textX, -1, label, labelStyle)
        .setOrigin(0.5);

      container.add(labelText);

      const hitArea = this.add.rectangle(0, 0, bgWidth, bgHeight, 0xffffff, 0.001);
      hitArea.setInteractive({ useHandCursor: true });
      container.add(hitArea);

      hitArea.on("pointerover", () => {
        bg.setTint(0xffffcc);

        this.tweens.add({
          targets: container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 120,
          ease: "Power2"
        });
      });

      hitArea.on("pointerout", () => {
        bg.clearTint();

        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 120,
          ease: "Power2"
        });
      });

      hitArea.on("pointerdown", () => {
        if (this.cache.audio.exists("touch")) {
          this.sound.play("touch", {
            volume: 0.5
          });
        }

        this.tweens.add({
          targets: container,
          scaleX: 0.94,
          scaleY: 0.94,
          duration: 80,
          yoyo: true,
          ease: "Power2",
          onComplete: callback
        });
      });

      return container;
    };

    // button buat main lagi
    createButtonWithIcon(WIDTH / 2, 330, {
      backgroundKey: "btn",
      iconKey: "btn_reset",
      label: "MAIN LAGI",

      bgWidth: 280,
      bgHeight: 64,

      iconSize: 30,
      iconX: -82,
      labelX: 18,

      callback: () => {
        this.scene.start("TA_scnChooseHero");
      }
    });

    // button back ke menu utama
    createButtonWithIcon(WIDTH / 2, 400, {
      backgroundKey: "btn",
      iconKey: "btn_right",
      label: "MENU UTAMA",

      bgWidth: 260,
      bgHeight: 58,

      iconSize: 28,
      iconX: -82,
      labelX: 18,

      labelStyle: {
        fontSize: "19px",
        fontFamily: "font",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
      },

      callback: () => {
        this.scene.start("TA_scnMenu");
      }
    });
  }
}