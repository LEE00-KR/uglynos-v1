import { useState, useEffect } from 'react';
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

export default function PetManageModal({ onClose }: PetManageModalProps) {
  const { setPets } = useGameStore();
  const [allPets, setAllPets] = useState<PetDetail[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all pets on mount
  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setIsLoading(true);
      const response = await petApi.getAll();
      setAllPets(response.data);
      // Update game store with party pets
      const partyPets = response.data.filter((p: PetDetail) => p.party_slot !== null);
      setPets(partyPets);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get pets in party slots
  const partySlots = [1, 2, 3].map(slot => {
    return allPets.find(p => p.party_slot === slot) || null;
  });

  const handleAddToParty = async (petId: string, slot: number) => {
    try {
      setActionLoading(true);
      await petApi.addToParty(petId, slot);
      await fetchPets();
      setSelectedPet(null);
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
        const updated = allPets.find(p => p.id === petId);
        if (updated) setSelectedPet({ ...updated, party_slot: null });
      }
    } catch (error) {
      console.error('Failed to remove pet from party:', error);
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
    if (!selectedPet || !newNickname.trim()) return;
    try {
      setActionLoading(true);
      await petApi.updateNickname(selectedPet.id, newNickname.trim());
      await fetchPets();
      setIsEditingNickname(false);
      // Update selected pet
      setSelectedPet(prev => prev ? { ...prev, nickname: newNickname.trim() } : null);
    } catch (error) {
      console.error('Failed to update nickname:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleasePet = async (petId: string) => {
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
      earth: 'text-amber-400',
      wind: 'text-green-400',
      fire: 'text-red-400',
      water: 'text-blue-400',
    };
    return colors[element] || 'text-gray-400';
  };

  const getRarityColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      common: 'text-gray-400 border-gray-500',
      uncommon: 'text-green-400 border-green-500',
      rare: 'text-blue-400 border-blue-500',
      epic: 'text-purple-400 border-purple-500',
      legendary: 'text-yellow-400 border-yellow-500',
    };
    return colors[rarity] || 'text-gray-400 border-gray-500';
  };

  const getRarityBg = (rarity: string) => {
    const colors: { [key: string]: string } = {
      common: 'bg-gray-700/50',
      uncommon: 'bg-green-900/30',
      rare: 'bg-blue-900/30',
      epic: 'bg-purple-900/30',
      legendary: 'bg-yellow-900/30',
    };
    return colors[rarity] || 'bg-gray-700/50';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl w-[900px] max-h-[90vh] border border-slate-600 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">펫 관리</h2>
            <p className="text-sm text-slate-300">보유 펫: {allPets.length}마리</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl hover:bg-slate-600 rounded-lg w-10 h-10 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left - Party Slots */}
          <div className="w-48 bg-slate-900/50 p-4 border-r border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 mb-3">파티 슬롯</h3>
            <div className="space-y-3">
              {partySlots.map((pet, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    pet
                      ? `${getRarityBg(pet.template.rarity)} border-slate-500 hover:border-slate-400`
                      : 'bg-slate-800/50 border-dashed border-slate-600 hover:border-slate-500'
                  } ${selectedPet?.id === pet?.id ? 'ring-2 ring-emerald-400' : ''}`}
                  onClick={() => pet && setSelectedPet(pet)}
                >
                  <div className="text-xs text-slate-500 mb-1">슬롯 {index + 1}</div>
                  {pet ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getElementIcon(pet.template.element_primary)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {pet.nickname || pet.template.name}
                        </div>
                        <div className="text-xs text-slate-400">Lv.{pet.level}</div>
                      </div>
                      {pet.is_riding && <span className="text-xs">🏇</span>}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 text-center py-2">비어있음</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Center - Pet List */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-400 mb-3">보유 펫 목록</h3>
            {isLoading ? (
              <div className="text-center text-slate-400 py-8">로딩 중...</div>
            ) : allPets.length === 0 ? (
              <div className="text-center text-slate-400 py-8">보유한 펫이 없습니다</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {allPets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => {
                      setSelectedPet(pet);
                      setIsEditingNickname(false);
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${getRarityBg(pet.template.rarity)} ${
                      selectedPet?.id === pet.id
                        ? 'border-emerald-400 ring-1 ring-emerald-400'
                        : `${getRarityColor(pet.template.rarity)} hover:brightness-110`
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getElementIcon(pet.template.element_primary)}</span>
                      <span className={`text-sm font-medium ${getRarityColor(pet.template.rarity)}`}>
                        {pet.nickname || pet.template.name}
                      </span>
                      {pet.is_rare_color && <span className="text-yellow-400 text-xs">★</span>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Lv.{pet.level}</span>
                      <div className="flex items-center gap-1">
                        {pet.party_slot && <span className="bg-emerald-600/50 px-1 rounded">P{pet.party_slot}</span>}
                        {pet.is_riding && <span>🏇</span>}
                        {pet.is_starter && <span className="bg-blue-600/50 px-1 rounded">초기</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right - Pet Detail */}
          <div className="w-64 bg-slate-900/50 p-4 border-l border-slate-700">
            {selectedPet ? (
              <div className="space-y-4">
                {/* Pet Header */}
                <div className="text-center">
                  <div className="text-4xl mb-2">{getElementIcon(selectedPet.template.element_primary)}</div>
                  {isEditingNickname ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newNickname}
                        onChange={(e) => setNewNickname(e.target.value)}
                        maxLength={20}
                        className="w-full px-2 py-1 bg-slate-700 rounded text-center text-sm"
                        placeholder="새 닉네임"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={handleUpdateNickname}
                          disabled={actionLoading}
                          className="flex-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs"
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
                    <div
                      onClick={() => {
                        setNewNickname(selectedPet.nickname || '');
                        setIsEditingNickname(true);
                      }}
                      className="cursor-pointer hover:text-emerald-400"
                    >
                      <div className={`font-bold text-lg ${getRarityColor(selectedPet.template.rarity)}`}>
                        {selectedPet.nickname || selectedPet.template.name}
                      </div>
                      <div className="text-xs text-slate-500">(클릭하여 닉네임 변경)</div>
                    </div>
                  )}
                  <div className="text-sm text-slate-400 mt-1">
                    {selectedPet.template.name} · Lv.{selectedPet.level}
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">속성</span>
                    <span className={getElementColor(selectedPet.template.element_primary)}>
                      {getElementIcon(selectedPet.template.element_primary)} {selectedPet.template.element_primary}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">희귀도</span>
                    <span className={getRarityColor(selectedPet.template.rarity)}>
                      {selectedPet.template.rarity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
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
                            슬롯 {slot}
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

                  {!selectedPet.is_starter && (
                    <button
                      onClick={() => handleReleasePet(selectedPet.id)}
                      disabled={actionLoading}
                      className="w-full py-2 bg-red-600/50 hover:bg-red-600 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      방생하기
                    </button>
                  )}
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
        </div>
      </div>
    </div>
  );
}
