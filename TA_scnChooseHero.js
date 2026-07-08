const FEMALE_UNLOCK_SCORE = 100;

class TA_scnChooseHero extends Phaser.Scene {
  constructor() {
    super("TA_scnChooseHero");
  }

  create() {
    this.ensureValidHeroSelected();

    this.createBackground();
    this.createAudio();
    this.createTitle();
    this.createHeroCards();
    this.createButtons();
  }

  isHeroUnlocked(index) {
    if (index === 0) return true;
    if (index === 1) return GameState.bestScore >= FEMALE_UNLOCK_SCORE;
    return true;
  }

  ensureValidHeroSelected() {
    if (!this.isHeroUnlocked(GameState.selectedHero)) {
      GameState.selectedHero = 0;
    }
  }

  createBackground() {
    if (this.textures.exists("bgSky")) {
      this.add.image(0, 0, "bgSky").setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    } else {
      this.cameras.main.setBackgroundColor("#87CEEB");
    }

    this.addParallaxLayer("bgCloud", 0, 0.9);
    this.addParallaxLayer("bgTrees", HEIGHT, 1, true);

    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.18).setOrigin(0);
  }

  addParallaxLayer(key, y, alpha, bottomOrigin = false) {
    if (!this.textures.exists(key)) return;

    const h = this.textures.get(key).getSourceImage().height;

    this.add.tileSprite(0, y, WIDTH, h, key)
      .setOrigin(0, bottomOrigin ? 1 : 0)
      .setAlpha(alpha);
  }

  createAudio() {
    if (this.cache.audio.exists("ambience")) {
      this.ambience = this.sound.get("ambience") || this.sound.add("ambience", { volume: 0.35, loop: true });
      if (!this.ambience.isPlaying) this.ambience.play();
    }

    this.playSound("choose", 0.6);

    this.sfxTouch = this.cache.audio.exists("touch")
      ? this.sound.add("touch", { volume: 0.6 })
      : null;
  }

  playSound(key, volume = 0.6) {
    if (this.cache.audio.exists(key)) this.sound.play(key, { volume });
  }

  playTouch() {
    if (this.sfxTouch) this.sfxTouch.play();
  }

  playVoice(index) {
    ["male_voice", "female_voice"].forEach(key => {
      if (this.cache.audio.exists(key)) this.sound.stopByKey(key);
    });

    const voiceKey = index === 0 ? "male_voice" : index === 1 ? "female_voice" : null;
    if (voiceKey) this.playSound(voiceKey, 0.75);
  }

  textStyle(size, color = "#ffffff", strokeThickness = 4) {
    return {
      fontSize: size + "px",
      fontFamily: "font",
      fontStyle: "bold",
      color,
      stroke: "#000000",
      strokeThickness
    };
  }

  createTitle() {
    this.add.text(WIDTH / 2, 55, "PILIH KARAKTERMU!", this.textStyle(38, "#ffffff", 7))
      .setOrigin(0.5);
  }

  createHeroCards() {
    this.heroCards = [];

    const spacing = 210;
    const baseX = WIDTH / 2 - ((HEROES.length - 1) * spacing) / 2;

    HEROES.forEach((hero, index) => {
      const card = this.createHeroCard(hero, index, baseX + index * spacing, 220);
      this.heroCards.push(card);
    });
  }

  createHeroCard(hero, index, x, y) {
    const card = this.add.container(x, y);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(-75, -88, 160, 205, 18);

    const bg = this.add.graphics();
    bg.fillRoundedRect(-80, -95, 160, 205, 18);

    const border = this.add.graphics();

    const sprite = this.add.sprite(0, -25, hero.key).setScale(1.55);
    const animKey = hero.key + "_idle";
    if (this.anims.exists(animKey)) sprite.play(animKey);

    const nameText = this.add.text(0, 65, hero.name, this.textStyle(22)).setOrigin(0.5);
    const checkText = this.add.text(0, 92, "SELECTED", this.textStyle(14, "#c2ffbc", 3)).setOrigin(0.5);
    const lockText = this.add.text(0, 20, "LOCKED", this.textStyle(16, "#4a983e")).setOrigin(0.5);
    const unlockText = this.add.text(0, 40, `Score ${FEMALE_UNLOCK_SCORE}`, this.textStyle(14, "#a9c23d", 3)).setOrigin(0.5);

    let lockIcon = null;
    if (this.textures.exists("lock")) {
      lockIcon = this.add.image(0, -18, "lock").setDisplaySize(44, 44);
    }

    const hitArea = this.add.rectangle(0, 5, 160, 205, 0xc2ffa1, 0.001)
      .setInteractive({ useHandCursor: true });

    card.add([shadow, bg, border, sprite, nameText, checkText]);
    if (lockIcon) card.add(lockIcon);
    card.add([lockText, unlockText, hitArea]);

    Object.assign(card, { bg, border, sprite, nameText, checkText, lockText, unlockText, lockIcon });

    hitArea.on("pointerover", () => {
      if (this.isHeroUnlocked(index)) this.hoverTween(card, 1.05);
    });
    hitArea.on("pointerout", () => this.hoverTween(card, 1));
    hitArea.on("pointerdown", () => {
      this.playTouch();
      this.selectHero(index);
    });

    this.refreshCard(card, index);
    return card;
  }

  refreshCard(card, index) {
    const unlocked = this.isHeroUnlocked(index);
    const selected = index === GameState.selectedHero;

    card.bg.clear();
    card.bg.fillStyle(unlocked ? 0x1b263b : 0x222222, 0.92);
    card.bg.fillRoundedRect(-80, -95, 160, 205, 18);

    card.border.clear();

    if (!unlocked) {
      card.border.lineStyle(4, 0x555555, 1);
    } else if (selected) {
      card.border.lineStyle(5, 0xffca28, 1);
    } else {
      card.border.lineStyle(4, 0xffffff, 0.35);
    }

    card.border.strokeRoundedRect(-80, -95, 160, 205, 18);

    card.checkText.setVisible(unlocked && selected);
    card.lockText.setVisible(!unlocked);
    card.unlockText.setVisible(!unlocked);
    if (card.lockIcon) card.lockIcon.setVisible(!unlocked);

    card.sprite.setAlpha(unlocked ? 1 : 0.35);
    card.nameText.setAlpha(unlocked ? 1 : 0.45);
  }

  updateAllCards() {
    this.heroCards.forEach((card, i) => this.refreshCard(card, i));
  }

  selectHero(index) {
    if (!this.isHeroUnlocked(index)) {
      this.shakeCard(this.heroCards[index]);
      return;
    }

    GameState.selectedHero = index;
    this.playVoice(index);
    this.updateAllCards();
  }

  shakeCard(card) {
    this.tweens.add({ targets: card, x: card.x + 8, duration: 45, yoyo: true, repeat: 4 });
  }

  hoverTween(target, scale) {
    this.tweens.add({ targets: target, scaleX: scale, scaleY: scale, duration: 120, ease: "Power2" });
  }

  // buttons
  createButtons() {
    this.createButtonWithIcon(WIDTH / 2, 375, {
      iconKey: "btn_play",
      label: "MULAI BERMAIN",
      bgWidth: 285,
      bgHeight: 64,
      iconSize: 35,
      iconX: -100,
      labelX: 20,
      labelStyle: this.textStyle(22),
      callback: () => this.scene.start("TA_scnPlay")
    });

    const back = this.add.image(25, 25, "btn_back")
      .setOrigin(0, 0)
      .setDepth(999)
      .setInteractive({ useHandCursor: true });

    back.on("pointerdown", () => {
      this.playTouch();
      this.scene.start("TA_scnMenu");
    });
  }

  createButtonWithIcon(x, y, config) {
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
      labelStyle = this.textStyle(24)
    } = config;

    const container = this.add.container(x, y);

    const shadow = this.add.image(6, 7, backgroundKey)
      .setTint(0xc2ffa1)
      .setAlpha(0.28)
      .setDisplaySize(bgWidth, bgHeight);

    const bg = this.add.image(0, 0, backgroundKey).setDisplaySize(bgWidth, bgHeight);

    container.add([shadow, bg]);

    const hasIcon = iconKey && this.textures.exists(iconKey);

    if (hasIcon) {
      container.add(this.add.image(iconX, 0, iconKey).setDisplaySize(iconSize, iconSize));
    }

    container.add(
      this.add.text(hasIcon ? labelX : 0, -1, label, labelStyle).setOrigin(0.5)
    );

    const hitArea = this.add.rectangle(0, 0, bgWidth, bgHeight, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });

    container.add(hitArea);

    hitArea.on("pointerover", () => {
      bg.setTint(0xc2ffa1);
      this.hoverTween(container, 1.05);
    });

    hitArea.on("pointerout", () => {
      bg.clearTint();
      this.hoverTween(container, 1);
    });

    hitArea.on("pointerdown", () => {
      this.playTouch();

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
  }
}