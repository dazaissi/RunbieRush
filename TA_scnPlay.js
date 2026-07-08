const obs = [
  { key: "zombie",   minScore: 0,   type: "zombie" },
  { key: "rock",     minScore: 0,   type: "ground" },
  { key: "rock2",    minScore: 0,   type: "ground" },
  { key: "mushroom", minScore: 50,  type: "ground" },
  { key: "mushroom2",minScore: 50,  type: "ground" },
  { key: "cactus",   minScore: 100, type: "ground" },
  { key: "bush",     minScore: 100, type: "ground" },
  { key: "hill",     minScore: 100, type: "ground" },
  { key: "hillTop",  minScore: 100, type: "ground" },
  { key: "hill2",    minScore: 100, type: "ground" },
  { key: "enemy",    minScore: 130, type: "flying" },
  { key: "enemy2",   minScore: 130, type: "flying" },
  { key: "bomb",     minScore: 160, type: "ground" }
];

const obs_dt = {
  zombie:    { w: 34, h: 58, offsetX: 23, offsetY: 52, sprite: true },
  rock:      { w: 52, h: 52, hit: 0.72 },
  rock2:     { w: 52, h: 52, hit: 0.72 },
  mushroom:  { w: 84, h: 80, hit: 0.68 },
  mushroom2: { w: 84, h: 80, hit: 0.68 },
  cactus:    { w: 46, h: 78, hit: 0.65 },
  bush:      { w: 78, h: 56, hit: 0.62 },
  hill:      { w: 88, h: 62, hit: 0.68 },
  hillTop:   { w: 88, h: 62, hit: 0.68 },
  hill2:     { w: 88, h: 62, hit: 0.68 },
  enemy:     { w: 64, h: 48, hit: 0.7 },
  enemy2:    { w: 70, h: 56, hit: 0.7 },
  bomb:      { w: 50, h: 50, hit: 0.7 }
};

const collectibleData = {
  coin: { effect: "+1", onCollect(scene) { scene.coinCount += 1; scene.updateCoinUI(); } },
  star: { effect: "+10 Score", onCollect(scene) { scene.addScore(10); } },
  gem:  { effect: "+10 Koin", onCollect(scene) { scene.coinCount += 10; scene.updateCoinUI(); } },
  flag: { effect: "+20 Score", onCollect(scene) { scene.addScore(20); } }
};

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

    this.isFemaleHero = GameState.selectedHero === 1;
    this.dashReady = true;
    this.isDashing = false;
    this.dashDir = 1;

    this.timers = [];

    this.createBackground();
    this.createAudio();
    this.createGround();
    this.createPlayer();
    this.createGroups();
    this.createUI();
    this.createCollisions();
    this.createInput();
    this.createTimers();
  }

  //setup background
  createBackground() {
    if (this.textures.exists("bgSky")) {
      this.add.image(0, 0, "bgSky").setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    } else {
      this.cameras.main.setBackgroundColor("#87CEEB");
    }

    this.bgCloud = this.makeParallax("bgCloud", 0, 18);
    this.bgTrees = this.makeParallax("bgTrees", HEIGHT, 55, true);
  }

  makeParallax(key, y, speed, bottomOrigin = false) {
    if (!this.textures.exists(key)) return null;

    const h = this.textures.get(key).getSourceImage().height;
    const layer = this.add.tileSprite(0, y, WIDTH, h, key)
      .setOrigin(0, bottomOrigin ? 1 : 0)
      .setAlpha(bottomOrigin ? 1 : 0.9);

    layer.scrollSpeed = speed;
    return layer;
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
    this.player.setSize(32, 55);
    this.player.setOffset(24, 55);

    if (this.anims.exists(heroKey + "_run")) {
      this.player.anims.play(heroKey + "_run", true);
    }

    this.playerMinX = 75;
    this.playerMaxX = WIDTH - 95;
    this.playerMoveSpeed = 300;
  }

  createGroups() {
    const config = { allowGravity: false, immovable: true };
    this.enemyGroup = this.physics.add.group(config);
    this.itemGroup = this.physics.add.group(config);
  }

  createUI() {
    this.hpIcons = [];

    for (let i = 0; i < 3; i++) {
      this.hpIcons.push(this.add.image(28 + i * 34, 28, "hpFull").setScale(0.75).setDepth(1000));
    }

    this.scoreText = this.add.text(20, 58, "Skor: 0", this.textStyle(22)).setDepth(1000);

    this.coinPanel = this.add.container(WIDTH - 120, 35).setDepth(1000);
    this.coinText = this.add.text(-40, -13, "Koin: 0", this.textStyle(22));

    this.coinPanel.add([
      this.add.image(0, 0, "btn").setDisplaySize(210, 56),
      this.add.image(-72, -2, "coin").setScale(0.8),
      this.coinText
    ]);
  }

  textStyle(size, color = "#ffffff") {
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
    this.physics.add.overlap(this.player, this.enemyGroup, (p, enemy) => this.hitPlayer(enemy));
    this.physics.add.overlap(this.player, this.itemGroup, (p, item) => this.collectItem(item));
  }

  createInput() {
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });
  }

  createTimers() {
    this.addTimer(500, () => {
      this.addScore(1);

      if (this.score >= this.nextFlagScore) {
        this.spawnCollectible("flag");
        this.nextFlagScore += 50;
      }
    });

    this.scheduleObstacle();
    this.scheduleCollectible();

    this.time.delayedCall(900, () => {
      if (!this.gameOverFlag) this.spawnObstacle("zombie");
    });
  }

  // repeating timer that auto-stops when game over, tracked for cleanup
  addTimer(delay, callback) {
    const event = this.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        if (!this.gameOverFlag) callback();
      }
    });

    this.timers.push(event);
    return event;
  }

  // loop

  update(time, delta) {
    if (this.gameOverFlag) return;

    const dt = delta / 1000;

    this.updateSpeed();
    this.updateBackground(dt);
    this.updateInput(dt);
    this.updateGround(dt);
    this.updateObjects();
    this.checkGround();
    this.checkAnimation();
  }

  updateSpeed() {
    this.groundSpeed = this.baseGroundSpeed + this.score * 1.25;
  }

  updateBackground(dt) {
    [this.bgCloud, this.bgTrees].forEach(layer => {
      if (layer) layer.tilePositionX += layer.scrollSpeed * dt;
    });
  }

  updateInput(dt) {
    const onGround = this.isOnGround();
    let moveDir = 0;

    if (onGround) {
      if (this.keys.A.isDown) moveDir = -1;
      else if (this.keys.D.isDown) moveDir = 1;
    }

    if (moveDir !== 0) this.dashDir = moveDir;

    let speed = this.playerMoveSpeed;

    if (this.isFemaleHero && this.isDashing) {
      speed = 780;
      moveDir = this.dashDir;
    }

    this.player.x = Phaser.Math.Clamp(
      this.player.x + moveDir * speed * dt,
      this.playerMinX,
      this.playerMaxX
    );

    if (moveDir !== 0) this.player.flipX = moveDir < 0;

    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) this.jump();

    if (this.isFemaleHero && onGround && Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
      this.dash();
    }
  }

  updateGround(dt) {
    let maxX = 0;
    this.groundGroup.children.each(tile => { if (tile.x > maxX) maxX = tile.x; });

    this.groundGroup.children.each(tile => {
      tile.x -= this.groundSpeed * dt;
      if (tile.x + this.tileW < 0) tile.x = maxX + this.tileStep;
    });
  }

  updateObjects() {
    this.updateGroup(this.enemyGroup, -150);
    this.updateGroup(this.itemGroup, -120);
  }

  updateGroup(group, destroyX) {
    group.children.each(obj => {
      if (!obj || !obj.active) return;

      obj.setVelocityX(-(this.groundSpeed + (obj.speedOffset || 0)));

      if (obj.x < destroyX) obj.destroy();
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
      if (this.anims.exists(heroKey + "_run")) this.player.anims.play(heroKey + "_run", true);
    }
  }

  // actions player

  jump() {
    if (this.gameOverFlag || this.jumpCount >= this.maxJump) return;

    this.playSfx(this.sfxJump);
    this.player.body.setVelocityY(-500);
    this.jumpCount++;
  }

  dash() {
    if (this.gameOverFlag || !this.isFemaleHero || !this.dashReady) return;

    this.dashReady = false;
    this.isDashing = true;

    this.playSfx(this.sfxTouch);
    this.player.setAlpha(0.65);

    this.time.delayedCall(160, () => {
      this.isDashing = false;
      if (this.player.active) this.player.setAlpha(1);
    });

    this.time.delayedCall(900, () => { this.dashReady = true; });
  }

  // spawn

  getRandomKey(list) {
    if (list.length === 0) return null;
    return Phaser.Utils.Array.GetRandom(list);
  }

  scheduleObstacle() {
    const delay = Phaser.Math.Clamp(2400 - this.score * 5, 850, 2400);

    this.time.delayedCall(delay, () => {
      if (this.gameOverFlag) return;

      if (this.canSpawnEnemy(130)) {
        const keys = obs.filter(o => this.score >= o.minScore && this.textures.exists(o.key)).map(o => o.key);
        const key = this.getRandomKey(keys);
        if (key) this.spawnObstacle(key);
      }

      this.scheduleObstacle();
    });
  }

  scheduleCollectible() {
    this.addTimer(2500, () => this.spawnCollectible());
  }

  canSpawnEnemy(minGap) {
    let farthestX = -999;

    this.enemyGroup.children.each(obj => {
      if (obj && obj.active && obj.x > farthestX) farthestX = obj.x;
    });

    return farthestX < WIDTH + minGap;
  }

  spawnObstacle(forcedKey = null) {
    const entry = obs.find(o => o.key === forcedKey) ||
      obs.find(o => o.key === this.getRandomKey(
        obs.filter(o => this.score >= o.minScore && this.textures.exists(o.key)).map(o => o.key)
      ));

    if (!entry) return;

    const data = obs_dt[entry.key];
    if (!data) return;

    if (data.sprite) {
      this.spawnZombieLike(entry.key, data);
      return;
    }

    const x = WIDTH + Phaser.Math.Between(130, 260);
    const y = entry.type === "flying"
      ? this.groundY - Phaser.Math.Between(150, 205)
      : this.groundY - data.h / 2 + 8;

    const obj = this.physics.add.image(x, y, entry.key);

    obj.setDisplaySize(data.w, data.h);
    obj.setImmovable(true);
    obj.body.allowGravity = false;
    obj.setSize(data.w * data.hit, data.h * data.hit);
    obj.speedOffset = entry.type === "flying" ? 95 : 0;

    if (entry.type === "flying") {
      this.floatTween(obj, Phaser.Math.Between(12, 22), Phaser.Math.Between(450, 650));
    } else if (entry.key === "bomb") {
      this.wobbleTween(obj, 10, 170);
    } else {
      obj.setAngle(Phaser.Math.Between(-6, 6));
    }

    this.enemyGroup.add(obj);
  }

  spawnZombieLike(key, data) {
    if (!this.textures.exists(key)) return;

    const zombie = this.physics.add.sprite(WIDTH + 90, this.playerGroundY, key);

    zombie.flipX = true;
    zombie.setSize(data.w, data.h);
    zombie.setOffset(data.offsetX, data.offsetY);
    zombie.speedOffset = 45;

    if (this.anims.exists(key + "_walk")) zombie.anims.play(key + "_walk", true);

    this.enemyGroup.add(zombie);
  }

  floatTween(target, distance, duration) {
    this.tweens.add({ targets: target, y: target.y + distance, duration, yoyo: true, repeat: -1 });
  }

  wobbleTween(target, angle, duration) {
    this.tweens.add({ targets: target, angle, duration, yoyo: true, repeat: -1 });
  }

  spawnCollectible(forcedKey = null) {
    const key = forcedKey || this.getRandomCollectibleKey();
    if (!key || !this.textures.exists(key)) return;

    let x = WIDTH + Phaser.Math.Between(160, 250);
    let y = this.groundY - Phaser.Math.Between(115, 190);

    if (key === "flag") {
      x = WIDTH + 180;
      y = this.groundY - 42;
    }

    const item = this.physics.add.image(x, y, key);
    item.itemKey = key;
    item.body.allowGravity = false;
    item.setImmovable(true);

    if (key === "coin") {
      item.setScale(1.15);
      item.setCircle(18);
    } else if (key === "flag") {
      item.setDisplaySize(54, 78);
      item.setSize(38, 70);
    } else {
      item.setScale(key === "gem" ? 0.9 : 1);
      item.setCircle(16);
      this.floatTween(item, -10, 500);
    }

    this.itemGroup.add(item);
  }

  getRandomCollectibleKey() {
    const keys = [];

    if (this.textures.exists("coin")) keys.push("coin", "coin", "coin", "coin");
    if (this.score >= 40 && this.textures.exists("star")) keys.push("star");
    if (this.score >= 70 && this.textures.exists("gem")) keys.push("gem");

    return this.getRandomKey(keys);
  }

  collectItem(item) {
    if (!item || !item.active) return;

    const { x, y, itemKey: key } = item;
    const data = collectibleData[key];

    item.destroy();
    this.playSfx(this.sfxTouch);

    if (data) {
      data.onCollect(this);
      this.showCollectEffect(x, y, data.effect, key);
    }
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
      const p = this.add.image(x, y, key).setScale(0.22).setDepth(1003);

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

  // damage

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

//  ui score

  updateHpUI() {
    this.hpIcons.forEach((heart, i) => heart.setTexture(i < this.hp ? "hpFull" : "hpEmpty"));
  }

  updateCoinUI() {
    this.coinText.setText("Koin: " + this.coinCount);
  }

  addScore(value) {
    this.score += value;
    this.scoreText.setText("Skor: " + this.score);
    this.updateSpeed();
  }

  // gameover
  gameOver() {
    if (this.gameOverFlag) return;

    this.gameOverFlag = true;

    this.timers.forEach(event => event.remove());

    if (this.sfxWalk && this.sfxWalk.isPlaying) this.sfxWalk.stop();

    this.playSfx(this.sfxKalah);

    GameState.lastScore = this.score;
    GameState.lastCoins = this.coinCount;

    if (this.score > GameState.bestScore) GameState.bestScore = this.score;

    this.physics.pause();

    this.time.delayedCall(650, () => {
      this.scene.start("TA_scnGameOver", { score: this.score, coins: this.coinCount });
    });
  }
}