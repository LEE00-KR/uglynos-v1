import React from 'react';
import { useBattleStore } from '../../stores/battleStore';

interface BattleResultModalProps {
  onClose: () => void;
}

const BattleResultModal: React.FC<BattleResultModalProps> = ({ onClose }) => {
  const { phase, rewards } = useBattleStore();

  if (phase !== 'victory' && phase !== 'defeat' && phase !== 'fled') {
    return null;
  }

  const isVictory = phase === 'victory';
  const isFled = phase === 'fled';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className={`
        bg-gray-900 rounded-xl border-4 p-8 min-w-[400px] max-w-[500px]
        ${isVictory ? 'border-yellow-500' : isFled ? 'border-gray-500' : 'border-red-500'}
      `}>
        {/* Result Header */}
        <div className="text-center mb-6">
          <h1 className={`text-4xl font-bold mb-2 ${
            isVictory ? 'text-yellow-400' : isFled ? 'text-gray-400' : 'text-red-400'
          }`}>
            {isVictory ? '⚔️ 승리!' : isFled ? '🏃 도주 성공' : '💀 패배...'}
          </h1>
          <p className="text-gray-400">
            {isVictory && '전투에서 승리했습니다!'}
            {isFled && '전투에서 도주했습니다.'}
            {phase === 'defeat' && '전투에서 패배했습니다...'}
          </p>
        </div>

        {/* Rewards (only on victory) */}
        {isVictory && rewards && (
          <div className="space-y-4">
            {/* Stars */}
            <div className="text-center">
              <div className="text-3xl mb-1">
                {Array(3).fill(0).map((_, i) => (
                  <span key={i} className={i < rewards.stars ? 'text-yellow-400' : 'text-gray-600'}>
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-400">{rewards.stars}성 클리어!</p>
            </div>

            {/* Gold */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-yellow-500">💰 골드</span>
                <span className="text-xl font-bold text-yellow-400">+{rewards.gold}</span>
              </div>
            </div>

            {/* EXP */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-blue-400 mb-2">📈 경험치</h3>
              <div className="space-y-1">
                {rewards.exp.map((exp, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-300">캐릭터 {idx + 1}</span>
                    <span className="text-blue-400">+{exp.exp} EXP</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Drops */}
            {rewards.drops.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-green-400 mb-2">🎁 획득 아이템</h3>
                <div className="space-y-1">
                  {rewards.drops.map((drop, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-300">
                        {drop.itemType === 'material' && '🪨'}
                        {drop.itemType === 'equipment' && '⚔️'}
                        {drop.itemType === 'consumable' && '🧪'}
                        {' '}아이템 #{drop.itemId}
                      </span>
                      <span className="text-green-400">x{drop.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Defeat message */}
        {phase === 'defeat' && (
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-300 mb-2">
              모든 아군이 쓰러졌습니다...
            </p>
            <p className="text-sm text-gray-500">
              마을로 돌아가 치료를 받으세요.
            </p>
          </div>
        )}

        {/* Fled message */}
        {isFled && (
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-300">
              무사히 도주했습니다.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              보상은 획득하지 못했습니다.
            </p>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className={`
            w-full mt-6 py-3 rounded-lg font-bold text-lg transition-all
            ${isVictory
              ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
            }
          `}
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default BattleResultModal;
