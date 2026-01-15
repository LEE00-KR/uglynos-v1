import React, { useEffect } from 'react';
import { useBattleStore } from '../../stores/battleStore';
import BattleHUD from './BattleHUD';
import BattleActionMenu from './BattleActionMenu';
import BattleResultModal from './BattleResultModal';

interface BattleOverlayProps {
  onExitBattle: () => void;
}

const BattleOverlay: React.FC<BattleOverlayProps> = ({ onExitBattle }) => {
  const { phase, battleId } = useBattleStore();

  // Don't render if no battle
  if (!battleId && phase === 'idle') {
    return null;
  }

  const handleResultClose = () => {
    useBattleStore.getState().reset();
    onExitBattle();
  };

  return (
    <div className="battle-overlay">
      {/* HUD - always visible during battle */}
      {phase !== 'idle' && <BattleHUD />}

      {/* Action Menu - only during battle */}
      {phase === 'in_progress' && <BattleActionMenu />}

      {/* Result Modal - after battle ends */}
      {(phase === 'victory' || phase === 'defeat' || phase === 'fled') && (
        <BattleResultModal onClose={handleResultClose} />
      )}
    </div>
  );
};

export default BattleOverlay;
