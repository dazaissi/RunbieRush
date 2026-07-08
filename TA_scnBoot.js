class TA_scnBoot extends Phaser.Scene {
  constructor() {
    super("TA_scnBoot");
  }

  preload() {
    // karakter
    this.load.spritesheet("male", "/assets/player.png", {
      frameWidth: 80,
      frameHeight: 110,
      endFrame: 23
    });

    this.load.spritesheet("female", "/assets/female.png", {
      frameWidth: 80,
      frameHeight: 110,
      endFrame: 23
    });

    this.load.spritesheet("zombie", "/assets/zombie.png", {
      frameWidth: 80,
      frameHeight: 110,
      endFrame: 23
    });

    // ground
    this.load.image("grassTop", "/assets/terrain_grass_block_top.png");
    this.load.image("grassCenter", "/assets/terrain_grass_block_center.png");
    this.load.image("grassBottom", "/assets/terrain_grass_block_bottom.png");

    this.load.image("grassTopLeft", "/assets/terrain_grass_block_top_left.png");
    this.load.image("grassTopRight", "/assets/terrain_grass_block_top_right.png");
    this.load.image("grassLeft", "/assets/terrain_grass_block_left.png");
    this.load.image("grassRight", "/assets/terrain_grass_block_right.png");

    this.load.image("cloudLeft", "/assets/terrain_grass_cloud_left.png");
    this.load.image("cloudMiddle", "/assets/terrain_grass_cloud_middle.png");
    this.load.image("cloudRight", "/assets/terrain_grass_cloud_right.png");
    this.load.image("cloudBg", "/assets/terrain_grass_cloud_background.png");

    // ui
    this.load.image("coin", "/assets/hud_coin.png");
    this.load.image("hpFull", "/assets/hud_heart.png");
    this.load.image("hpEmpty", "/assets/hud_heart_empty.png");

    // this.load.image("panel", "/assets/button_coin.png");
    this.load.image("btn", "/assets/btn.png");

    this.load.image("btn_play", "/assets/btn_play.png");
    this.load.image("btn_reset", "/assets/btn_repeat.png");
    this.load.image("btn_right", "/assets/btn_right.png");
    this.load.image("btn_back", "/assets/btn_back.png");

    this.load.image("lock", "/assets/lock_green.png");

    //bg
    this.load.image("bgSky", "/assets/bg_sky.png");
    this.load.image("bgTrees", "/assets/bg_trees.png");
    this.load.image("bgCloud", "/assets/bg_cloud.png");

    this.load.image("star", "/assets/star.png");
    this.load.image("gem", "/assets/gem_yellow.png");

    // enemy
    this.load.image("enemy", "/assets/bee_a.png");
    this.load.image("enemy2", "/assets/enemy2.png");

    this.load.image("rock", "/assets/rockDirt.png");
    this.load.image("rock2", "/assets/rock.png");
    this.load.image("bomb", "/assets/bomb.png");
    this.load.image("cactus", "/assets/cactus.png");
    this.load.image("bush", "/assets/bush.png");

    this.load.image("mushroom", "/assets/mushroom_brown.png");
    this.load.image("mushroom2", "/assets/mushroom_red.png");

    this.load.image("hill", "/assets/hill.png");
    this.load.image("hillTop", "/assets/hill_top.png");
    this.load.image("hill2", "/assets/hill_top_smile.png");
    this.load.image("flag", "/assets/flag_green_a.png");

    // audio
    this.load.audio("touch", [
      "/assets/touch.mp3",
      "/assets/touch.ogg"
    ]);

    this.load.audio("jump", [
      "/assets/lompat.mp3",
      "/assets/lompat.ogg"
    ]);

    this.load.audio("walk", [
      "/assets/walk.mp3",
      "/assets/walk.ogg"
    ]);

    this.load.audio("kalah", [
      "/assets/kalah.mp3",
      "/assets/kalah.ogg"
    ]);

    this.load.audio("male_voice", "/assets/malevoice.mp3");
    this.load.audio("female_voice", "/assets/girlvoice.mp3");
    this.load.audio("choose", "/assets/chooseur.mp3");
    this.load.audio("ambience", "/assets/ambience.ogg");

    // font
    this.load.bitmapFont("font", "/assets/font.fnt");
  }

  create() {
    this.createCharacterAnimations();

    this.scene.start("TA_scnMenu");
  }

  createCharacterAnimations() {
    this.createAnim("male_run", "male", 0, 23, 20);
    this.createAnim("male_idle", "male", 0, 5, 6);

    this.createAnim("female_run", "female", 0, 23, 20);
    this.createAnim("female_idle", "female", 0, 5, 6);

    this.createAnim("zombie_walk", "zombie", 0, 23, 18);
  }

  createAnim(animKey, textureKey, start, end, frameRate) {
    if (this.anims.exists(animKey)) return;
    if (!this.textures.exists(textureKey)) return;

    this.anims.create({
      key: animKey,
      frames: this.anims.generateFrameNumbers(textureKey, {
        start: start,
        end: end
      }),
      frameRate: frameRate,
      repeat: -1
    });
  }
}