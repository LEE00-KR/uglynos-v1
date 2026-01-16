import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import type { AdminPet, AdminPetBaseStats, AdminPetGrowthRates, AdminPetSprites, ElementRatio, SkillComponent } from '../../types/admin';
import { ELEMENTS, ELEMENT_LABELS, ELEMENT_COLORS } from '../../types/admin';

const defaultPet: Omit<AdminPet, 'createdAt' | 'updatedAt'> = {
  id: '',
  name: '',
  element: { earth: 25, water: 25, fire: 25, wind: 25 },
  baseStats: { hp: 50, atk: 10, def: 10, spd: 10 },
  growthRates: { hp: 15, atk: 2, def: 2, spd: 2 },
  sprites: { idle: '', attack: '', hit: '', defend: '', down: '', walk: '' },
  skills: [],
};

export default function PetManagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pets, skills, fetchPets, fetchSkills, createPet, updatePet, deletePet, loading } = useAdminStore();

  const [selectedPet, setSelectedPet] = useState<AdminPet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<AdminPet, 'createdAt' | 'updatedAt'>>(defaultPet);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchPets();
    fetchSkills();
  }, [fetchPets, fetchSkills]);

  useEffect(() => {
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (action === 'create') {
      setIsEditing(true);
      setSelectedPet(null);
      setFormData(defaultPet);
    } else if (id) {
      const pet = pets.find((p) => p.id === id);
      if (pet) {
        setSelectedPet(pet);
        setFormData(pet);
      }
    }
  }, [searchParams, pets]);

  const handleSelectPet = (pet: AdminPet) => {
    setSelectedPet(pet);
    setFormData(pet);
    setIsEditing(false);
    setSearchParams({ id: pet.id });
  };

  const handleCreate = () => {
    setIsEditing(true);
    setSelectedPet(null);
    setFormData(defaultPet);
    setSearchParams({ action: 'create' });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (selectedPet) {
      setFormData(selectedPet);
    } else {
      setSearchParams({});
    }
  };

  const handleSave = async () => {
    try {
      if (selectedPet) {
        await updatePet(selectedPet.id, formData);
      } else {
        const newId = await createPet(formData);
        setSearchParams({ id: newId });
      }
      setIsEditing(false);
    } catch {
      // Error is handled in store
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm && selectedPet) {
      try {
        await deletePet(selectedPet.id);
        setSelectedPet(null);
        setFormData(defaultPet);
        setSearchParams({});
        setDeleteConfirm(null);
      } catch {
        // Error is handled in store
      }
    }
  };

  // Element slider handler - maintains sum of 100
  const handleElementChange = (element: keyof ElementRatio, newValue: number) => {
    const current = formData.element;
    const others = ELEMENTS.filter((e) => e !== element);
    const otherSum = others.reduce((sum, e) => sum + current[e], 0);
    const available = 100 - newValue;

    if (otherSum === 0) {
      // Distribute equally
      const perElement = Math.floor(available / 3);
      const remainder = available - perElement * 3;
      setFormData({
        ...formData,
        element: {
          ...current,
          [element]: newValue,
          [others[0]]: perElement + remainder,
          [others[1]]: perElement,
          [others[2]]: perElement,
        },
      });
    } else {
      // Scale proportionally
      const scale = available / otherSum;
      const newElement: ElementRatio = { ...current, [element]: newValue };
      others.forEach((e) => {
        newElement[e] = Math.round(current[e] * scale);
      });
      // Fix rounding errors
      const total = Object.values(newElement).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        newElement[others[0]] += 100 - total;
      }
      setFormData({ ...formData, element: newElement });
    }
  };

  const handleBaseStatChange = (stat: keyof AdminPetBaseStats, value: number) => {
    setFormData({
      ...formData,
      baseStats: { ...formData.baseStats, [stat]: value },
    });
  };

  const handleGrowthRateChange = (stat: keyof AdminPetGrowthRates, value: number) => {
    setFormData({
      ...formData,
      growthRates: { ...formData.growthRates, [stat]: value },
    });
  };

  const handleSpriteChange = (motion: keyof AdminPetSprites, url: string) => {
    setFormData({
      ...formData,
      sprites: { ...formData.sprites, [motion]: url },
    });
  };

  const handleSkillToggle = (skillId: string) => {
    const newSkills = formData.skills.includes(skillId)
      ? formData.skills.filter((id) => id !== skillId)
      : [...formData.skills, skillId];
    setFormData({ ...formData, skills: newSkills });
  };

  const totalGrowthRate = formData.growthRates.atk + formData.growthRates.def + formData.growthRates.spd;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">페트 관리</h1>
          <p className="text-gray-400 mt-2">페트 템플릿 생성 및 관리</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          + 새 페트 추가
        </button>
      </div>

      <div className="flex gap-8">
        {/* Pet List */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">페트 목록</h2>
              <p className="text-sm text-gray-400">{pets.length}개</p>
            </div>
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {loading && pets.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">로딩 중...</div>
              ) : pets.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">등록된 페트가 없습니다.</div>
              ) : (
                pets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => handleSelectPet(pet)}
                    className={`w-full p-4 text-left border-b border-gray-700 last:border-b-0 transition-colors ${
                      selectedPet?.id === pet.id
                        ? 'bg-primary-600/20 border-l-2 border-l-primary-400'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                        {pet.sprites.idle ? (
                          <img src={pet.sprites.idle} alt={pet.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <span className="text-lg">🐾</span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{pet.name}</p>
                        <p className="text-xs text-gray-400">{pet.id}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pet Detail / Edit Form */}
        <div className="flex-1">
          {selectedPet || isEditing ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? (selectedPet ? '페트 수정' : '새 페트 등록') : '페트 상세'}
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
                        onClick={() => setDeleteConfirm(selectedPet?.id || null)}
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
                      disabled={!isEditing || !!selectedPet}
                      placeholder="pet_001 (자동 생성)"
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
                      placeholder="페트 이름"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Element Ratios */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">속성 비율 (합계 100%)</label>
                  <div className="grid grid-cols-2 gap-4">
                    {ELEMENTS.map((element) => (
                      <div key={element} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded ${ELEMENT_COLORS[element]} flex items-center justify-center text-white font-bold`}>
                          {ELEMENT_LABELS[element]}
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formData.element[element]}
                          onChange={(e) => handleElementChange(element, parseInt(e.target.value))}
                          disabled={!isEditing}
                          className="flex-1"
                        />
                        <span className="w-12 text-right text-white">{formData.element[element]}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Base Stats */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">기본 스텟</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">체력 (HP) 1-100</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.baseStats.hp}
                        onChange={(e) => handleBaseStatChange('hp', parseInt(e.target.value) || 1)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">공격력 (ATK) 1-20</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.baseStats.atk}
                        onChange={(e) => handleBaseStatChange('atk', parseInt(e.target.value) || 1)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">방어력 (DEF) 1-20</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.baseStats.def}
                        onChange={(e) => handleBaseStatChange('def', parseInt(e.target.value) || 1)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">순발력 (SPD) 1-20</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.baseStats.spd}
                        onChange={(e) => handleBaseStatChange('spd', parseInt(e.target.value) || 1)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Growth Rates */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-300">성장률</label>
                    <span className={`text-sm ${totalGrowthRate >= 3 && totalGrowthRate <= 9 ? 'text-green-400' : 'text-red-400'}`}>
                      전체 성장률: {totalGrowthRate.toFixed(2)} (3.00~9.00)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">HP 성장률 1.00-30.00</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        step="0.1"
                        value={formData.growthRates.hp}
                        onChange={(e) => handleGrowthRateChange('hp', parseFloat(e.target.value) || 1)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">ATK 성장률 1.00-3.00</label>
                      <input
                        type="number"
                        min="1"
                        max="3"
                        step="0.1"
                        value={formData.growthRates.atk}
                        onChange={(e) => handleGrowthRateChange('atk', parseFloat(e.target.value) || 1)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">DEF 성장률 1.00-3.00</label>
                      <input
                        type="number"
                        min="1"
                        max="3"
                        step="0.1"
                        value={formData.growthRates.def}
                        onChange={(e) => handleGrowthRateChange('def', parseFloat(e.target.value) || 1)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">SPD 성장률 1.00-3.00</label>
                      <input
                        type="number"
                        min="1"
                        max="3"
                        step="0.1"
                        value={formData.growthRates.spd}
                        onChange={(e) => handleGrowthRateChange('spd', parseFloat(e.target.value) || 1)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Sprites */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">스프라이트 이미지</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['idle', 'attack', 'hit', 'defend', 'down', 'walk'] as const).map((motion) => (
                      <div key={motion}>
                        <label className="block text-xs text-gray-400 mb-1 capitalize">{motion}</label>
                        <input
                          type="text"
                          value={formData.sprites[motion]}
                          onChange={(e) => handleSpriteChange(motion, e.target.value)}
                          disabled={!isEditing}
                          placeholder="이미지 URL"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 disabled:opacity-50"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">스킬 목록</label>
                  {skills.length === 0 ? (
                    <p className="text-gray-400 text-sm">등록된 스킬이 없습니다. 먼저 스킬을 등록해주세요.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {skills.map((skill) => (
                        <label
                          key={skill.id}
                          className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                            formData.skills.includes(skill.id)
                              ? 'bg-primary-600/20 border border-primary-500'
                              : 'bg-gray-700 border border-gray-600'
                          } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.skills.includes(skill.id)}
                            onChange={() => handleSkillToggle(skill.id)}
                            disabled={!isEditing}
                            className="sr-only"
                          />
                          <span className="text-white">{skill.name}</span>
                          <span className="text-xs text-gray-400">기력 {skill.cost}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">좌측 목록에서 페트를 선택하거나 새 페트를 추가하세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">삭제 확인</h3>
            <p className="text-gray-300 mb-6">
              이 페트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
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
