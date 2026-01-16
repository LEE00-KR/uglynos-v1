import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import type { AdminSkill, SkillComponent, SkillComponentType, SpellType } from '../../types/admin';
import { SKILL_COMPONENT_TYPES, SPELL_TYPES } from '../../types/admin';

const defaultSkill: Omit<AdminSkill, 'createdAt' | 'updatedAt'> = {
  id: '',
  name: '',
  cost: 0,
  components: [],
};

export default function SkillManagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { skills, fetchSkills, createSkill, updateSkill, deleteSkill, loading } = useAdminStore();

  const [selectedSkill, setSelectedSkill] = useState<AdminSkill | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<AdminSkill, 'createdAt' | 'updatedAt'>>(defaultSkill);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  useEffect(() => {
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (action === 'create') {
      setIsEditing(true);
      setSelectedSkill(null);
      setFormData(defaultSkill);
    } else if (id) {
      const skill = skills.find((s) => s.id === id);
      if (skill) {
        setSelectedSkill(skill);
        setFormData(skill);
      }
    }
  }, [searchParams, skills]);

  const handleSelectSkill = (skill: AdminSkill) => {
    setSelectedSkill(skill);
    setFormData(skill);
    setIsEditing(false);
    setSearchParams({ id: skill.id });
  };

  const handleCreate = () => {
    setIsEditing(true);
    setSelectedSkill(null);
    setFormData(defaultSkill);
    setSearchParams({ action: 'create' });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (selectedSkill) {
      setFormData(selectedSkill);
    } else {
      setSearchParams({});
    }
  };

  const handleSave = async () => {
    try {
      if (selectedSkill) {
        await updateSkill(selectedSkill.id, formData);
      } else {
        const newId = await createSkill(formData);
        setSearchParams({ id: newId });
      }
      setIsEditing(false);
    } catch {
      // Error is handled in store
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm && selectedSkill) {
      try {
        await deleteSkill(selectedSkill.id);
        setSelectedSkill(null);
        setFormData(defaultSkill);
        setSearchParams({});
        setDeleteConfirm(null);
      } catch {
        // Error is handled in store
      }
    }
  };

  // Component management
  const addComponent = (type: SkillComponentType) => {
    const newComponent: SkillComponent = { type };
    if (type === 'attackPercent' || type === 'dodgePercent') {
      newComponent.percent = 100;
    }
    if (type === 'spell') {
      newComponent.spellType = 'poison';
    }
    setFormData({
      ...formData,
      components: [...formData.components, newComponent],
    });
  };

  const removeComponent = (index: number) => {
    const newComponents = [...formData.components];
    newComponents.splice(index, 1);
    setFormData({ ...formData, components: newComponents });
  };

  const moveComponent = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.components.length) return;

    const newComponents = [...formData.components];
    [newComponents[index], newComponents[newIndex]] = [newComponents[newIndex], newComponents[index]];
    setFormData({ ...formData, components: newComponents });
  };

  const updateComponent = (index: number, updates: Partial<SkillComponent>) => {
    const newComponents = [...formData.components];
    newComponents[index] = { ...newComponents[index], ...updates };
    setFormData({ ...formData, components: newComponents });
  };

  const getComponentLabel = (component: SkillComponent) => {
    const typeInfo = SKILL_COMPONENT_TYPES.find((t) => t.value === component.type);
    if (!typeInfo) return component.type;

    if (component.type === 'attackPercent' || component.type === 'dodgePercent') {
      return `${typeInfo.label} ${component.percent}%`;
    }
    if (component.type === 'spell') {
      const spellInfo = SPELL_TYPES.find((s) => s.value === component.spellType);
      return `${typeInfo.label}: ${spellInfo?.label || component.spellType}`;
    }
    return typeInfo.label;
  };

  const getSkillPreview = () => {
    if (formData.components.length === 0) return '(비어 있음)';
    return formData.components.map((c) => getComponentLabel(c)).join(' + ');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">스킬 관리</h1>
          <p className="text-gray-400 mt-2">스킬 구성요소 조합 및 관리</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          + 새 스킬 추가
        </button>
      </div>

      <div className="flex gap-8">
        {/* Skill List */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">스킬 목록</h2>
              <p className="text-sm text-gray-400">{skills.length}개</p>
            </div>
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {loading && skills.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">로딩 중...</div>
              ) : skills.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">등록된 스킬이 없습니다.</div>
              ) : (
                skills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => handleSelectSkill(skill)}
                    className={`w-full p-4 text-left border-b border-gray-700 last:border-b-0 transition-colors ${
                      selectedSkill?.id === skill.id
                        ? 'bg-primary-600/20 border-l-2 border-l-primary-400'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <div>
                      <p className="text-white font-medium">{skill.name}</p>
                      <p className="text-xs text-gray-400 mt-1">기력 {skill.cost} | {skill.components.length}개 구성요소</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Skill Detail / Edit Form */}
        <div className="flex-1">
          {selectedSkill || isEditing ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? (selectedSkill ? '스킬 수정' : '새 스킬 등록') : '스킬 상세'}
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
                        onClick={() => setDeleteConfirm(selectedSkill?.id || null)}
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
                      disabled={!isEditing || !!selectedSkill}
                      placeholder="skill_001 (자동 생성)"
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
                      placeholder="스킬 이름"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">소모 기력</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                    disabled={!isEditing}
                    className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                  />
                </div>

                {/* Skill Preview */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">스킬 미리보기</label>
                  <p className="text-white text-lg font-medium">
                    [{formData.name || '이름 없음'}] = {getSkillPreview()}
                  </p>
                </div>

                {/* Components */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">구성 요소</label>

                  {/* Component List */}
                  <div className="space-y-3 mb-4">
                    {formData.components.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">구성 요소를 추가해주세요.</p>
                    ) : (
                      formData.components.map((component, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg"
                        >
                          <span className="w-6 h-6 flex items-center justify-center bg-gray-600 rounded text-xs text-white">
                            {index + 1}
                          </span>

                          <div className="flex-1">
                            <select
                              value={component.type}
                              onChange={(e) => {
                                const newType = e.target.value as SkillComponentType;
                                const updates: Partial<SkillComponent> = { type: newType };
                                if (newType === 'attackPercent' || newType === 'dodgePercent') {
                                  updates.percent = component.percent || 100;
                                  delete updates.spellType;
                                } else if (newType === 'spell') {
                                  updates.spellType = component.spellType || 'poison';
                                  delete updates.percent;
                                } else {
                                  delete updates.percent;
                                  delete updates.spellType;
                                }
                                updateComponent(index, updates);
                              }}
                              disabled={!isEditing}
                              className="px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                            >
                              {SKILL_COMPONENT_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>

                            {(component.type === 'attackPercent' || component.type === 'dodgePercent') && (
                              <input
                                type="number"
                                min="1"
                                value={component.percent || 100}
                                onChange={(e) => updateComponent(index, { percent: parseInt(e.target.value) || 100 })}
                                disabled={!isEditing}
                                className="ml-2 w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                              />
                            )}

                            {component.type === 'spell' && (
                              <select
                                value={component.spellType || 'poison'}
                                onChange={(e) => updateComponent(index, { spellType: e.target.value as SpellType })}
                                disabled={!isEditing}
                                className="ml-2 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50"
                              >
                                {SPELL_TYPES.map((spell) => (
                                  <option key={spell.value} value={spell.value}>
                                    {spell.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {isEditing && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => moveComponent(index, 'up')}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => moveComponent(index, 'down')}
                                disabled={index === formData.components.length - 1}
                                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                              >
                                ▼
                              </button>
                              <button
                                onClick={() => removeComponent(index)}
                                className="p-1 text-red-400 hover:text-red-300"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Component Buttons */}
                  {isEditing && (
                    <div className="flex flex-wrap gap-2">
                      {SKILL_COMPONENT_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => addComponent(type.value)}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                        >
                          + {type.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Spell Types Reference */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-3">주술(상태이상) 참조</label>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {SPELL_TYPES.map((spell) => (
                      <div key={spell.value} className="text-gray-400">
                        <span className="text-white">{spell.label}</span>: {spell.description}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">좌측 목록에서 스킬을 선택하거나 새 스킬을 추가하세요.</p>
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
              이 스킬을 삭제하시겠습니까? 이 스킬을 사용하는 페트에서도 제거됩니다.
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
