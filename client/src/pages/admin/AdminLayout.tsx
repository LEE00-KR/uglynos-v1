import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const navItems = [
  { path: '/admin', label: '대시보드', icon: '🏠', exact: true },
  { path: '/admin/pets', label: '페트 관리', icon: '🐾' },
  { path: '/admin/skills', label: '스킬 관리', icon: '⚔️' },
  { path: '/admin/stage-groups', label: '스테이지 단계', icon: '🗺️' },
  { path: '/admin/stages', label: '개별 스테이지', icon: '🎯' },
  { path: '/admin/shop', label: '상점 관리', icon: '🛒' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-primary-400">Uglynos Admin</h1>
          <p className="text-sm text-gray-400 mt-1">게임 콘텐츠 관리</p>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 border-r-2 border-primary-400'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => navigate('/game')}
            className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors mb-2"
          >
            게임으로 돌아가기
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
