import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import type { AdminStageGroup, StagePosition } from '../../types/admin';

const defaultStageGroup: Omit<AdminStageGroup, 'createdAt' | 'updatedAt'> = {
  id: '',
  name: '',
  background: '',
  stages: [],
};

export default function StageGroupManagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { stageGroups, stages, fetchStageGroups, fetchStages, createStageGroup, updateStageGroup, deleteStageGroup, loading } = useAdminStore();

  const [selectedGroup, setSelectedGroup] = useState<AdminStageGroup | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<AdminStageGroup, 'createdAt' | 'updatedAt'>>(defaultStageGroup);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isPlacingStage, setIsPlacingStage] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>('');

  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStageGroups();
    fetchStages();
  }, [fetchStageGroups, fetchStages]);

  useEffect(() => {
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (action === 'create') {
      setIsEditing(true);
      setSelectedGroup(null);
      setFormData(defaultStageGroup);
    } else if (id) {
      const group = stageGroups.find((g) => g.id === id);
      if (group) {
        setSelectedGroup(group);
        setFormData(group);
      }
    }
  }, [searchParams, stageGroups]);

  const handleSelectGroup = (group: AdminStageGroup) => {
    setSelectedGroup(group);
    setFormData(group);
    setIsEditing(false);
    setSearchParams({ id: group.id });
  };

  const handleCreate = () => {
    setIsEditing(true);
    setSelectedGroup(null);
    setFormData(defaultStageGroup);
    setSearchParams({ action: 'create' });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsPlacingStage(false);
    if (selectedGroup) {
      setFormData(selectedGroup);
    } else {
      setSearchParams({});
    }
  };

  const handleSave = async () => {
    try {
      if (selectedGroup) {
        await updateStageGroup(selectedGroup.id, formData);
      } else {
        const newId = await createStageGroup(formData);
        setSearchParams({ id: newId });
      }
      setIsEditing(false);
    } catch {
      // Error is handled in store
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm && selectedGroup) {
      try {
        await deleteStageGroup(selectedGroup.id);
        setSelectedGroup(null);
        setFormData(defaultStageGroup);
        setSearchParams({});
        setDeleteConfirm(null);
      } catch {
        // Error is handled in store
      }
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing || !isPlacingStage || !selectedStageId) return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    const existingIndex = formData.stages.findIndex((s) => s.stageId === selectedStageId);
    const newOrder = existingIndex >= 0
      ? formData.stages[existingIndex].order
      : Math.max(0, ...formData.stages.map((s) => s.order)) + 1;

    const newPosition: StagePosition = {
      stageId: selectedStageId,
      x,
      y,
      order: newOrder,
    };

    if (existingIndex >= 0) {
      const newStages = [...formData.stages];
      newStages[existingIndex] = newPosition;
      setFormData({ ...formData, stages: newStages });
    } else {
      setFormData({ ...formData, stages: [...formData.stages, newPosition] });
    }

    setIsPlacingStage(false);
    setSelectedStageId('');
  };

  const removeStage = (stageId: string) => {
    setFormData({
      ...formData,
      stages: formData.stages.filter((s) => s.stageId !== stageId),
    });
  };

  const updateStageOrder = (stageId: string, newOrder: number) => {
    setFormData({
      ...formData,
      stages: formData.stages.map((s) =>
        s.stageId === stageId ? { ...s, order: newOrder } : s
      ),
    });
  };

  const getStageName = (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    return stage?.name || stageId;
  };

  const availableStages = stages.filter(
    (stage) => !formData.stages.some((s) => s.stageId === stage.id)
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">스테이지 단계 관리</h1>
          <p className="text-gray-400 mt-2">맵 배경 및 스테이지 배치 관리</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          + 새 단계 추가
        </button>
      </div>

      <div className="flex gap-8">
        {/* Stage Group List */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">단계 목록</h2>
              <p className="text-sm text-gray-400">{stageGroups.length}개</p>
            </div>
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {loading && stageGroups.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">로딩 중...</div>
              ) : stageGroups.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">등록된 단계가 없습니다.</div>
              ) : (
                stageGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className={`w-full p-4 text-left border-b border-gray-700 last:border-b-0 transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'bg-primary-600/20 border-l-2 border-l-primary-400'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <p className="text-white font-medium">{group.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{group.stages.length}개 스테이지</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stage Group Detail / Edit Form */}
        <div className="flex-1">
          {selectedGroup || isEditing ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    {isEditing ? (selectedGroup ? '단계 수정' : '새 단계 등록') : '단계 상세'}
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
                          onClick={() => setDeleteConfirm(selectedGroup?.id || null)}
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
                      disabled={!isEditing || !!selectedGroup}
                      placeholder="group_001 (자동 생성)"
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
                      placeholder="예: 초원 지역"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">배경 이미지 URL</label>
                  <input
                    type="text"
                    value={formData.background}
                    onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                    disabled={!isEditing}
                    placeholder="/backgrounds/grassland_map.png"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Map Preview */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">맵 미리보기</h3>
                  {isEditing && (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedStageId}
                        onChange={(e) => setSelectedStageId(e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      >
                        <option value="">스테이지 선택...</option>
                        {availableStages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setIsPlacingStage(true)}
                        disabled={!selectedStageId}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        배치하기
                      </button>
                    </div>
                  )}
                </div>

                {isPlacingStage && (
                  <div className="mb-4 p-3 bg-green-600/20 border border-green-500 rounded-lg text-green-300">
                    맵을 클릭하여 "{getStageName(selectedStageId)}" 스테이지를 배치하세요.
                  </div>
                )}

                <div
                  ref={mapRef}
                  onClick={handleMapClick}
                  className={`relative w-full h-96 bg-gray-700 rounded-lg overflow-hidden ${
                    isPlacingStage ? 'cursor-crosshair' : ''
                  }`}
                  style={{
                    backgroundImage: formData.background ? `url(${formData.background})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!formData.background && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      배경 이미지를 설정하세요
                    </div>
                  )}

                  {/* Stage Markers */}
                  {formData.stages.map((stagePos) => (
                    <div
                      key={stagePos.stageId}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                      style={{ left: stagePos.x, top: stagePos.y }}
                    >
                      <div className="w-10 h-10 bg-primary-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        {stagePos.order}
                      </div>
                      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {getStageName(stagePos.stageId)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage List */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">배치된 스테이지</h3>
                {formData.stages.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">배치된 스테이지가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {[...formData.stages]
                      .sort((a, b) => a.order - b.order)
                      .map((stagePos) => (
                        <div
                          key={stagePos.stageId}
                          className="flex items-center gap-4 p-3 bg-gray-700 rounded-lg"
                        >
                          <span className="w-8 h-8 flex items-center justify-center bg-primary-600 rounded-full text-white font-bold">
                            {stagePos.order}
                          </span>
                          <div className="flex-1">
                            <p className="text-white font-medium">{getStageName(stagePos.stageId)}</p>
                            <p className="text-xs text-gray-400">
                              좌표: ({stagePos.x}, {stagePos.y})
                            </p>
                          </div>
                          {isEditing && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                value={stagePos.order}
                                onChange={(e) => updateStageOrder(stagePos.stageId, parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-center"
                              />
                              <button
                                onClick={() => removeStage(stagePos.stageId)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">좌측 목록에서 단계를 선택하거나 새 단계를 추가하세요.</p>
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
              이 스테이지 단계를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
