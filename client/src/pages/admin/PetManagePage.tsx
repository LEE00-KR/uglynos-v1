import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import type { AdminPet, AdminPetBaseStatsRange, AdminPetBonusPool, AdminPetGrowthRatesRange, AdminPetSprites, ElementType, GrowthGroup } from '../../types/admin';
import { ELEMENTS, ELEMENT_LABELS, ELEMENT_LABELS_KR, ELEMENT_COLORS, STATS, STAT_LABELS } from '../../types/admin';

// 숫자 포맷 (0.1 → "0.1", .1 방지)
const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  if (value === 0) return '0';
  // 소수점 이하 불필요한 0 제거하면서 표시
  return Number(value.toFixed(2)).toString();
};

// 성장 그룹별 배수 (포획 시 랜덤 부여)
const GROWTH_GROUP_MULTIPLIERS: Record<GrowthGroup, number> = {
  S: 1.0,
  A: 0.9,
  B: 0.8,
  C: 0.7,
  D: 0.6,
};

const GROWTH_GROUP_COLORS: Record<GrowthGroup, string> = {
  S: 'text-yellow-400',
  A: 'text-purple-400',
  B: 'text-blue-400',
  C: 'text-green-400',
  D: 'text-gray-400',
};

const GROWTH_GROUPS_LIST: GrowthGroup[] = ['S', 'A', 'B', 'C', 'D'];

// 빈 기본값 (입력 즉시 가능하도록)
const defaultPet: Omit<AdminPet, 'createdAt' | 'updatedAt'> = {
  id: '',
  name: '',
  element: { primary: 'earth', secondary: null, primaryRatio: 100 },
  baseStatsRange: {
    hp: { min: 0, max: 0 },
    atk: { min: 0, max: 0 },
    def: { min: 0, max: 0 },
    spd: { min: 0, max: 0 },
  },
  bonusPool: { hp: 0, atk: 0, def: 0, spd: 0 },
  growthRatesRange: {
    hp: { min: 0, max: 0 },
    atk: { min: 0, max: 0 },
    def: { min: 0, max: 0 },
    spd: { min: 0, max: 0 },
  },
  totalStats: 0,
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

  const handlePrimaryRatioChange = (value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    setFormData({
      ...formData,
      element: { ...formData.element, primaryRatio: numValue },
    });
  };

  // Validation for primary ratio
  const isValidPrimaryRatio = () => {
    const value = formData.element.primaryRatio;
    return value >= 50 && value <= 100;
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

  // 성장률: min/max 직접 입력
  const handleGrowthRateChange = (stat: keyof AdminPetGrowthRatesRange, field: 'min' | 'max', value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    const newRange = { ...formData.growthRatesRange[stat], [field]: numValue };
    setFormData({
      ...formData,
      growthRatesRange: { ...formData.growthRatesRange, [stat]: newRange },
    });
  };

  // 성장률 기준값 계산 헬퍼
  const getGrowthRateBase = (stat: keyof AdminPetGrowthRatesRange): number => {
    const range = formData.growthRatesRange[stat];
    return (range.min + range.max) / 2;
  };

  // Validation helpers
  const isValidBaseStat = (stat: keyof AdminPetBaseStatsRange, field: 'min' | 'max') => {
    const value = formData.baseStatsRange[stat][field];
    const max = stat === 'hp' ? 100 : 20;
    return value >= 0 && value <= max;
  };

  // 보너스풀 합산 계산
  const totalBonusPool = formData.bonusPool.hp + formData.bonusPool.atk + formData.bonusPool.def + formData.bonusPool.spd;
  const isValidTotalBonusPool = totalBonusPool <= 20;

  const isValidBonusPool = (stat: keyof AdminPetBonusPool) => {
    const value = formData.bonusPool[stat];
    return value >= 0 && isValidTotalBonusPool;
  };

  const isValidGrowthRate = (stat: keyof AdminPetGrowthRatesRange, field: 'min' | 'max') => {
    const value = formData.growthRatesRange[stat][field];
    const maxValue = stat === 'hp' ? 20 : 3;
    return value >= 0 && value <= maxValue;
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

  // 성장률 총합 계산 (HP 제외)
  const growthRateTotals = {
    minus: formData.growthRatesRange.atk.min + formData.growthRatesRange.def.min + formData.growthRatesRange.spd.min,
    base: getGrowthRateBase('atk') + getGrowthRateBase('def') + getGrowthRateBase('spd'),
    plus: formData.growthRatesRange.atk.max + formData.growthRatesRange.def.max + formData.growthRatesRange.spd.max,
  };

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
                            {ELEMENT_LABELS_KR[el]} ({ELEMENT_LABELS[el]})
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
                            {ELEMENT_LABELS_KR[el]} ({ELEMENT_LABELS[el]})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">주 속성 비율 (%)</label>
                      <input
                        type="number"
                        value={formData.element.secondary ? (formData.element.primaryRatio || '') : ''}
                        onChange={(e) => handlePrimaryRatioChange(e.target.value)}
                        disabled={!isEditing || !formData.element.secondary}
                        placeholder="50-100"
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-500 disabled:opacity-50 ${
                          isEditing && formData.element.secondary && !isValidPrimaryRatio() ? 'border-red-500' : 'border-gray-600'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`w-6 h-6 rounded ${ELEMENT_COLORS[formData.element.primary]} flex items-center justify-center text-white text-xs font-bold`}>
                      {ELEMENT_LABELS[formData.element.primary]}
                    </div>
                    {formData.element.secondary ? (
                      <>
                        <span className="text-gray-300 text-sm">{formData.element.primaryRatio || 0}%</span>
                        <span className="text-gray-500">+</span>
                        <div className={`w-6 h-6 rounded ${ELEMENT_COLORS[formData.element.secondary]} flex items-center justify-center text-white text-xs font-bold`}>
                          {ELEMENT_LABELS[formData.element.secondary]}
                        </div>
                        <span className="text-gray-300 text-sm">{100 - (formData.element.primaryRatio || 0)}%</span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Growth Group Preview - 등급별 실제 성장률 */}
                <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="text-sm font-medium text-gray-300 mb-3">
                    성장 그룹 미리보기 <span className="text-gray-500 font-normal">(포획 시 랜덤 부여)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-600">
                          <th className="text-left py-2 pr-4">등급</th>
                          <th className="text-center py-2 px-2">배수</th>
                          <th className="text-center py-2 px-2">HP</th>
                          <th className="text-center py-2 px-2">ATK</th>
                          <th className="text-center py-2 px-2">DEF</th>
                          <th className="text-center py-2 px-2">SPD</th>
                          <th className="text-center py-2 pl-2">총합 (HP제외)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {GROWTH_GROUPS_LIST.map((group) => {
                          const mult = GROWTH_GROUP_MULTIPLIERS[group];
                          const effectiveRates = {
                            hp: { min: formData.growthRatesRange.hp.min * mult, max: formData.growthRatesRange.hp.max * mult },
                            atk: { min: formData.growthRatesRange.atk.min * mult, max: formData.growthRatesRange.atk.max * mult },
                            def: { min: formData.growthRatesRange.def.min * mult, max: formData.growthRatesRange.def.max * mult },
                            spd: { min: formData.growthRatesRange.spd.min * mult, max: formData.growthRatesRange.spd.max * mult },
                          };
                          const totalMin = effectiveRates.atk.min + effectiveRates.def.min + effectiveRates.spd.min;
                          const totalMax = effectiveRates.atk.max + effectiveRates.def.max + effectiveRates.spd.max;
                          return (
                            <tr key={group} className="border-b border-gray-700 last:border-b-0">
                              <td className={`py-2 pr-4 font-bold ${GROWTH_GROUP_COLORS[group]}`}>{group}등급</td>
                              <td className="text-center py-2 px-2 text-gray-400">×{mult}</td>
                              <td className="text-center py-2 px-2 text-gray-300">
                                {formatNumber(effectiveRates.hp.min)}~{formatNumber(effectiveRates.hp.max)}
                              </td>
                              <td className="text-center py-2 px-2 text-gray-300">
                                {formatNumber(effectiveRates.atk.min)}~{formatNumber(effectiveRates.atk.max)}
                              </td>
                              <td className="text-center py-2 px-2 text-gray-300">
                                {formatNumber(effectiveRates.def.min)}~{formatNumber(effectiveRates.def.max)}
                              </td>
                              <td className="text-center py-2 px-2 text-gray-300">
                                {formatNumber(effectiveRates.spd.min)}~{formatNumber(effectiveRates.spd.max)}
                              </td>
                              <td className="text-center py-2 pl-2 text-gray-300">
                                {formatNumber(totalMin)}~{formatNumber(totalMax)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    * 포획 시 S~D 등급 중 하나가 랜덤 부여되며, 레벨업 시 성장률 × 배수만큼 스탯 증가
                  </p>
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

                {/* Base Stats Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">기본 스텟 범위 (HP: 0-100, 그 외: 0-20)</label>
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
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-300">보너스 풀 (합산 최대 20)</label>
                    <span className={`text-sm ${isValidTotalBonusPool ? 'text-green-400' : 'text-red-400'}`}>
                      합산: {totalBonusPool} / 20
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {STATS.map((stat) => (
                      <div key={stat}>
                        <label className="block text-xs text-gray-400 mb-1">{STAT_LABELS[stat]}</label>
                        <input
                          type="number"
                          value={formData.bonusPool[stat] || ''}
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

                {/* Growth Rates (최소 / 최대) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-300">성장률 (최소 / 최대)</label>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-red-400">{formatNumber(growthRateTotals.minus)}</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-yellow-400">{formatNumber(growthRateTotals.base)}</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-green-400">{formatNumber(growthRateTotals.plus)}</span>
                      <span className="text-gray-500 text-xs">(HP 제외 총합)</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {STATS.map((stat) => (
                      <div key={stat} className="flex items-center gap-4">
                        <label className="w-32 text-sm text-gray-400">{STAT_LABELS[stat]}</label>
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={formData.growthRatesRange[stat].min || ''}
                            onChange={(e) => handleGrowthRateChange(stat, 'min', e.target.value)}
                            disabled={!isEditing}
                            placeholder="최소"
                            className={`flex-1 px-3 py-2 bg-gray-700 border rounded-lg text-white disabled:opacity-50 ${
                              isEditing && !isValidGrowthRate(stat, 'min') ? 'border-red-500' : 'border-gray-600'
                            }`}
                          />
                          <span className="text-gray-400">~</span>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.growthRatesRange[stat].max || ''}
                            onChange={(e) => handleGrowthRateChange(stat, 'max', e.target.value)}
                            disabled={!isEditing}
                            placeholder="최대"
                            className={`flex-1 px-3 py-2 bg-gray-700 border rounded-lg text-white disabled:opacity-50 ${
                              isEditing && !isValidGrowthRate(stat, 'max') ? 'border-red-500' : 'border-gray-600'
                            }`}
                          />
                          <span className="text-xs text-gray-500 w-16 text-right">
                            ({formatNumber(getGrowthRateBase(stat))})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    HP: 0-20, 그 외: 0-3
                  </p>
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
