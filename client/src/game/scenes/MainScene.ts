import Phaser from 'phaser';
import { getSocket } from '../../services/socket';

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
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a2a3e, 0x1a2a3e, 0x0f1a2f, 0x0f1a2f);
    bg.fillRect(0, 0, 1024, 576);

    // Title
    this.add.text(512, 100, 'Prehistoric Life', {
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(512, 160, '원시 생활', {
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Village area
    this.createVillageArea();

    // Stage selection area
    this.createStageArea();

    // Info panel
    this.createInfoPanel();
  }

  private createVillageArea() {
    // Village section title
    this.add.text(200, 220, '마을', {
      fontSize: '20px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const villageButtons = [
      { label: '상점', icon: '🏪', action: 'shop' },
      { label: '대장간', icon: '⚒️', action: 'blacksmith' },
      { label: '펫 관리', icon: '🐾', action: 'pet' },
      { label: '장비', icon: '⚔️', action: 'equipment' },
    ];

    villageButtons.forEach((btn, index) => {
      const x = 100 + (index % 2) * 120;
      const y = 280 + Math.floor(index / 2) * 80;

      const button = this.add.rectangle(x, y, 100, 60, 0x2a3a4e, 0.9)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          button.setStrokeStyle(2, 0xffcc00);
          button.setFillStyle(0x3a4a5e);
        })
        .on('pointerout', () => {
          button.setStrokeStyle(0);
          button.setFillStyle(0x2a3a4e);
        })
        .on('pointerdown', () => this.showComingSoon(btn.label));

      this.add.text(x, y - 10, btn.icon, {
        fontSize: '24px',
      }).setOrigin(0.5);

      this.add.text(x, y + 20, btn.label, {
        fontSize: '12px',
        color: '#ffffff',
      }).setOrigin(0.5);
    });
  }

  private createStageArea() {
    // Stage section title
    this.add.text(650, 220, '스테이지 선택', {
      fontSize: '20px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Stage buttons
    const stages = [
      { id: 1, name: '숲의 입구', level: '1-3', unlocked: true },
      { id: 2, name: '깊은 숲', level: '4-7', unlocked: true },
      { id: 3, name: '동굴 입구', level: '8-12', unlocked: true },
      { id: 4, name: '수정 동굴', level: '13-18', unlocked: true },
      { id: 5, name: '용암 지대', level: '19-25', unlocked: true },
      { id: 6, name: '???', level: '???', unlocked: false },
    ];

    stages.forEach((stage, index) => {
      const x = 500 + (index % 3) * 150;
      const y = 300 + Math.floor(index / 3) * 100;

      const button = this.add.rectangle(x, y, 130, 70, stage.unlocked ? 0x2e4a3e : 0x333333, 0.9)
        .setInteractive({ useHandCursor: stage.unlocked })
        .on('pointerover', () => {
          if (stage.unlocked) {
            button.setStrokeStyle(2, 0x00ff88);
            button.setFillStyle(0x3e5a4e);
          }
        })
        .on('pointerout', () => {
          button.setStrokeStyle(0);
          button.setFillStyle(stage.unlocked ? 0x2e4a3e : 0x333333);
        })
        .on('pointerdown', () => {
          if (stage.unlocked) this.startBattle(stage.id);
        });

      this.add.text(x, y - 15, stage.name, {
        fontSize: '14px',
        color: stage.unlocked ? '#ffffff' : '#666666',
      }).setOrigin(0.5);

      this.add.text(x, y + 10, `Lv.${stage.level}`, {
        fontSize: '12px',
        color: stage.unlocked ? '#88ff88' : '#444444',
      }).setOrigin(0.5);

      if (!stage.unlocked) {
        this.add.text(x, y + 25, '🔒', {
          fontSize: '16px',
        }).setOrigin(0.5);
      }
    });
  }

  private createInfoPanel() {
    // Info panel at bottom
    const panel = this.add.rectangle(512, 540, 1000, 50, 0x1a1a2e, 0.9);
    panel.setStrokeStyle(1, 0x333333);

    this.add.text(30, 540, '💡 스테이지를 클릭하여 전투를 시작하세요. 레벨 1 몬스터는 포획할 수 있습니다!', {
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0, 0.5);
  }

  private showComingSoon(feature: string) {
    // Show a temporary message
    const msg = this.add.text(512, 288, `${feature} - 준비 중...`, {
      fontSize: '24px',
      color: '#ffcc00',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      y: 250,
      duration: 1500,
      onComplete: () => msg.destroy(),
    });
  }

  startBattle(stageId: number) {
    const socket = getSocket();

    if (socket) {
      // Show loading indicator
      const loading = this.add.text(512, 288, '전투 준비 중...', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5);

      // Request battle start via socket
      socket.emit('battle:start', { stageId });

      // The GamePage will handle the 'battle:started' event and switch to BattleScene
      // We'll remove the loading message after a timeout if not handled
      this.time.delayedCall(5000, () => {
        if (loading.active) {
          loading.destroy();
          const error = this.add.text(512, 288, '전투 시작 실패. 다시 시도해주세요.', {
            fontSize: '16px',
            color: '#ff4444',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 },
          }).setOrigin(0.5);

          this.tweens.add({
            targets: error,
            alpha: 0,
            duration: 2000,
            delay: 2000,
            onComplete: () => error.destroy(),
          });
        }
      });
    } else {
      // Fallback: start battle scene directly for testing
      this.scene.start('BattleScene', { stageId });
    }
  }
}
