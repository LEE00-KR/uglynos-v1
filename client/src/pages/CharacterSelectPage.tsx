import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { characterApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import CharacterCreateModal from '../components/CharacterCreateModal';

interface Character {
  id: string;
  nickname: string;
  level: number;
  element_primary: string;
}

export default function CharacterSelectPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const setCharacter = useAuthStore((state) => state.setCharacter);
  const setGameCharacter = useGameStore((state) => state.setCharacter);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['characters'],
    queryFn: () => characterApi.getAll(),
  });

  const characters: Character[] = data?.data?.data || [];

  const handleSelectCharacter = async (character: Character) => {
    try {
      const response = await characterApi.select(character.id);
      const { accessToken, character: fullCharacter } = response.data.data;
      setCharacter(character.id, accessToken);
      setGameCharacter(fullCharacter);
      navigate('/game');
    } catch (error) {
      console.error('Failed to select character:', error);
    }
  };

  const elementColors: Record<string, string> = {
    earth: 'bg-game-earth',
    wind: 'bg-game-wind',
    fire: 'bg-game-fire',
    water: 'bg-game-water',
  };

  useEffect(() => {
    if (!showCreateModal) {
      refetch();
    }
  }, [showCreateModal, refetch]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">캐릭터 선택</h1>

        {isLoading ? (
          <div className="text-center text-gray-400">로딩 중...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {characters.map((character) => (
              <button
                key={character.id}
                onClick={() => handleSelectCharacter(character)}
                className="card hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl">
                      {character.nickname.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{character.nickname}</h3>
                    <p className="text-gray-400">Lv. {character.level}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs text-white ${elementColors[character.element_primary]}`}
                    >
                      {character.element_primary}
                    </span>
                  </div>
                </div>
              </button>
            ))}

            {characters.length < 3 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="card border-2 border-dashed border-gray-600 hover:border-primary-500 transition-colors flex items-center justify-center min-h-[120px]"
              >
                <div className="text-center text-gray-400">
                  <span className="text-4xl block mb-2">+</span>
                  <span>새 캐릭터 생성</span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CharacterCreateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
