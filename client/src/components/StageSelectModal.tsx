import { useState } from 'react';
import { getSocket } from '../services/socket';

interface StageSelectModalProps {
  onClose: () => void;
}

interface Stage {
  id: number;
  name: string;
  level: string;
  unlocked: boolean;
  icon: string;
  description: string;
  bossStages: number[];
}

const stages: Stage[] = [
  {
    id: 1,
    name: '숲의 입구',
    level: '1-3',
    unlocked: true,
    icon: '🌲',
    description: '원시림의 입구. 약한 몬스터들이 서식합니다.',
    bossStages: [3],
  },
  {
    id: 2,
    name: '깊은 숲',
    level: '4-7',
    unlocked: true,
    icon: '🌳',
    description: '울창한 숲 속. 더 강한 몬스터들이 나타납니다.',
    bossStages: [7],
  },
  {
    id: 3,
    name: '동굴 입구',
    level: '8-12',
    unlocked: true,
    icon: '🕳️',
    description: '어두운 동굴의 입구. 주의가 필요합니다.',
    bossStages: [12],
  },
  {
    id: 4,
    name: '수정 동굴',
    level: '13-18',
    unlocked: true,
    icon: '💎',
    description: '신비로운 수정이 빛나는 동굴입니다.',
    bossStages: [18],
  },
  {
    id: 5,
    name: '용암 지대',
    level: '19-25',
    unlocked: true,
    icon: '🌋',
    description: '뜨거운 용암이 흐르는 위험한 지역입니다.',
    bossStages: [25],
  },
  {
    id: 6,
    name: '???',
    level: '???',
    unlocked: false,
    icon: '❓',
    description: '아직 개방되지 않은 미지의 영역입니다.',
    bossStages: [],
  },
];

export default function StageSelectModal({ onClose }: StageSelectModalProps) {
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartBattle = () => {
    if (!selectedStage || !selectedStage.unlocked) return;

    const socket = getSocket();
    if (socket) {
      setIsLoading(true);
      socket.emit('battle:start', { stageId: selectedStage.id });

      // Close modal after a short delay (battle will start via socket event)
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl w-[700px] max-h-[90vh] border border-slate-600 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">모험하러 가기</h2>
            <p className="text-sm text-slate-300">스테이지를 선택하세요</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl hover:bg-slate-600 rounded-lg w-10 h-10 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex">
          {/* Stage List */}
          <div className="w-1/2 p-4 border-r border-slate-700 max-h-[400px] overflow-y-auto">
            <div className="space-y-2">
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => stage.unlocked && setSelectedStage(stage)}
                  disabled={!stage.unlocked}
                  className={`w-full p-3 rounded-lg text-left flex items-center gap-3 transition-all ${
                    selectedStage?.id === stage.id
                      ? 'bg-emerald-600/50 border-2 border-emerald-400'
                      : stage.unlocked
                      ? 'bg-slate-700/50 hover:bg-slate-700 border-2 border-transparent'
                      : 'bg-slate-800/50 opacity-50 cursor-not-allowed border-2 border-transparent'
                  }`}
                >
                  <span className="text-2xl">{stage.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${stage.unlocked ? 'text-white' : 'text-slate-500'}`}>
                        {stage.name}
                      </span>
                      {!stage.unlocked && <span className="text-sm">🔒</span>}
                    </div>
                    <div className={`text-sm ${stage.unlocked ? 'text-emerald-400' : 'text-slate-600'}`}>
                      Lv.{stage.level}
                    </div>
                  </div>
                  {stage.bossStages.length > 0 && stage.unlocked && (
                    <span className="text-xs bg-red-600 px-2 py-1 rounded text-white">
                      BOSS
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Stage Detail */}
          <div className="w-1/2 p-4">
            {selectedStage ? (
              <div className="h-full flex flex-col">
                <div className="text-center mb-4">
                  <span className="text-6xl">{selectedStage.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">
                  {selectedStage.name}
                </h3>
                <div className="text-center mb-4">
                  <span className="bg-emerald-600/50 px-3 py-1 rounded-full text-sm text-emerald-300">
                    권장 레벨 {selectedStage.level}
                  </span>
                </div>
                <p className="text-slate-400 text-sm text-center mb-6">
                  {selectedStage.description}
                </p>

                {selectedStage.bossStages.length > 0 && (
                  <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                    <div className="text-sm text-slate-400 mb-1">보스 스테이지</div>
                    <div className="flex gap-2">
                      {selectedStage.bossStages.map((bs) => (
                        <span key={bs} className="bg-red-600/50 px-2 py-1 rounded text-xs text-red-300">
                          Stage {bs}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto">
                  <button
                    onClick={handleStartBattle}
                    disabled={isLoading}
                    className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                      isLoading
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white shadow-lg hover:shadow-emerald-500/30'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span> 전투 준비 중...
                      </span>
                    ) : (
                      '전투 시작!'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <span className="text-4xl block mb-2">👈</span>
                  <p>스테이지를 선택하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer tip */}
        <div className="bg-slate-900/50 px-6 py-3 text-sm text-slate-400">
          💡 레벨 1 몬스터는 포획하여 펫으로 만들 수 있습니다!
        </div>
      </div>
    </div>
  );
}
