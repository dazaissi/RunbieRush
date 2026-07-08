class TA_scnMenu extends Phaser.Scene {
  constructor() {
    super("TA_scnMenu");
  }

  create() {
   
    // bg
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

    // audio ambience
    if (this.sound && this.cache.audio.exists("ambience")) {
      this.ambience = this.sound.get("ambience");

      if (!this.ambience) {
        this.ambience = this.sound.add("ambience", {
          volume: 0.35,
          loop: true
        });
      }

      if (!this.ambience.isPlaying) {
        this.ambience.play();
      }
    }

    
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.12).setOrigin(0);

    // judul
    this.add.text(WIDTH / 2, 58, "RUNBIE RUSH", {
      fontSize: "60px",
      fontFamily: "font",
      fontStyle: "bold",
      color: "#c2ffa1",
      stroke: "#000000",
      strokeThickness: 8
    }).setOrigin(0.5);

//  button
    const createButtonWithIcon = (x, y, config) => {
      const {
        backgroundKey = "btn",
        iconKey = null,
        label = "",
        callback = () => {},

        bgWidth = 280,
        bgHeight = 70,

        iconSize = 34,
        iconX = -75,
        iconY = 0,

        labelX = 18,
        labelY = -1,

        labelStyle = {
          fontSize: "24px",
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
        const icon = this.add.image(iconX, iconY, iconKey)
          .setDisplaySize(iconSize, iconSize);

        container.add(icon);
        hasIcon = true;
      }

      const textX = hasIcon ? labelX : 0;

      const labelText = this.add.text(textX, labelY, label, labelStyle)
        .setOrigin(0.5);

      container.add(labelText);

      const hitArea = this.add.rectangle(0, 0, bgWidth, bgHeight, 0xffffff, 0.001);
      hitArea.setInteractive({ useHandCursor: true });
      container.add(hitArea);

      hitArea.on("pointerover", () => {
        bg.setTint(0xc2ffa1);

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

    // button start
    createButtonWithIcon(WIDTH / 2, 200, {
      backgroundKey: "btn",
      iconKey: "btn_play",
      label: "MULAI",

      bgWidth: 180,
      bgHeight: 70,

      iconSize: 35,
      iconX: -60,
      iconY: -2,

      labelX: 10,
      labelY: -1,

      labelStyle: {
        fontSize: "24px",
        fontFamily: "font",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 5
      },

      callback: () => {
        if (this.ambience && this.ambience.isPlaying) {
          this.ambience.stop();
        }

        this.scene.start("TA_scnChooseHero");
      }
    });

    // highscore panel
const highscorePanel = this.add.container(WIDTH / 2, 350);

let hsBg = this.add.image(0, 0, "btn").setDisplaySize(320, 60);

// pake hero
const heroName = GameState.selectedHero === 0 ? "Male" : "Female";

// teks high score di kiri
const highScoreText = this.add.text(-80, 0, `High Score: ${GameState.bestScore}`, {
  fontSize: "17px",
  fontFamily: "font",
  fontStyle: "bold",
  color: "#c2ffa1",
  stroke: "#000000",
  strokeThickness: 4
}).setOrigin(0.5);

// teks hero di kanan
const heroText = this.add.text(80, 0, `Hero: ${heroName}`, {
  fontSize: "17px",
  fontFamily: "font",
  fontStyle: "bold",
  color: "#ffffff",
  stroke: "#000000",
  strokeThickness: 3
}).setOrigin(0.5);

highscorePanel.add([hsBg, highScoreText, heroText]);
  }
}