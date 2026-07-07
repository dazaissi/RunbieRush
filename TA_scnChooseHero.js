class TA_scnChooseHero extends Phaser.Scene {
  constructor() {
    super("TA_scnChooseHero");
  }

  create() {
    // =========================
    // LOCK FEMALE
    // =========================
    const FEMALE_UNLOCK_SCORE = 100;

    const isHeroUnlocked = (index) => {
      if (index === 0) return true;
      if (index === 1) return GameState.bestScore >= FEMALE_UNLOCK_SCORE;
      return true;
    };

    if (!isHeroUnlocked(GameState.selectedHero)) {
      GameState.selectedHero = 0;
    }

    // =========================
    // BACKGROUND
    // =========================
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

    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.18).setOrigin(0);

    // =========================
    // AUDIO
    // =========================
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

    if (this.cache.audio.exists("choose")) {
      this.sound.play("choose", {
        volume: 0.6
      });
    }

    this.sfxTouch = null;

    if (this.cache.audio.exists("touch")) {
      this.sfxTouch = this.sound.add("touch", {
        volume: 0.6
      });
    }

    // =========================
    // TITLE
    // =========================
    this.add.text(WIDTH / 2, 55, "PILIH KARAKTERMU!", {
      fontSize: "38px",
      fontFamily: "font",
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 7
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 95, "Female terbuka setelah skor 100!", {
      fontSize: "18px",
      fontFamily: "font",
      color: "#ffdd9a",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    // =========================
    // HERO CARD
    // =========================
    this.heroCards = [];

    const spacing = 210;
    const baseX = WIDTH / 2 - ((HEROES.length - 1) * spacing) / 2;

    const updateCardUI = () => {
      this.heroCards.forEach((card, i) => {
        const unlocked = isHeroUnlocked(i);

        card.border.clear();

        if (!unlocked) {
          card.border.lineStyle(4, 0x555555, 1);
        } else if (i === GameState.selectedHero) {
          card.border.lineStyle(5, 0xffca28, 1);
        } else {
          card.border.lineStyle(4, 0xffffff, 0.35);
        }

        card.border.strokeRoundedRect(-80, -95, 160, 205, 18);

        card.checkText.setVisible(unlocked && i === GameState.selectedHero);
        card.lockText.setVisible(!unlocked);
        card.unlockText.setVisible(!unlocked);

        if (card.lockIcon) {
          card.lockIcon.setVisible(!unlocked);
        }

        card.sprite.setAlpha(unlocked ? 1 : 0.35);
        card.nameText.setAlpha(unlocked ? 1 : 0.45);
      });
    };

    const selectHero = (index) => {
      const unlocked = isHeroUnlocked(index);

      if (!unlocked) {
        const card = this.heroCards[index];

        this.tweens.add({
          targets: card,
          x: card.x + 8,
          duration: 45,
          yoyo: true,
          repeat: 4
        });

        return;
      }

      GameState.selectedHero = index;

      if (this.cache.audio.exists("male_voice")) {
        this.sound.stopByKey("male_voice");
      }

      if (this.cache.audio.exists("female_voice")) {
        this.sound.stopByKey("female_voice");
      }

      if (index === 0 && this.cache.audio.exists("male_voice")) {
        this.sound.play("male_voice", {
          volume: 0.75
        });
      }

      if (index === 1 && this.cache.audio.exists("female_voice")) {
        this.sound.play("female_voice", {
          volume: 0.75
        });
      }

      updateCardUI();
    };

    HEROES.forEach((hero, index) => {
      const x = baseX + index * spacing;
      const y = 220;
      const unlocked = isHeroUnlocked(index);

      const card = this.add.container(x, y);

      // Shadow
      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.35);
      shadow.fillRoundedRect(-75, -88, 160, 205, 18);

      // Background card
      const bg = this.add.graphics();
      bg.fillStyle(unlocked ? 0x1b263b : 0x222222, 0.92);
      bg.fillRoundedRect(-80, -95, 160, 205, 18);

      // Border
      const border = this.add.graphics();

      if (!unlocked) {
        border.lineStyle(4, 0x555555, 1);
      } else if (index === GameState.selectedHero) {
        border.lineStyle(5, 0xffca28, 1);
      } else {
        border.lineStyle(4, 0xffffff, 0.35);
      }

      border.strokeRoundedRect(-80, -95, 160, 205, 18);

      // Sprite hero
      const heroKey = hero.key;
      const animKey = heroKey + "_idle";

      const sprite = this.add.sprite(0, -25, heroKey);
      sprite.setScale(1.55);
      sprite.setAlpha(unlocked ? 1 : 0.35);

      if (this.anims.exists(animKey)) {
        sprite.play(animKey);
      }

      // Nama hero
      const nameText = this.add.text(0, 65, hero.name, {
        fontSize: "22px",
        fontFamily: "font",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5);

      nameText.setAlpha(unlocked ? 1 : 0.45);

      // Selected text
      const checkText = this.add.text(0, 92, "SELECTED", {
        fontSize: "14px",
        fontFamily: "font",
        fontStyle: "bold",
        color: "#ffca28",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);

      checkText.setVisible(unlocked && index === GameState.selectedHero);

      // Lock icon asset
      let lockIcon = null;

      if (this.textures.exists("lock")) {
        lockIcon = this.add.image(0, -18, "lock");
        lockIcon.setDisplaySize(44, 44);
        lockIcon.setVisible(!unlocked);
      }

      // Locked text
      const lockText = this.add.text(0, 20, "LOCKED", {
        fontSize: "16px",
        fontFamily: "font",
        fontStyle: "bold",
        color: "#ff5252",
        stroke: "#000000",
        strokeThickness: 4
      }).setOrigin(0.5);

      lockText.setVisible(!unlocked);

      const unlockText = this.add.text(0, 46, `Score ${FEMALE_UNLOCK_SCORE}`, {
        fontSize: "14px",
        fontFamily: "font",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);

      unlockText.setVisible(!unlocked);

      // Hit area
      const hitArea = this.add.rectangle(0, 5, 160, 205, 0xffffff, 0.001);
      hitArea.setInteractive({ useHandCursor: true });

      card.add([
        shadow,
        bg,
        border,
        sprite,
        nameText,
        checkText
      ]);

      if (lockIcon) {
        card.add(lockIcon);
      }

      card.add([
        lockText,
        unlockText,
        hitArea
      ]);

      card.border = border;
      card.checkText = checkText;
      card.lockText = lockText;
      card.unlockText = unlockText;
      card.lockIcon = lockIcon;
      card.sprite = sprite;
      card.nameText = nameText;

      hitArea.on("pointerover", () => {
        if (!isHeroUnlocked(index)) return;

        this.tweens.add({
          targets: card,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 120,
          ease: "Power2"
        });
      });

      hitArea.on("pointerout", () => {
        this.tweens.add({
          targets: card,
          scaleX: 1,
          scaleY: 1,
          duration: 120,
          ease: "Power2"
        });
      });

      hitArea.on("pointerdown", () => {
        if (this.sfxTouch) {
          this.sfxTouch.play();
        }

        selectHero(index);
      });

      this.heroCards.push(card);
    });

    // =========================
    // BUTTON FUNCTION
    // =========================
    const createButtonWithIcon = (x, y, config) => {
      const {
        backgroundKey = "btn",
        iconKey = null,
        label = "",
        callback = () => {},
        bgWidth = 280,
        bgHeight = 70,
        iconSize = 32,
        iconX = -75,
        labelX = 18,
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
        if (this.sfxTouch) {
          this.sfxTouch.play();
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

    // =========================
    // BUTTON MAIN
    // =========================
    createButtonWithIcon(WIDTH / 2, 375, {
      backgroundKey: "btn",
      iconKey: "btn_play",
      label: "MULAI BERMAIN",

      bgWidth: 280,
      bgHeight: 64,

      iconSize: 30,
      iconX: -88,
      labelX: 20,

      labelStyle: {
        fontSize: "22px",
        fontFamily: "font",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
      },

      callback: () => {
        this.scene.start("TA_scnPlay");
      }
    });

    // =========================
    // BUTTON KEMBALI
    // =========================
    const back = this.add.text(25, 25, "<", {
      fontSize: "22px",
      fontFamily: "font",
      fontStyle: "bold",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    });

    back.setInteractive({ useHandCursor: true });

    back.on("pointerdown", () => {
      if (this.sfxTouch) {
        this.sfxTouch.play();
      }

      this.scene.start("TA_scnMenu");
    });
  }
}