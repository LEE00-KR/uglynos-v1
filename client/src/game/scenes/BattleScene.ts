import Phaser from 'phaser';

interface BattleSceneData {
  stageId: number;
}

export class BattleScene extends Phaser.Scene {
  private stageId: number = 0;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleSceneData) {
    this.stageId = data.stageId;
  }

  create() {
    // Background
    this.add.rectangle(512, 288, 1024, 576, 0x1a1a2e);

    // Battle arena divider
    this.add.line(512, 288, 0, -200, 0, 200, 0x333333);

    // Title
    this.add.text(512, 50, `Stage ${this.stageId} - 전투`, {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Player side (left)
    this.createPlayerUnits();

    // Enemy side (right)
    this.createEnemyUnits();

    // Turn indicator
    this.add.text(512, 100, '턴 1 - 행동을 선택하세요', {
      fontSize: '16px',
      color: '#ffcc00',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.rectangle(100, 50, 120, 40, 0x333333)
      .setInteractive()
      .on('pointerover', () => backBtn.setFillStyle(0x555555))
      .on('pointerout', () => backBtn.setFillStyle(0x333333))
      .on('pointerdown', () => this.endBattle());

    this.add.text(100, 50, '마을로 돌아가기', {
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  private createPlayerUnits() {
    // Character
    const charCircle = this.add.circle(200, 300, 30, 0x4488ff);
    this.add.text(200, 260, '캐릭터', {
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // HP bar
    this.add.rectangle(200, 340, 60, 8, 0x333333);
    this.add.rectangle(200, 340, 60, 8, 0xff4444);

    // Pets (3 slots)
    const petPositions = [
      { x: 300, y: 200 },
      { x: 300, y: 300 },
      { x: 300, y: 400 },
    ];

    petPositions.forEach((pos, index) => {
      const petCircle = this.add.circle(pos.x, pos.y, 25, 0x44ff88);
      this.add.text(pos.x, pos.y - 35, `펫 ${index + 1}`, {
        fontSize: '10px',
        color: '#ffffff',
      }).setOrigin(0.5);

      // HP bar
      this.add.rectangle(pos.x, pos.y + 35, 50, 6, 0x333333);
      this.add.rectangle(pos.x, pos.y + 35, 50, 6, 0xff4444);
    });
  }

  private createEnemyUnits() {
    // Enemies
    const enemyPositions = [
      { x: 700, y: 200 },
      { x: 700, y: 300 },
      { x: 700, y: 400 },
    ];

    enemyPositions.forEach((pos, index) => {
      const enemyCircle = this.add.circle(pos.x, pos.y, 25, 0xff4488)
        .setInteractive()
        .on('pointerover', () => enemyCircle.setStrokeStyle(3, 0xffff00))
        .on('pointerout', () => enemyCircle.setStrokeStyle(0))
        .on('pointerdown', () => this.selectTarget(index));

      this.add.text(pos.x, pos.y - 35, `적 ${index + 1}`, {
        fontSize: '10px',
        color: '#ffffff',
      }).setOrigin(0.5);

      // HP bar
      this.add.rectangle(pos.x, pos.y + 35, 50, 6, 0x333333);
      this.add.rectangle(pos.x, pos.y + 35, 50, 6, 0xff4444);
    });
  }

  private selectTarget(enemyIndex: number) {
    console.log(`Selected enemy ${enemyIndex}`);
    // TODO: Process attack on selected target
  }

  private endBattle() {
    this.scene.start('MainScene');
  }
}
