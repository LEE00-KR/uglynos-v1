import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import type { AdminStage, StageMonster, WildPet, MonsterStats, StageDrop, StarCondition3Type, DropItemType } from '../../types/admin';
import { STATS, STAT_LABELS, STAR_CONDITION_3_TYPES, DROP_ITEM_TYPES } from '../../types/admin';

const defaultStage: Omit<AdminStage, 'createdAt' | 'updatedAt'> = {
  id: '',
  name: '',
  background: '',
  monsters: [],
  wildPets: [],
  expReward: 100,
  goldReward: 50,
  starConditions: {
    star2Turns: 0,
    star3Type: 'none',
    star3Value: 0,
  },
  drops: [],
};

const defaultMonsterStats: MonsterStats = {
  hp: 100,
  atk: 10,
  def: 10,
  spd: 10,
};

const MONSTER_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function StageManagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    stages,
    pets,
    skills,
    fetchStages,
    fetchPets,
    fetchSkills,
    createStage,
    updateStage,
    deleteStage,
    loading,
  } = useAdminStore();

  const [selectedStage, setSelectedStage] = useState<AdminStage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<AdminStage, 'createdAt' | 'updatedAt'>>(defaultStage);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchStages();
    fetchPets();
    fetchSkills();
  }, [fetchStages, fetchPets, fetchSkills]);

  useEffect(() => {
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (action === 'create') {
      setIsEditing(true);
      setSelectedStage(null);
      setFormData(defaultStage);
    } else if (id) {
      const stage = stages.find((s) => s.id === id);
      if (stage) {
        setSelectedStage(stage);
        setFormData(stage);
      }
    }
  }, [searchParams, stages]);

  const handleSelectStage = (stage: AdminStage) => {
    setSelectedStage(stage);
    setFormData(stage);
    setIsEditing(false);
    setSearchParams({ id: stage.id });
  };

  const handleCreate = () => {
    setIsEditing(true);
    setSelectedStage(null);
    setFormData(defaultStage);
    setSearchParams({ action: 'create' });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (selectedStage) {
      setFormData(selectedStage);
    } else {
      setSearchParams({});
    }
  };

  const handleSave = async () => {
    try {
      if (selectedStage) {
        await updateStage(selectedStage.id, formData);
      } else {
        const newId = await createStage(formData);
        setSearchParams({ id: newId });
      }
      setIsEditing(false);
    } catch {
      // Error is handled in store
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm && selectedStage) {
      try {
        await deleteStage(selectedStage.id);
        setSelectedStage(null);
        setFormData(defaultStage);
        setSearchParams({});
        setDeleteConfirm(null);
      } catch {
        // Error is handled in store
      }
    }
  };

  // Monster management
  const addMonster = () => {
    const usedSlots = formData.monsters.map((m) => m.slot);
    const availableSlot = MONSTER_SLOTS.find((s) => !usedSlots.includes(s));
    if (!availableSlot || formData.monsters.length >= 10) return;

    const newMonster: StageMonster = {
      petId: pets[0]?.id || '',
      slot: availableSlot,
      level: 1,
      stats: { ...defaultMonsterStats },
      skills: ['attack', 'defend'],
    };

    setFormData({ ...formData, monsters: [...formData.monsters, newMonster] });
  };

  const updateMonster = (index: number, updates: Partial<StageMonster>) => {
    const newMonsters = [...formData.monsters];
    newMonsters[index] = { ...newMonsters[index], ...updates };
    setFormData({ ...formData, monsters: newMonsters });
  };

  const removeMonster = (index: number) => {
    const newMonsters = [...formData.monsters];
    newMonsters.splice(index, 1);
    setFormData({ ...formData, monsters: newMonsters });
  };

  const calculateStats = (petId: string, level: number): MonsterStats => {
    const pet = pets.find((p) => p.id === petId);
    if (!pet) return defaultMonsterStats;

    // Use average of min/max for base stats and growth rates
    const baseHp = (pet.baseStatsRange.hp.min + pet.baseStatsRange.hp.max) / 2;
    const baseAtk = (pet.baseStatsRange.atk.min + pet.baseStatsRange.atk.max) / 2;
    const baseDef = (pet.baseStatsRange.def.min + pet.baseStatsRange.def.max) / 2;
    const baseSpd = (pet.baseStatsRange.spd.min + pet.baseStatsRange.spd.max) / 2;

    const growthHp = (pet.growthRatesRange.hp.min + pet.growthRatesRange.hp.max) / 2;
    const growthAtk = (pet.growthRatesRange.atk.min + pet.growthRatesRange.atk.max) / 2;
    const growthDef = (pet.growthRatesRange.def.min + pet.growthRatesRange.def.max) / 2;
    const growthSpd = (pet.growthRatesRange.spd.min + pet.growthRatesRange.spd.max) / 2;

    return {
      hp: Math.round(baseHp + growthHp * (level - 1)),
      atk: Math.round(baseAtk + growthAtk * (level - 1)),
      def: Math.round(baseDef + growthDef * (level - 1)),
      spd: Math.round(baseSpd + growthSpd * (level - 1)),
    };
  };

  const autoCalculateStats = (index: number) => {
    const monster = formData.monsters[index];
    const newStats = calculateStats(monster.petId, monster.level);
    updateMonster(index, { stats: newStats });
  };

  // Wild pet management
  const addWildPet = () => {
    if (formData.wildPets.length >= 2) return;

    const newWildPet: WildPet = {
      petId: pets[0]?.id || '',
      spawnRate: 30,
    };

    setFormData({ ...formData, wildPets: [...formData.wildPets, newWildPet] });
  };

  const updateWildPet = (index: number, updates: Partial<WildPet>) => {
    const newWildPets = [...formData.wildPets];
    newWildPets[index] = { ...newWildPets[index], ...updates };
    setFormData({ ...formData, wildPets: newWildPets });
  };

  const removeWildPet = (index: number) => {
    const newWildPets = [...formData.wildPets];
    newWildPets.splice(index, 1);
    setFormData({ ...formData, wildPets: newWildPets });
  };

  // Drop management
  const addDrop = () => {
    const newDrop: StageDrop = {
      itemId: '',
      itemType: 'material',
      dropRate: 30,
      minQty: 1,
      maxQty: 1,
    };
    setFormData({ ...formData, drops: [...formData.drops, newDrop] });
  };

  const updateDrop = (index: number, updates: Partial<StageDrop>) => {
    const newDrops = [...formData.drops];
    newDrops[index] = { ...newDrops[index], ...updates };
    setFormData({ ...formData, drops: newDrops });
  };

  const removeDrop = (index: number) => {
    const newDrops = [...formData.drops];
    newDrops.splice(index, 1);
    setFormData({ ...formData, drops: newDrops });
  };

  const getSkillName = (skillId: string) => {
    if (skillId === 'attack') return '공격';
    if (skillId === 'defend') return '방어';
    const skill = skills.find((s) => s.id === skillId);
    return skill?.name || skillId;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">개별 스테이지 관리</h1>
          <p className="text-gray-400 mt-2">몬스터 배치 및 야생 페트 출현 설정</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          + 새 스테이지 추가
        </button>
      </div>

      <div className="flex gap-8">
        {/* Stage List */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">스테이지 목록</h2>
              <p className="text-sm text-gray-400">{stages.length}개</p>
            </div>
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {loading && stages.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">로딩 중...</div>
              ) : stages.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">등록된 스테이지가 없습니다.</div>
              ) : (
                stages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => handleSelectStage(stage)}
                    className={`w-full p-4 text-left border-b border-gray-700 last:border-b-0 transition-colors ${
                      selectedStage?.id === stage.id
                        ? 'bg-primary-600/20 border-l-2 border-l-primary-400'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <p className="text-white font-medium">{stage.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      몬스터 {stage.monsters.length}마리 | 야생 페트 {stage.wildPets.length}종
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stage Detail / Edit Form */}
        <div className="flex-1">
          {selectedStage || isEditing ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    {isEditing ? (selectedStage ? '스테이지 수정' : '새 스테이지 등록') : '스테이지 상세'}
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
                          onClick={() => setDeleteConfirm(selectedStage?.id || null)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">ID</label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      disabled={!isEditing || !!selectedStage}
                      placeholder="stage_001 (자동 생성)"
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
                      placeholder="예: 초원 입구"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">전투 배경 이미지</label>
                  {/* Preview */}
                  <div className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center overflow-hidden mb-2">
                    {formData.background ? (
                      <img
                        src={formData.background}
                        alt="배경 미리보기"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">미리보기</span>
                    )}
                  </div>
                  {/* File Upload */}
                  {isEditing && (
                    <label className="block mb-2">
                      <span className="sr-only">파일 선택</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const base64 = ev.target?.result as string;
                              setFormData({ ...formData, background: base64 });
                            };
                            reader.readAsDataURL(file);
                          }
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
                  <input
                    type="text"
                    value={formData.background}
                    onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                    disabled={!isEditing}
                    placeholder="또는 URL 입력"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 text-sm"
                  />
                </div>
              </div>

              {/* Rewards & Star Conditions */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">보상 및 별 조건</h3>

                {/* Rewards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">경험치 보상</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.expReward}
                      onChange={(e) => setFormData({ ...formData, expReward: parseInt(e.target.value) || 0 })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">골드 보상</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.goldReward}
                      onChange={(e) => setFormData({ ...formData, goldReward: parseInt(e.target.value) || 0 })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Star Conditions */}
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">별 조건 (1성: 클리어 시 자동 획득)</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">2성 조건: N턴 이내 클리어</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.starConditions.star2Turns}
                        onChange={(e) => setFormData({
                          ...formData,
                          starConditions: { ...formData.starConditions, star2Turns: parseInt(e.target.value) || 0 }
                        })}
                        disabled={!isEditing}
                        placeholder="0 = 비활성화"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">0으로 설정 시 2성 조건 비활성화</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">3성 조건</label>
                      <select
                        value={formData.starConditions.star3Type}
                        onChange={(e) => setFormData({
                          ...formData,
                          starConditions: { ...formData.starConditions, star3Type: e.target.value as StarCondition3Type }
                        })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                      >
                        {STAR_CONDITION_3_TYPES.map((cond) => (
                          <option key={cond.value} value={cond.value}>
                            {cond.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {STAR_CONDITION_3_TYPES.find(c => c.value === formData.starConditions.star3Type)?.hasValue && (
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">3성 조건 수치</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.starConditions.star3Value}
                        onChange={(e) => setFormData({
                          ...formData,
                          starConditions: { ...formData.starConditions, star3Value: parseInt(e.target.value) || 0 }
                        })}
                        disabled={!isEditing}
                        placeholder="예: 체력 80% 이상, 스킬 3회 사용"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Drop Table */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">드롭 테이블</h3>
                  {isEditing && (
                    <button
                      onClick={addDrop}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      + 드롭 아이템 추가
                    </button>
                  )}
                </div>

                {formData.drops.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">설정된 드롭 아이템이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {formData.drops.map((drop, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-700 rounded-lg">
                        <div className="flex-1 grid grid-cols-5 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">아이템 ID</label>
                            <input
                              type="text"
                              value={drop.itemId}
                              onChange={(e) => updateDrop(index, { itemId: e.target.value })}
                              disabled={!isEditing}
                              placeholder="item_001"
                              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">타입</label>
                            <select
                              value={drop.itemType}
                              onChange={(e) => updateDrop(index, { itemType: e.target.value as DropItemType })}
                              disabled={!isEditing}
                              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                            >
                              {DROP_ITEM_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">드롭률 (%)</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={drop.dropRate}
                              onChange={(e) => updateDrop(index, { dropRate: parseInt(e.target.value) || 1 })}
                              disabled={!isEditing}
                              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">최소 수량</label>
                            <input
                              type="number"
                              min="1"
                              value={drop.minQty}
                              onChange={(e) => updateDrop(index, { minQty: parseInt(e.target.value) || 1 })}
                              disabled={!isEditing}
                              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">최대 수량</label>
                            <input
                              type="number"
                              min="1"
                              value={drop.maxQty}
                              onChange={(e) => updateDrop(index, { maxQty: parseInt(e.target.value) || 1 })}
                              disabled={!isEditing}
                              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                            />
                          </div>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => removeDrop(index)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Monster Configuration */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">몬스터 배치 ({formData.monsters.length}/10)</h3>
                  {isEditing && formData.monsters.length < 10 && (
                    <button
                      onClick={addMonster}
                      disabled={pets.length === 0}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      + 몬스터 추가
                    </button>
                  )}
                </div>

                {pets.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    먼저 페트를 등록해주세요. 페트가 몬스터로 사용됩니다.
                  </p>
                ) : formData.monsters.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">배치된 몬스터가 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {formData.monsters
                      .sort((a, b) => a.slot - b.slot)
                      .map((monster, index) => (
                        <div key={index} className="p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-4 mb-4">
                            <span className="w-8 h-8 flex items-center justify-center bg-red-600 rounded-full text-white font-bold">
                              {monster.slot}
                            </span>

                            <div className="flex-1 grid grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">페트</label>
                                <select
                                  value={monster.petId}
                                  onChange={(e) => updateMonster(index, { petId: e.target.value })}
                                  disabled={!isEditing}
                                  className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                                >
                                  {pets.map((pet) => (
                                    <option key={pet.id} value={pet.id}>
                                      {pet.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs text-gray-400 mb-1">슬롯</label>
                                <select
                                  value={monster.slot}
                                  onChange={(e) => updateMonster(index, { slot: parseInt(e.target.value) })}
                                  disabled={!isEditing}
                                  className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                                >
                                  {MONSTER_SLOTS.map((slot) => (
                                    <option
                                      key={slot}
                                      value={slot}
                                      disabled={formData.monsters.some((m, i) => i !== index && m.slot === slot)}
                                    >
                                      슬롯 {slot}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-400 mb-1">레벨</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={monster.level}
                                    onChange={(e) => updateMonster(index, { level: parseInt(e.target.value) || 1 })}
                                    disabled={!isEditing}
                                    className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                                  />
                                </div>
                                {isEditing && (
                                  <button
                                    onClick={() => autoCalculateStats(index)}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                    title="레벨에 따라 스텟 자동 계산"
                                  >
                                    계산
                                  </button>
                                )}
                              </div>
                            </div>

                            {isEditing && (
                              <button
                                onClick={() => removeMonster(index)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-5 gap-3 mb-4">
                            {STATS.map((stat) => (
                              <div key={stat}>
                                <label className="block text-xs text-gray-400 mb-1">{STAT_LABELS[stat]}</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={monster.stats[stat]}
                                  onChange={(e) =>
                                    updateMonster(index, {
                                      stats: { ...monster.stats, [stat]: parseInt(e.target.value) || 1 },
                                    })
                                  }
                                  disabled={!isEditing}
                                  className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Skills */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">스킬</label>
                            <div className="flex flex-wrap gap-2">
                              {monster.skills.map((skillId, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className="px-2 py-1 bg-gray-600 rounded text-sm text-white"
                                >
                                  {getSkillName(skillId)}
                                  {isEditing && skillId !== 'attack' && skillId !== 'defend' && (
                                    <button
                                      onClick={() => {
                                        const newSkills = [...monster.skills];
                                        newSkills.splice(skillIndex, 1);
                                        updateMonster(index, { skills: newSkills });
                                      }}
                                      className="ml-1 text-red-400 hover:text-red-300"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </span>
                              ))}
                              {isEditing && (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value && !monster.skills.includes(e.target.value)) {
                                      updateMonster(index, { skills: [...monster.skills, e.target.value] });
                                    }
                                    e.target.value = '';
                                  }}
                                  className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                                >
                                  <option value="">+ 스킬 추가</option>
                                  {skills
                                    .filter((s) => !monster.skills.includes(s.id))
                                    .map((skill) => (
                                      <option key={skill.id} value={skill.id}>
                                        {skill.name}
                                      </option>
                                    ))}
                                </select>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Wild Pet Configuration */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">출현 페트 ({formData.wildPets.length}/2)</h3>
                  {isEditing && formData.wildPets.length < 2 && (
                    <button
                      onClick={addWildPet}
                      disabled={pets.length === 0}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      + 야생 페트 추가
                    </button>
                  )}
                </div>

                {formData.wildPets.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">설정된 야생 페트가 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {formData.wildPets.map((wildPet, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-700 rounded-lg">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">페트</label>
                            <select
                              value={wildPet.petId}
                              onChange={(e) => updateWildPet(index, { petId: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                            >
                              {pets.map((pet) => (
                                <option key={pet.id} value={pet.id}>
                                  {pet.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">출현률 (%)</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={wildPet.spawnRate}
                              onChange={(e) => updateWildPet(index, { spawnRate: parseInt(e.target.value) || 1 })}
                              disabled={!isEditing}
                              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                            />
                          </div>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => removeWildPet(index)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Battle Layout Reference */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">전투 배치 레이아웃 (참조)</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">적 배치 (왼쪽, 지그재그)</p>
                    <pre className="text-xs text-gray-300 bg-gray-700 p-3 rounded font-mono">
{`      [적6]  [적1]      ← 1열
   [적7]  [적2]         ← 2열
      [적8]  [적3]      ← 3열
   [적9]  [적4]         ← 4열
      [적10] [적5]      ← 5열`}
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">아군 배치 (오른쪽)</p>
                    <pre className="text-xs text-gray-300 bg-gray-700 p-3 rounded font-mono">
{`솔로:
           [페트1]
[대표페트]  [캐릭터]
           [페트3]

파티:
[페트1]  [파티원1]
[페트2]  [파티원2]
  ...       ...`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">좌측 목록에서 스테이지를 선택하거나 새 스테이지를 추가하세요.</p>
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
              이 스테이지를 삭제하시겠습니까? 스테이지 단계에서도 제거됩니다.
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
