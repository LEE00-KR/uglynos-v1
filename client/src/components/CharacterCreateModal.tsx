import { useState } from 'react';
import { characterApi } from '../services/api';

interface Props {
  onClose: () => void;
}

const ELEMENTS = ['earth', 'water', 'fire', 'wind'] as const;
const ELEMENT_NAMES: Record<string, string> = {
  earth: '땅',
  water: '물',
  fire: '불',
  wind: '바람',
};
const ELEMENT_COLORS: Record<string, string> = {
  earth: 'border-amber-500 bg-amber-500/20 text-amber-400',
  water: 'border-blue-500 bg-blue-500/20 text-blue-400',
  fire: 'border-red-500 bg-red-500/20 text-red-400',
  wind: 'border-green-500 bg-green-500/20 text-green-400',
};

// 4스탯 시스템: HP, ATK, DEF, SPD
const STAT_NAMES: Record<string, string> = {
  hp: '체력',
  atk: '공격력',
  def: '방어력',
  spd: '순발력',
};
const STAT_COLORS: Record<string, string> = {
  hp: 'text-red-400',
  atk: 'text-orange-400',
  def: 'text-blue-400',
  spd: 'text-green-400',
};

export default function CharacterCreateModal({ onClose }: Props) {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [element, setElement] = useState<typeof ELEMENTS[number]>('earth');
  // 4스탯 시스템: 기본값 HP:100, ATK:10, DEF:10, SPD:10
  const [stats, setStats] = useState({ hp: 100, atk: 10, def: 10, spd: 10 });
  const [remainingPoints, setRemainingPoints] = useState(20);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 스탯별 최소값 (HP는 100, 나머지는 10)
  const getMinStat = (stat: keyof typeof stats) => stat === 'hp' ? 100 : 10;

  const handleStatChange = (stat: keyof typeof stats, delta: number) => {
    const minStat = getMinStat(stat);
    const newValue = stats[stat] + delta;
    const newRemaining = remainingPoints - delta;

    if (newValue < minStat || newRemaining < 0) return;

    setStats({ ...stats, [stat]: newValue });
    setRemainingPoints(newRemaining);
  };

  const handleCreate = async () => {
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요');
      return;
    }

    if (!/^[가-힣a-zA-Z0-9]+$/.test(nickname)) {
      setError('한글, 영문, 숫자만 사용 가능합니다');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await characterApi.create({
        nickname,
        appearance: { eye: 1, nose: 1, mouth: 1, hair: 1, skin: 1 },
        element: { primary: element, primaryRatio: 100 },
        stats,
      });
      onClose();
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        '캐릭터 생성에 실패했습니다';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">새 캐릭터 생성</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input"
                placeholder="2~8자"
                maxLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">속성 선택</label>
              <div className="grid grid-cols-2 gap-2">
                {ELEMENTS.map((el) => (
                  <button
                    key={el}
                    onClick={() => setElement(el)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      element === el
                        ? ELEMENT_COLORS[el]
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {ELEMENT_NAMES[el]}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(2)} className="btn btn-primary w-full">
              다음
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <span className="text-primary-400 text-lg font-bold">
                남은 포인트: {remainingPoints}
              </span>
            </div>

            {(Object.keys(stats) as Array<keyof typeof stats>).map((stat) => (
              <div key={stat} className="flex items-center justify-between">
                <span className={`w-20 font-medium ${STAT_COLORS[stat]}`}>
                  {STAT_NAMES[stat]}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleStatChange(stat, -1)}
                    className="btn btn-secondary px-3 py-1"
                    disabled={stats[stat] <= getMinStat(stat)}
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-lg font-bold">
                    {stats[stat]}
                  </span>
                  <button
                    onClick={() => handleStatChange(stat, 1)}
                    className="btn btn-secondary px-3 py-1"
                    disabled={remainingPoints <= 0}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-4">
              <button onClick={() => setStep(1)} className="btn btn-secondary flex-1">
                이전
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || remainingPoints > 0}
                className="btn btn-primary flex-1"
              >
                {loading ? '생성 중...' : '캐릭터 생성'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
