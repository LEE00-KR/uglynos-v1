import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';

const dashboardCards = [
  {
    title: '페트',
    icon: '🐾',
    path: '/admin/pets',
    color: 'bg-amber-600',
    dataKey: 'pets' as const,
  },
  {
    title: '스킬',
    icon: '⚔️',
    path: '/admin/skills',
    color: 'bg-red-600',
    dataKey: 'skills' as const,
  },
  {
    title: '스테이지 단계',
    icon: '🗺️',
    path: '/admin/stage-groups',
    color: 'bg-green-600',
    dataKey: 'stageGroups' as const,
  },
  {
    title: '개별 스테이지',
    icon: '🎯',
    path: '/admin/stages',
    color: 'bg-blue-600',
    dataKey: 'stages' as const,
  },
  {
    title: '상점 아이템',
    icon: '🛒',
    path: '/admin/shop',
    color: 'bg-purple-600',
    dataKey: 'shopItems' as const,
  },
];

export default function DashboardPage() {
  const { pets, skills, stageGroups, stages, shopItems, fetchPets, fetchSkills, fetchStageGroups, fetchStages, fetchShopItems, loading } = useAdminStore();

  useEffect(() => {
    fetchPets();
    fetchSkills();
    fetchStageGroups();
    fetchStages();
    fetchShopItems();
  }, [fetchPets, fetchSkills, fetchStageGroups, fetchStages, fetchShopItems]);

  const getCounts = () => ({
    pets: pets.length,
    skills: skills.length,
    stageGroups: stageGroups.length,
    stages: stages.length,
    shopItems: shopItems.length,
  });

  const counts = getCounts();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">대시보드</h1>
        <p className="text-gray-400 mt-2">Uglynos 게임 콘텐츠 관리 시스템</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">로딩 중...</div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            {dashboardCards.map((card) => (
              <Link
                key={card.path}
                to={card.path}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors border border-gray-700 hover:border-gray-600"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{card.icon}</span>
                  <span className={`${card.color} px-3 py-1 rounded-full text-sm text-white`}>
                    {counts[card.dataKey]}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="text-sm text-gray-400 mt-1">관리하기</p>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">빠른 작업</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/admin/pets?action=create"
                className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <span className="text-2xl">➕</span>
                <div>
                  <p className="text-white font-medium">새 페트 추가</p>
                  <p className="text-sm text-gray-400">페트 템플릿 생성</p>
                </div>
              </Link>
              <Link
                to="/admin/skills?action=create"
                className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <span className="text-2xl">➕</span>
                <div>
                  <p className="text-white font-medium">새 스킬 추가</p>
                  <p className="text-sm text-gray-400">스킬 컴포넌트 구성</p>
                </div>
              </Link>
              <Link
                to="/admin/stages?action=create"
                className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <span className="text-2xl">➕</span>
                <div>
                  <p className="text-white font-medium">새 스테이지 추가</p>
                  <p className="text-sm text-gray-400">몬스터 배치 설정</p>
                </div>
              </Link>
              <Link
                to="/admin/shop?action=create"
                className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <span className="text-2xl">➕</span>
                <div>
                  <p className="text-white font-medium">새 상품 추가</p>
                  <p className="text-sm text-gray-400">상점 아이템 등록</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Recent Pets */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">최근 페트</h2>
              {pets.length === 0 ? (
                <p className="text-gray-400">등록된 페트가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {pets.slice(0, 5).map((pet) => (
                    <Link
                      key={pet.id}
                      to={`/admin/pets?id=${pet.id}`}
                      className="flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                        {pet.sprites.idle ? (
                          <img src={pet.sprites.idle} alt={pet.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <span className="text-lg">🐾</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{pet.name}</p>
                        <p className="text-sm text-gray-400">{pet.id}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Skills */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">최근 스킬</h2>
              {skills.length === 0 ? (
                <p className="text-gray-400">등록된 스킬이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {skills.slice(0, 5).map((skill) => (
                    <Link
                      key={skill.id}
                      to={`/admin/skills?id=${skill.id}`}
                      className="flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                        <span className="text-lg">⚔️</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{skill.name}</p>
                        <p className="text-sm text-gray-400">기력 {skill.cost} | {skill.components.length}개 구성요소</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
