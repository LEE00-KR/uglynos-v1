import React, { useState, useEffect } from 'react';
import { useBattleStore, selectAllies, selectEnemies } from '../../stores/battleStore';
import { useGameStore } from '../../stores/gameStore';
import { petApi } from '../../services/api';
import type { BattleUnit } from '../../stores/battleStore';

const MAX_PET_SLOTS = 20; // 최대 펫 슬롯 수

interface StandbyPet {
  id: string;
  nickname: string | null;
  level: number;
  standby_slot: number;
  pet_templates: {
    name: string;
    element_primary: string;
  };
}

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
  showX?: boolean; // X 표시 여부
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  highlight = false,
  showX = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex flex-col items-center justify-center relative
      w-16 h-16 rounded-lg border-2 transition-all
      ${disabled
        ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
        : highlight
          ? 'bg-yellow-600 border-yellow-400 hover:bg-yellow-500'
          : 'bg-gray-800 border-gray-500 hover:bg-gray-700 hover:border-gray-400'
      }
    `}
  >
    {showX && (
      <span className="absolute top-0 right-0 text-red-500 text-lg font-bold -mt-1 -mr-1">✕</span>
    )}
    <span className="text-2xl">{icon}</span>
    <span className="text-xs mt-1">{label}</span>
  </button>
);

interface TargetListProps {
  targets: BattleUnit[];
  onSelect: (id: string) => void;
  title: string;
}

const TargetList: React.FC<TargetListProps> = ({ targets, onSelect, title }) => (
  <div className="bg-black/90 rounded-lg p-3 min-w-[200px]">
    <h3 className="text-yellow-400 font-bold mb-2">{title}</h3>
    <div className="space-y-2">
      {targets.map(unit => (
        <button
          key={unit.id}
          onClick={() => onSelect(unit.id)}
          disabled={!unit.isAlive}
          className={`
            w-full p-2 rounded text-left transition-all
            ${unit.isAlive
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <div className="flex justify-between">
            <span>{unit.name}</span>
            <span className="text-sm text-gray-400">Lv.{unit.level}</span>
          </div>
          <div className="text-xs text-gray-400">
            HP: {unit.hp}/{unit.maxHp}
            {unit.isCapturable && unit.level === 1 && (
              <span className="ml-2 text-yellow-400">포획가능</span>
            )}
          </div>
        </button>
      ))}
    </div>
  </div>
);

const BattleActionMenu: React.FC = () => {
  const {
    phase,
    isSubmitting,
    showTargetSelection,
    showSkillMenu,
    showItemMenu,
    selectedAction,
    pendingActions,
    selectAction,
    selectTarget,
    cancelAction,
    submitActions,
    toggleSkillMenu,
    toggleItemMenu,
  } = useBattleStore();

  const allies = useBattleStore(selectAllies);
  const enemies = useBattleStore(selectEnemies);

  // Pet swap state
  const [showPetSwapMenu, setShowPetSwapMenu] = useState(false);
  const [standbyPets, setStandbyPets] = useState<StandbyPet[]>([]);
  const [selectedBattlePet, setSelectedBattlePet] = useState<BattleUnit | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // Fetch standby pets when menu opens
  useEffect(() => {
    if (showPetSwapMenu) {
      petApi.getStandby().then(res => {
        setStandbyPets(res.data.data || []);
      }).catch(err => {
        console.error('Failed to fetch standby pets:', err);
      });
    }
  }, [showPetSwapMenu]);

  // Get player character (first ally that is a character)
  const playerCharacter = allies.find(u => u.type === 'character');
  const playerPets = allies.filter(u => u.type === 'pet');

  if (phase !== 'in_progress') {
    return null;
  }

  const hasPlayerAction = playerCharacter && pendingActions.has(playerCharacter.id);
  const allActionsReady = playerCharacter && pendingActions.has(playerCharacter.id) &&
    playerPets.every(pet => pendingActions.has(pet.id));

  // Handle action selection
  const handleAttack = () => {
    if (!playerCharacter) return;
    selectAction({ actorId: playerCharacter.id, type: 'attack' });
  };

  const handleDefend = () => {
    if (!playerCharacter) return;
    selectAction({ actorId: playerCharacter.id, type: 'defend' });
    // Defend doesn't need target, auto-select self
    selectTarget(playerCharacter.id);
  };

  const handleCapture = () => {
    if (!playerCharacter) return;
    selectAction({ actorId: playerCharacter.id, type: 'capture' });
  };

  const handleFlee = () => {
    if (!playerCharacter) return;
    selectAction({ actorId: playerCharacter.id, type: 'flee' });
    selectTarget(playerCharacter.id);
  };

  // Handle pet action selection
  const handlePetAction = (pet: BattleUnit, actionType: 'attack' | 'defend') => {
    if (actionType === 'attack') {
      selectAction({ actorId: pet.id, type: 'attack' });
    } else {
      selectAction({ actorId: pet.id, type: actionType });
      selectTarget(pet.id);
    }
  };

  // Handle pet swap
  const handlePetSwap = async (standbyPet: StandbyPet) => {
    if (!selectedBattlePet || isSwapping) return;

    try {
      setIsSwapping(true);
      // TODO: Implement actual swap via socket.io
      // For now, show message
      console.log(`Swapping ${selectedBattlePet.name} with ${standbyPet.nickname || standbyPet.pet_templates.name}`);

      // Close menu after swap
      setShowPetSwapMenu(false);
      setSelectedBattlePet(null);
    } catch (error) {
      console.error('Failed to swap pets:', error);
    } finally {
      setIsSwapping(false);
    }
  };

  // Get swappable battle pets (not representative, not riding)
  const swappablePets = playerPets.filter(pet =>
    pet.isAlive && !pet.isRepresentative && !pet.isRiding
  );

  const hasStandbyPets = standbyPets.length > 0;
  const canSwap = swappablePets.length > 0 && hasStandbyPets;

  // Check if any enemy is capturable
  const hasCapturableTarget = enemies.some(e => e.isCapturable && e.level === 1 && e.isAlive);

  // Check if pet slots are full
  const myPets = useGameStore((state) => state.pets);
  const isPetSlotsFull = myPets.length >= MAX_PET_SLOTS;
  const canCapture = hasCapturableTarget && !isPetSlotsFull;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
      {/* Target Selection Modal */}
      {showTargetSelection && (
        <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2">
          <div className="flex gap-4">
            {/* Enemy targets for attack/capture */}
            {(selectedAction?.type === 'attack' || selectedAction?.type === 'capture') && (
              <TargetList
                targets={enemies.filter(e =>
                  selectedAction.type === 'capture'
                    ? e.isCapturable && e.level === 1
                    : true
                )}
                onSelect={selectTarget}
                title={selectedAction.type === 'capture' ? '포획 대상' : '공격 대상'}
              />
            )}
            {/* Ally targets for support skills */}
            {selectedAction?.type === 'magic' && (
              <TargetList
                targets={allies}
                onSelect={selectTarget}
                title="대상 선택"
              />
            )}
          </div>
          <button
            onClick={cancelAction}
            className="mt-2 w-full bg-gray-700 hover:bg-gray-600 py-2 rounded"
          >
            취소
          </button>
        </div>
      )}

      {/* Skill Menu */}
      {showSkillMenu && (
        <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-black/90 rounded-lg p-3">
          <h3 className="text-yellow-400 font-bold mb-2">마법</h3>
          <p className="text-gray-400 text-sm">구현 예정...</p>
          <button
            onClick={() => toggleSkillMenu(false)}
            className="mt-2 w-full bg-gray-700 hover:bg-gray-600 py-2 rounded"
          >
            닫기
          </button>
        </div>
      )}

      {/* Item Menu */}
      {showItemMenu && (
        <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-black/90 rounded-lg p-3">
          <h3 className="text-yellow-400 font-bold mb-2">아이템</h3>
          <p className="text-gray-400 text-sm">구현 예정...</p>
          <button
            onClick={() => toggleItemMenu(false)}
            className="mt-2 w-full bg-gray-700 hover:bg-gray-600 py-2 rounded"
          >
            닫기
          </button>
        </div>
      )}

      {/* Pet Swap Menu */}
      {showPetSwapMenu && (
        <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-black/90 rounded-lg p-4 min-w-[350px]">
          <h3 className="text-yellow-400 font-bold mb-3">펫 교체</h3>

          {/* Battle Pets (Swappable) */}
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">전투 펫 선택</p>
            <div className="flex gap-2 flex-wrap">
              {swappablePets.length > 0 ? (
                swappablePets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedBattlePet(pet)}
                    className={`px-3 py-2 rounded text-sm transition-all ${
                      selectedBattlePet?.id === pet.id
                        ? 'bg-blue-600 border-2 border-blue-400'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {pet.name} (Lv.{pet.level})
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-sm">교체 가능한 펫이 없습니다</p>
              )}
            </div>
            {playerPets.some(p => p.isRepresentative || p.isRiding) && (
              <p className="text-xs text-gray-500 mt-1">
                * 대표/탑승 펫은 교체할 수 없습니다
              </p>
            )}
          </div>

          {/* Standby Pets */}
          {selectedBattlePet && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">대기 펫 선택</p>
              <div className="flex gap-2 flex-wrap">
                {standbyPets.length > 0 ? (
                  standbyPets.map(pet => (
                    <button
                      key={pet.id}
                      onClick={() => handlePetSwap(pet)}
                      disabled={isSwapping}
                      className="px-3 py-2 rounded text-sm bg-green-700 hover:bg-green-600 transition-all disabled:opacity-50"
                    >
                      {pet.nickname || pet.pet_templates.name} (Lv.{pet.level})
                      <span className="ml-1 text-xs text-green-300">S{pet.standby_slot}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">대기 슬롯이 비어있습니다</p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setShowPetSwapMenu(false);
              setSelectedBattlePet(null);
            }}
            className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded"
          >
            닫기
          </button>
        </div>
      )}

      {/* Pet Actions */}
      {playerPets.length > 0 && !showTargetSelection && (
        <div className="mb-4 bg-black/80 rounded-lg p-3">
          <h4 className="text-sm text-yellow-400 mb-2">펫 명령</h4>
          <div className="flex gap-2">
            {playerPets.map(pet => (
              <div key={pet.id} className="bg-gray-800 rounded p-2">
                <div className="text-sm mb-1">{pet.name}</div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePetAction(pet, 'attack')}
                    disabled={pendingActions.has(pet.id) || !pet.isAlive}
                    className={`px-2 py-1 text-xs rounded ${
                      pendingActions.has(pet.id)
                        ? 'bg-green-700 text-green-200'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {pendingActions.has(pet.id) ? '준비완료' : '공격'}
                  </button>
                  {!pendingActions.has(pet.id) && pet.isAlive && (
                    <button
                      onClick={() => handlePetAction(pet, 'defend')}
                      className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600"
                    >
                      방어
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="bg-black/80 rounded-lg p-4">
        <div className="flex gap-2">
          <ActionButton
            icon="⚔"
            label="공격"
            onClick={handleAttack}
            disabled={hasPlayerAction || isSubmitting}
            highlight={!hasPlayerAction}
          />
          <ActionButton
            icon="🛡"
            label="방어"
            onClick={handleDefend}
            disabled={hasPlayerAction || isSubmitting}
          />
          <ActionButton
            icon="✨"
            label="마법"
            onClick={() => toggleSkillMenu(true)}
            disabled={hasPlayerAction || isSubmitting}
          />
          <ActionButton
            icon="🎒"
            label="아이템"
            onClick={() => toggleItemMenu(true)}
            disabled={hasPlayerAction || isSubmitting}
          />
          <ActionButton
            icon="🐾"
            label="펫"
            onClick={() => setShowPetSwapMenu(true)}
            disabled={hasPlayerAction || isSubmitting || !canSwap}
          />
          <ActionButton
            icon="🪤"
            label="포획"
            onClick={handleCapture}
            disabled={hasPlayerAction || isSubmitting || !canCapture}
            showX={isPetSlotsFull}
          />
          <ActionButton
            icon="🏃"
            label="도주"
            onClick={handleFlee}
            disabled={hasPlayerAction || isSubmitting}
          />
        </div>

        {/* Submit button */}
        {allActionsReady && (
          <button
            onClick={submitActions}
            disabled={isSubmitting}
            className={`
              w-full mt-3 py-3 rounded-lg font-bold text-lg transition-all
              ${isSubmitting
                ? 'bg-gray-700 text-gray-400'
                : 'bg-yellow-600 hover:bg-yellow-500 text-black'
              }
            `}
          >
            {isSubmitting ? '처리 중...' : '행동 실행!'}
          </button>
        )}

        {/* Status message */}
        {hasPlayerAction && !allActionsReady && (
          <p className="text-center text-yellow-400 mt-2 text-sm">
            펫의 행동을 선택해주세요
          </p>
        )}
      </div>
    </div>
  );
};

export default BattleActionMenu;
