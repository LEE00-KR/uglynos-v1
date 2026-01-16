import Phaser from 'phaser';
import { useGameStore } from '../../stores/gameStore';

export class MainScene extends Phaser.Scene {
  private characterSprite: Phaser.GameObjects.Container | null = null;
  private petSprites: Phaser.GameObjects.Container[] = [];
  private updateInterval: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Create placeholder graphics
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Character placeholder (larger circle)
    graphics.fillStyle(0x4488ff);
    graphics.fillCircle(40, 40, 35);
    graphics.generateTexture('character_sprite', 80, 80);
    graphics.clear();

    // Pet placeholder (smaller circle)
    graphics.fillStyle(0x44cc88);
    graphics.fillCircle(25, 25, 20);
    graphics.generateTexture('pet_sprite', 50, 50);
    graphics.clear();

    // Ground/platform
    graphics.fillGradientStyle(0x3a3a4e, 0x3a3a4e, 0x2a2a3e, 0x2a2a3e);
    graphics.fillRoundedRect(0, 0, 400, 30, 15);
    graphics.generateTexture('ground_platform', 400, 30);

    graphics.destroy();
  }

  create() {
    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a2a4e, 0x1a2a4e, 0x0f1a2f, 0x0f1a2f);
    bg.fillRect(0, 0, 1024, 576);

    // Add some ambient decorations (stars/particles)
    this.createAmbientEffects();

    // Create ground platform
    this.add.image(512, 400, 'ground_platform').setAlpha(0.7);

    // Create character and pets display
    this.createCharacterDisplay();

    // Update display periodically to sync with store
    this.updateInterval = this.time.addEvent({
      delay: 500,
      callback: this.updateDisplay,
      callbackScope: this,
      loop: true,
    });

    // Initial update
    this.updateDisplay();
  }

  private createAmbientEffects() {
    // Create floating particles/stars
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, 1024);
      const y = Phaser.Math.Between(0, 300);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 3), 0xffffff, Phaser.Math.FloatBetween(0.1, 0.5));

      // Twinkle animation
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: star.alpha * 0.3 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createCharacterDisplay() {
    // Character container will be created/updated in updateDisplay
    this.characterSprite = null;
    this.petSprites = [];
  }

  private updateDisplay() {
    const { character, pets } = useGameStore.getState();

    // Update or create character sprite
    if (character) {
      if (!this.characterSprite) {
        this.characterSprite = this.createCharacterContainer(character, 512, 320);
      } else {
        this.updateCharacterContainer(this.characterSprite, character);
      }
    }

    // Get pets in party (party_slot !== null)
    const partyPets = pets.filter(p => p.party_slot !== null).sort((a, b) => (a.party_slot || 0) - (b.party_slot || 0));

    // Update or create pet sprites
    const petPositions = [
      { x: 350, y: 350 },
      { x: 674, y: 350 },
      { x: 512, y: 420 },
    ];

    // Remove excess pet sprites
    while (this.petSprites.length > partyPets.length) {
      const sprite = this.petSprites.pop();
      sprite?.destroy();
    }

    // Update or create pet sprites
    partyPets.forEach((pet, index) => {
      if (index < petPositions.length) {
        if (this.petSprites[index]) {
          this.updatePetContainer(this.petSprites[index], pet);
        } else {
          const container = this.createPetContainer(pet, petPositions[index].x, petPositions[index].y);
          this.petSprites.push(container);
        }
      }
    });
  }

  private createCharacterContainer(character: { nickname: string; level: number; element_primary: string }, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Element color mapping
    const elementColors: { [key: string]: number } = {
      earth: 0x8b4513,
      wind: 0x90ee90,
      fire: 0xff4500,
      water: 0x1e90ff,
    };

    const color = elementColors[character.element_primary] || 0x4488ff;

    // Character body (circle)
    const body = this.add.circle(0, 0, 40, color);
    body.setStrokeStyle(3, 0xffffff);

    // Element icon
    const elementIcons: { [key: string]: string } = {
      earth: '🌍',
      wind: '🌪️',
      fire: '🔥',
      water: '💧',
    };
    const elementIcon = this.add.text(0, -5, elementIcons[character.element_primary] || '✨', {
      fontSize: '28px',
    }).setOrigin(0.5);

    // Name label
    const nameLabel = this.add.text(0, 55, character.nickname, {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Level badge
    const levelBg = this.add.circle(30, -30, 15, 0x000000, 0.7);
    const levelText = this.add.text(30, -30, `${character.level}`, {
      fontSize: '14px',
      color: '#ffcc00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([body, elementIcon, nameLabel, levelBg, levelText]);

    // Idle animation (gentle bounce)
    this.tweens.add({
      targets: container,
      y: y - 5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return container;
  }

  private updateCharacterContainer(container: Phaser.GameObjects.Container, character: { nickname: string; level: number }) {
    // Update level and name if needed
    const nameLabel = container.getAt(2) as Phaser.GameObjects.Text;
    const levelText = container.getAt(4) as Phaser.GameObjects.Text;

    if (nameLabel && nameLabel.text !== character.nickname) {
      nameLabel.setText(character.nickname);
    }
    if (levelText && levelText.text !== `${character.level}`) {
      levelText.setText(`${character.level}`);
    }
  }

  private createPetContainer(pet: { nickname: string | null; level: number; template: { name: string; element_primary: string } }, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Element color mapping
    const elementColors: { [key: string]: number } = {
      earth: 0x8b4513,
      wind: 0x90ee90,
      fire: 0xff4500,
      water: 0x1e90ff,
    };

    const color = elementColors[pet.template.element_primary] || 0x44cc88;

    // Pet body (smaller circle)
    const body = this.add.circle(0, 0, 28, color);
    body.setStrokeStyle(2, 0xffffff);

    // Element icon (smaller)
    const elementIcons: { [key: string]: string } = {
      earth: '🌍',
      wind: '🌪️',
      fire: '🔥',
      water: '💧',
    };
    const elementIcon = this.add.text(0, -3, elementIcons[pet.template.element_primary] || '🐾', {
      fontSize: '20px',
    }).setOrigin(0.5);

    // Name label
    const displayName = pet.nickname || pet.template.name;
    const nameLabel = this.add.text(0, 42, displayName, {
      fontSize: '12px',
      color: '#aaffaa',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Level badge
    const levelBg = this.add.circle(20, -20, 12, 0x000000, 0.7);
    const levelText = this.add.text(20, -20, `${pet.level}`, {
      fontSize: '11px',
      color: '#88ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([body, elementIcon, nameLabel, levelBg, levelText]);

    // Idle animation (different timing for variety)
    this.tweens.add({
      targets: container,
      y: y - 4,
      duration: 1200 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return container;
  }

  private updatePetContainer(container: Phaser.GameObjects.Container, pet: { nickname: string | null; level: number; template: { name: string } }) {
    const nameLabel = container.getAt(2) as Phaser.GameObjects.Text;
    const levelText = container.getAt(4) as Phaser.GameObjects.Text;

    const displayName = pet.nickname || pet.template.name;
    if (nameLabel && nameLabel.text !== displayName) {
      nameLabel.setText(displayName);
    }
    if (levelText && levelText.text !== `${pet.level}`) {
      levelText.setText(`${pet.level}`);
    }
  }

  shutdown() {
    if (this.updateInterval) {
      this.updateInterval.destroy();
    }
  }
}
