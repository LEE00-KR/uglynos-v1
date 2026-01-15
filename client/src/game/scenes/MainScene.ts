import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Load placeholder assets
    this.load.setBaseURL('/assets');

    // Create placeholder graphics
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Character placeholder
    graphics.fillStyle(0x4488ff);
    graphics.fillCircle(32, 32, 24);
    graphics.generateTexture('character', 64, 64);

    // Ground placeholder
    graphics.clear();
    graphics.fillStyle(0x228b22);
    graphics.fillRect(0, 0, 64, 64);
    graphics.generateTexture('ground', 64, 64);

    graphics.destroy();
  }

  create() {
    // Simple placeholder scene
    this.add.text(512, 288, 'Prehistoric Life', {
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(512, 350, '스테이지를 선택하여 전투를 시작하세요', {
      fontSize: '18px',
      color: '#888888',
    }).setOrigin(0.5);

    // Add clickable stage buttons
    const stages = [1, 2, 3, 4, 5];
    stages.forEach((stage, index) => {
      const x = 300 + index * 100;
      const button = this.add.rectangle(x, 450, 80, 40, 0x333333)
        .setInteractive()
        .on('pointerover', () => button.setFillStyle(0x555555))
        .on('pointerout', () => button.setFillStyle(0x333333))
        .on('pointerdown', () => this.startBattle(stage));

      this.add.text(x, 450, `Stage ${stage}`, {
        fontSize: '14px',
        color: '#ffffff',
      }).setOrigin(0.5);
    });
  }

  startBattle(stageId: number) {
    this.scene.start('BattleScene', { stageId });
  }
}
