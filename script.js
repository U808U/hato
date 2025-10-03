const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.image('bgFar', 'https://i.imgur.com/FO4koVd.png');
    this.load.image('bgMid', 'https://i.imgur.com/WIr15MQ.png');
    this.load.image('bgNear', 'https://i.imgur.com/rkDCAW7.png');

    this.load.spritesheet('pigeon', 'https://i.imgur.com/petijFc.png', {
      frameWidth: 512,
      frameHeight: 512
    });

    this.load.spritesheet('crow', 'https://i.imgur.com/pwQQUvi.png', {
      frameWidth: 512,
      frameHeight: 512
    });
  }

  create() {
    // 補間オフ（NEARESTフィルター）
    this.textures.get('bgFar').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('bgMid').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('bgNear').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('pigeon').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('crow').setFilter(Phaser.Textures.FilterMode.NEAREST);

    // 背景レイヤー
    this.bgFar = this.add.tileSprite(0, GAME_HEIGHT - 200, GAME_WIDTH, 512, 'bgFar')
      .setOrigin(0, 1).setScrollFactor(0).setDepth(0);
    this.bgMid = this.add.tileSprite(0, GAME_HEIGHT - 100, GAME_WIDTH, 512, 'bgMid')
      .setOrigin(0, 1).setScrollFactor(0).setDepth(1);
    this.bgNear = this.add.tileSprite(0, GAME_HEIGHT, GAME_WIDTH, 256, 'bgNear')
      .setOrigin(0, 1).setScrollFactor(0).setDepth(2);

    // 影
    this.shadowFront = this.add.ellipse(
      GAME_WIDTH * 0.25,
      GAME_HEIGHT - 10,
      80,
      10,
      0x000000, 0.3
    ).setDepth(3);

    // 鳩
    this.player = this.physics.add.sprite(
      GAME_WIDTH * 0.25, GAME_HEIGHT / 2, 'pigeon'
    ).setScale(0.5).setGravityY(1000).setCollideWorldBounds(true).setDepth(4);

    this.player.setSize(200, 200).setOffset(150, 150);

    this.anims.create({
      key: 'fly',
      frames: [
        { key: 'pigeon', frame: 0 },
        { key: 'pigeon', frame: 1 },
        { key: 'pigeon', frame: 2 }
      ],
      frameRate: 6,
      repeat: -1
    });

    this.player.anims.play('fly', true);

    // カラスアニメーション
    this.anims.create({
      key: 'crowFly',
      frames: [
        { key: 'crow', frame: 0 },
        { key: 'crow', frame: 1 }
      ],
      frameRate: 6,
      repeat: -1
    });

    // カラスグループ
    this.crows = this.physics.add.group();

    for (let i = 0; i < 3; i++) {
      const speedX = Phaser.Math.Between(200, 300);
      const speedY = Phaser.Math.Between(-60, 60);

      const crow = this.crows.create(
        GAME_WIDTH + i * Phaser.Math.Between(400, 800),
        GAME_HEIGHT / 2 + Phaser.Math.Between(-100, 100),
        'crow'
      ).setScale(0.5).setDepth(4).setImmovable(true);

      crow.anims.play('crowFly', true);
      crow.setSize(200, 200).setOffset(150, 150);
      crow.setVelocityX(-speedX);
      crow.setVelocityY(speedY);
      crow.speedX = speedX;
    }

    this.physics.add.collider(this.player, this.crows, this.handleCrowCollision, null, this);

    this.input.on('pointerdown', () => this.jump());
    this.input.keyboard.on('keydown-SPACE', () => this.jump());

    this.scrollBlocked = false;
  }

  jump() {
    this.player.setVelocityY(-400);
  }

  handleCrowCollision(player, crow) {
    player.setVelocityX(-200);
    player.setTint(0xff9999); // ダメージ色：柔らかいピンク

    crow.setVelocityX(-crow.speedX); // カラスのスクロール維持

    this.time.delayedCall(500, () => {
      player.clearTint();
      player.setVelocityX(0);
      player.x = GAME_WIDTH * 0.25;
    });

    this.scrollBlocked = true;
    this.time.delayedCall(500, () => this.scrollBlocked = false);
  }

  update() {
    if (!this.scrollBlocked) {
      this.bgFar.tilePositionX += 0.6;
      this.bgMid.tilePositionX += 2.5;
      this.bgNear.tilePositionX += 3;
    }

    const offset = Phaser.Math.Clamp((GAME_HEIGHT / 2 - this.player.y) * 0.25, -100, 100);
    this.bgFar.y = GAME_HEIGHT - 230 + offset * 0.4;
    this.bgMid.y = GAME_HEIGHT - 20 + offset * 0.8;
    this.bgNear.y = GAME_HEIGHT + offset * 1 + 100;

    const heightRatio = Phaser.Math.Clamp((GAME_HEIGHT - this.player.y) / GAME_HEIGHT, 0, 1);
    this.shadowFront.setScale(1 + heightRatio * 0.8, 1 + heightRatio * 0.5);
    this.shadowFront.setAlpha(0.6 - heightRatio * 0.4);
    this.shadowFront.x = this.player.x;

    this.crows.children.iterate(crow => {
      if (crow.x < -100) {
        crow.x = GAME_WIDTH + Phaser.Math.Between(400, 800);
        crow.y = GAME_HEIGHT / 2 + Phaser.Math.Between(-100, 100);
        const newSpeedX = Phaser.Math.Between(200, 300);
        const newSpeedY = Phaser.Math.Between(-60, 60);
        crow.setVelocityX(-newSpeedX);
        crow.setVelocityY(newSpeedY);
        crow.speedX = newSpeedX;
      }

      if (Phaser.Math.Between(0, 100) < 5) {
        crow.setVelocityY(Phaser.Math.Between(-60, 60));
      }
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  transparent: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);