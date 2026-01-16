import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import type { AdminShopItem, ShopCategory, ShopEffect } from '../../types/admin';
import { SHOP_CATEGORIES } from '../../types/admin';

const defaultShopItem: Omit<AdminShopItem, 'createdAt' | 'updatedAt'> = {
  id: '',
  name: '',
  category: 'consumable',
  price: 100,
  icon: '',
  description: '',
  effect: undefined,
  stackable: true,
  maxStack: 99,
  available: true,
};

const EFFECT_TYPES = [
  { value: 'heal', label: '회복', hasTarget: true, hasValue: true },
  { value: 'buff', label: '버프', hasTarget: true, hasValue: true, hasDuration: true },
  { value: 'equip', label: '장비', hasStats: true },
  { value: 'capture', label: '포획', hasValue: true },
  { value: 'none', label: '없음', hasTarget: false, hasValue: false },
];

const EFFECT_TARGETS = [
  { value: 'hp', label: 'HP' },
  { value: 'mp', label: 'MP' },
  { value: 'atk', label: '공격력' },
  { value: 'def', label: '방어력' },
  { value: 'spd', label: '순발력' },
];

export default function ShopManagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { shopItems, fetchShopItems, createShopItem, updateShopItem, deleteShopItem, loading } = useAdminStore();

  const [selectedItem, setSelectedItem] = useState<AdminShopItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<AdminShopItem, 'createdAt' | 'updatedAt'>>(defaultShopItem);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [effectType, setEffectType] = useState<string>('none');

  useEffect(() => {
    fetchShopItems();
  }, [fetchShopItems]);

  useEffect(() => {
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (action === 'create') {
      setIsEditing(true);
      setSelectedItem(null);
      setFormData(defaultShopItem);
      setEffectType('none');
    } else if (id) {
      const item = shopItems.find((i) => i.id === id);
      if (item) {
        setSelectedItem(item);
        setFormData(item);
        setEffectType(item.effect?.type || 'none');
      }
    }
  }, [searchParams, shopItems]);

  const handleSelectItem = (item: AdminShopItem) => {
    setSelectedItem(item);
    setFormData(item);
    setEffectType(item.effect?.type || 'none');
    setIsEditing(false);
    setSearchParams({ id: item.id });
  };

  const handleCreate = () => {
    setIsEditing(true);
    setSelectedItem(null);
    setFormData(defaultShopItem);
    setEffectType('none');
    setSearchParams({ action: 'create' });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (selectedItem) {
      setFormData(selectedItem);
      setEffectType(selectedItem.effect?.type || 'none');
    } else {
      setSearchParams({});
    }
  };

  const handleSave = async () => {
    try {
      const dataToSave = { ...formData };
      if (effectType === 'none') {
        dataToSave.effect = undefined;
      }

      if (selectedItem) {
        await updateShopItem(selectedItem.id, dataToSave);
      } else {
        const newId = await createShopItem(dataToSave);
        setSearchParams({ id: newId });
      }
      setIsEditing(false);
    } catch {
      // Error is handled in store
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm && selectedItem) {
      try {
        await deleteShopItem(selectedItem.id);
        setSelectedItem(null);
        setFormData(defaultShopItem);
        setSearchParams({});
        setDeleteConfirm(null);
      } catch {
        // Error is handled in store
      }
    }
  };

  const handleEffectTypeChange = (type: string) => {
    setEffectType(type);
    if (type === 'none') {
      setFormData({ ...formData, effect: undefined });
    } else {
      const newEffect: ShopEffect = { type };
      if (type === 'heal' || type === 'buff') {
        newEffect.target = 'hp';
        newEffect.value = 50;
      }
      if (type === 'buff') {
        newEffect.duration = 300;
      }
      if (type === 'capture') {
        newEffect.value = 10;
      }
      if (type === 'equip') {
        newEffect.stats = { atk: 0, def: 0, spd: 0 };
      }
      setFormData({ ...formData, effect: newEffect });
    }
  };

  const updateEffect = (updates: Partial<ShopEffect>) => {
    setFormData({
      ...formData,
      effect: { ...formData.effect!, ...updates },
    });
  };

  const getCategoryLabel = (category: ShopCategory) => {
    return SHOP_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  const filteredItems = (category: ShopCategory) => {
    return shopItems.filter((item) => item.category === category);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">상점 관리</h1>
          <p className="text-gray-400 mt-2">상품 등록 및 관리</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          + 새 상품 추가
        </button>
      </div>

      <div className="flex gap-8">
        {/* Shop Item List */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">상품 목록</h2>
              <p className="text-sm text-gray-400">{shopItems.length}개</p>
            </div>
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {loading && shopItems.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">로딩 중...</div>
              ) : shopItems.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">등록된 상품이 없습니다.</div>
              ) : (
                SHOP_CATEGORIES.map((category) => {
                  const items = filteredItems(category.value);
                  if (items.length === 0) return null;

                  return (
                    <div key={category.value}>
                      <div className="px-4 py-2 bg-gray-700/50 text-xs text-gray-400 font-medium">
                        {category.label} ({items.length})
                      </div>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          className={`w-full p-4 text-left border-b border-gray-700 last:border-b-0 transition-colors ${
                            selectedItem?.id === item.id
                              ? 'bg-primary-600/20 border-l-2 border-l-primary-400'
                              : 'hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon ? (
                              <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center text-lg">
                                🛒
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-white font-medium">{item.name}</p>
                              <p className="text-xs text-gray-400">
                                {item.price.toLocaleString()} stone
                                {!item.available && ' (판매 중지)'}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Shop Item Detail / Edit Form */}
        <div className="flex-1">
          {selectedItem || isEditing ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? (selectedItem ? '상품 수정' : '새 상품 등록') : '상품 상세'}
                </h2>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loading ? '저장 중...' : '저장'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(selectedItem?.id || null)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">ID</label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      disabled={!isEditing || !!selectedItem}
                      placeholder="item_001 (자동 생성)"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      placeholder="상품 이름"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">카테고리</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as ShopCategory })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                    >
                      {SHOP_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">가격 (stone)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">아이콘 URL</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    disabled={!isEditing}
                    placeholder="/items/potion_red.png"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={!isEditing}
                    placeholder="상품 설명"
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Effect */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">효과</label>
                  <div className="space-y-4 p-4 bg-gray-700 rounded-lg">
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">효과 타입</label>
                      <select
                        value={effectType}
                        onChange={(e) => handleEffectTypeChange(e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
                      >
                        {EFFECT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {effectType !== 'none' && formData.effect && (
                      <div className="grid grid-cols-2 gap-4">
                        {(effectType === 'heal' || effectType === 'buff') && (
                          <>
                            <div>
                              <label className="block text-xs text-gray-400 mb-2">대상</label>
                              <select
                                value={formData.effect.target || 'hp'}
                                onChange={(e) => updateEffect({ target: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
                              >
                                {EFFECT_TARGETS.map((target) => (
                                  <option key={target.value} value={target.value}>
                                    {target.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-2">수치</label>
                              <input
                                type="number"
                                value={formData.effect.value || 0}
                                onChange={(e) => updateEffect({ value: parseInt(e.target.value) || 0 })}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
                              />
                            </div>
                          </>
                        )}

                        {effectType === 'buff' && (
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">지속 시간 (초)</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.effect.duration || 0}
                              onChange={(e) => updateEffect({ duration: parseInt(e.target.value) || 0 })}
                              disabled={!isEditing}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
                            />
                          </div>
                        )}

                        {effectType === 'capture' && (
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">포획률 보정 (%)</label>
                            <input
                              type="number"
                              value={formData.effect.value || 0}
                              onChange={(e) => updateEffect({ value: parseInt(e.target.value) || 0 })}
                              disabled={!isEditing}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
                            />
                          </div>
                        )}

                        {effectType === 'equip' && (
                          <>
                            <div>
                              <label className="block text-xs text-gray-400 mb-2">공격력</label>
                              <input
                                type="number"
                                value={formData.effect.stats?.atk || 0}
                                onChange={(e) =>
                                  updateEffect({
                                    stats: { ...formData.effect!.stats, atk: parseInt(e.target.value) || 0 },
                                  })
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-2">방어력</label>
                              <input
                                type="number"
                                value={formData.effect.stats?.def || 0}
                                onChange={(e) =>
                                  updateEffect({
                                    stats: { ...formData.effect!.stats, def: parseInt(e.target.value) || 0 },
                                  })
                                }
                                disabled={!isEditing}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="stackable"
                      checked={formData.stackable}
                      onChange={(e) => setFormData({ ...formData, stackable: e.target.checked })}
                      disabled={!isEditing}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="stackable" className="text-sm text-gray-300">
                      중첩 가능
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">최대 중첩 수</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxStack}
                      onChange={(e) => setFormData({ ...formData, maxStack: parseInt(e.target.value) || 1 })}
                      disabled={!isEditing || !formData.stackable}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="available"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      disabled={!isEditing}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="available" className="text-sm text-gray-300">
                      판매 중
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">좌측 목록에서 상품을 선택하거나 새 상품을 추가하세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">삭제 확인</h3>
            <p className="text-gray-300 mb-6">이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
