import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { useGameStore } from '../stores/gameStore';
import { useBattleStore } from '../stores/battleStore';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { MainScene } from '../game/scenes/MainScene';
import { BattleScene } from '../game/scenes/BattleScene';
import GameUI from '../components/GameUI';
import BattleOverlay from '../components/battle/BattleOverlay';

export default function GamePage() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const character = useGameStore((state) => state.character);
  const [isInBattle, setIsInBattle] = useState(false);
  const battlePhase = useBattleStore((state) => state.phase);

  // Handle battle exit
  const handleExitBattle = useCallback(() => {
    setIsInBattle(false);
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('BattleScene');
      if (scene?.scene.isActive()) {
        gameRef.current.scene.switch('BattleScene', 'MainScene');
      }
    }
  }, []);

  useEffect(() => {
    // Connect socket
    const socket = connectSocket();

    // Setup battle store with socket
    if (socket) {
      useBattleStore.getState().setSocket(socket);

      // Listen for battle start events
      socket.on('battle:started', (data) => {
        setIsInBattle(true);

        // Initialize battle store
        useBattleStore.getState().initBattle({
          battleId: data.battleId,
          stageId: data.stageId,
          units: data.units,
          turnOrder: data.turnOrder,
        });

        // Switch to battle scene
        if (gameRef.current) {
          gameRef.current.scene.start('BattleScene', {
            stageId: data.stageId,
            battleId: data.battleId,
            units: data.units,
            turnOrder: data.turnOrder,
          });
        }
      });
    }

    // Initialize Phaser game
    if (containerRef.current && !gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: 1024,
        height: 576,
        backgroundColor: '#1a1a2e',
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [MainScene, BattleScene],
        physics: {
          default: 'arcade',
          arcade: {
            debug: false,
          },
        },
      };

      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      disconnectSocket();
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Track battle state
  useEffect(() => {
    if (battlePhase !== 'idle' && battlePhase !== 'loading') {
      setIsInBattle(true);
    }
  }, [battlePhase]);

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">캐릭터를 선택해주세요</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Game Header */}
      <header className="bg-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg">{character.nickname}</span>
            <span className="text-gray-400">Lv.{character.level}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-yellow-400">{character.gold.toLocaleString()} G</span>
            {isInBattle && (
              <span className="text-red-400 animate-pulse">전투 중</span>
            )}
          </div>
        </div>
      </header>

      {/* Game Container */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl">
          <div
            id="game-container"
            ref={containerRef}
            className="rounded-lg overflow-hidden shadow-2xl"
          />

          {/* Game UI Overlay (when not in battle) */}
          {!isInBattle && <GameUI />}

          {/* Battle UI Overlay (when in battle) */}
          {isInBattle && <BattleOverlay onExitBattle={handleExitBattle} />}
        </div>
      </main>
    </div>
  );
}
