import Phaser from 'phaser';
import { useBattleStore, type BattleUnit } from '../../stores/battleStore';

interface BattleSceneData {
  stageId: number;
  battleId: string;
  units: BattleUnit[];
  turnOrder: string[];
}

interface UnitSprite {
  container: Phaser.GameObjects.Container;
  circle: Phaser.GameObjects.Ellipse;
  nameText: Phaser.GameObjects.Text;
  hpBarBg: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
  mpBar?: Phaser.GameObjects.Rectangle;
  statusIcons: Phaser.GameObjects.Text;
}

export class BattleScene extends Phaser.Scene {
  private stageId: number = 0;
  private unitSprites: Map<string, UnitSprite> = new Map();
  private turnIndicator!: Phaser.GameObjects.Text;

  // Unit positions
  private allyPositions = [
    { x: 200, y: 250 }, // Character
    { x: 150, y: 350 }, // Pet 1
    { x: 250, y: 350 }, // Pet 2
    { x: 200, y: 430 }, // Pet 3
  ];

  private enemyPositions = [
    { x: 750, y: 180 },
    { x: 700, y: 280 },
    { x: 800, y: 280 },
    { x: 650, y: 380 },
    { x: 750, y: 380 },
    { x: 850, y: 380 },
  ];

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleSceneData) {
    this.stageId = data.stageId;

    // Initialize battle store if data provided
    if (data.battleId && data.units) {
      useBattleStore.getState().initBattle({
        battleId: data.battleId,
        stageId: data.stageId,
        units: data.units,
        turnOrder: data.turnOrder,
      });
    }
  }

  create() {
    this.unitSprites.clear();

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a3e, 0x1a1a3e, 0x0f0f1f, 0x0f0f1f);
    bg.fillRect(0, 0, 1024, 576);

    // Ground
    this.add.ellipse(512, 500, 800, 150, 0x2d4a2d, 0.5);

    // Stage name
    this.add.text(512, 20, `스테이지 ${this.stageId}`, {
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Turn indicator
    this.turnIndicator = this.add.text(512, 50, '', {
      fontSize: '16px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Create unit sprites from store
    const state = useBattleStore.getState();
    this.createUnitsFromStore(state);

    // Subscribe to store updates
    const unsubscribe = useBattleStore.subscribe((state, prevState) => {
      // Update turn indicator
      this.updateTurnIndicator(state.turnNumber);

      // Update unit sprites
      state.units.forEach((unit, unitId) => {
        const prevUnit = prevState.units.get(unitId);
        if (prevUnit && (prevUnit.hp !== unit.hp || prevUnit.isAlive !== unit.isAlive)) {
          this.updateUnitSprite(unitId, unit, prevUnit);
        }
      });

      // Handle battle end
      if (state.phase !== 'in_progress' && prevState.phase === 'in_progress') {
        this.onBattleEnd(state.phase);
      }
    });

    // Store unsubscribe function
    this.events.once('shutdown', unsubscribe);

    // Initial turn indicator update
    this.updateTurnIndicator(state.turnNumber);

    // Create back button (for testing)
    this.createBackButton();
  }

  private createUnitsFromStore(state: ReturnType<typeof useBattleStore.getState>) {
    let allyIndex = 0;
    let enemyIndex = 0;

    state.units.forEach((unit) => {
      if (unit.type === 'enemy') {
        const pos = this.enemyPositions[enemyIndex] || this.enemyPositions[0];
        this.createUnitSprite(unit, pos.x, pos.y, true);
        enemyIndex++;
      } else {
        const pos = this.allyPositions[allyIndex] || this.allyPositions[0];
        this.createUnitSprite(unit, pos.x, pos.y, false);
        allyIndex++;
      }
    });
  }

  private createUnitSprite(unit: BattleUnit, x: number, y: number, isEnemy: boolean): void {
    const container = this.add.container(x, y);

    // Unit circle
    const circleColor = isEnemy ? 0xff4488 : unit.type === 'pet' ? 0x44ff88 : 0x4488ff;
    const circle = this.add.ellipse(0, 0, 50, 50, circleColor);

    if (isEnemy && unit.isAlive) {
      circle.setInteractive({ useHandCursor: true });
      circle.on('pointerover', () => {
        circle.setStrokeStyle(3, 0xffff00);
      });
      circle.on('pointerout', () => {
        circle.setStrokeStyle(0);
      });
      circle.on('pointerdown', () => {
        this.onEnemyClicked(unit.id);
      });
    }

    // Name
    const nameText = this.add.text(0, -40, unit.name, {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Level badge
    this.add.text(25, -25, `Lv${unit.level}`, {
      fontSize: '10px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // HP bar background
    const hpBarBg = this.add.rectangle(0, 35, 60, 8, 0x333333);

    // HP bar
    const hpPercent = unit.hp / unit.maxHp;
    const hpColor = hpPercent > 0.5 ? 0x44ff44 : hpPercent > 0.25 ? 0xffff44 : 0xff4444;
    const hpBar = this.add.rectangle(-30 + 30 * hpPercent, 35, 60 * hpPercent, 8, hpColor);
    hpBar.setOrigin(0, 0.5);
    hpBar.x = -30;

    // MP bar (for allies)
    let mpBar: Phaser.GameObjects.Rectangle | undefined;
    if (!isEnemy) {
      this.add.rectangle(0, 45, 50, 5, 0x333333);
      const mpPercent = unit.mp / unit.maxMp;
      mpBar = this.add.rectangle(-25, 45, 50 * mpPercent, 5, 0x4488ff);
      mpBar.setOrigin(0, 0.5);
    }

    // Status effect icons
    const statusIcons = this.add.text(0, 55, '', {
      fontSize: '14px',
    }).setOrigin(0.5);

    // Capturable indicator
    if (unit.isCapturable && unit.level === 1) {
      this.add.text(0, -55, '포획가능', {
        fontSize: '10px',
        color: '#ffff00',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5);
    }

    // Rare color indicator
    if (unit.isRareColor) {
      this.add.text(25, -35, '★', {
        fontSize: '14px',
        color: '#ffdd00',
      });
    }

    // Add all to container
    container.add([circle, nameText, hpBarBg, hpBar]);
    if (mpBar) container.add(mpBar);
    container.add(statusIcons);

    // Store reference
    this.unitSprites.set(unit.id, {
      container,
      circle,
      nameText,
      hpBarBg,
      hpBar,
      mpBar,
      statusIcons,
    });

    // Apply initial alive/dead state
    if (!unit.isAlive) {
      container.setAlpha(0.4);
      circle.setFillStyle(0x555555);
    }
  }

  private updateUnitSprite(unitId: string, unit: BattleUnit, prevUnit: BattleUnit): void {
    const sprite = this.unitSprites.get(unitId);
    if (!sprite) return;

    // Show damage number
    if (prevUnit.hp > unit.hp) {
      const damage = prevUnit.hp - unit.hp;
      this.showDamageNumber(sprite.container.x, sprite.container.y - 50, damage);
    } else if (prevUnit.hp < unit.hp) {
      const healing = unit.hp - prevUnit.hp;
      this.showHealNumber(sprite.container.x, sprite.container.y - 50, healing);
    }

    // Update HP bar
    const hpPercent = Math.max(0, unit.hp / unit.maxHp);
    const hpColor = hpPercent > 0.5 ? 0x44ff44 : hpPercent > 0.25 ? 0xffff44 : 0xff4444;

    this.tweens.add({
      targets: sprite.hpBar,
      width: 60 * hpPercent,
      duration: 300,
      ease: 'Cubic.out',
      onUpdate: () => {
        sprite.hpBar.setFillStyle(hpColor);
      },
    });

    // Handle death
    if (!unit.isAlive && prevUnit.isAlive) {
      this.playDeathAnimation(sprite);
    }
  }

  private showDamageNumber(x: number, y: number, damage: number): void {
    const damageText = this.add.text(x, y, `-${damage}`, {
      fontSize: '24px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: damageText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.out',
      onComplete: () => damageText.destroy(),
    });
  }

  private showHealNumber(x: number, y: number, healing: number): void {
    const healText = this.add.text(x, y, `+${healing}`, {
      fontSize: '24px',
      color: '#44ff44',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: healText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.out',
      onComplete: () => healText.destroy(),
    });
  }

  private playDeathAnimation(sprite: UnitSprite): void {
    // Flash red
    this.tweens.add({
      targets: sprite.circle,
      fillColor: { from: 0xff0000, to: 0x555555 },
      duration: 300,
    });

    // Fade out
    this.tweens.add({
      targets: sprite.container,
      alpha: 0.4,
      duration: 500,
      ease: 'Cubic.out',
    });

    // Shake
    this.tweens.add({
      targets: sprite.container,
      x: sprite.container.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 5,
    });
  }

  private updateTurnIndicator(turnNumber: number): void {
    this.turnIndicator.setText(`턴 ${turnNumber}`);
  }

  private onEnemyClicked(enemyId: string): void {
    const state = useBattleStore.getState();

    // If waiting for target selection
    if (state.showTargetSelection && state.selectedAction) {
      state.selectTarget(enemyId);

      // Highlight selected enemy
      const sprite = this.unitSprites.get(enemyId);
      if (sprite) {
        this.tweens.add({
          targets: sprite.circle,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 100,
          yoyo: true,
        });
      }
    }
  }

  private onBattleEnd(result: string): void {
    // Play victory/defeat animation
    if (result === 'victory') {
      this.cameras.main.flash(500, 255, 255, 100);
    } else if (result === 'defeat') {
      this.cameras.main.shake(500, 0.02);
      this.cameras.main.fade(1000, 0, 0, 0);
    }
  }

  private createBackButton(): void {
    const backBtn = this.add.rectangle(80, 540, 140, 35, 0x333333, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => backBtn.setFillStyle(0x555555))
      .on('pointerout', () => backBtn.setFillStyle(0x333333))
      .on('pointerdown', () => this.exitBattle());

    this.add.text(80, 540, '🏠 마을로 돌아가기', {
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  private exitBattle(): void {
    useBattleStore.getState().reset();
    this.scene.start('MainScene');
  }

  update(): void {
    // Update status effect icons
    const state = useBattleStore.getState();
    state.units.forEach((unit, unitId) => {
      const sprite = this.unitSprites.get(unitId);
      if (!sprite) return;

      const statusText = unit.statusEffects
        .map(e => this.getStatusIcon(e.type))
        .join('');
      sprite.statusIcons.setText(statusText);
    });
  }

  private getStatusIcon(effectType: string): string {
    const icons: Record<string, string> = {
      poison: '☠',
      petrify: '🪨',
      confusion: '💫',
      freeze: '❄',
      paralysis: '⚡',
      blind: '👁',
      silence: '🔇',
      fear: '😨',
      burn: '🔥',
    };
    return icons[effectType] || '?';
  }
}
