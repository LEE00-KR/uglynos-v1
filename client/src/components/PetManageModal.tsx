import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { petApi } from '../services/api';

interface PetManageModalProps {
  onClose: () => void;
}

interface PetDetail {
  id: string;
  nickname: string | null;
  level: number;
  exp: number;
  loyalty: number;
  party_slot: number | null;
  is_riding: boolean;
  is_rare_color: boolean;
  is_starter: boolean;
  in_storage: boolean;
  stat_str: number;
  stat_agi: number;
  stat_vit: number;
  stat_con: number;
  stat_int: number;
  current_hp: number;
  current_mp: number;
  template: {
    id: number;
    name: string;
    element_primary: string;
    element_secondary: string | null;
    can_ride: boolean;
    rarity: string;
  };
}

type TabType = 'active' | 'storage' | 'party';

const MAX_ACTIVE_PETS = 6;
const MAX_STORAGE_PETS = 20;

export default function PetManageModal({ onClose }: PetManageModalProps) {
  const { setPets } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [activePets, setActivePets] = useState<PetDetail[]>([]);
  const [storagePets, setStoragePets] = useState<PetDetail[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [petAction, setPetAction] = useState<string | null>(null);

  const fetchPets = useCallback(async () => {
    try {
      setIsLoading(true);
      const [activeRes, storageRes] = await Promise.all([
        petApi.getActive(),
        petApi.getStorage(),
      ]);
      setActivePets(activeRes.data.data || []);
      setStoragePets(storageRes.data.data || []);

      // Update game store with party pets
      const partyPets = (activeRes.data.data || []).filter((p: PetDetail) => p.party_slot !== null);
      setPets(partyPets);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setPets]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Get pets in party slots
  const partySlots = [1, 2, 3].map(slot => {
    return activePets.find(p => p.party_slot === slot) || null;
  });

  const handleSelectPet = (pet: PetDetail) => {
    setSelectedPet(pet);
    setIsEditingNickname(false);
  };

  const handlePetImageClick = () => {
    if (!selectedPet || petAction) return;

    // Trigger random action animation
    const actions = ['attack', 'defend', 'skill', 'jump'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    setPetAction(randomAction);

    // Return to idle after animation
    setTimeout(() => {
      setPetAction(null);
    }, 800);
  };

  const handleAddToParty = async (petId: string, slot: number) => {
    try {
      setActionLoading(true);
      await petApi.addToParty(petId, slot);
      await fetchPets();
      // Update selected pet
      const updated = activePets.find(p => p.id === petId);
      if (updated) setSelectedPet({ ...updated, party_slot: slot });
    } catch (error) {
      console.error('Failed to add pet to party:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFromParty = async (petId: string) => {
    try {
      setActionLoading(true);
      await petApi.removeFromParty(petId);
      await fetchPets();
      if (selectedPet?.id === petId) {
        setSelectedPet(prev => prev ? { ...prev, party_slot: null } : null);
      }
    } catch (error) {
      console.error('Failed to remove pet from party:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveToStorage = async (petId: string) => {
    try {
      setActionLoading(true);
      await petApi.moveToStorage(petId);
      await fetchPets();
      setSelectedPet(null);
      setActiveTab('storage');
    } catch (error) {
      console.error('Failed to move to storage:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveFromStorage = async (petId: string) => {
    try {
      setActionLoading(true);
      await petApi.moveFromStorage(petId);
      await fetchPets();
      setSelectedPet(null);
      setActiveTab('active');
    } catch (error) {
      console.error('Failed to move from storage:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetRiding = async (petId: string) => {
    try {
      setActionLoading(true);
      await petApi.setRiding(petId);
      await fetchPets();
    } catch (error) {
      console.error('Failed to set riding:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsetRiding = async (petId: string) => {
    try {
      setActionLoading(true);
      await petApi.unsetRiding(petId);
      await fetchPets();
    } catch (error) {
      console.error('Failed to unset riding:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateNickname = async () => {
    if (!selectedPet) return;
    const finalNickname = newNickname.trim() || selectedPet.template.name;
    try {
      setActionLoading(true);
      await petApi.updateNickname(selectedPet.id, finalNickname);
      await fetchPets();
      setIsEditingNickname(false);
      setSelectedPet(prev => prev ? { ...prev, nickname: finalNickname } : null);
    } catch (error) {
      console.error('Failed to update nickname:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleasePet = async (petId: string) => {
    const totalPets = activePets.length + storagePets.length;
    if (totalPets <= 1) {
      alert('최소 1마리의 펫은 보유해야 합니다.');
      return;
    }
    if (!confirm('정말로 이 펫을 방생하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      setActionLoading(true);
      await petApi.release(petId);
      await fetchPets();
      setSelectedPet(null);
    } catch (error) {
      console.error('Failed to release pet:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getElementIcon = (element: string) => {
    const icons: { [key: string]: string } = {
      earth: '🌍',
      wind: '🌪️',
      fire: '🔥',
      water: '💧',
    };
    return icons[element] || '✨';
  };

  const getElementColor = (element: string) => {
    const colors: { [key: string]: string } = {
      earth: 'from-amber-600 to-amber-400',
      wind: 'from-green-600 to-green-400',
      fire: 'from-red-600 to-orange-400',
      water: 'from-blue-600 to-cyan-400',
    };
    return colors[element] || 'from-gray-600 to-gray-400';
  };

  const getRarityColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      common: 'border-gray-500 text-gray-400',
      uncommon: 'border-green-500 text-green-400',
      rare: 'border-blue-500 text-blue-400',
      epic: 'border-purple-500 text-purple-400',
      legendary: 'border-yellow-500 text-yellow-400',
    };
    return colors[rarity] || 'border-gray-500 text-gray-400';
  };

  const getActionAnimation = () => {
    switch (petAction) {
      case 'attack': return 'animate-pulse scale-110 translate-x-4';
      case 'defend': return 'scale-90 opacity-80';
      case 'skill': return 'animate-spin';
      case 'jump': return '-translate-y-8';
      default: return '';
    }
  };

  const renderPetSlot = (pet: PetDetail | null, index: number, isSelected: boolean, onClick: () => void) => {
    if (!pet) {
      return (
        <div
          key={index}
          className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-600"
        >
          <span className="text-2xl">+</span>
        </div>
      );
    }

    return (
      <button
        key={pet.id}
        onClick={onClick}
        className={`w-16 h-16 rounded-lg border-2 transition-all relative overflow-hidden ${
          isSelected
            ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-105'
            : `${getRarityColor(pet.template.rarity)} hover:scale-105`
        }`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${getElementColor(pet.template.element_primary)} opacity-30`} />
        <div className="relative flex flex-col items-center justify-center h-full">
          <span className="text-2xl">{getElementIcon(pet.template.element_primary)}</span>
          <span className="text-[10px] text-white font-bold">Lv.{pet.level}</span>
        </div>
        {pet.party_slot && (
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] px-1 rounded-bl">
            P{pet.party_slot}
          </div>
        )}
        {pet.is_riding && (
          <div className="absolute bottom-0 left-0 text-[10px]">🏇</div>
        )}
        {pet.is_rare_color && (
          <div className="absolute top-0 left-0 text-yellow-400 text-[10px]">★</div>
        )}
      </button>
    );
  };

  const currentPets = activeTab === 'storage' ? storagePets : activePets;
  const maxPets = activeTab === 'storage' ? MAX_STORAGE_PETS : MAX_ACTIVE_PETS;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl w-[850px] max-h-[90vh] border border-slate-600 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">펫 관리</h2>
            <p className="text-sm text-slate-300">
              보유: {activePets.length}/{MAX_ACTIVE_PETS} | 창고: {storagePets.length}/{MAX_STORAGE_PETS}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl hover:bg-slate-600 rounded-lg w-10 h-10 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {[
            { id: 'active' as TabType, label: '보유 펫', icon: '🐾' },
            { id: 'storage' as TabType, label: '창고', icon: '📦' },
            { id: 'party' as TabType, label: '파티', icon: '⚔️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-700 text-white border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left - Pet Display & List */}
          <div className="flex-1 p-4 flex flex-col">
            {activeTab === 'party' ? (
              /* Party Management View */
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">파티 슬롯</h3>
                <div className="grid grid-cols-3 gap-4">
                  {partySlots.map((pet, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        pet
                          ? `bg-slate-700/50 ${getRarityColor(pet.template.rarity)}`
                          : 'bg-slate-800/50 border-dashed border-slate-600'
                      }`}
                    >
                      <div className="text-xs text-slate-400 mb-2">슬롯 {index + 1}</div>
                      {pet ? (
                        <div className="text-center">
                          <div className="text-4xl mb-2">{getElementIcon(pet.template.element_primary)}</div>
                          <div className="font-medium text-white truncate">
                            {pet.nickname || pet.template.name}
                          </div>
                          <div className="text-sm text-slate-400">Lv.{pet.level}</div>
                          <button
                            onClick={() => handleRemoveFromParty(pet.id)}
                            disabled={actionLoading}
                            className="mt-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs transition-colors disabled:opacity-50"
                          >
                            제외
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-slate-500 py-4">
                          <span className="text-2xl block mb-1">+</span>
                          <span className="text-sm">비어있음</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-400 mt-4">
                  💡 보유 펫 탭에서 펫을 선택한 후 파티에 추가할 수 있습니다.
                </p>
              </div>
            ) : (
              /* Active/Storage Pet View */
              <>
                {/* Large Pet Display */}
                <div
                  onClick={handlePetImageClick}
                  className={`flex-1 min-h-[200px] flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 mb-4 cursor-pointer transition-all duration-300 ${
                    selectedPet ? 'hover:border-slate-500' : ''
                  }`}
                >
                  {selectedPet ? (
                    <div className={`text-center transition-all duration-300 ${getActionAnimation()}`}>
                      <div className={`text-8xl mb-4 drop-shadow-lg`}>
                        {getElementIcon(selectedPet.template.element_primary)}
                      </div>
                      <div className={`text-xl font-bold ${getRarityColor(selectedPet.template.rarity)}`}>
                        {selectedPet.nickname || selectedPet.template.name}
                      </div>
                      <div className="text-slate-400">Lv.{selectedPet.level}</div>
                      {petAction && (
                        <div className="text-emerald-400 text-sm mt-2 animate-pulse">
                          {petAction === 'attack' && '공격!'}
                          {petAction === 'defend' && '방어!'}
                          {petAction === 'skill' && '스킬!'}
                          {petAction === 'jump' && '점프!'}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-2">(클릭하면 액션)</div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500">
                      <span className="text-6xl block mb-2">🐾</span>
                      <p>펫을 선택하세요</p>
                    </div>
                  )}
                </div>

                {/* Pet Grid */}
                <div>
                  <div className="text-sm text-slate-400 mb-2">
                    {activeTab === 'storage' ? '창고' : '보유 펫'} ({currentPets.length}/{maxPets})
                  </div>
                  {isLoading ? (
                    <div className="text-center text-slate-400 py-4">로딩 중...</div>
                  ) : currentPets.length === 0 ? (
                    <div className="text-center text-slate-500 py-4">
                      {activeTab === 'storage' ? '창고가 비어있습니다' : '보유한 펫이 없습니다'}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentPets.map((pet, index) =>
                        renderPetSlot(pet, index, selectedPet?.id === pet.id, () => handleSelectPet(pet))
                      )}
                      {/* Empty slots */}
                      {Array.from({ length: maxPets - currentPets.length }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center"
                        >
                          <span className="text-slate-700 text-xl">+</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right - Pet Info Panel */}
          {activeTab !== 'party' && (
            <div className="w-64 bg-slate-900/50 p-4 border-l border-slate-700 overflow-y-auto">
              {selectedPet ? (
                <div className="space-y-4">
                  {/* Pet Header */}
                  <div className="text-center">
                    {isEditingNickname ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newNickname}
                          onChange={(e) => setNewNickname(e.target.value)}
                          maxLength={20}
                          className="w-full px-2 py-1 bg-slate-700 rounded text-center text-sm"
                          placeholder={selectedPet.template.name}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={handleUpdateNickname}
                            disabled={actionLoading}
                            className="flex-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs disabled:opacity-50"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setIsEditingNickname(false)}
                            className="flex-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className={`font-bold text-lg ${getRarityColor(selectedPet.template.rarity)}`}>
                          {selectedPet.nickname || selectedPet.template.name}
                        </div>
                        <div className="text-xs text-slate-500">{selectedPet.template.name}</div>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">레벨</span>
                      <span className="text-yellow-400">Lv.{selectedPet.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">속성</span>
                      <span>
                        {getElementIcon(selectedPet.template.element_primary)} {selectedPet.template.element_primary}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">희귀도</span>
                      <span className={getRarityColor(selectedPet.template.rarity)}>
                        {selectedPet.template.rarity.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">충성도</span>
                      <span className="text-pink-400">{selectedPet.loyalty}%</span>
                    </div>
                    <div className="border-t border-slate-700 pt-2 mt-2 grid grid-cols-2 gap-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-red-400">STR</span>
                        <span>{selectedPet.stat_str}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-400">AGI</span>
                        <span>{selectedPet.stat_agi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-400">VIT</span>
                        <span>{selectedPet.stat_vit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-400">CON</span>
                        <span>{selectedPet.stat_con}</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-blue-400">INT</span>
                        <span>{selectedPet.stat_int}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setNewNickname(selectedPet.nickname || '');
                        setIsEditingNickname(true);
                      }}
                      disabled={actionLoading}
                      className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      닉네임 변경
                    </button>

                    {!selectedPet.in_storage && (
                      <>
                        {selectedPet.party_slot ? (
                          <button
                            onClick={() => handleRemoveFromParty(selectedPet.id)}
                            disabled={actionLoading}
                            className="w-full py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm transition-colors disabled:opacity-50"
                          >
                            파티에서 제외
                          </button>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xs text-slate-400 text-center">파티에 추가</div>
                            <div className="flex gap-1">
                              {[1, 2, 3].map((slot) => (
                                <button
                                  key={slot}
                                  onClick={() => handleAddToParty(selectedPet.id, slot)}
                                  disabled={actionLoading}
                                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm transition-colors disabled:opacity-50"
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedPet.template.can_ride && (
                          selectedPet.is_riding ? (
                            <button
                              onClick={() => handleUnsetRiding(selectedPet.id)}
                              disabled={actionLoading}
                              className="w-full py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                              🏇 탑승 해제
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSetRiding(selectedPet.id)}
                              disabled={actionLoading}
                              className="w-full py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                              🏇 탑승하기
                            </button>
                          )
                        )}

                        <button
                          onClick={() => handleMoveToStorage(selectedPet.id)}
                          disabled={actionLoading || storagePets.length >= MAX_STORAGE_PETS}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          📦 창고로 이동
                        </button>
                      </>
                    )}

                    {selectedPet.in_storage && (
                      <button
                        onClick={() => handleMoveFromStorage(selectedPet.id)}
                        disabled={actionLoading || activePets.length >= MAX_ACTIVE_PETS}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        🐾 꺼내기
                      </button>
                    )}

                    <button
                      onClick={() => handleReleasePet(selectedPet.id)}
                      disabled={actionLoading || (activePets.length + storagePets.length) <= 1}
                      className="w-full py-2 bg-red-600/50 hover:bg-red-600 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      방생하기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <span className="text-4xl block mb-2">🐾</span>
                    <p>펫을 선택하세요</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
