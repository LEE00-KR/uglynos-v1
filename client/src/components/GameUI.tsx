import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import InventoryModal from './inventory/InventoryModal';
import ShopModal from './shop/ShopModal';
import StageSelectModal from './StageSelectModal';
import PetManageModal from './PetManageModal';
import { useInventoryStore, Shop } from '../stores/inventoryStore';

export default function GameUI() {
  const character = useGameStore((state) => state.character);
  const { shops, fetchShops } = useInventoryStore();

  const [showInventory, setShowInventory] = useState(false);
  const [showShopList, setShowShopList] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showStageSelect, setShowStageSelect] = useState(false);
  const [showPetManage, setShowPetManage] = useState(false);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  if (!character) return null;

  const handleOpenShop = (shop: Shop) => {
    setSelectedShop(shop);
    setShowShopList(false);
  };

  // Shortcut buttons configuration
  const shortcutButtons = [
    { id: 'inventory', label: '인벤토리', icon: '🎒', onClick: () => setShowInventory(true) },
    { id: 'shop', label: '상점', icon: '🏪', onClick: () => setShowShopList(true) },
    { id: 'pet', label: '펫 관리', icon: '🐾', onClick: () => setShowPetManage(true) },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD - Character Info */}
      <div className="absolute top-2 left-2 pointer-events-auto">
        <div className="bg-black/70 rounded-lg p-3 backdrop-blur-sm border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-white">{character.nickname}</span>
            <span className="text-yellow-400 text-sm">Lv.{character.level}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-red-400 text-xs w-6">HP</span>
              <div className="w-28 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 text-xs w-6">MP</span>
              <div className="w-28 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
          <div className="mt-2 text-yellow-400 text-sm">
            💰 {character.gold?.toLocaleString() || 0} G
          </div>
        </div>
      </div>

      {/* Bottom UI Bar */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-8 pb-4 px-4">
          <div className="max-w-4xl mx-auto flex items-end justify-between">
            {/* Left side - Shortcut buttons */}
            <div className="flex gap-2">
              {shortcutButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={btn.onClick}
                  className="group flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 transition-all hover:scale-105"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{btn.icon}</span>
                  <span className="text-xs text-slate-300 group-hover:text-white">{btn.label}</span>
                </button>
              ))}
            </div>

            {/* Right side - Adventure button */}
            <button
              onClick={() => setShowStageSelect(true)}
              className="relative group px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 border-2 border-emerald-400/50 shadow-lg hover:shadow-emerald-500/40 transition-all hover:scale-105"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/10" />
              <div className="relative flex items-center gap-3">
                <span className="text-3xl animate-bounce">⚔️</span>
                <div className="text-left">
                  <div className="text-lg font-bold text-white">모험하러 가기</div>
                  <div className="text-xs text-emerald-200">스테이지 선택</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Shop List Modal */}
      {showShopList && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-slate-800 rounded-lg w-[400px] border border-slate-600 shadow-xl">
            <div className="bg-slate-700 px-4 py-3 flex justify-between items-center rounded-t-lg">
              <h2 className="text-lg font-bold">상점 목록</h2>
              <button onClick={() => setShowShopList(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-4 space-y-2">
              {shops.length > 0 ? (
                shops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => handleOpenShop(shop)}
                    className="w-full p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-left flex items-center gap-3 transition-colors"
                  >
                    <span className="text-2xl">
                      {shop.shop_type === 'weapon' && '⚔️'}
                      {shop.shop_type === 'armor' && '🛡️'}
                      {shop.shop_type === 'potion' && '🧪'}
                      {shop.shop_type === 'general' && '🏪'}
                    </span>
                    <div>
                      <div className="font-medium">{shop.name}</div>
                      <div className="text-sm text-slate-400">{shop.npc_name}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center text-slate-400 py-4">
                  상점 정보를 불러오는 중...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventory && (
        <div className="pointer-events-auto">
          <InventoryModal onClose={() => setShowInventory(false)} />
        </div>
      )}

      {/* Shop Modal */}
      {selectedShop && (
        <div className="pointer-events-auto">
          <ShopModal shop={selectedShop} onClose={() => setSelectedShop(null)} />
        </div>
      )}

      {/* Stage Select Modal */}
      {showStageSelect && (
        <div className="pointer-events-auto">
          <StageSelectModal onClose={() => setShowStageSelect(false)} />
        </div>
      )}

      {/* Pet Manage Modal */}
      {showPetManage && (
        <div className="pointer-events-auto">
          <PetManageModal onClose={() => setShowPetManage(false)} />
        </div>
      )}
    </div>
  );
}
