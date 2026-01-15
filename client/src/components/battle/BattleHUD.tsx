import React from 'react';
import { useBattleStore, selectAllies, selectEnemies } from '../../stores/battleStore';
import type { BattleUnit } from '../../stores/battleStore';

// Status effect icons and colors
const statusConfig: Record<string, { icon: string; color: string; name: string }> = {
  poison: { icon: '☠', color: 'text-purple-400', name: '독' },
  petrify: { icon: '🪨', color: 'text-gray-400', name: '석화' },
  confusion: { icon: '💫', color: 'text-yellow-400', name: '혼란' },
  freeze: { icon: '❄', color: 'text-blue-300', name: '빙결' },
  paralysis: { icon: '⚡', color: 'text-yellow-300', name: '마비' },
  blind: { icon: '👁', color: 'text-gray-500', name: '암흑' },
  silence: { icon: '🔇', color: 'text-indigo-400', name: '침묵' },
  fear: { icon: '😨', color: 'text-red-300', name: '공포' },
  burn: { icon: '🔥', color: 'text-orange-400', name: '화상' },
};

// Element colors
const elementColors: Record<string, string> = {
  earth: 'bg-amber-700',
  wind: 'bg-green-500',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
};

interface UnitCardProps {
  unit: BattleUnit;
  isEnemy?: boolean;
  isCurrentTurn?: boolean;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, isEnemy = false, isCurrentTurn = false }) => {
  const hpPercent = (unit.hp / unit.maxHp) * 100;
  const mpPercent = (unit.mp / unit.maxMp) * 100;

  const hpColor = hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div
      className={`
        relative p-2 rounded-lg border-2 transition-all
        ${isEnemy ? 'bg-red-900/50 border-red-700' : 'bg-blue-900/50 border-blue-700'}
        ${isCurrentTurn ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black' : ''}
        ${!unit.isAlive ? 'opacity-50 grayscale' : ''}
      `}
    >
      {/* Name and Level */}
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-sm truncate max-w-[80px]">
          {unit.name}
          {unit.isRareColor && <span className="text-yellow-400 ml-1">★</span>}
        </span>
        <span className="text-xs text-gray-400">Lv.{unit.level}</span>
      </div>

      {/* Element indicator */}
      <div className="flex gap-1 mb-1">
        <span
          className={`w-3 h-3 rounded-full ${elementColors[unit.element.primary] || 'bg-gray-500'}`}
          title={unit.element.primary}
        />
        {unit.element.secondary && (
          <span
            className={`w-3 h-3 rounded-full ${elementColors[unit.element.secondary] || 'bg-gray-500'}`}
            title={unit.element.secondary}
          />
        )}
      </div>

      {/* HP Bar */}
      <div className="mb-1">
        <div className="flex justify-between text-xs mb-0.5">
          <span>HP</span>
          <span>{unit.hp}/{unit.maxHp}</span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
          <div
            className={`h-full ${hpColor} transition-all duration-300`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* MP Bar */}
      <div className="mb-1">
        <div className="flex justify-between text-xs mb-0.5">
          <span>MP</span>
          <span>{unit.mp}/{unit.maxMp}</span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
          <div
            className="h-full bg-blue-400 transition-all duration-300"
            style={{ width: `${mpPercent}%` }}
          />
        </div>
      </div>

      {/* Status Effects */}
      {unit.statusEffects.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-1">
          {unit.statusEffects.map((effect, idx) => {
            const config = statusConfig[effect.type] || { icon: '?', color: 'text-white', name: effect.type };
            return (
              <span
                key={idx}
                className={`text-sm ${config.color}`}
                title={`${config.name} (${effect.remainingTurns}턴)`}
              >
                {config.icon}
              </span>
            );
          })}
        </div>
      )}

      {/* Capture indicator */}
      {unit.isCapturable && unit.level === 1 && unit.isAlive && (
        <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1 rounded">
          포획가능
        </div>
      )}

      {/* Loyalty indicator for pets */}
      {unit.type === 'pet' && unit.loyalty !== undefined && (
        <div className="text-xs text-gray-400 mt-1">
          충성도: {unit.loyalty}
        </div>
      )}

      {/* Defending indicator */}
      {unit.isDefending && (
        <div className="absolute top-1 left-1 text-lg">🛡</div>
      )}
    </div>
  );
};

const BattleHUD: React.FC = () => {
  const { turnNumber, phase, actionMessages, turnOrder, currentTurnIndex, units } =
    useBattleStore();
  const allies = useBattleStore(selectAllies);
  const enemies = useBattleStore(selectEnemies);

  const currentUnitId = turnOrder[currentTurnIndex];

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Turn indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 px-6 py-2 rounded-full border border-yellow-500">
        <span className="text-yellow-400 font-bold">턴 {turnNumber}</span>
        {phase !== 'in_progress' && (
          <span className="ml-2 text-white">
            {phase === 'victory' && '승리!'}
            {phase === 'defeat' && '패배...'}
            {phase === 'fled' && '도주'}
          </span>
        )}
      </div>

      {/* Enemies (top) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-auto">
        {enemies.map(unit => (
          <UnitCard
            key={unit.id}
            unit={unit}
            isEnemy
            isCurrentTurn={unit.id === currentUnitId}
          />
        ))}
      </div>

      {/* Allies (bottom left) */}
      <div className="absolute bottom-24 left-4 flex flex-col gap-2 pointer-events-auto">
        {allies.map(unit => (
          <UnitCard
            key={unit.id}
            unit={unit}
            isCurrentTurn={unit.id === currentUnitId}
          />
        ))}
      </div>

      {/* Action messages (bottom right) */}
      <div className="absolute bottom-24 right-4 w-64 pointer-events-auto">
        <div className="bg-black/80 rounded-lg p-3 max-h-48 overflow-y-auto">
          <h3 className="text-yellow-400 font-bold mb-2 text-sm">전투 로그</h3>
          <div className="space-y-1">
            {actionMessages.slice(-8).map((msg, idx) => (
              <p key={idx} className="text-sm text-gray-200">{msg}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Turn order display */}
      <div className="absolute top-4 right-4 bg-black/80 rounded-lg p-2 pointer-events-auto">
        <h4 className="text-xs text-gray-400 mb-1">행동 순서</h4>
        <div className="flex gap-1">
          {turnOrder.slice(0, 8).map((unitId, idx) => {
            const unit = units.get(unitId);
            if (!unit || !unit.isAlive) return null;
            return (
              <div
                key={idx}
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${unit.type === 'enemy' ? 'bg-red-600' : 'bg-blue-600'}
                  ${idx === currentTurnIndex ? 'ring-2 ring-yellow-400' : ''}
                `}
                title={unit.name}
              >
                {unit.name.charAt(0)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BattleHUD;
