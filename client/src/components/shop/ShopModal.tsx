import { useEffect, useState } from 'react';
import { useInventoryStore, Shop, ShopItem } from '../../stores/inventoryStore';
import { useGameStore } from '../../stores/gameStore';

interface ShopModalProps {
  shop: Shop;
  onClose: () => void;
}

export default function ShopModal({ shop, onClose }: ShopModalProps) {
  const { shopItems, fetchShopItems, buyItem, isLoading, error, clearError } = useInventoryStore();
  const character = useGameStore((state) => state.character);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchShopItems(shop.id);
  }, [shop.id, fetchShopItems]);

  const handleBuy = async () => {
    if (!selectedItem) return;

    try {
      await buyItem(shop.id, selectedItem.item_template_id, quantity);
      setMessage(`${selectedItem.item_templates.name} x${quantity} 구매 완료!`);
      setSelectedItem(null);
      setQuantity(1);
      setTimeout(() => setMessage(null), 2000);
    } catch {
      // Error is handled by store
    }
  };

  const calculatePrice = (item: ShopItem, qty: number) => {
    const basePrice = item.item_templates.buy_price;
    const discountedPrice = Math.floor(basePrice * (100 - item.discount_percent) / 100);
    return discountedPrice * qty;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-300';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'accessory': return '💍';
      case 'consumable': return '🧪';
      case 'capture_item': return '🪤';
      case 'material': return '📦';
      default: return '📦';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg w-[800px] max-h-[600px] overflow-hidden border border-slate-600">
        {/* Header */}
        <div className="bg-slate-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{shop.name}</h2>
            <p className="text-sm text-slate-400">{shop.npc_name}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-yellow-400 font-bold">
              💰 {character?.gold?.toLocaleString() || 0} G
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[450px]">
          {/* Item List */}
          <div className="flex-1 p-4 overflow-y-auto border-r border-slate-600">
            <h3 className="text-slate-400 text-sm mb-3">판매 아이템</h3>
            {isLoading ? (
              <div className="text-center text-slate-400 py-8">로딩 중...</div>
            ) : (
              <div className="space-y-2">
                {shopItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setQuantity(1);
                      clearError();
                    }}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedItem?.id === item.id
                        ? 'bg-blue-600/30 border border-blue-500'
                        : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(item.item_templates.type)}</span>
                      <div className="flex-1">
                        <div className={`font-medium ${getRarityColor(item.item_templates.rarity)}`}>
                          {item.item_templates.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          Lv.{item.level_required} 이상
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-400 font-bold">
                          {item.discount_percent > 0 && (
                            <span className="text-red-400 line-through text-sm mr-2">
                              {item.item_templates.buy_price}
                            </span>
                          )}
                          {calculatePrice(item, 1)} G
                        </div>
                        {item.stock !== -1 && (
                          <div className="text-xs text-slate-400">
                            재고: {item.stock}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Item Detail */}
          <div className="w-[300px] p-4">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-5xl">{getTypeIcon(selectedItem.item_templates.type)}</span>
                  <h3 className={`text-lg font-bold mt-2 ${getRarityColor(selectedItem.item_templates.rarity)}`}>
                    {selectedItem.item_templates.name}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {selectedItem.item_templates.description}
                  </p>
                </div>

                {/* Stats */}
                {(selectedItem.item_templates.type === 'weapon' ||
                  selectedItem.item_templates.type === 'armor' ||
                  selectedItem.item_templates.type === 'accessory') && (
                  <div className="bg-slate-700/50 rounded p-3 text-sm">
                    <div className="text-slate-400 mb-2">스탯 보너스</div>
                    <div className="grid grid-cols-2 gap-1">
                      {selectedItem.item_templates.stat_str > 0 && (
                        <div>STR +{selectedItem.item_templates.stat_str}</div>
                      )}
                      {selectedItem.item_templates.stat_agi > 0 && (
                        <div>AGI +{selectedItem.item_templates.stat_agi}</div>
                      )}
                      {selectedItem.item_templates.stat_vit > 0 && (
                        <div>VIT +{selectedItem.item_templates.stat_vit}</div>
                      )}
                      {selectedItem.item_templates.stat_con > 0 && (
                        <div>CON +{selectedItem.item_templates.stat_con}</div>
                      )}
                      {selectedItem.item_templates.stat_int > 0 && (
                        <div>INT +{selectedItem.item_templates.stat_int}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Consumable effect */}
                {selectedItem.item_templates.type === 'consumable' && (
                  <div className="bg-slate-700/50 rounded p-3 text-sm">
                    <div className="text-slate-400 mb-2">효과</div>
                    <div className="text-green-400">
                      {selectedItem.item_templates.effect_type === 'heal_hp' && `HP +${selectedItem.item_templates.effect_value}`}
                      {selectedItem.item_templates.effect_type === 'heal_mp' && `MP +${selectedItem.item_templates.effect_value}`}
                    </div>
                  </div>
                )}

                {/* Capture bonus */}
                {selectedItem.item_templates.type === 'capture_item' && (
                  <div className="bg-slate-700/50 rounded p-3 text-sm">
                    <div className="text-slate-400 mb-2">포획 보너스</div>
                    <div className="text-green-400">
                      포획률 +{selectedItem.item_templates.capture_rate_bonus}%
                    </div>
                  </div>
                )}

                {/* Quantity */}
                {selectedItem.item_templates.stackable && (
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">수량:</span>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 bg-slate-600 rounded hover:bg-slate-500"
                    >
                      -
                    </button>
                    <span className="w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(
                        selectedItem.stock === -1 ? 99 : selectedItem.stock,
                        quantity + 1
                      ))}
                      className="w-8 h-8 bg-slate-600 rounded hover:bg-slate-500"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Price */}
                <div className="text-center">
                  <div className="text-sm text-slate-400">총 가격</div>
                  <div className="text-2xl text-yellow-400 font-bold">
                    {calculatePrice(selectedItem, quantity).toLocaleString()} G
                  </div>
                </div>

                {/* Error/Message */}
                {error && <div className="text-red-400 text-sm text-center">{error}</div>}
                {message && <div className="text-green-400 text-sm text-center">{message}</div>}

                {/* Buy button */}
                <button
                  onClick={handleBuy}
                  disabled={
                    isLoading ||
                    (character?.gold || 0) < calculatePrice(selectedItem, quantity)
                  }
                  className={`w-full py-3 rounded font-bold transition-colors ${
                    (character?.gold || 0) >= calculatePrice(selectedItem, quantity)
                      ? 'bg-green-600 hover:bg-green-500 text-white'
                      : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {(character?.gold || 0) < calculatePrice(selectedItem, quantity)
                    ? '골드 부족'
                    : '구매하기'}
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                아이템을 선택하세요
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
