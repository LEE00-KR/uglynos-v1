import { useEffect, useState } from 'react';
import { useInventoryStore, InventoryItem } from '../../stores/inventoryStore';

interface InventoryModalProps {
  onClose: () => void;
}

type TabType = 'all' | 'equipment' | 'consumable' | 'material';

export default function InventoryModal({ onClose }: InventoryModalProps) {
  const {
    items,
    equippedItems,
    fetchInventory,
    fetchEquipped,
    equipItem,
    unequipItem,
    consumeItem,
    sellItem,
    discardItem,
    isLoading,
    error,
    clearError,
  } = useInventoryStore();

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [message, setMessage] = useState<string | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);

  useEffect(() => {
    fetchInventory();
    fetchEquipped();
  }, [fetchInventory, fetchEquipped]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleEquip = async () => {
    if (!selectedItem) return;
    try {
      await equipItem(selectedItem.id);
      showMessage('아이템을 장착했습니다!');
      setSelectedItem(null);
    } catch {
      // Error handled by store
    }
  };

  const handleUnequip = async () => {
    if (!selectedItem) return;
    try {
      await unequipItem(selectedItem.id);
      showMessage('아이템을 해제했습니다!');
      setSelectedItem(null);
    } catch {
      // Error handled by store
    }
  };

  const handleUse = async () => {
    if (!selectedItem) return;
    try {
      const result = await consumeItem(selectedItem.id);
      showMessage(`${result.effect === 'heal_hp' ? 'HP' : 'MP'} +${result.value} 회복!`);
      setSelectedItem(null);
    } catch {
      // Error handled by store
    }
  };

  const handleSell = async () => {
    if (!selectedItem) return;
    try {
      const gold = await sellItem(selectedItem.id, sellQuantity);
      showMessage(`${gold.toLocaleString()} G 획득!`);
      setSelectedItem(null);
      setSellQuantity(1);
    } catch {
      // Error handled by store
    }
  };

  const handleDiscard = async () => {
    if (!selectedItem) return;
    if (!confirm('정말 버리시겠습니까?')) return;
    try {
      await discardItem(selectedItem.id, 1);
      showMessage('아이템을 버렸습니다');
      setSelectedItem(null);
    } catch {
      // Error handled by store
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'equipment') {
      return ['weapon', 'armor', 'accessory'].includes(item.item_templates.type);
    }
    if (activeTab === 'consumable') {
      return ['consumable', 'capture_item'].includes(item.item_templates.type);
    }
    if (activeTab === 'material') {
      return item.item_templates.type === 'material';
    }
    return true;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500';
      case 'uncommon': return 'border-green-500';
      case 'rare': return 'border-blue-500';
      case 'epic': return 'border-purple-500';
      case 'legendary': return 'border-yellow-500';
      default: return 'border-gray-500';
    }
  };

  const getRarityTextColor = (rarity: string) => {
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

  const getSlotName = (slot: string) => {
    const slots: Record<string, string> = {
      weapon: '무기',
      helmet: '투구',
      chest: '갑옷',
      pants: '하의',
      boots: '신발',
      accessory1: '악세서리 1',
      accessory2: '악세서리 2',
    };
    return slots[slot] || slot;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg w-[900px] max-h-[650px] overflow-hidden border border-slate-600">
        {/* Header */}
        <div className="bg-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">인벤토리</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[550px]">
          {/* Equipment Slots */}
          <div className="w-[200px] p-4 border-r border-slate-600">
            <h3 className="text-slate-400 text-sm mb-3">장착 장비</h3>
            <div className="space-y-2">
              {['weapon', 'helmet', 'chest', 'accessory1', 'accessory2'].map((slot) => {
                const equipped = equippedItems.find((item) => item.equipped_slot === slot);
                return (
                  <div
                    key={slot}
                    onClick={() => equipped && setSelectedItem(equipped)}
                    className={`p-2 rounded border ${
                      equipped
                        ? `${getRarityColor(equipped.item_templates.rarity)} bg-slate-700/50 cursor-pointer`
                        : 'border-slate-600 bg-slate-700/30'
                    }`}
                  >
                    <div className="text-xs text-slate-400 mb-1">{getSlotName(slot)}</div>
                    {equipped ? (
                      <div className={`text-sm ${getRarityTextColor(equipped.item_templates.rarity)}`}>
                        {getTypeIcon(equipped.item_templates.type)} {equipped.item_templates.name}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">비어있음</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="flex-1 p-4 border-r border-slate-600 flex flex-col">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { key: 'all', label: '전체' },
                { key: 'equipment', label: '장비' },
                { key: 'consumable', label: '소모품' },
                { key: 'material', label: '재료' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabType)}
                  className={`px-3 py-1 rounded text-sm ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Item Grid */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="text-center text-slate-400 py-8">로딩 중...</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center text-slate-400 py-8">아이템이 없습니다</div>
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setSellQuantity(1);
                        clearError();
                      }}
                      className={`relative w-16 h-16 rounded border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        getRarityColor(item.item_templates.rarity)
                      } ${
                        selectedItem?.id === item.id
                          ? 'ring-2 ring-white scale-105'
                          : 'hover:scale-105'
                      } ${item.is_equipped ? 'bg-green-900/30' : 'bg-slate-700/50'}`}
                    >
                      <span className="text-2xl">{getTypeIcon(item.item_templates.type)}</span>
                      {item.quantity > 1 && (
                        <span className="absolute bottom-0 right-1 text-xs bg-black/70 px-1 rounded">
                          {item.quantity}
                        </span>
                      )}
                      {item.is_equipped && (
                        <span className="absolute top-0 left-0 text-xs">E</span>
                      )}
                      {item.enhancement_level > 0 && (
                        <span className="absolute top-0 right-0 text-xs text-yellow-400">
                          +{item.enhancement_level}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Item Detail */}
          <div className="w-[250px] p-4">
            {selectedItem ? (
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-4xl">{getTypeIcon(selectedItem.item_templates.type)}</span>
                  <h3 className={`font-bold mt-2 ${getRarityTextColor(selectedItem.item_templates.rarity)}`}>
                    {selectedItem.item_templates.name}
                    {selectedItem.enhancement_level > 0 && (
                      <span className="text-yellow-400"> +{selectedItem.enhancement_level}</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedItem.item_templates.description}
                  </p>
                </div>

                {/* Stats - 4스탯 시스템: HP, ATK, DEF, SPD */}
                {['weapon', 'armor', 'accessory'].includes(selectedItem.item_templates.type) && (
                  <div className="bg-slate-700/50 rounded p-2 text-xs">
                    <div className="grid grid-cols-2 gap-1">
                      {(selectedItem.item_templates.stat_hp + selectedItem.bonus_stat_hp) > 0 && (
                        <div className="text-red-400">체력 +{selectedItem.item_templates.stat_hp + selectedItem.bonus_stat_hp}</div>
                      )}
                      {(selectedItem.item_templates.stat_atk + selectedItem.bonus_stat_atk) > 0 && (
                        <div className="text-orange-400">공격력 +{selectedItem.item_templates.stat_atk + selectedItem.bonus_stat_atk}</div>
                      )}
                      {(selectedItem.item_templates.stat_def + selectedItem.bonus_stat_def) > 0 && (
                        <div className="text-blue-400">방어력 +{selectedItem.item_templates.stat_def + selectedItem.bonus_stat_def}</div>
                      )}
                      {(selectedItem.item_templates.stat_spd + selectedItem.bonus_stat_spd) > 0 && (
                        <div className="text-green-400">순발력 +{selectedItem.item_templates.stat_spd + selectedItem.bonus_stat_spd}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Consumable effect */}
                {selectedItem.item_templates.type === 'consumable' && (
                  <div className="bg-slate-700/50 rounded p-2 text-xs text-green-400">
                    {selectedItem.item_templates.effect_type === 'heal_hp' && `HP +${selectedItem.item_templates.effect_value}`}
                    {selectedItem.item_templates.effect_type === 'heal_mp' && `MP +${selectedItem.item_templates.effect_value}`}
                  </div>
                )}

                {/* Capture bonus */}
                {selectedItem.item_templates.type === 'capture_item' && (
                  <div className="bg-slate-700/50 rounded p-2 text-xs text-green-400">
                    포획률 +{selectedItem.item_templates.capture_rate_bonus}%
                  </div>
                )}

                {/* Sell price */}
                <div className="text-center text-sm">
                  <span className="text-slate-400">판매가: </span>
                  <span className="text-yellow-400">{selectedItem.item_templates.sell_price} G</span>
                </div>

                {/* Error/Message */}
                {error && <div className="text-red-400 text-xs text-center">{error}</div>}
                {message && <div className="text-green-400 text-xs text-center">{message}</div>}

                {/* Action buttons */}
                <div className="space-y-2">
                  {/* Equip/Unequip */}
                  {['weapon', 'armor', 'accessory'].includes(selectedItem.item_templates.type) && (
                    selectedItem.is_equipped ? (
                      <button
                        onClick={handleUnequip}
                        disabled={isLoading}
                        className="w-full py-2 rounded bg-orange-600 hover:bg-orange-500 text-white text-sm"
                      >
                        해제하기
                      </button>
                    ) : (
                      <button
                        onClick={handleEquip}
                        disabled={isLoading}
                        className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm"
                      >
                        장착하기
                      </button>
                    )
                  )}

                  {/* Use */}
                  {selectedItem.item_templates.type === 'consumable' && (
                    <button
                      onClick={handleUse}
                      disabled={isLoading}
                      className="w-full py-2 rounded bg-green-600 hover:bg-green-500 text-white text-sm"
                    >
                      사용하기
                    </button>
                  )}

                  {/* Sell */}
                  {!selectedItem.is_equipped && (
                    <div className="flex gap-2">
                      {selectedItem.quantity > 1 && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))}
                            className="w-6 h-6 bg-slate-600 rounded text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-sm">{sellQuantity}</span>
                          <button
                            onClick={() => setSellQuantity(Math.min(selectedItem.quantity, sellQuantity + 1))}
                            className="w-6 h-6 bg-slate-600 rounded text-xs"
                          >
                            +
                          </button>
                        </div>
                      )}
                      <button
                        onClick={handleSell}
                        disabled={isLoading}
                        className="flex-1 py-2 rounded bg-yellow-600 hover:bg-yellow-500 text-white text-sm"
                      >
                        판매 ({(selectedItem.item_templates.sell_price * sellQuantity).toLocaleString()}G)
                      </button>
                    </div>
                  )}

                  {/* Discard */}
                  {!selectedItem.is_equipped && (
                    <button
                      onClick={handleDiscard}
                      disabled={isLoading}
                      className="w-full py-2 rounded bg-red-800 hover:bg-red-700 text-white text-sm"
                    >
                      버리기
                    </button>
                  )}
                </div>
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
