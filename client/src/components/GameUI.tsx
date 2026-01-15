import { useGameStore } from '../stores/gameStore';

export default function GameUI() {
  const character = useGameStore((state) => state.character);
  const isBattling = useGameStore((state) => state.isBattling);

  if (!character) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start pointer-events-auto">
        {/* Character Info */}
        <div className="bg-black/70 rounded-lg p-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold">{character.nickname}</span>
            <span className="text-gray-400">Lv.{character.level}</span>
          </div>
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <span className="text-red-400">HP</span>
              <div className="w-24 h-2 bg-gray-700 rounded">
                <div
                  className="h-full bg-red-500 rounded"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">MP</span>
              <div className="w-24 h-2 bg-gray-700 rounded">
                <div
                  className="h-full bg-blue-500 rounded"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mini Menu */}
        <div className="flex gap-2">
          <button className="bg-black/70 rounded-lg px-3 py-1 text-sm hover:bg-black/90">
            메뉴
          </button>
        </div>
      </div>

      {/* Battle UI */}
      {isBattling && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
          <div className="flex justify-center gap-4">
            <button className="btn btn-primary">공격</button>
            <button className="btn btn-secondary">방어</button>
            <button className="btn btn-secondary">주술</button>
            <button className="btn btn-secondary">아이템</button>
            <button className="btn btn-secondary">포획</button>
            <button className="btn btn-secondary text-red-400">도망</button>
          </div>
        </div>
      )}
    </div>
  );
}
