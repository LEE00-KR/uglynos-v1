import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import type { AdminPet, AdminPetBaseStatsRange, AdminPetGrowthRatesRange, AdminPetSprites, ElementType, StatRange } from '../../types/admin';
import { ELEMENTS, ELEMENT_LABELS, ELEMENT_COLORS, STATS, STAT_LABELS, GROWTH_GROUPS } from '../../types/admin';

// 숫자 포맷
const formatNumber = (value: number | undefined | null, decimal: number = 0): string => {
  if (value === undefined || value === null) return '';
  if (value === 0) return '0';
  return decimal > 0 ? value.toFixed(decimal) : value.toString();
};

// 빈 기본값
const defaultStatRange: StatRange = { min: 0, base: 0, max: 0 };

const defaultPet: Omit<AdminPet, 'createdAt' | 'updatedAt'> = {
  id: '',
  name: '',
  element: { primary: 'earth', secondary: null, primaryRatio: 100 },
  baseStatsRange: {
    hp: { ...defaultStatRange },
    atk: { ...defaultStatRange },
    def: { ...defaultStatRange },
    spd: { ...defaultStatRange },
  },
  growthRatesRange: {
    hp: { ...defaultStatRange },
    atk: { ...defaultStatRange },
    def: { ...defaultStatRange },
    spd: { ...defaultStatRange },
  },
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

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    if (selectedPet) setFormData(selectedPet);
    else setSearchParams({});
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
      // Error handled in store
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
        // Error handled in store
      }
    }
  };

  // Element handlers
  const handlePrimaryElementChange = (element: ElementType) => {
    setFormData({ ...formData, element: { ...formData.element, primary: element } });
  };

  const handleSecondaryElementChange = (element: ElementType | null) => {
    setFormData({ ...formData, element: { ...formData.element, secondary: element } });
  };

  const handlePrimaryRatioChange = (value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    setFormData({ ...formData, element: { ...formData.element, primaryRatio: numValue } });
  };

  // 기본 스탯 핸들러 (min/base/max)
  const handleBaseStatChange = (stat: keyof AdminPetBaseStatsRange, field: 'min' | 'base' | 'max', value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    const newRange = { ...formData.baseStatsRange[stat], [field]: numValue };
    setFormData({
      ...formData,
      baseStatsRange: { ...formData.baseStatsRange, [stat]: newRange },
    });
  };

  // 성장률 핸들러 (min/base/max)
  const handleGrowthRateChange = (stat: keyof AdminPetGrowthRatesRange, field: 'min' | 'base' | 'max', value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    const newRange = { ...formData.growthRatesRange[stat], [field]: numValue };
    setFormData({
      ...formData,
      growthRatesRange: { ...formData.growthRatesRange, [stat]: newRange },
    });
  };

  // 스탯 합산 계산
  const getStatSum = (field: 'min' | 'base' | 'max') => {
    return STATS.reduce((sum, stat) => sum + (formData.baseStatsRange[stat][field] || 0), 0);
  };

  // 성장률 합산 (HP 제외)
  const getGrowthSum = (field: 'min' | 'base' | 'max') => {
    return ['atk', 'def', 'spd'].reduce((sum, stat) =>
      sum + (formData.growthRatesRange[stat as keyof AdminPetGrowthRatesRange][field] || 0), 0);
  };

  const handleSpriteChange = (motion: keyof AdminPetSprites, url: string) => {
    setFormData({ ...formData, sprites: { ...formData.sprites, [motion]: url } });
  };

  const handleSpriteFileUpload = (motion: keyof AdminPetSprites, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setFormData({ ...formData, sprites: { ...formData.sprites, [motion]: base64 } });
    };
    reader.readAsDataURL(file);
  };

  const handleSkillToggle = (skillId: string) => {
    const newSkills = formData.skills.includes(skillId)
      ? formData.skills.filter((id) => id !== skillId)
      : [...formData.skills, skillId];
    setFormData({ ...formData, skills: newSkills });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">페트 관리</h1>
          <p className="text-gray-400 mt-2">페트 템플릿 생성 및 관리</p>
        </div>
        <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
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
                      selectedPet?.id === pet.id ? 'bg-primary-600/20 border-l-2 border-l-primary-400' : 'hover:bg-gray-700'
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
                      <button onClick={handleCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">취소</button>
                      <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">
                        {loading ? '저장 중...' : '저장'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleEdit} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">수정</button>
                      <button onClick={() => setDeleteConfirm(selectedPet?.id || null)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">삭제</button>
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
                          <option key={el} value={el}>{ELEMENT_LABELS[el]}</option>
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
                          <option key={el} value={el}>{ELEMENT_LABELS[el]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">주 속성 비율 (%)</label>
                      <input
                        type="number"
                        value={formData.element.primaryRatio || ''}
                        onChange={(e) => handlePrimaryRatioChange(e.target.value)}
                        disabled={!isEditing || !formData.element.secondary}
                        placeholder="50-100"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`px-2 py-1 rounded ${ELEMENT_COLORS[formData.element.primary]} text-white text-sm font-bold`}>
                      {ELEMENT_LABELS[formData.element.primary]}
                    </div>
                    <span className="text-gray-300 text-sm">{formData.element.primaryRatio}%</span>
                    {formData.element.secondary && (
                      <>
                        <span className="text-gray-500">+</span>
                        <div className={`px-2 py-1 rounded ${ELEMENT_COLORS[formData.element.secondary]} text-white text-sm font-bold`}>
                          {ELEMENT_LABELS[formData.element.secondary]}
                        </div>
                        <span className="text-gray-300 text-sm">{100 - formData.element.primaryRatio}%</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Base Stats Range - [최소][기준][최대] + 합산 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-300">기본 스탯 (최소 / 기준 / 최대)</label>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-400">{getStatSum('min')}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-yellow-400 font-bold">{getStatSum('base')}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-green-400">{getStatSum('max')}</span>
                      <span className="text-gray-500 text-xs">(합산)</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 mb-1">
                      <div></div>
                      <div className="text-center">최소</div>
                      <div className="text-center">기준</div>
                      <div className="text-center">최대</div>
                    </div>
                    {STATS.map((stat) => (
                      <div key={stat} className="grid grid-cols-4 gap-2 items-center">
                        <label className="text-sm text-gray-400">{STAT_LABELS[stat]}</label>
                        <input
                          type="number"
                          value={formData.baseStatsRange[stat].min || ''}
                          onChange={(e) => handleBaseStatChange(stat, 'min', e.target.value)}
                          disabled={!isEditing}
                          placeholder="최소"
                          className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm disabled:opacity-50 text-center"
                        />
                        <input
                          type="number"
                          value={formData.baseStatsRange[stat].base || ''}
                          onChange={(e) => handleBaseStatChange(stat, 'base', e.target.value)}
                          disabled={!isEditing}
                          placeholder="기준"
                          className="px-2 py-1.5 bg-yellow-900/30 border border-yellow-600/50 rounded text-yellow-400 text-sm disabled:opacity-50 text-center font-bold"
                        />
                        <input
                          type="number"
                          value={formData.baseStatsRange[stat].max || ''}
                          onChange={(e) => handleBaseStatChange(stat, 'max', e.target.value)}
                          disabled={!isEditing}
                          placeholder="최대"
                          className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm disabled:opacity-50 text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Growth Rates - [최소][기준][최대] */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-300">성장률 (최소 / 기준 / 최대)</label>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-400">{formatNumber(getGrowthSum('min'), 2)}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-yellow-400 font-bold">{formatNumber(getGrowthSum('base'), 2)}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-green-400">{formatNumber(getGrowthSum('max'), 2)}</span>
                      <span className="text-gray-500 text-xs">(HP 제외)</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 mb-1">
                      <div></div>
                      <div className="text-center">최소</div>
                      <div className="text-center">기준</div>
                      <div className="text-center">최대</div>
                    </div>
                    {STATS.map((stat) => (
                      <div key={stat} className="grid grid-cols-4 gap-2 items-center">
                        <label className="text-sm text-gray-400">{STAT_LABELS[stat]}</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.growthRatesRange[stat].min || ''}
                          onChange={(e) => handleGrowthRateChange(stat, 'min', e.target.value)}
                          disabled={!isEditing}
                          placeholder="최소"
                          className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm disabled:opacity-50 text-center"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={formData.growthRatesRange[stat].base || ''}
                          onChange={(e) => handleGrowthRateChange(stat, 'base', e.target.value)}
                          disabled={!isEditing}
                          placeholder="기준"
                          className="px-2 py-1.5 bg-yellow-900/30 border border-yellow-600/50 rounded text-yellow-400 text-sm disabled:opacity-50 text-center font-bold"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={formData.growthRatesRange[stat].max || ''}
                          onChange={(e) => handleGrowthRateChange(stat, 'max', e.target.value)}
                          disabled={!isEditing}
                          placeholder="최대"
                          className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm disabled:opacity-50 text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Growth Group Preview - 성장률 × 배수 미리보기 */}
                <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-300">성장 그룹 미리보기</span>
                    <span className="text-xs text-gray-500">입력한 기준 성장률 × 그룹 배수</span>
                  </div>

                  {/* 테이블 헤더 */}
                  <div className="grid grid-cols-8 gap-1 text-xs mb-2">
                    <div className="text-gray-400">스탯</div>
                    {GROWTH_GROUPS.map((g) => (
                      <div key={g.group} className="text-center text-gray-400">{g.group}</div>
                    ))}
                  </div>

                  {/* HP 행 */}
                  <div className="grid grid-cols-8 gap-1 text-xs py-1 border-t border-gray-600">
                    <div className="text-orange-400 font-medium">HP</div>
                    {GROWTH_GROUPS.map((g) => {
                      const baseRate = formData.growthRatesRange.hp.base || 0;
                      const minVal = baseRate * g.multiplierMin;
                      const maxVal = baseRate * g.multiplierMax;
                      return (
                        <div key={g.group} className="text-center text-orange-300">
                          {baseRate > 0 ? `${minVal.toFixed(1)}~${maxVal.toFixed(1)}` : '-'}
                        </div>
                      );
                    })}
                  </div>

                  {/* ATK+DEF+SPD 행 */}
                  <div className="grid grid-cols-8 gap-1 text-xs py-1 border-t border-gray-600">
                    <div className="text-cyan-400 font-medium">능력합</div>
                    {GROWTH_GROUPS.map((g) => {
                      const baseSum = getGrowthSum('base');
                      const minVal = baseSum * g.multiplierMin;
                      const maxVal = baseSum * g.multiplierMax;
                      return (
                        <div key={g.group} className="text-center text-cyan-300">
                          {baseSum > 0 ? `${minVal.toFixed(1)}~${maxVal.toFixed(1)}` : '-'}
                        </div>
                      );
                    })}
                  </div>

                  {/* 확률 행 */}
                  <div className="grid grid-cols-8 gap-1 text-xs py-1 border-t border-gray-600">
                    <div className="text-gray-400">확률</div>
                    {GROWTH_GROUPS.map((g) => (
                      <div key={g.group} className="text-center text-gray-500">{g.probability}%</div>
                    ))}
                  </div>

                  {/* 배수 범위 행 */}
                  <div className="grid grid-cols-8 gap-1 text-xs py-1 border-t border-gray-600">
                    <div className="text-gray-400">배수</div>
                    {GROWTH_GROUPS.map((g) => (
                      <div key={g.group} className="text-center text-gray-500">
                        {g.multiplierMin}~{g.multiplierMax}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capture Rate Info */}
                <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="text-sm text-gray-300">
                    <span className="font-medium">포획률:</span>{' '}
                    <span className="text-yellow-400">HP 및 캐릭터 레벨에 따라 자동 계산</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    기본 5% → HP ≤80%: 10% → HP ≤50%: 20% → HP ≤10%: 30% + 레벨 보너스 (30/50/80레벨: +10/20/30%)
                  </p>
                </div>

                {/* Sprites */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">스프라이트 이미지</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['idle', 'attack', 'hit', 'defend', 'down', 'walk'] as const).map((motion) => (
                      <div key={motion} className="space-y-2">
                        <label className="block text-xs text-gray-400 capitalize">{motion}</label>
                        <div className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                          {formData.sprites[motion] ? (
                            <img src={formData.sprites[motion]} alt={motion} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-gray-500 text-xs">미리보기</span>
                          )}
                        </div>
                        {isEditing && (
                          <label className="block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleSpriteFileUpload(motion, file);
                              }}
                              className="block w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-primary-600 file:text-white hover:file:bg-primary-700 file:cursor-pointer cursor-pointer"
                            />
                          </label>
                        )}
                        <input
                          type="text"
                          value={formData.sprites[motion]}
                          onChange={(e) => handleSpriteChange(motion, e.target.value)}
                          disabled={!isEditing}
                          placeholder="URL 입력"
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
                    <p className="text-gray-400 text-sm">등록된 스킬이 없습니다.</p>
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
            <p className="text-gray-300 mb-6">이 페트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">취소</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
