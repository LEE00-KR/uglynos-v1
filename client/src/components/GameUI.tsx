import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import InventoryModal from './inventory/InventoryModal';
import ShopModal from './shop/ShopModal';
import { useInventoryStore, Shop } from '../stores/inventoryStore';
import { useEffect } from 'react';

export default function GameUI() {
  const character = useGameStore((state) => state.character);
  const isBattling = useGameStore((state) => state.isBattling);
  const { shops, fetchShops } = useInventoryStore();

  const [showInventory, setShowInventory] = useState(false);
  const [showShopList, setShowShopList] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  if (!character) return null;

  const handleOpenShop = (shop: Shop) => {
    setSelectedShop(shop);
    setShowShopList(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start pointer-events-auto">
        {/* Character Info */}
        <div className="bg-black/70 rounded-lg p-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold">{character.nickname}</span>
            <span className="text-gray-400">Lv.{character.level}</span>
          </div>
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <span className="text-red-400">HP</span>
              <div className="w-24 h-2 bg-gray-700 rounded">
                <div
                  className="h-full bg-red-500 rounded"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">MP</span>
              <div className="w-24 h-2 bg-gray-700 rounded">
                <div
                  className="h-full bg-blue-500 rounded"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
          <div className="mt-1 text-yellow-400">
            💰 {character.gold?.toLocaleString() || 0} G
          </div>
        </div>

        {/* Mini Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-black/70 rounded-lg px-3 py-1 text-sm hover:bg-black/90"
          >
            메뉴
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 bg-slate-800 rounded-lg shadow-lg border border-slate-600 overflow-hidden">
              <button
                onClick={() => { setShowInventory(true); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center gap-2"
              >
                🎒 인벤토리
              </button>
              <button
                onClick={() => { setShowShopList(true); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center gap-2"
              >
                🏪 상점
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center gap-2"
              >
                🐾 펫 관리
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center gap-2"
              >
                ⚔️ 장비
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Battle UI */}
      {isBattling && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
          <div className="flex justify-center gap-4">
            <button className="btn btn-primary">공격</button>
            <button className="btn btn-secondary">방어</button>
            <button className="btn btn-secondary">주술</button>
            <button className="btn btn-secondary">아이템</button>
            <button className="btn btn-secondary">포획</button>
            <button className="btn btn-secondary text-red-400">도망</button>
          </div>
        </div>
      )}

      {/* Shop List Modal */}
      {showShopList && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-slate-800 rounded-lg w-[400px] border border-slate-600">
            <div className="bg-slate-700 px-4 py-3 flex justify-between items-center rounded-t-lg">
              <h2 className="text-lg font-bold">상점 목록</h2>
              <button onClick={() => setShowShopList(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-4 space-y-2">
              {shops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => handleOpenShop(shop)}
                  className="w-full p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-left flex items-center gap-3"
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
              ))}
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
    </div>
  );
}
