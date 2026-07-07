class TA_scnPlay extends Phaser.Scene {
    constructor() {
        super('TA_scnPlay');
        
        // ===== STATUS GAME =====
        this.gameActive = true;
        this.isGameOver = false;
        this.isTransitioning = false;
        
        // ===== PLAYER STATUS =====
        this.phase = 'merah';          // 'merah' atau 'biru'
        this.distance = 0;
        this.coins = 0;
        this.speed = 250;
        this.maxSpeed = 600;
        this.isSliding = false;
        this.isJumping = false;
        this.shiftCooldown = false;
        
        // ===== CHECKPOINT =====
        this.checkpointDistance = 0;
        this.checkpointInterval = 500; // setiap 500 meter
        this.spawnTimer = 0;
        
        // ===== OBSTACLE =====
        this.obstacles = [];
        this.groundY = 290; // posisi lantai (720x330)
    }

    preload() {
        // ---- Background & Environment ----
        this.load.image('bg2', '/assets/bg2.png');
        this.load.image('ground', '/assets/ground.png');
        this.load.image('gameover', '/assets/gameover.png');
        this.load.image('levelup', '/assets/levelup.png');
        this.load.image('particle', '/assets/herb.png');
        
        // ---- Coin & Collectibles ----
        this.load.image('herb', '/assets/herb.png');
        this.load.image('kunci', '/assets/key_big.png');

        // ---- Enemy Spritesheet (untuk obstacle nanti) ----
        this.load.spritesheet('enemy1', '/assets/slimesheet.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('enemy2', '/assets/slime2.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('enemy3', '/assets/slime2.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // ---- 📌 PLAYER SPRITESHEET (24 FRAME) ----
        // Asumsi: kamu punya spritesheet 24 frame untuk cowok & cewek
        // Ukuran tiap frame: 32x32 atau sesuai
        this.load.spritesheet('hero_male', '/assets/male_runner.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('hero_female', '/assets/female_runner.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // ---- Audio ----
        this.load.audio('music2', [
            '/assets/chillambient.mp3',
            '/assets/chillambient.ogg'
        ]);
        this.load.audio('snd_coin', [
            '/assets/koin.mp3',
            '/assets/koin.ogg'
        ]);
        this.load.audio('snd_jump', [
            '/assets/lompat.mp3',
            '/assets/lompat.ogg'
        ]);
        this.load.audio('snd_leveling', [
            '/assets/ganti_level.mp3',
            '/assets/ganti_level.ogg'
        ]);
        this.load.audio('snd_lose', [
            '/assets/kalah.mp3',
            '/assets/kalah.ogg'
        ]);
        this.load.audio('snd_walk', '/assets/walk.mp3');
    }

    // ============================================================
    //  CREATE - INISIALISASI GAME
    // ============================================================
    create() {
        const W = this.game.canvas.width;
        const H = this.game.canvas.height;
        const X_CENTER = W / 2;
        const Y_CENTER = H / 2;

        // ===== REFERENSI =====
        const activeScene = this;
        this.obstacles = [];

        // ===== AMBIL DATA HERO =====
        // Asumsi: data dari scene sebelumnya
        this.selectedHero = this.registry.get('selectedHero') || 0; // 0=cowok, 1=cewek

        // ===== RESET STATUS =====
        this.phase = 'merah';
        this.distance = 0;
        this.coins = 0;
        this.speed = 250;
        this.isSliding = false;
        this.isJumping = false;
        this.shiftCooldown = false;
        this.gameActive = true;
        this.isGameOver = false;
        this.spawnTimer = 0;
        this.obstacles = [];
        this.checkpointDistance = 0;

        // ===== FISIKA =====
        this.physics.world.setBounds(0, 0, W, H);
        this.physics.world.gravity.y = 800;

        // ===== BACKGROUND =====
        // Background dengan efek paralaks (pakai bg2 dari asetmu)
        this.bgTile = this.add.tileSprite(0, 0, W, H, 'bg2')
            .setOrigin(0)
            .setDepth(-1);

        // Overlay gelap tipis biar lebih dramatis
        const overlay = this.add.graphics();
        overlay.fillStyle(0x0a0a2a, 0.3);
        overlay.fillRect(0, 0, W, H);

        // ===== GROUND =====
        this.groundY = 290;
        
        // Ground utama (pakai ground dari asetmu)
        this.ground = this.add.tileSprite(0, this.groundY, W * 2, 40, 'ground')
            .setOrigin(0)
            .setDepth(5);

        // Garis bantu di ground (dekorasi)
        this.groundLines = this.add.graphics();
        this.groundLines.setDepth(6);
        this.groundLines.fillStyle(0x88ddff, 0.2);
        for (let i = 0; i < 20; i++) {
            this.groundLines.fillRect(i * 55, this.groundY + 18, 25, 2);
        }
        this.groundOffset = 0;

        // ===== PLAYER =====
        // 📌 Pilih spritesheet berdasarkan hero
        const heroKey = this.selectedHero === 0 ? 'hero_male' : 'hero_female';
        
        this.player = this.physics.add.sprite(120, this.groundY - 30, heroKey);
        this.player.setScale(2.5);
        this.player.setDepth(20);
        this.player.setBounce(0.1);
        this.player.setGravityY(700);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(22, 28);
        this.player.body.setOffset(5, 2);

        // ---- 📌 BUAT ANIMASI DARI 24 FRAME ----
        // Asumsi: 24 frame dibagi menjadi:
        // - 8 frame idle   (0-7)
        // - 8 frame run    (8-15)
        // - 4 frame jump   (16-19)
        // - 4 frame slide  (20-23)
        // Sesuaikan dengan spritesheetmu!
        
        if (!this.anims.exists('hero_idle')) {
            this.anims.create({
                key: 'hero_idle',
                frames: this.anims.generateFrameNumbers(heroKey, { start: 0, end: 7 }),
                frameRate: 6,
                repeat: -1
            });
        }
        if (!this.anims.exists('hero_run')) {
            this.anims.create({
                key: 'hero_run',
                frames: this.anims.generateFrameNumbers(heroKey, { start: 8, end: 15 }),
                frameRate: 12,
                repeat: -1
            });
        }
        if (!this.anims.exists('hero_jump')) {
            this.anims.create({
                key: 'hero_jump',
                frames: this.anims.generateFrameNumbers(heroKey, { start: 16, end: 19 }),
                frameRate: 10,
                repeat: 0
            });
        }
        if (!this.anims.exists('hero_slide')) {
            this.anims.create({
                key: 'hero_slide',
                frames: this.anims.generateFrameNumbers(heroKey, { start: 20, end: 23 }),
                frameRate: 10,
                repeat: 0
            });
        }

        // Mulai dengan animasi idle
        this.player.anims.play('hero_idle', true);

        // ---- GLOW EFEK FASE ----
        this.phaseGlow = this.add.graphics();
        this.phaseGlow.setDepth(15);
        this.updatePhaseGlow();

        // ===== OBSTACLE GROUP =====
        this.obstacleGroup = this.physics.add.group({
            allowGravity: false,
            immovable: true,
        });

        // ===== COIN GROUP =====
        this.coinGroup = this.physics.add.group({
            allowGravity: false,
            immovable: true,
        });

        // ===== AUDIO =====
        this.sndMusic = this.sound.add('music2', {
            loop: true,
            volume: 0.3
        });
        this.sndCoin = this.sound.add('snd_coin', { volume: 0.6 });
        this.sndJump = this.sound.add('snd_jump', { volume: 0.5 });
        this.sndLose = this.sound.add('snd_lose', { volume: 0.7 });
        this.sndWalk = this.sound.add('snd_walk', {
            loop: true,
            volume: 0.15
        });

        // ===== INPUT =====
        this.keys = this.input.keyboard.addKeys({
            jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });
        this.cursors = this.input.keyboard.createCursorKeys();

        // ===== TOUCH INPUT (MOBILE) =====
        this.input.on('pointerdown', (pointer) => {
            if (this.isGameOver || !this.gameActive) return;
            
            if (pointer.y < this.scale.height / 2) {
                this.jump();
            } else {
                this.slideStart();
                this.time.delayedCall(350, this.slideEnd, [], this);
            }
        });

        // ===== HUD =====
        this.createHUD(W, H);

        // ===== PARTIKEL UNTUK SHIFT =====
        this.particles = this.add.particles(0, 0, 'particle', {
            speed: 120,
            lifespan: 400,
            scale: { start: 0.5, end: 0 },
            tint: 0x00ffff,
            quantity: 1,
        });
        this.particles.setDepth(25);
        this.particles.setVisible(false);

        // ===== DARK OVERLAY UNTUK TRANSISI =====
        this.darkOverlay = this.add.rectangle(X_CENTER, Y_CENTER, W, H, 0x000000);
        this.darkOverlay.setDepth(80);
        this.darkOverlay.setAlpha(0);
        this.darkOverlay.setScrollFactor(0);

        // ===== MULAI GAME =====
        this.sndMusic.play();
        this.sndWalk.play();

        // ===== GAME LOOP =====
        // Spawn obstacle otomatis di update()
    }

    // ============================================================
    //  CREATE HUD
    // ============================================================
    createHUD(W, H) {
        const activeScene = this;

        // ---- Panel HUD ----
        const panel = this.add.graphics();
        panel.setDepth(50);
        panel.setScrollFactor(0);
        panel.fillStyle(0x000000, 0.6);
        panel.fillRoundedRect(10, 10, 200, 100, 12);
        panel.lineStyle(2, 0x00ffff, 0.2);
        panel.strokeRoundedRect(10, 10, 200, 100, 12);

        // ---- Jarak ----
        this.hudDistance = this.add.text(22, 18, '📏 0 m', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.hudDistance.setDepth(51);
        this.hudDistance.setScrollFactor(0);

        // ---- Koin ----
        this.hudCoins = this.add.text(22, 42, '🪙 0', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffdd44',
            fontStyle: 'bold'
        });
        this.hudCoins.setDepth(51);
        this.hudCoins.setScrollFactor(0);

        // ---- Fase ----
        this.hudPhase = this.add.text(W - 20, 18, '🔴 MERAH', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ff6666',
            fontStyle: 'bold'
        });
        this.hudPhase.setDepth(51);
        this.hudPhase.setScrollFactor(0);
        this.hudPhase.setOrigin(1, 0);

        // ---- Kecepatan ----
        this.hudSpeed = this.add.text(W - 20, 42, '⚡ 250', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#88ddff',
            fontStyle: 'bold'
        });
        this.hudSpeed.setDepth(51);
        this.hudSpeed.setScrollFactor(0);
        this.hudSpeed.setOrigin(1, 0);

        // ---- Checkpoint Notification ----
        this.hudCheckpoint = this.add.text(W / 2, 70, '', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#00ffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.hudCheckpoint.setDepth(52);
        this.hudCheckpoint.setScrollFactor(0);
        this.hudCheckpoint.setOrigin(0.5);

        // ---- Instruction / Shift hint ----
        this.hintText = this.add.text(W / 2, 120, '🔄 SHIFT = Ganti Warna', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#88aaff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.hintText.setDepth(52);
        this.hintText.setScrollFactor(0);
        this.hintText.setOrigin(0.5);

        // Hilang setelah 5 detik
        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: this.hintText,
                alpha: 0,
                duration: 500,
                onComplete: () => this.hintText.destroy()
            });
        });
    }

    // ============================================================
    //  UPDATE PHASE GLOW
    // ============================================================
    updatePhaseGlow() {
        const color = this.phase === 'merah' ? 0xff3333 : 0x33aaff;
        this.phaseGlow.clear();
        this.phaseGlow.fillStyle(color, 0.15);
        this.phaseGlow.fillCircle(this.player.x, this.player.y - 5, 45);
    }

    // ============================================================
    //  JUMP
    // ============================================================
    jump() {
        if (this.isGameOver || !this.gameActive) return;
        
        const onGround = this.player.body.touching.down || this.player.body.blocked.down;
        if (onGround) {
            this.player.setVelocityY(-550);
            this.sndJump.play();
            this.isJumping = true;
            this.player.anims.play('hero_jump', true);
            this.spawnDust(this.player.x, this.player.y + 20);
        }
    }

    // ============================================================
    //  SLIDE
    // ============================================================
    slideStart() {
        if (this.isGameOver || !this.gameActive || this.isSliding) return;
        
        this.isSliding = true;
        this.player.body.setSize(28, 18);
        this.player.body.setOffset(2, 12);
        this.player.anims.play('hero_slide', true);
    }

    slideEnd() {
        if (!this.isSliding) return;
        
        this.isSliding = false;
        this.player.body.setSize(22, 28);
        this.player.body.setOffset(5, 2);
        this.player.anims.play('hero_run', true);
    }

    // ============================================================
    //  TOGGLE PHASE (SHIFT)
    // ============================================================
    togglePhase() {
        if (this.isGameOver || !this.gameActive || this.shiftCooldown) return;
        
        this.shiftCooldown = true;
        this.time.delayedCall(250, () => { this.shiftCooldown = false; }, [], this);

        // Ganti fase
        this.phase = (this.phase === 'merah') ? 'biru' : 'merah';
        this.updatePhaseGlow();

        // Efek partikel
        this.particles.setVisible(true);
        this.particles.emitParticleAt(this.player.x, this.player.y - 10, 15);
        this.cameras.main.shake(80, 0.01);

        // Update HUD
        const label = this.phase === 'merah' ? '🔴 MERAH' : '🔵 BIRU';
        const color = this.phase === 'merah' ? '#ff6666' : '#66aaff';
        this.hudPhase.setText(label);
        this.hudPhase.setColor(color);

        // Efek suara "shift" (pakai snd_leveling)
        this.sound.play('snd_leveling', { volume: 0.4 });
    }

    // ============================================================
    //  SPAWN DUST
    // ============================================================
    spawnDust(x, y) {
        const dust = this.add.graphics();
        dust.fillStyle(0x88ddff, 0.5);
        dust.fillCircle(0, 0, 4);
        dust.setPosition(x, y);
        dust.setDepth(10);
        
        this.tweens.add({
            targets: dust,
            scale: 2.5,
            alpha: 0,
            y: y + 15,
            duration: 300,
            onComplete: () => dust.destroy()
        });
    }

    // ============================================================
    //  SPAWN OBSTACLE
    // ============================================================
    spawnObstacle() {
        const W = this.game.canvas.width;
        const H = this.game.canvas.height;
        
        // Tentukan jenis obstacle
        const type = Phaser.Math.Between(0, 1); // 0=merah, 1=biru
        const isWall = Phaser.Math.Between(0, 2) > 1; // 1/3 chance jadi tembok
        
        const x = W + 50;
        const y = this.groundY - 5;
        const color = type === 0 ? 0xff3333 : 0x33aaff;
        const phaseName = type === 0 ? 'merah' : 'biru';

        // Buat obstacle sebagai sprite (pakai enemy spritesheet sebagai placeholder)
        const enemyKey = type === 0 ? 'enemy1' : 'enemy2';
        const obs = this.obstacleGroup.create(x, y - 20, enemyKey);
        obs.setData('phase', phaseName);
        obs.setData('passed', false);
        obs.setDepth(16);
        
        // Ukuran & bentuk
        if (isWall) {
            obs.setDisplaySize(30, 65);
            obs.body.setSize(30, 65);
            obs.body.setOffset(1, 0);
        } else {
            obs.setDisplaySize(30, 30);
            obs.body.setSize(28, 28);
            obs.body.setOffset(2, 2);
        }
        obs.setImmovable(true);
        obs.body.allowGravity = false;
        
        // Warna tint sesuai fase
        obs.setTint(color);
        
        // Animasi
        const animKey = type === 0 ? 'enemy1_move' : 'enemy2_move';
        if (this.anims.exists(animKey)) {
            obs.anims.play(animKey, true);
        }

        // Simpan ke array untuk tracking
        this.obstacles.push(obs);
    }

    // ============================================================
    //  SPAWN COIN
    // ============================================================
    spawnCoin() {
        const W = this.game.canvas.width;
        const H = this.game.canvas.height;
        
        const x = W + 50;
        const y = this.groundY - 30 - Phaser.Math.Between(0, 60);
        
        const coin = this.coinGroup.create(x, y, 'herb');
        coin.setScale(1.0);
        coin.setDepth(15);
        coin.body.allowGravity = false;
        coin.setImmovable(true);

        // Animasi floating
        this.tweens.add({
            targets: coin,
            y: y - 12,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // ============================================================
    //  TRIGGER CHECKPOINT
    // ============================================================
    triggerCheckpoint() {
        this.checkpointDistance = this.distance;
        this.registry.set('checkpointDistance', this.distance);
        
        this.hudCheckpoint.setText('⚡ CHECKPOINT! ⚡');
        this.hudCheckpoint.setColor('#00ffff');
        this.cameras.main.shake(100, 0.012);
        
        // Efek partikel
        this.particles.setVisible(true);
        this.particles.emitParticleAt(this.player.x, this.player.y - 10, 20);
        
        this.time.delayedCall(1200, () => {
            this.hudCheckpoint.setText('');
        });
    }

    // ============================================================
    //  GAME OVER
    // ============================================================
    forceGameOver() {
        if (this.isGameOver) return;
        
        this.isGameOver = true;
        this.gameActive = false;
        
        this.physics.pause();
        this.sndWalk.setVolume(0);
        this.sndLose.play();
        
        // Efek mati
        this.player.setTint(0xff0000);
        this.cameras.main.shake(300, 0.02);
        
        // Simpan skor ke LocalStorage
        const highScore = this.registry.get('highScore') || 0;
        const totalCoins = this.registry.get('totalCoins') || 0;
        
        if (this.distance > highScore) {
            this.registry.set('highScore', Math.floor(this.distance));
            localStorage.setItem('echoHighScore', Math.floor(this.distance));
        }
        this.registry.set('totalCoins', totalCoins + this.coins);
        localStorage.setItem('echoTotalCoins', totalCoins + this.coins);
        
        // Dark overlay
        this.tweens.add({
            targets: this.darkOverlay,
            alpha: 0.7,
            duration: 300
        });
        
        // Tampilkan Game Over
        this.time.delayedCall(800, () => {
            this.sound.stopAll();
            this.scene.start('TA_scnGameOver', {
                distance: Math.floor(this.distance),
                coins: this.coins,
                highScore: this.registry.get('highScore')
            });
        });
    }

    // ============================================================
    //  UPDATE - MAIN GAME LOOP
    // ============================================================
    update(time, delta) {
        if (!this.gameActive || this.isGameOver) {
            // Tetap update bg biar gak diam
            if (this.bgTile) {
                this.bgTile.tilePositionX += 0.5;
            }
            return;
        }

        const W = this.game.canvas.width;
        const H = this.game.canvas.height;
        const dt = delta / 1000;

        // ===== 1. KECEPATAN BERTAMBAH =====
        this.speed = Math.min(this.maxSpeed, this.speed + 1.5 * dt);
        this.hudSpeed.setText('⚡ ' + Math.round(this.speed));

        // ===== 2. JARAK =====
        this.distance += this.speed * dt;
        this.hudDistance.setText(`📏 ${Math.floor(this.distance)} m`);

        // ===== 3. CHECKPOINT =====
        if (this.distance > this.checkpointDistance + this.checkpointInterval) {
            this.triggerCheckpoint();
        }

        // ===== 4. PLAYER PHYSICS =====
        // Posisi player tetap di x=120 (game endless run)
        this.player.x = 120;
        
        // Cek di ground
        if (this.player.y > this.groundY - 20 && !this.isSliding) {
            this.player.y = this.groundY - 20;
            this.player.body.setVelocityY(0);
            this.isJumping = false;
        }
        if (this.isSliding) {
            this.player.y = this.groundY - 5;
        }

        // ===== 5. PLAYER ANIMASI =====
        const onGround = this.player.body.touching.down || this.player.body.blocked.down;
        
        if (!this.isSliding && !this.isJumping) {
            if (onGround) {
                this.player.anims.play('hero_run', true);
                this.sndWalk.setVolume(0.15);
            } else {
                this.player.anims.play('hero_jump', true);
                this.sndWalk.setVolume(0);
            }
        }

        // ===== 6. GLOW MENGIKUTI PLAYER =====
        this.phaseGlow.x = this.player.x;
        this.phaseGlow.y = this.player.y;

        // ===== 7. BACKGROUND SCROLL =====
        if (this.bgTile) {
            this.bgTile.tilePositionX += this.speed * 0.2 * dt;
        }
        
        // Ground scroll
        this.ground.tilePositionX += this.speed * dt;
        this.groundOffset += this.speed * dt;
        if (this.groundOffset > 55) this.groundOffset -= 55;
        
        this.groundLines.clear();
        this.groundLines.fillStyle(0x88ddff, 0.2);
        for (let i = 0; i < 20; i++) {
            const x = (i * 55) - this.groundOffset;
            this.groundLines.fillRect(x, this.groundY + 18, 25, 2);
        }

        // ===== 8. UPDATE OBSTACLE =====
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            if (!obs || !obs.active) {
                this.obstacles.splice(i, 1);
                continue;
            }
            
            // Gerak ke kiri
            obs.x -= this.speed * dt;
            
            // Cek collision dengan player
            if (!obs.getData('passed')) {
                const dx = Math.abs(this.player.x - obs.x);
                const dy = Math.abs(this.player.y - obs.y);
                const hitW = 25;
                const hitH = obs.displayHeight > 40 ? 55 : 25;
                
                if (dx < hitW && dy < hitH) {
                    const obsPhase = obs.getData('phase');
                    if (this.phase === obsPhase) {
                        // Sama fase => MATI!
                        this.forceGameOver();
                        return;
                    } else {
                        // Beda fase => LOLOS!
                        obs.setData('passed', true);
                        obs.setTint(0x00ff00);
                        this.coins += 2;
                        this.hudCoins.setText(`🪙 ${this.coins}`);
                        this.sndCoin.play();
                        
                        // Efek menghilang
                        this.tweens.add({
                            targets: obs,
                            alpha: 0,
                            scale: 1.5,
                            duration: 200,
                            onComplete: () => {
                                this.obstacleGroup.remove(obs, true, true);
                            }
                        });
                    }
                }
            }
            
            // Hapus jika di luar layar
            if (obs.x < -60) {
                this.obstacleGroup.remove(obs, true, true);
                this.obstacles.splice(i, 1);
            }
        }

        // ===== 9. UPDATE COIN =====
        this.coinGroup.getChildren().forEach(coin => {
            if (!coin || !coin.active) return;
            
            coin.x -= this.speed * dt;
            
            // Ambil coin
            const dx = Math.abs(this.player.x - coin.x);
            const dy = Math.abs(this.player.y - coin.y);
            if (dx < 30 && dy < 30) {
                this.coins += 5;
                this.hudCoins.setText(`🪙 ${this.coins}`);
                this.sndCoin.play();
                this.spawnDust(coin.x, coin.y);
                this.coinGroup.remove(coin, true, true);
            }
            
            if (coin.x < -60) {
                this.coinGroup.remove(coin, true, true);
            }
        });

        // ===== 10. SPAWN OBSTACLE =====
        this.spawnTimer += dt;
        let spawnInterval = 1.6 - (this.speed - 250) / this.maxSpeed * 0.9;
        spawnInterval = Math.max(0.5, spawnInterval);
        
        if (this.spawnTimer > spawnInterval) {
            this.spawnTimer = 0;
            if (Phaser.Math.Between(0, 100) < 70) {
                this.spawnObstacle();
            }
            if (Phaser.Math.Between(0, 100) < 35) {
                this.spawnCoin();
            }
        }

        // ===== 11. CEK JATUH =====
        if (this.player.y > H + 100) {
            this.forceGameOver();
        }

        // ===== 12. INPUT =====
        // Jump
        const jumpPressed = 
            Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.up);
        if (jumpPressed) {
            this.jump();
        }
        
        // Slide
        if (this.keys.down.isDown || this.cursors.down.isDown) {
            if (!this.isSliding) this.slideStart();
        } else {
            if (this.isSliding) this.slideEnd();
        }
        
        // Shift
        if (Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
            this.togglePhase();
        }

        // ===== 13. UPDATE PARTICLES =====
        if (this.particles.visible) {
            this.particles.x = this.player.x;
            this.particles.y = this.player.y - 10;
        }
    }
}