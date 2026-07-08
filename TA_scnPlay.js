class TA_scnPlay extends Phaser.Scene {
  constructor() {
    super("TA_scnPlay");
  }

  create() {
    this.score = 0;
    this.coinCount = 0;
    this.hp = 3;

    this.gameOverFlag = false;
    this.isInvincible = false;

    this.jumpCount = 0;
    this.maxJump = 2;

    this.baseGroundSpeed = 220;
    this.groundSpeed = 220;
    this.nextFlagScore = 50;

    // mission system
    this.flagsTaken = 0;
    this.surviveSeconds = 0;
    this.currentMissionIndex = 0;
    this.completedMissions = 0;

    this.missions = [
      {
        text: "Kumpulkan 10 Koin",
        type: "coins",
        target: 10,
        reward: 5
      },
      {
        text: "Capai Skor 50",
        type: "score",
        target: 50,
        reward: 10
      },
      {
        text: "Ambil 1 Bendera",
        type: "flags",
        target: 1,
        reward: 15
      },
      {
        text: "Bertahan 30 detik",
        type: "survive",
        target: 30,
        reward: 20
      }
    ];

    // kombo coin
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.comboResetEvent = null;

    // rush mode
    this.nextRushScore = 100;
    this.isRushMode = false;
    this.rushDuration = 8;
    this.rushTimeLeft = 0;
    this.rushMultiplier = 1.35;

    this.isFemaleHero = GameState.selectedHero === 1;
    this.dashReady = true;
    this.isDashing = false;
    this.dashDir = 1;

    this.createBackground();
    this.createAudio();
    this.createGround();
    this.createPlayer();
    this.createGroups();
    this.createUI();
    this.createCollisions();
    this.createTimers();
    this.createInput();
  }

  createBackground() {
    if (this.textures.exists("bgSky")) {
      this.add.image(0, 0, "bgSky").setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    } else {
      this.cameras.main.setBackgroundColor("#87CEEB");
    }

    if (this.textures.exists("bgCloud")) {
      const h = this.textures.get("bgCloud").getSourceImage().height;
      this.bgCloud = this.add.tileSprite(0, 0, WIDTH, h, "bgCloud")
        .setOrigin(0)
        .setAlpha(0.9);
    }

    if (this.textures.exists("bgTrees")) {
      const h = this.textures.get("bgTrees").getSourceImage().height;
      this.bgTrees = this.add.tileSprite(0, HEIGHT, WIDTH, h, "bgTrees")
        .setOrigin(0, 1);
    }
  }

  createAudio() {
    this.sfxTouch = this.addSfx("touch", 0.45);
    this.sfxJump = this.addSfx("jump", 0.55);
    this.sfxKalah = this.addSfx("kalah", 0.65);
    this.sfxWalk = this.addSfx("walk", 0.25, true);

    if (this.sfxWalk) this.sfxWalk.play();
  }

  addSfx(key, volume, loop = false) {
    if (!this.cache.audio.exists(key)) return null;
    return this.sound.add(key, { volume, loop });
  }

  playSfx(sfx) {
    if (sfx) sfx.play();
  }

  createGround() {
    this.groundGroup = this.add.group();

    this.tileW = 64;
    this.tileStep = 60;
    this.groundY = GROUND_Y;

    const total = Math.ceil(WIDTH / this.tileStep) + 4;

    for (let i = 0; i < total; i++) {
      const column = this.add.container(i * this.tileStep, this.groundY);

      column.add([
        this.add.image(0, 0, "grassTop").setOrigin(0).setDisplaySize(64, 64),
        this.add.image(0, 64, "grassCenter").setOrigin(0).setDisplaySize(64, 64),
        this.add.image(0, 128, "grassBottom").setOrigin(0).setDisplaySize(64, 64)
      ]);

      this.groundGroup.add(column);
    }

    this.playerGroundY = this.groundY - 55;
  }

  createPlayer() {
    const heroKey = this.isFemaleHero ? "female" : "male";

    this.player = this.physics.add.sprite(120, this.playerGroundY, heroKey);
    this.player.setGravityY(780);
    this.player.setVelocityX(0);
    this.player.setSize(32, 55);
    this.player.setOffset(24, 55);
    this.player.anims.play(heroKey + "_run", true);

    this.playerMinX = 75;
    this.playerMaxX = WIDTH - 95;
    this.playerMoveSpeed = 300;
  }

  createGroups() {
    const config = { allowGravity: false, immovable: true };

    this.zombieGroup = this.physics.add.group(config);
    this.obstacleGroup = this.physics.add.group(config);
    this.enemyGroup = this.physics.add.group(config);
    this.coinGroup = this.physics.add.group(config);
    this.bonusGroup = this.physics.add.group(config);
  }

  createUI() {
    this.hpIcons = [];

    for (let i = 0; i < 3; i++) {
      this.hpIcons.push(
        this.add.image(28 + i * 34, 28, "hpFull")
          .setScale(0.75)
          .setDepth(1000)
      );
    }

    this.scoreText = this.add.text(WIDTH / 2 - 65, 25, "Skor: 0", this.textStyle(22))
      .setDepth(1000);

    this.coinPanel = this.add.container(WIDTH - 120, 35).setDepth(1000);

    const panel = this.add.image(0, 0, "btn").setDisplaySize(210, 56);
    const coinIcon = this.add.image(-72, -2, "coin").setScale(0.80);

    this.coinText = this.add.text(-40, -13, "Koin: 0", this.textStyle(22));

    this.coinPanel.add([panel, coinIcon, this.coinText]);

    // mission UI
    this.missionTitle = this.add.text(22, 72, "Misi", this.textStyle(16, "#ffd54f"))
      .setDepth(1000);

    this.missionText = this.add.text(22, 98, "", this.textStyle(14, "#ffffff"))
      .setDepth(1000)
      .setLineSpacing(4);

    // combo  ui
    this.comboText = this.add.text(WIDTH / 2, 74, "", this.textStyle(26, "#ffeb3b"))
      .setOrigin(0.5)
      .setDepth(1001)
      .setVisible(false);

  //  warning
    this.warningText = this.add.text(WIDTH/2, 70, "!\nPERINGATAN", {
      fontSize: "26px",
      fontFamily: "font",
      color: "#ff3030",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5,
      align: "center"
    })
      .setOrigin(0.5)
      .setDepth(1002)
      .setVisible(false);

    // rush mode
    this.rushText = this.add.text(WIDTH / 2, 125, "", this.textStyle(24, "#ff5252"))
      .setOrigin(0.5)
      .setDepth(1002)
      .setVisible(false);

    this.updateMissionUI();
  }

  textStyle(size, color = "#e6ff83") {
    return {
      fontSize: size + "px",
      fontFamily: "font",
      color,
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    };
  }

  createCollisions() {
    [this.zombieGroup, this.obstacleGroup, this.enemyGroup].forEach(group => {
      this.physics.add.overlap(this.player, group, (player, obj) => {
        this.hitPlayer(obj);
      });
    });

    this.physics.add.overlap(this.player, this.coinGroup, (player, coin) => {
      this.collectCoin(coin);
    });

    this.physics.add.overlap(this.player, this.bonusGroup, (player, bonus) => {
      this.collectBonus(bonus);
    });
  }

  createTimers() {
    this.scoreTimer = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (this.gameOverFlag) return;

        this.addScore(1);

        if (this.score >= this.nextFlagScore) {
          this.spawnFlag();
          this.nextFlagScore += 50;
        }
      }
    });

    this.surviveTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.gameOverFlag) return;

        this.surviveSeconds++;
        this.updateMissionUI();
        this.checkMissionComplete();
      }
    });

    this.zombieTimer = this.addTimer(2700, () => this.spawnZombie(), 90);
    this.obstacleTimer = this.addTimer(2200, () => this.spawnObstacle(), 135);

    this.coinTimer = this.time.addEvent({
      delay: 2400,
      loop: true,
      callback: () => {
        if (!this.gameOverFlag) this.spawnCoinPattern();
      }
    });

    this.enemyTimer = this.time.addEvent({
      delay: 3200,
      loop: true,
      callback: () => {
        if (!this.gameOverFlag && this.score >= 75 && this.canSpawnObstacle(130)) {
          this.spawnFlyingEnemy();
        }
      }
    });

    this.bonusTimer = this.time.addEvent({
      delay: 7000,
      loop: true,
      callback: () => {
        if (!this.gameOverFlag && this.score >= 30) {
          this.spawnBonus();
        }
      }
    });

    this.rushCoinTimer = this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        if (!this.gameOverFlag && this.isRushMode) {
          this.spawnCoinPattern();
        }
      }
    });

    this.rushObstacleTimer = this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: () => {
        if (!this.gameOverFlag && this.isRushMode && this.canSpawnObstacle(85)) {
          this.spawnObstacle();
        }
      }
    });

    this.time.delayedCall(900, () => {
      if (!this.gameOverFlag) this.spawnZombie();
    });
  }

  addTimer(delay, callback, gap) {
    return this.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        if (!this.gameOverFlag && this.canSpawnObstacle(gap)) callback();
      }
    });
  }

  createInput() {
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });

    this.input.on("pointerdown", () => this.jump());
  }

  update(time, delta) {
    if (this.gameOverFlag) return;

    const dt = delta / 1000;

    this.updateRushMode(dt);
    this.updateSpeed();
    this.updateBackground(dt);
    this.updateInput(dt);
    this.updateGround(dt);
    this.updateObjects();
    this.checkNearMiss();
    this.checkGround();
    this.checkAnimation();
  }

  updateSpeed() {
    const baseSpeed = this.baseGroundSpeed + this.score * 1.25;

    if (this.isRushMode) {
      this.groundSpeed = baseSpeed * this.rushMultiplier;
    } else {
      this.groundSpeed = baseSpeed;
    }
  }

  updateBackground(dt) {
    const rushAdd = this.isRushMode ? 1.7 : 1;

    if (this.bgCloud) this.bgCloud.tilePositionX += 18 * dt * rushAdd;
    if (this.bgTrees) this.bgTrees.tilePositionX += 55 * dt * rushAdd;
  }

  updateInput(dt) {
    const onGround = this.isOnGround();
    let moveDir = 0;

    if (onGround) {
      if (this.keys.left.isDown || this.keys.A.isDown) moveDir = -1;
      else if (this.keys.right.isDown || this.keys.D.isDown) moveDir = 1;
    }

    if (moveDir !== 0) this.dashDir = moveDir;

    let speed = this.playerMoveSpeed;

    if (this.isDashing && this.isFemaleHero) {
      speed = 780;
      moveDir = this.dashDir;
    }

    this.player.x += moveDir * speed * dt;
    this.player.x = Phaser.Math.Clamp(this.player.x, this.playerMinX, this.playerMaxX);

    if (moveDir < 0) this.player.flipX = true;
    if (moveDir > 0) this.player.flipX = false;

    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) this.jump();

    if (this.isFemaleHero && onGround && Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
      this.dash();
    }
  }

  updateGround(dt) {
    let maxX = 0;

    this.groundGroup.children.each(tile => {
      if (tile.x > maxX) maxX = tile.x;
    });

    this.groundGroup.children.each(tile => {
      tile.x -= this.groundSpeed * dt;

      if (tile.x + this.tileW < 0) {
        tile.x = maxX + this.tileStep;
      }
    });
  }

  updateObjects() {
    this.updateGroup(this.zombieGroup, this.groundSpeed + 45, -100, "zombie_walk");
    this.updateGroup(this.obstacleGroup, this.groundSpeed, -140);
    this.updateGroup(this.enemyGroup, this.groundSpeed + 95, -140);
    this.updateGroup(this.coinGroup, this.groundSpeed, -100);
    this.updateGroup(this.bonusGroup, this.groundSpeed, -120);
  }

  updateGroup(group, speed, destroyX, animKey = null) {
    group.children.each(obj => {
      if (!obj || !obj.active) return;

      obj.setVelocityX(-speed);

      if (obj.x < destroyX) {
        obj.destroy();
        return;
      }

      if (animKey && obj.anims && !obj.anims.isPlaying) {
        obj.anims.play(animKey, true);
      }
    });
  }

  isOnGround() {
    return this.player.y >= this.playerGroundY - 2;
  }

  checkGround() {
    if (this.player.y >= this.playerGroundY && this.player.body.velocity.y >= 0) {
      this.player.y = this.playerGroundY;
      this.player.body.setVelocityY(0);
      this.jumpCount = 0;
    }
  }

  checkAnimation() {
    if (!this.player.anims.isPlaying) {
      const heroKey = this.isFemaleHero ? "female" : "male";
      this.player.anims.play(heroKey + "_run", true);
    }
  }

  jump() {
    if (this.gameOverFlag) return;

    if (this.jumpCount < this.maxJump) {
      this.playSfx(this.sfxJump);
      this.player.body.setVelocityY(-500);
      this.jumpCount++;
    }
  }

  dash() {
    if (!this.dashReady) return;

    this.dashReady = false;
    this.isDashing = true;

    this.playSfx(this.sfxTouch);
    this.player.setAlpha(0.65);

    this.time.delayedCall(160, () => {
      this.isDashing = false;
      this.player.setAlpha(1);
    });

    this.time.delayedCall(900, () => {
      this.dashReady = true;
    });
  }

  spawnZombie() {
    const zombie = this.physics.add.sprite(WIDTH + 90, this.playerGroundY, "zombie");

    zombie.setVelocityX(-(this.groundSpeed + 45));
    zombie.flipX = true;
    zombie.setSize(34, 58);
    zombie.setOffset(23, 52);
    zombie.anims.play("zombie_walk", true);
    zombie.nearMissChecked = false;
    zombie.wasNearPlayer = false;

    this.zombieGroup.add(zombie);
  }

  spawnObstacle() {
    const keys = this.getObstacleKeys();
    if (keys.length === 0) return;

    const key = Phaser.Utils.Array.GetRandom(keys);
    const x = WIDTH + Phaser.Math.Between(130, 260);

    const data = this.getObstacleData(key);
    const y = this.groundY - data.h / 2 + 8;

    if (key === "bomb") {
      this.showWarning(y);

      this.time.delayedCall(450, () => {
        if (!this.gameOverFlag) {
          this.createObstacleObject(key, x, y, data);
        }
      });

      return;
    }

    this.createObstacleObject(key, x, y, data);
  }

  createObstacleObject(key, x, y, data) {
    const obj = this.physics.add.image(x, y, key);

    obj.setDisplaySize(data.w, data.h);
    obj.setVelocityX(-this.groundSpeed);
    obj.setImmovable(true);
    obj.body.allowGravity = false;
    obj.setSize(data.w * data.hit, data.h * data.hit);

    obj.nearMissChecked = false;
    obj.wasNearPlayer = false;

    if (key === "bomb") {
      this.tweens.add({
        targets: obj,
        angle: 10,
        duration: 170,
        yoyo: true,
        repeat: -1
      });
    } else {
      obj.setAngle(Phaser.Math.Between(-6, 6));
    }

    this.obstacleGroup.add(obj);
  }

  getObstacleKeys() {
    let keys = ["rock", "rock2"];

    if (this.score >= 50) {
      keys.push("mushroom", "mushroom2");
    }

    if (this.score >= 100) {
      keys.push("cactus", "bush", "hill", "hillTop", "hill2");
    }

    if (this.score >= 150) {
      keys.push("bomb");
    }

    return this.getAvailableKeys(keys);
  }

  getObstacleData(key) {
    if (key === "mushroom" || key === "mushroom2") {
      return { w: 76, h: 72, hit: 0.68 };
    }

    if (key === "cactus") {
      return { w: 46, h: 78, hit: 0.65 };
    }

    if (key === "bush") {
      return {
        w: Phaser.Math.Between(66, 86),
        h: Phaser.Math.Between(46, 60),
        hit: 0.62
      };
    }

    if (key === "bomb") {
      return { w: 48, h: 48, hit: 0.7 };
    }

    if (key === "hill" || key === "hillTop" || key === "hill2") {
      return {
        w: Phaser.Math.Between(72, 92),
        h: Phaser.Math.Between(54, 68),
        hit: 0.68
      };
    }

    return {
      w: Phaser.Math.Between(44, 58),
      h: Phaser.Math.Between(44, 60),
      hit: 0.72
    };
  }

  spawnFlyingEnemy() {
    const keys = this.getAvailableKeys(["enemy", "enemy2"]);
    if (keys.length === 0) return;

    const key = Phaser.Utils.Array.GetRandom(keys);
    const x = WIDTH + Phaser.Math.Between(140, 260);
    const y = this.groundY - Phaser.Math.Between(150, 205);

    this.showWarning(y);

    this.time.delayedCall(550, () => {
      if (this.gameOverFlag) return;

      const enemy = this.physics.add.image(x, y, key);

      enemy.setDisplaySize(key === "enemy2" ? 70 : 60, key === "enemy2" ? 56 : 46);
      enemy.setSize(key === "enemy2" ? 48 : 42, key === "enemy2" ? 38 : 32);
      enemy.setVelocityX(-(this.groundSpeed + 95));
      enemy.setImmovable(true);
      enemy.body.allowGravity = false;

      enemy.nearMissChecked = false;
      enemy.wasNearPlayer = false;

      this.tweens.add({
        targets: enemy,
        y: enemy.y + Phaser.Math.Between(12, 22),
        duration: Phaser.Math.Between(450, 650),
        yoyo: true,
        repeat: -1
      });

      this.enemyGroup.add(enemy);
    });
  }

  showWarning(y) {
    if (!this.warningText) return;

    this.warningText.setY(Phaser.Math.Clamp(y, 120, HEIGHT - 160));
    this.warningText.setAlpha(1);
    this.warningText.setVisible(true);

    this.tweens.add({
      targets: this.warningText,
      alpha: 0.25,
      duration: 120,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.warningText.setVisible(false);
        this.warningText.setAlpha(1);
      }
    });
  }

  spawnCoinPattern() {
    const startX = WIDTH + Phaser.Math.Between(160, 230);

    const lowY = this.groundY - 105;
    const midY = this.groundY - 150;
    const highY = this.groundY - 195;

    const patterns = [
      [lowY, lowY],
      [midY, midY - 28, midY - 10],
      [lowY, midY, highY],
      [highY, midY, lowY],
      [highY, highY]
    ];

    if (this.isRushMode) {
      patterns.push(
        [lowY, midY, highY, midY, lowY],
        [highY, highY, midY, midY, lowY],
        [midY, lowY, midY, highY, midY]
      );
    }

    let maxPattern = 1;

    if (this.score >= 30) maxPattern = 3;
    if (this.score >= 80) maxPattern = 4;
    if (this.isRushMode) maxPattern = patterns.length - 1;

    const pattern = patterns[Phaser.Math.Between(0, maxPattern)];

    pattern.forEach((y, i) => {
      this.spawnCoin(startX + i * 65, y);
    });
  }

  spawnCoin(x, y) {
    y = Phaser.Math.Clamp(y, 90, this.groundY - 80);

    const coin = this.physics.add.image(x, y, "coin");

    coin.setScale(1.15);
    coin.setVelocityX(-this.groundSpeed);
    coin.body.allowGravity = false;
    coin.setCircle(18);
    coin.setImmovable(true);

    this.tweens.add({
      targets: coin,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 400,
      yoyo: true,
      repeat: -1
    });

    this.coinGroup.add(coin);
  }

  spawnBonus() {
    const keys = this.getAvailableKeys(["gem", "star"]);
    if (keys.length === 0) return;

    const key = Phaser.Utils.Array.GetRandom(keys);
    const x = WIDTH + Phaser.Math.Between(170, 260);
    const y = this.groundY - Phaser.Math.Between(145, 205);

    this.createBonusItem(x, y, key);
  }

  spawnFlag() {
    if (!this.textures.exists("flag")) return;

    const x = WIDTH + 180;
    const y = this.groundY - 42;

    this.createBonusItem(x, y, "flag");
  }

  createBonusItem(x, y, key) {
    const item = this.physics.add.image(x, y, key);

    item.bonusKey = key;

    if (key === "flag") {
      item.setDisplaySize(54, 78);
      item.setSize(38, 70);
    } else if (key === "gem") {
      item.setScale(0.9);
      item.setCircle(16);
    } else {
      item.setScale(1);
      item.setCircle(16);
    }

    item.setVelocityX(-this.groundSpeed);
    item.body.allowGravity = false;
    item.setImmovable(true);

    this.tweens.add({
      targets: item,
      y: item.y - 10,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.bonusGroup.add(item);
  }

  collectCoin(coin) {
    if (!coin || !coin.active) return;

    const x = coin.x;
    const y = coin.y;

    coin.destroy();

    this.playSfx(this.sfxTouch);

    this.coinCount += 1;
    this.updateCoinUI();

    this.addCombo(x, y);
    this.showCollectEffect(x, y, "+1", "coin");

    this.updateMissionUI();
    this.checkMissionComplete();
  }

  addCombo(x, y) {
    this.comboCount++;
    this.comboMultiplier = this.getComboMultiplier();

    if (this.comboCount >= 5) {
      this.comboText.setText("Combo x" + this.comboMultiplier);
      this.comboText.setScale(1);
      this.comboText.setVisible(true);

      this.tweens.add({
        targets: this.comboText,
        scaleX: 1.18,
        scaleY: 1.18,
        duration: 120,
        yoyo: true
      });
    }

    if (this.comboCount % 5 === 0) {
      const bonusScore = 5 * this.comboMultiplier;

      this.addScore(bonusScore);
      this.showCollectEffect(
        x,
        y - 35,
        "Combo x" + this.comboMultiplier + " +" + bonusScore,
        "star"
      );
    }

    if (this.comboResetEvent) {
      this.comboResetEvent.remove(false);
    }

    this.comboResetEvent = this.time.delayedCall(1800, () => {
      this.resetCombo();
    });
  }

  getComboMultiplier() {
    if (this.comboCount >= 15) return 5;
    if (this.comboCount >= 10) return 3;
    if (this.comboCount >= 5) return 2;
    return 1;
  }

  resetCombo() {
    this.comboCount = 0;
    this.comboMultiplier = 1;

    if (this.comboText) {
      this.comboText.setVisible(false);
    }
  }

  collectBonus(item) {
    if (!item || !item.active) return;

    const x = item.x;
    const y = item.y;
    const key = item.bonusKey;

    item.destroy();

    this.playSfx(this.sfxTouch);

    if (key === "star") {
      this.addScore(10);
      this.showCollectEffect(x, y, "+10 Score", "star");
    } else if (key === "gem") {
      this.coinCount += 10;
      this.updateCoinUI();
      this.showCollectEffect(x, y, "+10 Coins", "gem");
    } else if (key === "flag") {
      this.flagsTaken++;
      this.addScore(20);
      this.showCollectEffect(x, y, "+20 Score", "flag");
    }

    this.updateMissionUI();
    this.checkMissionComplete();
  }

  showCollectEffect(x, y, label, particleKey) {
    const text = this.add.text(x, y - 15, label, this.textStyle(22, "#ffeb3b"))
      .setOrigin(0.5)
      .setDepth(1003);

    this.tweens.add({
      targets: text,
      y: text.y - 38,
      alpha: 0,
      duration: 550,
      ease: "Power2",
      onComplete: () => text.destroy()
    });

    const key = this.textures.exists(particleKey) ? particleKey : "coin";

    for (let i = 0; i < 6; i++) {
      const p = this.add.image(x, y, key).setDepth(1003);
      p.setScale(0.22);

      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-28, 28),
        y: y + Phaser.Math.Between(-32, 18),
        alpha: 0,
        scaleX: 0.05,
        scaleY: 0.05,
        duration: 430,
        ease: "Power2",
        onComplete: () => p.destroy()
      });
    }
  }

  hitPlayer(obj) {
    if (this.gameOverFlag || this.isInvincible || this.isDashing) return;

    this.playSfx(this.sfxTouch);

    this.hp--;
    this.updateHpUI();

    if (obj && obj.destroy) obj.destroy();

    if (this.hp <= 0) {
      this.gameOver();
      return;
    }

    this.isInvincible = true;

    this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      duration: 100,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        this.player.setAlpha(1);
        this.isInvincible = false;
      }
    });
  }

  checkNearMiss() {
    this.checkNearMissGroup(this.zombieGroup);
    this.checkNearMissGroup(this.obstacleGroup);
    this.checkNearMissGroup(this.enemyGroup);
  }

  checkNearMissGroup(group) {
    group.children.each(obj => {
      if (!obj || !obj.active || obj.nearMissChecked) return;

      const dx = Math.abs(obj.x - this.player.x);
      const dy = Math.abs(obj.y - this.player.y);

      if (dx < 95 && dy < 125 && !this.isInvincible) {
        obj.wasNearPlayer = true;
      }

      if (obj.x < this.player.x - 45) {
        obj.nearMissChecked = true;

        if (obj.wasNearPlayer) {
          this.addScore(5);
          this.showCollectEffect(this.player.x + 35, this.player.y - 60, "Near Miss +5", "star");
        }
      }
    });
  }

  updateHpUI() {
    this.hpIcons.forEach((heart, i) => {
      heart.setTexture(i < this.hp ? "hpFull" : "hpEmpty");
    });
  }

  updateCoinUI() {
    this.coinText.setText("Coins: " + this.coinCount);
  }

  addScore(value, checkMission = true) {
    this.score += value;
    this.scoreText.setText("Skor: " + this.score);

    this.updateSpeed();
    this.updateMissionUI();

    if (checkMission) {
      this.checkMissionComplete();
    }

    while (this.score >= this.nextRushScore) {
      if (!this.isRushMode) {
        this.startRushMode();
      } else {
        this.rushTimeLeft = this.rushDuration;
      }

      this.nextRushScore += 100;
    }
  }

  startRushMode() {
    this.isRushMode = true;
    this.rushTimeLeft = this.rushDuration;

    this.showBigMessage("RUSH MODE!", "#ff5252");

    if (this.rushText) {
      this.rushText.setVisible(true);
      this.rushText.setText("RUSH MODE: " + Math.ceil(this.rushTimeLeft) + "s");
    }

    this.cameras.main.flash(250, 255, 90, 90);
  }

  updateRushMode(dt) {
    if (!this.isRushMode) return;

    this.rushTimeLeft -= dt;

    if (this.rushText) {
      this.rushText.setText("RUSH MODE: " + Math.ceil(this.rushTimeLeft) + "s");
    }

    if (this.rushTimeLeft <= 0) {
      this.endRushMode();
    }
  }

  endRushMode() {
    this.isRushMode = false;
    this.rushTimeLeft = 0;

    if (this.rushText) {
      this.rushText.setVisible(false);
    }

    this.showSmallMessage("Rush End");
  }

  updateMissionUI() {
    if (!this.missionText) return;

    const mission = this.missions[this.currentMissionIndex];

    if (!mission) {
      this.missionText.setText("All missions complete!");
      return;
    }

    let progress = 0;

    if (mission.type === "coins") {
      progress = this.coinCount;
    } else if (mission.type === "score") {
      progress = this.score;
    } else if (mission.type === "flags") {
      progress = this.flagsTaken;
    } else if (mission.type === "survive") {
      progress = this.surviveSeconds;
    }

    progress = Math.min(progress, mission.target);

    this.missionText.setText(
      mission.text + "\n" +
      "Progress: " + progress + "/" + mission.target
    );
  }

  checkMissionComplete() {
    const mission = this.missions[this.currentMissionIndex];

    if (!mission) return;

    let progress = 0;

    if (mission.type === "coins") {
      progress = this.coinCount;
    } else if (mission.type === "score") {
      progress = this.score;
    } else if (mission.type === "flags") {
      progress = this.flagsTaken;
    } else if (mission.type === "survive") {
      progress = this.surviveSeconds;
    }

    if (progress >= mission.target) {
      this.completedMissions++;

      const reward = mission.reward;

      this.currentMissionIndex++;

      this.showSmallMessage("Mission Complete! +" + reward);
      this.addScore(reward, false);
      this.updateMissionUI();
    }
  }

  showBigMessage(label, color = "#ffeb3b") {
    const text = this.add.text(WIDTH / 2, HEIGHT / 2 - 90, label, this.textStyle(42, color))
      .setOrigin(0.5)
      .setDepth(1004);

    text.setScale(0.7);

    this.tweens.add({
      targets: text,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0,
      duration: 950,
      ease: "Power2",
      onComplete: () => text.destroy()
    });
  }

  showSmallMessage(label) {
    const text = this.add.text(WIDTH / 2, HEIGHT / 2 - 45, label, this.textStyle(24, "#ffffff"))
      .setOrigin(0.5)
      .setDepth(1004);

    this.tweens.add({
      targets: text,
      y: text.y - 35,
      alpha: 0,
      duration: 850,
      ease: "Power2",
      onComplete: () => text.destroy()
    });
  }

  canSpawnObstacle(minGap) {
    let farthestX = -999;

    [this.zombieGroup, this.obstacleGroup, this.enemyGroup].forEach(group => {
      group.children.each(obj => {
        if (obj && obj.active && obj.x > farthestX) {
          farthestX = obj.x;
        }
      });
    });

    return farthestX < WIDTH + minGap;
  }

  getAvailableKeys(keys) {
    return keys.filter(key => this.textures.exists(key));
  }

  getCompletedMissionsCount() {
    return this.completedMissions;
  }

  gameOver() {
    if (this.gameOverFlag) return;

    this.gameOverFlag = true;

    [
      this.scoreTimer,
      this.surviveTimer,
      this.zombieTimer,
      this.obstacleTimer,
      this.coinTimer,
      this.enemyTimer,
      this.bonusTimer,
      this.rushCoinTimer,
      this.rushObstacleTimer,
      this.comboResetEvent
    ].forEach(timer => {
      if (timer) timer.remove();
    });

    if (this.sfxWalk && this.sfxWalk.isPlaying) {
      this.sfxWalk.stop();
    }

    this.playSfx(this.sfxKalah);

    GameState.lastScore = this.score;
    GameState.lastCoins = this.coinCount;
    GameState.lastFlags = this.flagsTaken;
    GameState.lastSurvive = this.surviveSeconds;
    GameState.completedMissions = this.getCompletedMissionsCount();

    if (this.score > GameState.bestScore) {
      GameState.bestScore = this.score;
    }

    this.physics.pause();

    this.time.delayedCall(650, () => {
      this.scene.start("TA_scnGameOver", {
        score: this.score,
        coins: this.coinCount,
        flags: this.flagsTaken,
        survive: this.surviveSeconds,
        missions: this.getCompletedMissionsCount()
      });
    });
  }
}