import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import type { AdminPet, AdminPetBaseStatsRange, AdminPetBonusPool, AdminPetGrowthRatesRange, AdminPetSprites, ElementType, GrowthGroup } from '../../types/admin';
import { ELEMENTS, ELEMENT_LABELS, ELEMENT_COLORS, STATS, STAT_LABELS, GROWTH_GROUP_LABELS, GROWTH_GROUP_COLORS, calculateGrowthGroup, MAX_TOTAL_STATS } from '../../types/admin';

const defaultPet: Omit<AdminPet, 'createdAt' | 'updatedAt'> = {
  id: '',
  name: '',
  element: { primary: 'earth', secondary: null, primaryRatio: 100 },
  baseStatsRange: {
    hp: { min: 80, max: 120 },
    atk: { min: 8, max: 12 },
    def: { min: 8, max: 12 },
    spd: { min: 8, max: 12 },
  },
  bonusPool: { hp: 10, atk: 2, def: 2, spd: 2 },
  growthRatesRange: {
    hp: { min: 1.30, max: 1.70 },
    atk: { min: 1.30, max: 1.70 },
    def: { min: 1.30, max: 1.70 },
    spd: { min: 1.30, max: 1.70 },
  },
  totalStats: 156,
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

  // Element handlers
  const handlePrimaryElementChange = (element: ElementType) => {
    setFormData({
      ...formData,
      element: { ...formData.element, primary: element },
    });
  };

  const handleSecondaryElementChange = (element: ElementType | null) => {
    setFormData({
      ...formData,
      element: { ...formData.element, secondary: element },
    });
  };

  const handlePrimaryRatioChange = (ratio: number) => {
    setFormData({
      ...formData,
      element: { ...formData.element, primaryRatio: ratio },
    });
  };

  const handleBaseStatRangeChange = (stat: keyof AdminPetBaseStatsRange, field: 'min' | 'max', value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    const newRange = { ...formData.baseStatsRange[stat], [field]: numValue };
    const newBaseStatsRange = { ...formData.baseStatsRange, [stat]: newRange };
    // Recalculate total stats
    const totalStats = (newBaseStatsRange.hp.max || 0) + (newBaseStatsRange.atk.max || 0) + (newBaseStatsRange.def.max || 0) + (newBaseStatsRange.spd.max || 0);
    setFormData({
      ...formData,
      baseStatsRange: newBaseStatsRange,
      totalStats,
    });
  };

  const handleBonusPoolChange = (stat: keyof AdminPetBonusPool, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    setFormData({
      ...formData,
      bonusPool: { ...formData.bonusPool, [stat]: numValue },
    });
  };

  const handleGrowthRateRangeChange = (stat: keyof AdminPetGrowthRatesRange, field: 'min' | 'max', value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    const newRange = { ...formData.growthRatesRange[stat], [field]: numValue };
    setFormData({
      ...formData,
      growthRatesRange: { ...formData.growthRatesRange, [stat]: newRange },
    });
  };

  // Validation helpers
  const isValidBaseStat = (stat: keyof AdminPetBaseStatsRange, field: 'min' | 'max') => {
    const value = formData.baseStatsRange[stat][field];
    const max = stat === 'hp' ? 999 : 100;
    return value >= 1 && value <= max;
  };

  const isValidBonusPool = (stat: keyof AdminPetBonusPool) => {
    const value = formData.bonusPool[stat];
    const max = stat === 'hp' ? 50 : 10;
    return value >= 0 && value <= max;
  };

  const isValidGrowthRate = (stat: keyof AdminPetGrowthRatesRange, field: 'min' | 'max') => {
    const value = formData.growthRatesRange[stat][field];
    return value >= 1 && value <= 3;
  };

  const handleSpriteChange = (motion: keyof AdminPetSprites, url: string) => {
    setFormData({
      ...formData,
      sprites: { ...formData.sprites, [motion]: url },
    });
  };

  const handleSpriteFileUpload = (motion: keyof AdminPetSprites, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setFormData({
        ...formData,
        sprites: { ...formData.sprites, [motion]: base64 },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSkillToggle = (skillId: string) => {
    const newSkills = formData.skills.includes(skillId)
      ? formData.skills.filter((id) => id !== skillId)
      : [...formData.skills, skillId];
    setFormData({ ...formData, skills: newSkills });
  };

  // Calculate average growth rate
  const avgGrowthRate = (
    (formData.growthRatesRange.hp.min + formData.growthRatesRange.hp.max) / 2 +
    (formData.growthRatesRange.atk.min + formData.growthRatesRange.atk.max) / 2 +
    (formData.growthRatesRange.def.min + formData.growthRatesRange.def.max) / 2 +
    (formData.growthRatesRange.spd.min + formData.growthRatesRange.spd.max) / 2
  );

  // Calculate growth group
  const growthGroup: GrowthGroup = calculateGrowthGroup(formData.totalStats);
  const statPercent = ((formData.totalStats / MAX_TOTAL_STATS) * 100).toFixed(1);

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

                {/* Element Config */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">속성 설정</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">주 속성</label>
                      <select
                        value={formData.element.primary}
                        onChange={(e) => handlePrimaryElementChange(e.target.value as ElementType)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      >
                        {ELEMENTS.map((el) => (
                          <option key={el} value={el}>
                            {ELEMENT_LABELS[el]} ({el})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">부 속성 (선택)</label>
                      <select
                        value={formData.element.secondary || ''}
                        onChange={(e) => handleSecondaryElementChange(e.target.value ? e.target.value as ElementType : null)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      >
                        <option value="">없음</option>
                        {ELEMENTS.filter((el) => el !== formData.element.primary).map((el) => (
                          <option key={el} value={el}>
                            {ELEMENT_LABELS[el]} ({el})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">주 속성 비율 (%)</label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={formData.element.primaryRatio}
                        onChange={(e) => handlePrimaryRatioChange(parseInt(e.target.value) || 100)}
                        disabled={!isEditing || !formData.element.secondary}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`w-6 h-6 rounded ${ELEMENT_COLORS[formData.element.primary]} flex items-center justify-center text-white text-xs font-bold`}>
                      {ELEMENT_LABELS[formData.element.primary]}
                    </div>
                    <span className="text-gray-300 text-sm">{formData.element.primaryRatio}%</span>
                    {formData.element.secondary && (
                      <>
                        <span className="text-gray-500">+</span>
                        <div className={`w-6 h-6 rounded ${ELEMENT_COLORS[formData.element.secondary]} flex items-center justify-center text-white text-xs font-bold`}>
                          {ELEMENT_LABELS[formData.element.secondary]}
                        </div>
                        <span className="text-gray-300 text-sm">{100 - formData.element.primaryRatio}%</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Growth Group Info */}
                <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-300">성장 그룹:</span>
                      <span className={`px-3 py-1 rounded-full text-white font-bold ${GROWTH_GROUP_COLORS[growthGroup]}`}>
                        {growthGroup}등급
                      </span>
                      <span className="text-sm text-gray-400">
                        ({GROWTH_GROUP_LABELS[growthGroup]})
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      총합 스탯: <span className="text-white font-medium">{formData.totalStats}</span> / {MAX_TOTAL_STATS} ({statPercent}%)
                    </div>
                  </div>
                </div>

                {/* Base Stats Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">기본 스텟 범위 (HP: 1-999, 그 외: 1-100)</label>
                  <div className="space-y-3">
                    {STATS.map((stat) => (
                      <div key={stat} className="flex items-center gap-4">
                        <label className="w-32 text-sm text-gray-400">{STAT_LABELS[stat]}</label>
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="number"
                            value={formData.baseStatsRange[stat].min || ''}
                            onChange={(e) => handleBaseStatRangeChange(stat, 'min', e.target.value)}
                            disabled={!isEditing}
                            placeholder="최소"
                            className={`flex-1 px-3 py-2 bg-gray-700 border rounded-lg text-white disabled:opacity-50 ${
                              isEditing && !isValidBaseStat(stat, 'min') ? 'border-red-500' : 'border-gray-600'
                            }`}
                          />
                          <span className="text-gray-400">~</span>
                          <input
                            type="number"
                            value={formData.baseStatsRange[stat].max || ''}
                            onChange={(e) => handleBaseStatRangeChange(stat, 'max', e.target.value)}
                            disabled={!isEditing}
                            placeholder="최대"
                            className={`flex-1 px-3 py-2 bg-gray-700 border rounded-lg text-white disabled:opacity-50 ${
                              isEditing && !isValidBaseStat(stat, 'max') ? 'border-red-500' : 'border-gray-600'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bonus Pool */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">보너스 풀 (HP: 0-50, 그 외: 0-10)</label>
                  <div className="grid grid-cols-4 gap-3">
                    {STATS.map((stat) => (
                      <div key={stat}>
                        <label className="block text-xs text-gray-400 mb-1">{STAT_LABELS[stat]}</label>
                        <input
                          type="number"
                          value={formData.bonusPool[stat]}
                          onChange={(e) => handleBonusPoolChange(stat, e.target.value)}
                          disabled={!isEditing}
                          className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white disabled:opacity-50 ${
                            isEditing && !isValidBonusPool(stat) ? 'border-red-500' : 'border-gray-600'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Growth Rates Range */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-300">성장률 범위 (1.00-3.00)</label>
                    <span className={`text-sm ${avgGrowthRate >= 4 && avgGrowthRate <= 12 ? 'text-green-400' : 'text-yellow-400'}`}>
                      평균 성장률: {avgGrowthRate.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {STATS.map((stat) => (
                      <div key={stat} className="flex items-center gap-4">
                        <label className="w-32 text-sm text-gray-400">{STAT_LABELS[stat]}</label>
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="number"
                            step="0.05"
                            value={formData.growthRatesRange[stat].min || ''}
                            onChange={(e) => handleGrowthRateRangeChange(stat, 'min', e.target.value)}
                            disabled={!isEditing}
                            placeholder="최소"
                            className={`flex-1 px-3 py-2 bg-gray-700 border rounded-lg text-white disabled:opacity-50 ${
                              isEditing && !isValidGrowthRate(stat, 'min') ? 'border-red-500' : 'border-gray-600'
                            }`}
                          />
                          <span className="text-gray-400">~</span>
                          <input
                            type="number"
                            step="0.05"
                            value={formData.growthRatesRange[stat].max || ''}
                            onChange={(e) => handleGrowthRateRangeChange(stat, 'max', e.target.value)}
                            disabled={!isEditing}
                            placeholder="최대"
                            className={`flex-1 px-3 py-2 bg-gray-700 border rounded-lg text-white disabled:opacity-50 ${
                              isEditing && !isValidGrowthRate(stat, 'max') ? 'border-red-500' : 'border-gray-600'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sprites */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">스프라이트 이미지</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['idle', 'attack', 'hit', 'defend', 'down', 'walk'] as const).map((motion) => (
                      <div key={motion} className="space-y-2">
                        <label className="block text-xs text-gray-400 capitalize">{motion}</label>
                        {/* Preview */}
                        <div className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                          {formData.sprites[motion] ? (
                            <img
                              src={formData.sprites[motion]}
                              alt={motion}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-gray-500 text-xs">미리보기</span>
                          )}
                        </div>
                        {/* File Upload */}
                        {isEditing && (
                          <label className="block">
                            <span className="sr-only">파일 선택</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleSpriteFileUpload(motion, file);
                              }}
                              className="block w-full text-xs text-gray-400
                                file:mr-2 file:py-1 file:px-3
                                file:rounded file:border-0
                                file:text-xs file:font-medium
                                file:bg-primary-600 file:text-white
                                hover:file:bg-primary-700
                                file:cursor-pointer cursor-pointer"
                            />
                          </label>
                        )}
                        {/* URL Input */}
                        <input
                          type="text"
                          value={formData.sprites[motion]}
                          onChange={(e) => handleSpriteChange(motion, e.target.value)}
                          disabled={!isEditing}
                          placeholder="또는 URL 입력"
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs placeholder-gray-400 disabled:opacity-50"
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
