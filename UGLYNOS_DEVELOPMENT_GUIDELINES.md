# 🛠️ Uglynos 개발 지침서 (Development Guidelines)

> **버전:** 1.0  
> **최종 수정:** 2026-01-13  
> **대상:** 프론트엔드/백엔드 개발자

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [개발 환경 설정](#2-개발-환경-설정)
3. [코딩 컨벤션](#3-코딩-컨벤션)
4. [프로젝트 구조](#4-프로젝트-구조)
5. [프론트엔드 개발 가이드](#5-프론트엔드-개발-가이드)
6. [백엔드 개발 가이드](#6-백엔드-개발-가이드)
7. [게임 공식 및 계산 로직](#7-게임-공식-및-계산-로직)
8. [전투 시스템 구현](#8-전투-시스템-구현)
9. [데이터베이스 작업](#9-데이터베이스-작업)
10. [API 통신 패턴](#10-api-통신-패턴)
11. [WebSocket 통신](#11-websocket-통신)
12. [에러 처리](#12-에러-처리)
13. [보안 가이드라인](#13-보안-가이드라인)
14. [테스트 가이드](#14-테스트-가이드)
15. [배포 가이드](#15-배포-가이드)
16. [참조 문서](#16-참조-문서)

---

## 1. 프로젝트 개요

### 1.1 기본 정보

| 항목 | 내용 |
|------|------|
| **프로젝트명** | Uglynos (구 Prehistoric Life) |
| **장르** | 2D 턴제 웹 MMORPG |
| **플랫폼** | PC/Mobile Web (반응형) |
| **목표 동접** | 100명 |
| **개발 기간** | 10주 (5 Phase) |

### 1.2 기술 스택 요약

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React 18 + Phaser 3 + Vite + Zustand + Tailwind CSS        │
├─────────────────────────────────────────────────────────────┤
│                        Backend                               │
│  Node.js + Express + Socket.io + Zod                        │
├─────────────────────────────────────────────────────────────┤
│                        Database                              │
│  Supabase (PostgreSQL) + Redis                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 핵심 원칙

- **서버 권위 (Server Authority):** 모든 게임 로직은 서버에서 계산
- **클라이언트는 뷰어:** 클라이언트는 표시와 입력만 담당
- **검증 필수:** 모든 입력은 서버에서 재검증
- **문서 우선:** 코드 작성 전 관련 문서 확인

---

## 2. 개발 환경 설정

### 2.1 필수 도구

```bash
# Node.js (v20 LTS 권장)
node --version  # v20.x.x

# pnpm (패키지 매니저)
npm install -g pnpm
pnpm --version  # v8.x.x

# Redis (로컬 개발용)
# Mac: brew install redis
# Windows: WSL2 또는 Docker 사용
```

### 2.2 프로젝트 초기화

```bash
# 프론트엔드
pnpm create vite@latest uglynos-client --template react-ts
cd uglynos-client
pnpm install

# 필수 패키지
pnpm add phaser zustand axios socket.io-client react-router-dom
pnpm add -D tailwindcss postcss autoprefixer @types/node

# 백엔드
mkdir uglynos-server && cd uglynos-server
pnpm init
pnpm add express socket.io @supabase/supabase-js ioredis jsonwebtoken bcrypt zod helmet cors morgan winston
pnpm add -D typescript tsx nodemon @types/express @types/node @types/jsonwebtoken @types/bcrypt
```

### 2.3 환경 변수 설정

**프론트엔드 (.env)**

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

**백엔드 (.env)**

```env
# Server
NODE_ENV=development
PORT=3000

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 2.4 TypeScript 설정

**tsconfig.json (공통)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

---

## 3. 코딩 컨벤션

### 3.1 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일명 (컴포넌트) | PascalCase | `BattleScene.tsx` |
| 파일명 (유틸/서비스) | camelCase | `damageCalculator.ts` |
| 컴포넌트 | PascalCase | `ActionMenu` |
| 함수/메서드 | camelCase | `calculateDamage()` |
| 변수 | camelCase | `currentHp` |
| 상수 | SCREAMING_SNAKE_CASE | `MAX_PARTY_SIZE` |
| 인터페이스 | PascalCase (I 접두사 금지) | `BattleUnit` |
| 타입 | PascalCase | `ElementType` |
| 이넘 | PascalCase | `ActionType` |
| DB 테이블 | snake_case | `pet_templates` |
| DB 컬럼 | snake_case | `current_hp` |
| API 엔드포인트 | kebab-case | `/api/pet-storage` |
| 이벤트명 | snake_case with colon | `battle:action_result` |

### 3.2 파일 구조 규칙

```typescript
// 1. 외부 라이브러리 import
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. 내부 모듈 import (절대 경로)
import { useBattleStore } from '@/stores/battleStore';
import { BattleUnit } from '@/types/battle';

// 3. 상대 경로 import (같은 폴더 내)
import { ActionButton } from './ActionButton';

// 4. 스타일 import
import './BattleHUD.css';

// 5. 상수 정의
const MAX_ACTIONS = 4;

// 6. 타입 정의 (해당 파일에서만 사용하는 경우)
interface Props {
  battleId: string;
}

// 7. 컴포넌트 정의
export const BattleHUD: React.FC<Props> = ({ battleId }) => {
  // ...
};
```

### 3.3 주석 규칙

```typescript
/**
 * 데미지 계산
 * 
 * @param attacker - 공격자 유닛
 * @param defender - 방어자 유닛
 * @param options - 추가 옵션 (무기 정보, 스킬 등)
 * @returns 계산된 데미지 결과
 * 
 * @see 07_GAME_SYSTEMS.md - 크리티컬 시스템
 */
function calculateDamage(
  attacker: BattleUnit,
  defender: BattleUnit,
  options: DamageOptions
): DamageResult {
  // 1단계: 기본 공격력 계산
  const baseDamage = attacker.stats.atk;
  
  // TODO: 속성 배율 적용 필요
  // FIXME: 복합 속성 계산 버그 수정 필요
  // NOTE: 방어력 무시는 크리티컬일 때만
  
  return { damage: baseDamage, isCritical: false };
}
```

### 3.4 ESLint 설정

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // 사용하지 않는 변수 (언더스코어 시작은 허용)
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // any 타입 경고 (에러 아님)
    '@typescript-eslint/no-explicit-any': 'warn',
    // console.log 경고
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // 세미콜론 필수
    'semi': ['error', 'always'],
    // 작은따옴표 사용
    'quotes': ['error', 'single'],
  },
};
```

---

## 4. 프로젝트 구조

### 4.1 프론트엔드 구조

```
/src
├── /assets                 # 정적 에셋
│   ├── /images            # 일반 이미지
│   ├── /sprites           # 스프라이트 시트
│   └── /audio             # 사운드 파일
│
├── /components            # React 컴포넌트
│   ├── /common           # 공통 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── HealthBar.tsx
│   │   └── index.ts      # barrel export
│   │
│   ├── /battle           # 전투 UI
│   │   ├── BattleHUD.tsx
│   │   ├── ActionMenu.tsx
│   │   ├── TargetSelector.tsx
│   │   ├── TurnIndicator.tsx
│   │   └── index.ts
│   │
│   ├── /town             # 마을 UI
│   └── /character        # 캐릭터 관련
│
├── /game                  # Phaser 게임 로직
│   ├── /scenes           # Phaser 씬
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   └── BattleScene.ts
│   │
│   ├── /entities         # 게임 엔티티
│   │   ├── CharacterSprite.ts
│   │   ├── PetSprite.ts
│   │   └── MonsterSprite.ts
│   │
│   ├── /systems          # 게임 시스템
│   │   └── EffectsManager.ts
│   │
│   └── GameConfig.ts     # Phaser 설정
│
├── /hooks                 # 커스텀 훅
│   ├── useAuth.ts
│   ├── useBattle.ts
│   ├── useSocket.ts
│   └── index.ts
│
├── /pages                 # 페이지 컴포넌트
│   ├── LoginPage.tsx
│   ├── TownPage.tsx
│   ├── BattlePage.tsx
│   └── index.ts
│
├── /services             # API 서비스
│   ├── api.ts           # Axios 인스턴스
│   ├── authService.ts
│   ├── battleService.ts
│   ├── socket.ts        # Socket.io 클라이언트
│   └── index.ts
│
├── /stores               # Zustand 스토어
│   ├── authStore.ts
│   ├── characterStore.ts
│   ├── battleStore.ts
│   └── index.ts
│
├── /types                # TypeScript 타입
│   ├── character.ts
│   ├── pet.ts
│   ├── battle.ts
│   ├── api.ts           # API 응답 타입
│   └── index.ts
│
├── /utils                # 유틸리티
│   ├── constants.ts     # 상수
│   ├── formatters.ts    # 포맷터
│   └── index.ts
│
├── App.tsx
├── main.tsx
└── index.css
```

### 4.2 백엔드 구조

```
/src
├── /config               # 설정
│   ├── database.ts      # Supabase 연결
│   ├── redis.ts         # Redis 연결
│   ├── socket.ts        # Socket.io 설정
│   └── env.ts           # 환경 변수
│
├── /controllers         # 컨트롤러 (라우트 핸들러)
│   ├── authController.ts
│   ├── characterController.ts
│   ├── battleController.ts
│   └── ...
│
├── /services            # 비즈니스 로직
│   ├── authService.ts
│   ├── characterService.ts
│   ├── battleService.ts
│   │
│   └── /battle          # 전투 관련 서비스
│       ├── turnManager.ts
│       ├── damageCalculator.ts
│       ├── statusEffectManager.ts
│       ├── captureManager.ts
│       ├── loyaltyManager.ts
│       └── rewardCalculator.ts
│
├── /routes              # 라우트 정의
│   ├── authRoutes.ts
│   ├── characterRoutes.ts
│   └── index.ts
│
├── /socket              # WebSocket 핸들러
│   ├── index.ts
│   ├── battleSocket.ts
│   └── partySocket.ts
│
├── /middlewares         # 미들웨어
│   ├── authMiddleware.ts
│   ├── errorMiddleware.ts
│   ├── rateLimiter.ts
│   └── validator.ts
│
├── /validators          # Zod 스키마
│   ├── authValidator.ts
│   ├── characterValidator.ts
│   └── battleValidator.ts
│
├── /utils               # 유틸리티
│   ├── logger.ts
│   ├── errors.ts
│   ├── formulas.ts     # 게임 공식
│   └── constants.ts
│
├── /types               # 타입 정의
│   ├── express.d.ts
│   ├── socket.d.ts
│   └── game.ts
│
├── app.ts               # Express 앱
└── server.ts            # 서버 진입점
```

### 4.3 Barrel Export 패턴

각 폴더에 `index.ts` 파일을 두어 깔끔한 import를 지원합니다.

```typescript
// /components/common/index.ts
export { Button } from './Button';
export { Modal } from './Modal';
export { HealthBar } from './HealthBar';

// 사용 시
import { Button, Modal, HealthBar } from '@/components/common';
```

---

## 5. 프론트엔드 개발 가이드

### 5.1 컴포넌트 작성 패턴

```typescript
// /components/battle/ActionMenu.tsx
import React, { useCallback } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import type { ActionType } from '@/types/battle';

// Props 인터페이스 정의
interface ActionMenuProps {
  disabled?: boolean;
  onActionSelect?: (action: ActionType) => void;
}

// 상수는 컴포넌트 외부에 정의
const ACTIONS: { type: ActionType; icon: string; label: string }[] = [
  { type: 'attack', icon: '⚔️', label: '공격' },
  { type: 'defend', icon: '🛡️', label: '방어' },
  { type: 'spell', icon: '✨', label: '주술' },
  { type: 'item', icon: '🎒', label: '아이템' },
  { type: 'capture', icon: '🎯', label: '포획' },
  { type: 'flee', icon: '🏃', label: '도주' },
];

export const ActionMenu: React.FC<ActionMenuProps> = ({ 
  disabled = false,
  onActionSelect 
}) => {
  // Zustand store 사용
  const { setCharacterAction, inputPhase } = useBattleStore();

  // 이벤트 핸들러는 useCallback으로 메모이제이션
  const handleAction = useCallback((action: ActionType) => {
    if (disabled || inputPhase !== 'character') return;
    
    setCharacterAction(action);
    onActionSelect?.(action);
  }, [disabled, inputPhase, setCharacterAction, onActionSelect]);

  // 조건부 스타일은 함수로 분리
  const getButtonClass = (actionType: ActionType) => {
    const base = 'p-3 rounded-lg transition-all';
    const isDisabled = disabled || inputPhase !== 'character';
    
    return `${base} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700 cursor-pointer'}`;
  };

  return (
    <div className="grid grid-cols-3 gap-2 p-2 bg-gray-800 rounded-xl">
      {ACTIONS.map(({ type, icon, label }) => (
        <button
          key={type}
          onClick={() => handleAction(type)}
          disabled={disabled}
          className={getButtonClass(type)}
          aria-label={label}
        >
          <span className="text-2xl">{icon}</span>
          <span className="block text-xs mt-1">{label}</span>
        </button>
      ))}
    </div>
  );
};
```

### 5.2 Zustand 스토어 패턴

```typescript
// /stores/battleStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { BattleUnit, ActionType, BattlePhase } from '@/types/battle';

// 상태 인터페이스
interface BattleState {
  // 전투 기본 상태
  battleId: string | null;
  phase: BattlePhase;
  turnNumber: number;
  
  // 유닛 상태
  allies: BattleUnit[];
  enemies: BattleUnit[];
  
  // 턴 상태
  turnOrder: string[];
  currentTurnIndex: number;
  turnTimer: number;
  
  // 입력 상태
  inputPhase: 'character' | 'pet1' | 'pet2' | 'pet3' | 'ready';
  characterAction: {
    type: ActionType | null;
    spellId?: number;
    itemId?: string;
    targetId?: string;
  };
  petActions: Array<{
    petId: string;
    skillId: number;
    targetId: string;
  }>;
  
  // UI 상태
  selectionMode: 'none' | 'target_enemy' | 'target_ally' | 'spell' | 'item' | 'pet_skill';
  highlightedTargets: string[];
}

// 액션 인터페이스
interface BattleActions {
  // 전투 시작/종료
  startBattle: (battleId: string, initialState: Partial<BattleState>) => void;
  endBattle: () => void;
  
  // 캐릭터 액션
  setCharacterAction: (type: ActionType) => void;
  setCharacterSpell: (spellId: number) => void;
  setCharacterItem: (itemId: string) => void;
  setCharacterTarget: (targetId: string) => void;
  
  // 펫 액션
  setPetSkill: (petIndex: number, skillId: number) => void;
  setPetTarget: (petIndex: number, targetId: string) => void;
  
  // 턴 관리
  nextInputPhase: () => void;
  goToPreviousStep: () => void;
  resetTurnInput: () => void;
  
  // 유닛 상태 업데이트
  updateUnit: (unitId: string, updates: Partial<BattleUnit>) => void;
  removeUnit: (unitId: string) => void;
  
  // UI
  setSelectionMode: (mode: BattleState['selectionMode']) => void;
  setHighlightedTargets: (targets: string[]) => void;
}

// 초기 상태
const initialState: BattleState = {
  battleId: null,
  phase: 'waiting',
  turnNumber: 0,
  allies: [],
  enemies: [],
  turnOrder: [],
  currentTurnIndex: 0,
  turnTimer: 30,
  inputPhase: 'character',
  characterAction: { type: null },
  petActions: [],
  selectionMode: 'none',
  highlightedTargets: [],
};

// 스토어 생성
export const useBattleStore = create<BattleState & BattleActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 전투 시작
      startBattle: (battleId, initialState) => {
        set({
          ...initialState,
          battleId,
          phase: 'in_progress',
          inputPhase: 'character',
          characterAction: { type: null },
          petActions: [],
        }, false, 'startBattle');
      },

      // 전투 종료
      endBattle: () => {
        set(initialState, false, 'endBattle');
      },

      // 캐릭터 액션 설정
      setCharacterAction: (type) => {
        const { setSelectionMode, setHighlightedTargets, enemies, allies } = get();
        
        set({
          characterAction: { type },
        }, false, 'setCharacterAction');

        // 액션에 따른 선택 모드 설정
        switch (type) {
          case 'attack':
            setSelectionMode('target_enemy');
            setHighlightedTargets(enemies.filter(e => e.isAlive).map(e => e.id));
            break;
          case 'defend':
            // 방어는 즉시 다음 단계로
            get().nextInputPhase();
            break;
          case 'spell':
            setSelectionMode('spell');
            break;
          case 'item':
            setSelectionMode('item');
            break;
          case 'capture':
            setSelectionMode('target_enemy');
            // 1레벨 펫만 하이라이트
            setHighlightedTargets(
              enemies.filter(e => e.isAlive && e.isCapturable).map(e => e.id)
            );
            break;
          case 'flee':
            // 도주 확인 모달 표시
            break;
        }
      },

      // 캐릭터 타겟 설정
      setCharacterTarget: (targetId) => {
        set(state => ({
          characterAction: { ...state.characterAction, targetId },
          selectionMode: 'none',
          highlightedTargets: [],
        }), false, 'setCharacterTarget');
        
        // 다음 입력 단계로
        get().nextInputPhase();
      },

      // 다음 입력 단계
      nextInputPhase: () => {
        const { inputPhase, allies } = get();
        const pets = allies.filter(u => u.type === 'pet' && u.isAlive);
        
        const phases = ['character', 'pet1', 'pet2', 'pet3', 'ready'] as const;
        const currentIndex = phases.indexOf(inputPhase);
        
        // 다음 단계 계산 (펫 수에 따라)
        let nextPhase = phases[currentIndex + 1];
        
        // 펫이 없거나 이미 모든 펫 설정 완료
        const petIndex = parseInt(nextPhase?.replace('pet', '') || '0') - 1;
        if (nextPhase?.startsWith('pet') && petIndex >= pets.length) {
          nextPhase = 'ready';
        }
        
        set({ inputPhase: nextPhase || 'ready' }, false, 'nextInputPhase');
      },

      // 이전 단계로 (ESC)
      goToPreviousStep: () => {
        const { inputPhase, selectionMode } = get();
        
        // 선택 모드가 있으면 선택 취소
        if (selectionMode !== 'none') {
          set({
            selectionMode: 'none',
            highlightedTargets: [],
          }, false, 'cancelSelection');
          return;
        }
        
        // 이전 입력 단계로
        const phases = ['character', 'pet1', 'pet2', 'pet3', 'ready'] as const;
        const currentIndex = phases.indexOf(inputPhase);
        
        if (currentIndex > 0) {
          const prevPhase = phases[currentIndex - 1];
          set({
            inputPhase: prevPhase,
            characterAction: prevPhase === 'character' ? { type: null } : get().characterAction,
          }, false, 'goToPreviousStep');
        }
      },

      // 유닛 업데이트
      updateUnit: (unitId, updates) => {
        set(state => ({
          allies: state.allies.map(u => 
            u.id === unitId ? { ...u, ...updates } : u
          ),
          enemies: state.enemies.map(u => 
            u.id === unitId ? { ...u, ...updates } : u
          ),
        }), false, 'updateUnit');
      },

      // 기타 액션들...
      setCharacterSpell: (spellId) => {
        set(state => ({
          characterAction: { ...state.characterAction, spellId },
          selectionMode: 'target_enemy',
        }), false, 'setCharacterSpell');
      },

      setCharacterItem: (itemId) => {
        set(state => ({
          characterAction: { ...state.characterAction, itemId },
          selectionMode: 'target_ally',
        }), false, 'setCharacterItem');
      },

      setPetSkill: (petIndex, skillId) => {
        set(state => {
          const newPetActions = [...state.petActions];
          newPetActions[petIndex] = { 
            ...newPetActions[petIndex], 
            skillId,
            petId: state.allies.filter(u => u.type === 'pet')[petIndex]?.id || '',
          };
          return { petActions: newPetActions, selectionMode: 'target_enemy' };
        }, false, 'setPetSkill');
      },

      setPetTarget: (petIndex, targetId) => {
        set(state => {
          const newPetActions = [...state.petActions];
          newPetActions[petIndex] = { ...newPetActions[petIndex], targetId };
          return { 
            petActions: newPetActions, 
            selectionMode: 'none',
            highlightedTargets: [],
          };
        }, false, 'setPetTarget');
        
        get().nextInputPhase();
      },

      resetTurnInput: () => {
        set({
          inputPhase: 'character',
          characterAction: { type: null },
          petActions: [],
          selectionMode: 'none',
          highlightedTargets: [],
        }, false, 'resetTurnInput');
      },

      removeUnit: (unitId) => {
        set(state => ({
          allies: state.allies.filter(u => u.id !== unitId),
          enemies: state.enemies.filter(u => u.id !== unitId),
        }), false, 'removeUnit');
      },

      setSelectionMode: (mode) => set({ selectionMode: mode }, false, 'setSelectionMode'),
      setHighlightedTargets: (targets) => set({ highlightedTargets: targets }, false, 'setHighlightedTargets'),
    }),
    { name: 'battle-store' }
  )
);
```

### 5.3 Phaser 씬 작성 패턴

```typescript
// /game/scenes/BattleScene.ts
import Phaser from 'phaser';
import { useBattleStore } from '@/stores/battleStore';
import { CharacterSprite } from '../entities/CharacterSprite';
import { PetSprite } from '../entities/PetSprite';
import { EffectsManager } from '../systems/EffectsManager';
import type { BattleUnit, ActionResult } from '@/types/battle';

// 배치 좌표 상수
const POSITIONS = {
  ENEMIES: [
    { x: 300, y: 450 },
    { x: 450, y: 500 },
    { x: 350, y: 550 },
  ],
  ALLIES: {
    CHARACTER: { x: 1500, y: 550 },
    PETS: [
      { x: 1300, y: 450 },
      { x: 1400, y: 500 },
      { x: 1350, y: 550 },
    ],
  },
} as const;

export class BattleScene extends Phaser.Scene {
  // 배경
  private background!: Phaser.GameObjects.Image;
  
  // 스프라이트 맵
  private unitSprites: Map<string, CharacterSprite | PetSprite> = new Map();
  
  // 이펙트 매니저
  private effectsManager!: EffectsManager;
  
  // 스토어 구독 해제 함수
  private unsubscribe?: () => void;

  constructor() {
    super({ key: 'BattleScene' });
  }

  // 씬 초기화
  init(data: { battleId: string; background: string }) {
    // 데이터 검증
    if (!data.battleId) {
      console.error('BattleScene: battleId is required');
      return;
    }
  }

  // 에셋 생성
  create() {
    this.createBackground();
    this.createUnits();
    this.setupAnimations();
    this.setupStoreSubscription();
    this.setupInputHandlers();
    
    // 이펙트 매니저 초기화
    this.effectsManager = new EffectsManager(this);
  }

  // 배경 생성
  private createBackground() {
    const { width, height } = this.scale;
    const state = useBattleStore.getState();
    
    this.background = this.add.image(width / 2, height / 2, 'bg_grassland');
    this.background.setDisplaySize(width, height);
  }

  // 유닛 스프라이트 생성
  private createUnits() {
    const state = useBattleStore.getState();
    
    // 아군 생성
    state.allies.forEach((unit, index) => {
      const position = unit.type === 'character' 
        ? POSITIONS.ALLIES.CHARACTER 
        : POSITIONS.ALLIES.PETS[index - 1]; // 캐릭터가 0번
      
      if (!position) return;
      
      const sprite = unit.type === 'character'
        ? new CharacterSprite(this, position.x, position.y, unit)
        : new PetSprite(this, position.x, position.y, unit);
      
      this.unitSprites.set(unit.id, sprite);
    });
    
    // 적군 생성 (미러링)
    state.enemies.forEach((unit, index) => {
      const position = POSITIONS.ENEMIES[index];
      if (!position) return;
      
      const sprite = new PetSprite(this, position.x, position.y, unit);
      sprite.setFlipX(true); // 오른쪽을 바라보도록 미러링
      
      this.unitSprites.set(unit.id, sprite);
    });
  }

  // 스토어 구독 설정
  private setupStoreSubscription() {
    // Zustand 스토어 변화 구독
    this.unsubscribe = useBattleStore.subscribe(
      (state, prevState) => {
        // 유닛 HP 변화 감지
        this.handleUnitUpdates(state, prevState);
        
        // 선택 모드 변화 감지
        if (state.selectionMode !== prevState.selectionMode) {
          this.handleSelectionModeChange(state.selectionMode, state.highlightedTargets);
        }
      }
    );
  }

  // 유닛 업데이트 처리
  private handleUnitUpdates(state: any, prevState: any) {
    const allUnits = [...state.allies, ...state.enemies];
    const prevAllUnits = [...prevState.allies, ...prevState.enemies];
    
    allUnits.forEach(unit => {
      const prevUnit = prevAllUnits.find(u => u.id === unit.id);
      const sprite = this.unitSprites.get(unit.id);
      
      if (!sprite || !prevUnit) return;
      
      // HP 변화 시 HP 바 업데이트
      if (unit.currentHp !== prevUnit.currentHp) {
        sprite.updateHealthBar(unit.currentHp, unit.maxHp);
        
        // HP 감소 시 피격 애니메이션
        if (unit.currentHp < prevUnit.currentHp) {
          sprite.playHurt();
        }
      }
      
      // 사망 처리
      if (unit.currentHp <= 0 && prevUnit.currentHp > 0) {
        sprite.playDeath();
      }
    });
  }

  // 선택 모드 변화 처리
  private handleSelectionModeChange(mode: string, highlightedTargets: string[]) {
    // 모든 하이라이트 해제
    this.unitSprites.forEach(sprite => {
      sprite.setHighlight(false);
      sprite.setDimmed(false);
    });
    
    if (mode === 'none') return;
    
    // 선택 가능한 타겟 하이라이트
    this.unitSprites.forEach((sprite, unitId) => {
      if (highlightedTargets.includes(unitId)) {
        sprite.setHighlight(true);
        sprite.setInteractive();
      } else {
        sprite.setDimmed(true);
        sprite.disableInteractive();
      }
    });
  }

  // 입력 핸들러 설정
  private setupInputHandlers() {
    // ESC 키로 이전 단계
    this.input.keyboard?.on('keydown-ESC', () => {
      useBattleStore.getState().goToPreviousStep();
    });
    
    // 유닛 클릭 핸들러
    this.unitSprites.forEach((sprite, unitId) => {
      sprite.on('pointerdown', () => {
        const state = useBattleStore.getState();
        
        if (state.selectionMode === 'target_enemy' || state.selectionMode === 'target_ally') {
          if (state.highlightedTargets.includes(unitId)) {
            // 현재 입력 단계에 따라 타겟 설정
            if (state.inputPhase === 'character') {
              state.setCharacterTarget(unitId);
            } else {
              const petIndex = parseInt(state.inputPhase.replace('pet', '')) - 1;
              state.setPetTarget(petIndex, unitId);
            }
          }
        }
      });
    });
  }

  // 공격 애니메이션 실행 (외부에서 호출)
  public async executeAttack(result: ActionResult): Promise<void> {
    const attackerSprite = this.unitSprites.get(result.actorId);
    const targetSprite = this.unitSprites.get(result.targetId || '');
    
    if (!attackerSprite || !targetSprite) return;
    
    // 1. 공격 애니메이션
    await attackerSprite.playAttack();
    
    // 2. 히트 판정
    if (result.hit) {
      // 이펙트 재생
      await this.effectsManager.playHitEffect(
        targetSprite.x, 
        targetSprite.y,
        result.isCritical ? 'critical' : 'normal'
      );
      
      // 데미지 숫자 표시
      this.showDamageNumber(
        targetSprite.x, 
        targetSprite.y, 
        result.damage || 0,
        result.isCritical
      );
      
      // 피격 애니메이션
      targetSprite.playHurt();
    } else {
      // Miss 표시
      this.showMissText(targetSprite.x, targetSprite.y);
    }
    
    // 3. 대기 상태로 복귀
    await attackerSprite.playIdle();
  }

  // 데미지 숫자 표시
  private showDamageNumber(x: number, y: number, damage: number, isCritical: boolean) {
    const text = this.add.text(x, y - 50, `-${damage}`, {
      fontSize: isCritical ? '32px' : '24px',
      color: isCritical ? '#FF0000' : '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    
    // 위로 떠오르며 사라지는 애니메이션
    this.tweens.add({
      targets: text,
      y: y - 100,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  // Miss 텍스트 표시
  private showMissText(x: number, y: number) {
    const text = this.add.text(x, y - 50, 'MISS', {
      fontSize: '20px',
      color: '#AAAAAA',
      fontStyle: 'italic',
    });
    
    this.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  // 매 프레임 업데이트
  update(time: number, delta: number) {
    // 스프라이트 애니메이션 업데이트
    this.unitSprites.forEach(sprite => sprite.update(time, delta));
  }

  // 씬 종료 시 정리
  shutdown() {
    this.unsubscribe?.();
    this.unitSprites.clear();
  }
}
```

### 5.4 커스텀 훅 패턴

```typescript
// /hooks/useBattle.ts
import { useCallback, useEffect, useRef } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import { socketService } from '@/services/socket';
import type { ActionResult, BattleRewards } from '@/types/battle';

export const useBattle = (battleId: string | null) => {
  const store = useBattleStore();
  const gameRef = useRef<Phaser.Game | null>(null);

  // 전투 방 입장
  useEffect(() => {
    if (!battleId) return;
    
    socketService.emit('battle:join', { battleId });
    
    return () => {
      socketService.emit('battle:leave', { battleId });
    };
  }, [battleId]);

  // WebSocket 이벤트 리스너 설정
  useEffect(() => {
    const handleTurnStart = (data: any) => {
      store.resetTurnInput();
      // 턴 타이머 시작 등
    };

    const handleActionResult = async (data: { results: ActionResult[] }) => {
      const battleScene = gameRef.current?.scene.getScene('BattleScene') as any;
      
      // 순차적으로 액션 결과 실행
      for (const result of data.results) {
        if (battleScene?.executeAttack) {
          await battleScene.executeAttack(result);
        }
        
        // 유닛 상태 업데이트
        if (result.targetId) {
          store.updateUnit(result.targetId, {
            currentHp: result.targetHpAfter,
          });
        }
        
        // 잠시 대기 (애니메이션 간격)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    };

    const handleVictory = (data: BattleRewards) => {
      store.endBattle();
      // 승리 처리
    };

    const handleDefeat = (data: any) => {
      store.endBattle();
      // 패배 처리
    };

    // 이벤트 등록
    socketService.on('battle:turn_start', handleTurnStart);
    socketService.on('battle:action_result', handleActionResult);
    socketService.on('battle:victory', handleVictory);
    socketService.on('battle:defeat', handleDefeat);

    return () => {
      socketService.off('battle:turn_start', handleTurnStart);
      socketService.off('battle:action_result', handleActionResult);
      socketService.off('battle:victory', handleVictory);
      socketService.off('battle:defeat', handleDefeat);
    };
  }, [store]);

  // 턴 제출
  const submitTurn = useCallback(() => {
    if (!battleId || store.inputPhase !== 'ready') return;

    socketService.emit('battle:action', {
      battleId,
      characterAction: store.characterAction,
      petActions: store.petActions,
    });
  }, [battleId, store.inputPhase, store.characterAction, store.petActions]);

  // 도주
  const flee = useCallback(() => {
    if (!battleId) return;
    socketService.emit('battle:flee', { battleId });
  }, [battleId]);

  return {
    // 상태
    phase: store.phase,
    turnNumber: store.turnNumber,
    allies: store.allies,
    enemies: store.enemies,
    inputPhase: store.inputPhase,
    isReady: store.inputPhase === 'ready',
    
    // 액션
    submitTurn,
    flee,
    
    // Phaser 게임 참조 설정용
    setGameRef: (game: Phaser.Game) => { gameRef.current = game; },
  };
};
```

---

## 6. 백엔드 개발 가이드

### 6.1 컨트롤러 패턴

```typescript
// /controllers/battleController.ts
import { Request, Response, NextFunction } from 'express';
import { battleService } from '@/services/battleService';
import { AuthRequest } from '@/middlewares/authMiddleware';
import { startBattleSchema } from '@/validators/battleValidator';
import { BattleError, NotFoundError } from '@/utils/errors';

export const battleController = {
  /**
   * POST /api/battles/start
   * 전투 시작
   */
  startBattle: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // 1. 요청 검증 (미들웨어에서 이미 처리됨)
      const { stageId, partyPetIds, ridingPetId } = req.body;
      const characterId = req.characterId!;

      // 2. 서비스 호출
      const battle = await battleService.startBattle({
        characterId,
        stageId,
        partyPetIds,
        ridingPetId,
      });

      // 3. 응답
      res.status(201).json({
        success: true,
        data: battle,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/battles/:id
   * 전투 상태 조회
   */
  getBattle: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const characterId = req.characterId!;

      const battle = await battleService.getBattle(id, characterId);

      if (!battle) {
        throw new NotFoundError('전투');
      }

      res.json({
        success: true,
        data: battle,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/battles/:id/action
   * 행동 제출 (REST 백업)
   */
  submitAction: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { characterAction, petActions } = req.body;
      const characterId = req.characterId!;

      await battleService.submitAction({
        battleId: id,
        characterId,
        characterAction,
        petActions,
      });

      res.json({
        success: true,
        data: {
          message: '행동이 제출되었습니다. WebSocket으로 결과를 확인하세요.',
          submittedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/battles/:id/flee
   * 도주
   */
  flee: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const characterId = req.characterId!;

      const result = await battleService.flee(id, characterId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
```

### 6.2 서비스 패턴

```typescript
// /services/battleService.ts
import { supabase } from '@/config/database';
import { CacheService } from './cacheService';
import { TurnManager } from './battle/turnManager';
import { DamageCalculator } from './battle/damageCalculator';
import { RewardCalculator } from './battle/rewardCalculator';
import { BattleError, NotFoundError, ForbiddenError } from '@/utils/errors';
import { calculateDerivedStats } from '@/utils/formulas';
import type { BattleState, BattleUnit, StartBattleParams } from '@/types/battle';
import { v4 as uuidv4 } from 'uuid';

class BattleService {
  private turnManager = new TurnManager();
  private damageCalculator = new DamageCalculator();
  private rewardCalculator = new RewardCalculator();

  /**
   * 전투 시작
   */
  async startBattle(params: StartBattleParams): Promise<BattleState> {
    const { characterId, stageId, partyPetIds, ridingPetId } = params;

    // 1. 스테이지 정보 조회 (캐시 사용)
    const stage = await CacheService.getStage(stageId, async () => {
      const { data, error } = await supabase
        .from('stage_templates')
        .select('*')
        .eq('id', stageId)
        .single();

      if (error || !data) throw new NotFoundError('스테이지');
      return data;
    });

    // 2. 스테이지 해금 확인
    const { data: progress } = await supabase
      .from('stage_progress')
      .select('is_cleared')
      .eq('character_id', characterId)
      .eq('stage_id', stage.unlock_stage_id)
      .single();

    if (stage.unlock_stage_id && !progress?.is_cleared) {
      throw new ForbiddenError('이전 스테이지를 먼저 클리어해야 합니다.');
    }

    // 3. 캐릭터 정보 조회
    const character = await this.loadCharacter(characterId);

    // 4. 파티 펫 정보 조회
    const pets = await this.loadPartyPets(characterId, partyPetIds);

    // 5. 적 몬스터 생성
    const enemies = await this.generateEnemies(stage);

    // 6. 전투 상태 생성
    const battleId = uuidv4();
    const battleState: BattleState = {
      id: battleId,
      stageId,
      phase: 'in_progress',
      turnNumber: 1,
      units: new Map([
        ...this.createAllyUnits(character, pets),
        ...this.createEnemyUnits(enemies),
      ]),
      turnOrder: [],
      currentTurnIndex: 0,
      pendingActions: new Map(),
      participants: [characterId],
      turnStartedAt: Date.now(),
      turnTimeout: 30,
      potentialDrops: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 7. 턴 순서 계산
    battleState.turnOrder = this.turnManager.calculateTurnOrder(
      Array.from(battleState.units.values())
    );

    // 8. Redis에 전투 상태 저장
    await CacheService.setBattleState(battleId, battleState);

    // 9. 응답 데이터 변환
    return this.serializeBattleState(battleState);
  }

  /**
   * 캐릭터 로드
   */
  private async loadCharacter(characterId: string) {
    const { data, error } = await supabase
      .from('characters')
      .select(`
        *,
        equipment:equipment(*, spell:spell_templates(*))
      `)
      .eq('id', characterId)
      .single();

    if (error || !data) throw new NotFoundError('캐릭터');

    // 파생 스탯 계산
    const derivedStats = calculateDerivedStats({
      str: data.stat_str,
      agi: data.stat_agi,
      vit: data.stat_vit,
      con: data.stat_con,
      int: data.stat_int,
    }, data.level);

    return { ...data, derivedStats };
  }

  /**
   * 파티 펫 로드
   */
  private async loadPartyPets(characterId: string, petIds: string[]) {
    if (petIds.length === 0) return [];

    const { data, error } = await supabase
      .from('pets')
      .select(`
        *,
        template:pet_templates(*, skills:pet_skills(*))
      `)
      .eq('character_id', characterId)
      .in('id', petIds);

    if (error) throw new Error('펫 로드 실패');

    return data || [];
  }

  /**
   * 적 몬스터 생성
   */
  private async generateEnemies(stage: any) {
    const { data: stageMonsters } = await supabase
      .from('stage_monsters')
      .select(`
        *,
        monster:monster_templates(*)
      `)
      .eq('stage_id', stage.id);

    const enemies: any[] = [];

    for (const sm of stageMonsters || []) {
      const count = sm.spawn_count_min + 
        Math.floor(Math.random() * (sm.spawn_count_max - sm.spawn_count_min + 1));

      for (let i = 0; i < count; i++) {
        // 몬스터 레벨 랜덤 (스테이지 범위 내)
        const level = stage.monster_level_min + 
          Math.floor(Math.random() * (stage.monster_level_max - stage.monster_level_min + 1));

        enemies.push({
          ...sm.monster,
          level,
          isBoss: sm.is_boss,
          // 1레벨 펫 등장 확률 (3% 미만)
          isCapturable: sm.monster.linked_pet_id && Math.random() < 0.03,
          isRareColor: Math.random() < 0.00005, // 0.005%
        });
      }
    }

    return enemies;
  }

  // ... 추가 메서드들 (createAllyUnits, createEnemyUnits 등)

  /**
   * 전투 상태 직렬화
   */
  private serializeBattleState(state: BattleState) {
    return {
      ...state,
      units: undefined,
      allies: Array.from(state.units.values()).filter(u => u.type !== 'enemy'),
      enemies: Array.from(state.units.values()).filter(u => u.type === 'enemy'),
      pendingActions: undefined,
    };
  }

  // 기타 메서드들...
  async getBattle(battleId: string, characterId: string) {
    const state = await CacheService.getBattleState(battleId);
    if (!state) return null;
    if (!state.participants.includes(characterId)) {
      throw new ForbiddenError('이 전투에 참여하지 않았습니다.');
    }
    return this.serializeBattleState(state);
  }

  async submitAction(params: any) {
    // 행동 제출 로직...
  }

  async flee(battleId: string, characterId: string) {
    // 도주 로직...
  }
}

export const battleService = new BattleService();
```

### 6.3 라우트 정의

```typescript
// /routes/battleRoutes.ts
import { Router } from 'express';
import { battleController } from '@/controllers/battleController';
import { authenticate, requireCharacter } from '@/middlewares/authMiddleware';
import { validate } from '@/middlewares/validator';
import { battleStartLimiter } from '@/middlewares/rateLimiter';
import { startBattleSchema, battleActionSchema } from '@/validators/battleValidator';

const router = Router();

// 모든 전투 라우트는 인증 + 캐릭터 필요
router.use(authenticate);
router.use(requireCharacter);

// POST /api/battles/start - 전투 시작
router.post(
  '/start',
  battleStartLimiter,
  validate(startBattleSchema),
  battleController.startBattle
);

// GET /api/battles/:id - 전투 상태 조회
router.get('/:id', battleController.getBattle);

// POST /api/battles/:id/action - 행동 제출
router.post(
  '/:id/action',
  validate(battleActionSchema),
  battleController.submitAction
);

// POST /api/battles/:id/flee - 도주
router.post('/:id/flee', battleController.flee);

export default router;
```

### 6.4 WebSocket 핸들러

```typescript
// /socket/battleSocket.ts
import { Server, Socket } from 'socket.io';
import { battleService } from '@/services/battleService';
import { CacheService } from '@/services/cacheService';
import { TurnManager } from '@/services/battle/turnManager';
import { DamageCalculator } from '@/services/battle/damageCalculator';
import { logger } from '@/utils/logger';

export const registerBattleHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.userId;
  const characterId = socket.data.characterId;

  /**
   * 전투 방 입장
   */
  socket.on('battle:join', async ({ battleId }) => {
    try {
      const battleState = await CacheService.getBattleState(battleId);
      
      if (!battleState) {
        socket.emit('battle:error', { code: 'E4001', message: '전투를 찾을 수 없습니다.' });
        return;
      }

      if (!battleState.participants.includes(characterId)) {
        socket.emit('battle:error', { code: 'E4004', message: '이 전투에 참여하지 않았습니다.' });
        return;
      }

      // 전투 방에 입장
      socket.join(`battle:${battleId}`);
      
      // 현재 전투 상태 전송
      socket.emit('battle:joined', serializeBattleState(battleState));

      logger.info(`User ${userId} joined battle ${battleId}`);
    } catch (error) {
      logger.error('battle:join error', error);
      socket.emit('battle:error', { code: 'E9001', message: '서버 오류' });
    }
  });

  /**
   * 행동 제출
   */
  socket.on('battle:action', async ({ battleId, characterAction, petActions }) => {
    try {
      const battleState = await CacheService.getBattleState(battleId);
      
      if (!battleState) {
        socket.emit('battle:error', { code: 'E4001', message: '전투를 찾을 수 없습니다.' });
        return;
      }

      if (battleState.phase !== 'in_progress') {
        socket.emit('battle:error', { code: 'E4002', message: '이미 종료된 전투입니다.' });
        return;
      }

      // 행동 검증 및 저장
      battleState.pendingActions.set(characterId, {
        characterAction,
        petActions,
        submittedAt: Date.now(),
      });

      await CacheService.setBattleState(battleId, battleState);

      // 모든 참가자가 행동을 제출했는지 확인
      if (battleState.pendingActions.size >= battleState.participants.length) {
        await executeTurn(io, battleState);
      }
    } catch (error) {
      logger.error('battle:action error', error);
      socket.emit('battle:error', { code: 'E9001', message: '서버 오류' });
    }
  });

  /**
   * 도주
   */
  socket.on('battle:flee', async ({ battleId }) => {
    try {
      const result = await battleService.flee(battleId, characterId);
      
      // 도주 결과 전송
      socket.emit('battle:fled', result);
      
      // 방에서 나가기
      socket.leave(`battle:${battleId}`);
    } catch (error) {
      logger.error('battle:flee error', error);
      socket.emit('battle:error', { code: 'E9001', message: '서버 오류' });
    }
  });

  /**
   * 전투 방 퇴장
   */
  socket.on('battle:leave', ({ battleId }) => {
    socket.leave(`battle:${battleId}`);
    logger.info(`User ${userId} left battle ${battleId}`);
  });
};

// 헬퍼 함수들...
function serializeBattleState(state: any) {
  return {
    ...state,
    units: undefined,
    allies: Array.from(state.units.values()).filter((u: any) => u.type !== 'enemy'),
    enemies: Array.from(state.units.values()).filter((u: any) => u.type === 'enemy'),
    pendingActions: undefined,
  };
}
```

---

## 7. 게임 공식 및 계산 로직

### 7.1 파생 스탯 공식

```typescript
// /utils/formulas.ts

/**
 * 파생 스탯 계산
 * @see 07_GAME_SYSTEMS.md - 1.4 파생 스탯 공식
 */
export interface BaseStats {
  str: number;  // 힘
  agi: number;  // 민첩
  vit: number;  // 체력
  con: number;  // 건강
  int: number;  // 지력
}

export interface DerivedStats {
  maxHp: number;   // 최대 HP
  maxMp: number;   // 최대 MP
  atk: number;     // 공격력
  def: number;     // 방어력
  spd: number;     // 속도 (턴 순서)
  eva: number;     // 회피율 (%)
}

export const calculateDerivedStats = (
  stats: BaseStats,
  level: number
): DerivedStats => {
  return {
    maxHp: 100 + (stats.vit * 10) + (level * 5),
    maxMp: 50 + (stats.int * 5) + (level * 2),
    atk: 10 + (stats.str * 2) + Math.floor(level * 1.5),
    def: 5 + (stats.con * 2) + Math.floor(level * 0.8),
    spd: 10 + (stats.agi * 2),
    eva: stats.agi * 0.3,
  };
};

/**
 * 펫 스탯 계산 (성장률 적용)
 */
export const calculatePetStats = (
  baseStats: BaseStats,
  growthRates: BaseStats,
  level: number
): BaseStats => {
  const calculateStat = (base: number, growth: number) => {
    // 성장률은 퍼센트 (예: 100 = 100%)
    const growthMultiplier = growth / 100;
    return Math.floor(base + (base * growthMultiplier * (level - 1) / 10));
  };

  return {
    str: calculateStat(baseStats.str, growthRates.str),
    agi: calculateStat(baseStats.agi, growthRates.agi),
    vit: calculateStat(baseStats.vit, growthRates.vit),
    con: calculateStat(baseStats.con, growthRates.con),
    int: calculateStat(baseStats.int, growthRates.int),
  };
};
```

### 7.2 경험치 계산

```typescript
// /utils/formulas.ts

/**
 * 레벨업 필요 경험치
 * @see 07_GAME_SYSTEMS.md - 15. 경험치/레벨업 시스템
 */
export const getRequiredExp = (level: number): number => {
  // 레벨 1~4: 고정값
  const earlyLevels: Record<number, number> = {
    1: 8,
    2: 20,
    3: 40,
    4: 100,
  };

  if (earlyLevels[level]) {
    return earlyLevels[level];
  }

  // 레벨 5 이후: 지수형 증가
  if (level < 30) {
    // 1~30: 빠른 성장
    return Math.floor(100 * Math.pow(1.15, level - 4));
  } else if (level < 70) {
    // 30~70: 보통 성장
    const base30 = Math.floor(100 * Math.pow(1.15, 26));
    return Math.floor(base30 * Math.pow(1.2, level - 30));
  } else {
    // 70~99: 매우 느린 성장
    const base30 = Math.floor(100 * Math.pow(1.15, 26));
    const base70 = Math.floor(base30 * Math.pow(1.2, 40));
    return Math.floor(base70 * Math.pow(1.3, level - 70));
  }
};

/**
 * 몬스터 경험치
 * 공식: Lv × (2 + Lv/20)
 */
export const calculateMonsterExp = (level: number, isBoss: boolean): number => {
  const baseExp = level * (2 + level / 20);
  // 보스 배율 ×1.1
  const exp = isBoss ? baseExp * 1.1 : baseExp;
  return Math.floor(exp);
};

/**
 * 파티 경험치 보너스
 * 1인: 100%, 2인: 103%, 3인: 106%, 4인: 109%, 5인: 120%
 */
export const getPartyExpBonus = (memberCount: number): number => {
  const bonuses: Record<number, number> = {
    1: 1.0,
    2: 1.03,
    3: 1.06,
    4: 1.09,
    5: 1.20,
  };
  return bonuses[memberCount] || 1.0;
};

/**
 * 레벨 차이 경험치 페널티
 * @param levelDiff 캐릭터 레벨 - 몬스터 레벨
 */
export const getLevelPenalty = (levelDiff: number): number => {
  if (levelDiff <= 10) return 1.0;           // 없음
  if (levelDiff <= 20) return 1.0 - (levelDiff - 10) * 0.005;  // -1~5%
  if (levelDiff <= 30) return 0.95 - (levelDiff - 20) * 0.014; // -6~20%
  return 0.5; // 31+ : -50%
};
```

### 7.3 속성 상성 계산

```typescript
// /utils/formulas.ts

export type ElementType = 'earth' | 'wind' | 'fire' | 'water';

export interface ElementInfo {
  primary: ElementType;
  secondary?: ElementType;
  primaryRatio: number; // 50-100
}

/**
 * 속성 상성 배율 계산
 * 상성: 지(地) → 풍(風) → 화(火) → 수(水) → 지(地)
 * 
 * @see 07_GAME_SYSTEMS.md - 3. 속성 시스템
 */
export const calculateElementMultiplier = (
  attackElement: ElementInfo,
  defenderElement: ElementInfo
): number => {
  // 상성 관계 정의
  const ADVANTAGE: Record<ElementType, ElementType> = {
    earth: 'wind',  // 지 → 풍
    wind: 'fire',   // 풍 → 화
    fire: 'water',  // 화 → 수
    water: 'earth', // 수 → 지
  };

  const DISADVANTAGE: Record<ElementType, ElementType> = {
    earth: 'water', // 지 ← 수
    wind: 'earth',  // 풍 ← 지
    fire: 'wind',   // 화 ← 풍
    water: 'fire',  // 수 ← 화
  };

  // 공격자 속성 비율
  const attackPrimaryRatio = attackElement.primaryRatio / 100;
  const attackSecondaryRatio = attackElement.secondary
    ? (100 - attackElement.primaryRatio) / 100
    : 0;

  // 방어자 속성 비율
  const defPrimaryRatio = defenderElement.primaryRatio / 100;
  const defSecondaryRatio = defenderElement.secondary
    ? (100 - defenderElement.primaryRatio) / 100
    : 0;

  // 단일 속성 배율 계산
  const getSingleMultiplier = (atk: ElementType, def: ElementType): number => {
    if (ADVANTAGE[atk] === def) return 1.3;  // 상성 우위: 130%
    if (DISADVANTAGE[atk] === def) return 0.7; // 상성 열위: 70%
    return 1.0; // 동일/무관: 100%
  };

  // 모든 속성 조합 계산
  let totalMultiplier = 0;

  // 주 속성 vs 주 속성
  totalMultiplier += getSingleMultiplier(attackElement.primary, defenderElement.primary)
    * attackPrimaryRatio * defPrimaryRatio;

  // 주 속성 vs 부 속성
  if (defenderElement.secondary) {
    totalMultiplier += getSingleMultiplier(attackElement.primary, defenderElement.secondary)
      * attackPrimaryRatio * defSecondaryRatio;
  }

  // 부 속성 vs 주 속성
  if (attackElement.secondary) {
    totalMultiplier += getSingleMultiplier(attackElement.secondary, defenderElement.primary)
      * attackSecondaryRatio * defPrimaryRatio;
  }

  // 부 속성 vs 부 속성
  if (attackElement.secondary && defenderElement.secondary) {
    totalMultiplier += getSingleMultiplier(attackElement.secondary, defenderElement.secondary)
      * attackSecondaryRatio * defSecondaryRatio;
  }

  return totalMultiplier || 1.0;
};

/**
 * 허용된 복합 속성 조합인지 확인
 * 인접 속성만 조합 가능
 */
export const isValidElementCombination = (
  primary: ElementType,
  secondary: ElementType
): boolean => {
  const adjacent: Record<ElementType, ElementType[]> = {
    earth: ['wind', 'water'],
    wind: ['earth', 'fire'],
    fire: ['wind', 'water'],
    water: ['fire', 'earth'],
  };

  return adjacent[primary].includes(secondary);
};
```

### 7.4 무기 시스템

```typescript
// /utils/formulas.ts

export type WeaponType = 'sword' | 'club' | 'axe' | 'spear' | 'claw' | 'bow';

export interface WeaponStats {
  attackRatio: number;  // 공격력 배율 (%)
  accuracy: number;     // 명중률 (%)
  hitCount: number;     // 기본 타격 횟수
  penaltyAgi: number;   // 민첩 패널티
  penaltyCon: number;   // 방어 패널티
}

/**
 * 무기 기본 스탯
 * @see 07_GAME_SYSTEMS.md - 8.1 무기 (6종류)
 */
export const WEAPON_STATS: Record<WeaponType, WeaponStats> = {
  sword: {
    attackRatio: 150,
    accuracy: 90,
    hitCount: 1,
    penaltyAgi: -10,
    penaltyCon: 0,
  },
  club: {
    attackRatio: 100,
    accuracy: 100,
    hitCount: 1,
    penaltyAgi: 0,
    penaltyCon: 0,
  },
  axe: {
    attackRatio: 200,
    accuracy: 90,
    hitCount: 1,
    penaltyAgi: -20,
    penaltyCon: -20,
  },
  spear: {
    attackRatio: 90,  // 90% × 2회 = 180%
    accuracy: 80,
    hitCount: 2,
    penaltyAgi: -20,
    penaltyCon: 0,
  },
  claw: {
    attackRatio: 40,  // 40% × 3회 = 120%
    accuracy: 90,
    hitCount: 3,
    penaltyAgi: 0,
    penaltyCon: 0,
  },
  bow: {
    attackRatio: 80,  // 80% × 랜덤 횟수
    accuracy: 80,
    hitCount: 1,      // 실제로는 1~적 수 랜덤
    penaltyAgi: 0,
    penaltyCon: 0,
  },
};

/**
 * 활 타격 횟수 계산
 */
export const calculateBowHitCount = (enemyCount: number): number => {
  return Math.floor(Math.random() * enemyCount) + 1;
};
```

### 7.5 충성도 시스템

```typescript
// /utils/formulas.ts

export interface LoyaltyEffects {
  damageBonus: number;      // 데미지 보너스 (%)
  accuracyBonus: number;    // 명중 보너스 (%)
  disobeyChance: number;    // 불복 확률 (%)
  fleeRisk: boolean;        // 탈주 위험
}

/**
 * 충성도 효과 계산
 * @see 07_GAME_SYSTEMS.md - 2. 충성도 시스템
 */
export const getLoyaltyEffects = (loyalty: number): LoyaltyEffects => {
  if (loyalty >= 100) {
    return { damageBonus: 0.1, accuracyBonus: 0.05, disobeyChance: 0, fleeRisk: false };
  }
  if (loyalty >= 70) {
    return { damageBonus: 0.05, accuracyBonus: 0.02, disobeyChance: 0.05, fleeRisk: false };
  }
  if (loyalty >= 50) {
    return { damageBonus: 0, accuracyBonus: 0, disobeyChance: 0.15, fleeRisk: false };
  }
  if (loyalty >= 30) {
    return { damageBonus: -0.1, accuracyBonus: -0.05, disobeyChance: 0.3, fleeRisk: true };
  }
  return { damageBonus: -0.2, accuracyBonus: -0.1, disobeyChance: 0.5, fleeRisk: true };
};

/**
 * 레벨 차이에 따른 충성도 감소 계산
 */
export const getLevelDiffLoyaltyPenalty = (
  characterLevel: number,
  petLevel: number
): number => {
  const diff = petLevel - characterLevel;
  if (diff <= 0) return 0;
  if (diff <= 5) return 0;
  if (diff <= 10) return -10;  // -10%
  if (diff <= 20) return -20;  // -20%
  return -50; // -50%
};

/**
 * 불복 시 행동 결정
 */
export type DisobeyAction = 'idle' | 'attack_random' | 'defend';

export const rollDisobeyAction = (): DisobeyAction => {
  const actions: DisobeyAction[] = ['idle', 'attack_random', 'defend'];
  return actions[Math.floor(Math.random() * actions.length)];
};
```

---

## 8. 전투 시스템 구현

### 8.1 데미지 계산기

```typescript
// /services/battle/damageCalculator.ts
import { calculateElementMultiplier } from '@/utils/formulas';
import type { BattleUnit, DamageResult, DamageOptions } from '@/types/battle';

export class DamageCalculator {
  /**
   * 메인 데미지 계산
   * @see 07_GAME_SYSTEMS.md - 4. 전투 시스템
   */
  calculate(
    attacker: BattleUnit,
    defender: BattleUnit,
    options: DamageOptions = {}
  ): DamageResult {
    // 1단계: 기본 공격력
    let baseDamage = attacker.stats.atk;

    // 2단계: 무기 배율 적용
    if (options.weaponInfo) {
      baseDamage = Math.floor(baseDamage * (options.weaponInfo.attackRatio / 100));
    }

    // 3단계: 속성 배율
    const attackElement = options.attackElement || attacker.element;
    const elementMultiplier = calculateElementMultiplier(attackElement, defender.element);
    baseDamage = Math.floor(baseDamage * elementMultiplier);

    // 4단계: 크리티컬 판정
    const critChance = options.critChance || 5;
    const isCritical = Math.random() * 100 < critChance;

    // 5단계: 방어력 적용 (크리티컬이면 무시)
    let finalDamage = baseDamage;
    if (!isCritical) {
      finalDamage = Math.max(1, baseDamage - defender.stats.def);
    }

    // 6단계: 방어 상태 체크
    if (defender.isDefending) {
      finalDamage = Math.floor(finalDamage * 0.5);
    }

    // 7단계: 상태이상 약점 배율
    const statusWeakness = this.getStatusWeaknessMultiplier(
      defender.statusEffects,
      attackElement
    );
    finalDamage = Math.floor(finalDamage * statusWeakness);

    // 최소 데미지 보장
    finalDamage = Math.max(1, finalDamage);

    return {
      damage: finalDamage,
      isCritical,
      elementMultiplier,
      statusWeaknessMultiplier: statusWeakness,
      wasDefending: defender.isDefending,
    };
  }

  /**
   * 명중/회피 판정
   */
  calculateHit(
    attacker: BattleUnit,
    defender: BattleUnit,
    weaponAccuracy: number = 100
  ): { hit: boolean; evaded: boolean } {
    // 1단계: 무기 정확도
    if (Math.random() * 100 > weaponAccuracy) {
      return { hit: false, evaded: false };
    }

    // 2단계: 회피 판정
    const evasionRate = defender.stats.eva;
    if (Math.random() * 100 < evasionRate) {
      return { hit: false, evaded: true };
    }

    return { hit: true, evaded: false };
  }

  /**
   * 상태이상 약점 배율
   * 독-화: 120%, 석화-풍: 120%, 마비-지: 120%, 화상-수: 120%
   */
  private getStatusWeaknessMultiplier(
    statusEffects: any[],
    attackElement: any
  ): number {
    const WEAKNESS_MAP: Record<string, string> = {
      poison: 'fire',
      petrify: 'wind',
      paralysis: 'earth',
      burn: 'water',
    };

    for (const effect of statusEffects) {
      const weakElement = WEAKNESS_MAP[effect.type];
      if (
        weakElement === attackElement.primary ||
        weakElement === attackElement.secondary
      ) {
        return 1.2;
      }
    }

    return 1.0;
  }
}
```

### 8.2 턴 매니저

```typescript
// /services/battle/turnManager.ts
import type { BattleUnit } from '@/types/battle';

export class TurnManager {
  /**
   * 턴 순서 계산 (민첩 기반)
   */
  calculateTurnOrder(units: BattleUnit[]): string[] {
    const aliveUnits = units.filter(u => u.isAlive);

    const sorted = aliveUnits.sort((a, b) => {
      // 민첩 순 정렬 (높은 순)
      if (a.stats.spd !== b.stats.spd) {
        return b.stats.spd - a.stats.spd;
      }
      // 동일하면 랜덤
      return Math.random() - 0.5;
    });

    return sorted.map(u => u.id);
  }

  /**
   * 다굴 그룹 찾기
   * 민첩이 ±10% 이내인 연속된 아군
   * 
   * @see 07_GAME_SYSTEMS.md - 5. 다굴 시스템
   */
  findGangUpGroup(
    actorId: string,
    turnOrder: string[],
    units: Map<string, BattleUnit>
  ): string[] {
    const actor = units.get(actorId);
    if (!actor || actor.type === 'enemy') return [actorId];

    const actorSpd = actor.stats.spd;
    const spdMin = actorSpd * 0.9;
    const spdMax = actorSpd * 1.1;

    const group: string[] = [];
    const actorIndex = turnOrder.indexOf(actorId);

    for (let i = actorIndex; i < turnOrder.length; i++) {
      const unit = units.get(turnOrder[i]);
      if (!unit || !unit.isAlive) continue;

      // 적이 끼어들면 다굴 끊김
      if (unit.type === 'enemy') break;

      // 민첩 범위 확인
      if (unit.stats.spd >= spdMin && unit.stats.spd <= spdMax) {
        group.push(unit.id);
      } else {
        break;
      }
    }

    return group;
  }

  /**
   * 다굴 크리티컬 보너스
   * 2명: +10%, 3명: +20%, ..., 최대 +50%
   */
  getGangUpCritBonus(participantCount: number): number {
    return Math.min((participantCount - 1) * 10, 50);
  }
}
```

### 8.3 상태이상 매니저

```typescript
// /services/battle/statusEffectManager.ts
import type { BattleUnit, StatusEffect, StatusEffectType } from '@/types/battle';

// 상태이상 설정
const STATUS_CONFIGS: Record<StatusEffectType, any> = {
  poison: {
    name: '독',
    onTurnStart: (unit: BattleUnit) => {
      // 최대 HP의 5~10% 피해
      const damagePercent = 0.05 + Math.random() * 0.05;
      return { type: 'damage', value: Math.floor(unit.maxHp * damagePercent) };
    },
  },
  petrify: {
    name: '석화',
    preventsAction: true,
    damageReduction: 0.2, // 받는 데미지 -20%
  },
  confusion: {
    name: '혼란',
    modifyTarget: true, // 타겟 변경 (자신 33% / 적 33% / 아군 33%)
  },
  freeze: {
    name: '동결',
    preventsAction: true,
    curedByElement: 'fire', // 화 속성 공격 시 해제
  },
  paralysis: {
    name: '마비',
    actionChance: 0.5,   // 50% 확률로 행동 가능
    spdReduction: 0.3,   // 민첩 -30%
  },
  blind: {
    name: '실명',
    accuracyReduction: 0.3, // 명중률 -30%
  },
  silence: {
    name: '침묵',
    preventsSpells: true,
    preventsSkills: true,
  },
  fear: {
    name: '공포',
    allowedActions: ['defend', 'flee'], // 방어/도주만 가능
  },
  burn: {
    name: '화상',
    atkReduction: 0.2, // 공격력 -20%
    onTurnStart: (unit: BattleUnit) => {
      // 최대 HP의 3~5% 피해
      const damagePercent = 0.03 + Math.random() * 0.02;
      return { type: 'damage', value: Math.floor(unit.maxHp * damagePercent) };
    },
  },
};

export class StatusEffectManager {
  /**
   * 상태이상 적용 시도
   */
  tryApply(
    target: BattleUnit,
    statusType: StatusEffectType,
    isAoE: boolean = false
  ): { applied: boolean; reason?: string } {
    // 이미 같은 상태이상이 있으면 실패
    if (target.statusEffects.some(e => e.type === statusType)) {
      return { applied: false, reason: 'already_affected' };
    }

    // 이미 다른 상태이상이 있으면 덮어쓰기 (단일 슬롯)
    if (target.statusEffects.length > 0) {
      target.statusEffects = [];
    }

    // 적용 확률: 단일 90%, 전체 80%
    const applyChance = isAoE ? 80 : 90;
    if (Math.random() * 100 > applyChance) {
      return { applied: false, reason: 'resisted' };
    }

    // 지속 시간: 3~5턴 랜덤
    const duration = 3 + Math.floor(Math.random() * 3);

    target.statusEffects.push({
      type: statusType,
      remainingTurns: duration,
      appliedAt: Date.now(),
    });

    return { applied: true };
  }

  /**
   * 턴 시작 시 상태이상 처리
   */
  processTurnStart(unit: BattleUnit): Array<{ type: string; damage?: number }> {
    const results: Array<{ type: string; damage?: number }> = [];

    for (const effect of unit.statusEffects) {
      const config = STATUS_CONFIGS[effect.type];

      if (config.onTurnStart) {
        const result = config.onTurnStart(unit);
        results.push({ type: effect.type, ...result });
      }
    }

    return results;
  }

  /**
   * 턴 종료 시 지속시간 감소
   */
  processTurnEnd(unit: BattleUnit): string[] {
    const expired: string[] = [];

    unit.statusEffects = unit.statusEffects.filter(effect => {
      effect.remainingTurns--;

      if (effect.remainingTurns <= 0) {
        expired.push(effect.type);
        return false;
      }
      return true;
    });

    return expired;
  }

  /**
   * 행동 가능 여부 확인
   */
  canAct(unit: BattleUnit): { canAct: boolean; reason?: string } {
    for (const effect of unit.statusEffects) {
      const config = STATUS_CONFIGS[effect.type];

      if (config.preventsAction) {
        return { canAct: false, reason: effect.type };
      }

      if (config.actionChance) {
        if (Math.random() > config.actionChance) {
          return { canAct: false, reason: effect.type };
        }
      }
    }

    return { canAct: true };
  }

  /**
   * 속성 공격으로 상태이상 해제 체크
   */
  checkElementCure(
    unit: BattleUnit,
    attackElement: string
  ): string | null {
    const freezeEffect = unit.statusEffects.find(e => e.type === 'freeze');
    if (freezeEffect && attackElement === 'fire') {
      unit.statusEffects = unit.statusEffects.filter(e => e.type !== 'freeze');
      return 'freeze';
    }

    return null;
  }
}
```

---

## 9. 데이터베이스 작업

### 9.1 Supabase 클라이언트 설정

```typescript
// /config/database.ts
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// 서버 사이드 클라이언트 (service_role key)
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// 클라이언트 사이드용 (anon key) - 프론트엔드에서 직접 사용 시
export const createClientSupabase = () => {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
};
```

### 9.2 쿼리 패턴

```typescript
// 단일 조회
const { data, error } = await supabase
  .from('characters')
  .select('*')
  .eq('id', characterId)
  .single();

if (error) throw new NotFoundError('캐릭터');

// 관계 포함 조회
const { data: character } = await supabase
  .from('characters')
  .select(`
    *,
    pets:pets(*),
    equipment:equipment(
      *,
      spell:spell_templates(*)
    )
  `)
  .eq('id', characterId)
  .single();

// 조건부 조회
const { data: pets } = await supabase
  .from('pets')
  .select('*')
  .eq('character_id', characterId)
  .not('party_slot', 'is', null)
  .order('party_slot', { ascending: true });

// 삽입
const { data: newPet, error } = await supabase
  .from('pets')
  .insert({
    character_id: characterId,
    template_id: templateId,
    level: 1,
    stat_str: 5,
    // ...
  })
  .select()
  .single();

// 업데이트
const { error } = await supabase
  .from('characters')
  .update({
    level: newLevel,
    exp: newExp,
    stat_points: newStatPoints,
  })
  .eq('id', characterId);

// 트랜잭션 (RPC 사용)
const { data, error } = await supabase.rpc('craft_equipment', {
  p_character_id: characterId,
  p_recipe_id: recipeId,
  p_spell_material_id: spellMaterialId,
});
```

### 9.3 RPC 함수 예시 (PostgreSQL)

```sql
-- 장비 제작 트랜잭션
CREATE OR REPLACE FUNCTION craft_equipment(
  p_character_id UUID,
  p_recipe_id INTEGER,
  p_spell_material_id INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_recipe RECORD;
  v_character RECORD;
  v_equipment_id UUID;
  v_result JSON;
BEGIN
  -- 레시피 조회
  SELECT * INTO v_recipe FROM recipes WHERE id = p_recipe_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipe not found';
  END IF;

  -- 캐릭터 골드 확인
  SELECT * INTO v_character FROM characters WHERE id = p_character_id;
  IF v_character.gold < v_recipe.gold_cost THEN
    RAISE EXCEPTION 'Insufficient gold';
  END IF;

  -- 재료 확인 및 차감 (별도 함수로 분리 가능)
  -- ...

  -- 골드 차감
  UPDATE characters 
  SET gold = gold - v_recipe.gold_cost 
  WHERE id = p_character_id;

  -- 장비 생성
  INSERT INTO equipment (
    character_id,
    template_id,
    spell_id,
    stat_str,
    stat_agi,
    -- 랜덤 스탯 생성
    durability
  ) VALUES (
    p_character_id,
    v_recipe.result_equipment_id,
    p_spell_material_id,
    -- 랜덤 값들...
    100
  ) RETURNING id INTO v_equipment_id;

  -- 결과 반환
  SELECT json_build_object(
    'equipment_id', v_equipment_id,
    'remaining_gold', v_character.gold - v_recipe.gold_cost
  ) INTO v_result;

  RETURN v_result;
END;
$$;
```

---

## 10. API 통신 패턴

### 10.1 Axios 설정

```typescript
// /services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';

// Axios 인스턴스 생성
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 자동 첨부
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    // 401 에러 시 로그아웃
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    // 에러 응답 변환
    const apiError: ApiError = {
      code: error.response?.data?.error?.code || 'E9001',
      message: error.response?.data?.error?.message || '서버 오류가 발생했습니다.',
      details: error.response?.data?.error?.details,
    };

    return Promise.reject(apiError);
  }
);

export default api;

// 타입 정의
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
```

### 10.2 서비스 레이어

```typescript
// /services/battleService.ts
import api from './api';
import type { BattleState, StartBattleParams } from '@/types/battle';

export const battleService = {
  /**
   * 전투 시작
   */
  startBattle: async (params: StartBattleParams): Promise<BattleState> => {
    const { data } = await api.post<{ success: true; data: BattleState }>(
      '/battles/start',
      params
    );
    return data.data;
  },

  /**
   * 전투 상태 조회
   */
  getBattle: async (battleId: string): Promise<BattleState> => {
    const { data } = await api.get<{ success: true; data: BattleState }>(
      `/battles/${battleId}`
    );
    return data.data;
  },

  /**
   * 도주
   */
  flee: async (battleId: string): Promise<{ fled: boolean; penalties: any }> => {
    const { data } = await api.post(`/battles/${battleId}/flee`);
    return data.data;
  },
};
```

### 10.3 React Query 통합 (선택적)

```typescript
// /hooks/queries/useBattleQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { battleService } from '@/services/battleService';

// 전투 상태 조회
export const useBattleQuery = (battleId: string | null) => {
  return useQuery({
    queryKey: ['battle', battleId],
    queryFn: () => battleService.getBattle(battleId!),
    enabled: !!battleId,
    staleTime: 0, // 항상 최신 데이터
    refetchInterval: false, // WebSocket 사용하므로 폴링 불필요
  });
};

// 전투 시작 뮤테이션
export const useStartBattleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: battleService.startBattle,
    onSuccess: (data) => {
      queryClient.setQueryData(['battle', data.id], data);
    },
  });
};
```

---

## 11. WebSocket 통신

### 11.1 Socket.io 클라이언트

```typescript
// /services/socket.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * 소켓 연결
   */
  connect(): void {
    const token = useAuthStore.getState().token;
    if (!token) {
      console.error('Socket: No token available');
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    this.socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupDefaultListeners();
  }

  /**
   * 기본 이벤트 리스너
   */
  private setupDefaultListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });
  }

  /**
   * 소켓 연결 해제
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * 이벤트 발신
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * 이벤트 수신 등록
   */
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  /**
   * 이벤트 수신 해제
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
```

### 11.2 Socket Hook

```typescript
// /hooks/useSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { socketService } from '@/services/socket';

interface UseSocketOptions {
  autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = { autoConnect: true }) => {
  const { autoConnect } = options;

  useEffect(() => {
    if (autoConnect) {
      socketService.connect();
    }

    return () => {
      // 컴포넌트 언마운트 시 연결 유지 (앱 전역 사용)
    };
  }, [autoConnect]);

  const emit = useCallback((event: string, data?: any) => {
    socketService.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketService.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    socketService.off(event, callback);
  }, []);

  return {
    emit,
    on,
    off,
    isConnected: socketService.isConnected(),
    connect: () => socketService.connect(),
    disconnect: () => socketService.disconnect(),
  };
};

/**
 * 특정 이벤트 구독 Hook
 */
export const useSocketEvent = <T = any>(
  event: string,
  callback: (data: T) => void
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (data: T) => {
      callbackRef.current(data);
    };

    socketService.on(event, handler);

    return () => {
      socketService.off(event, handler);
    };
  }, [event]);
};
```

---

## 12. 에러 처리

### 12.1 커스텀 에러 클래스

```typescript
// /utils/errors.ts

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 Bad Request
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

// 401 Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다') {
    super(401, 'UNAUTHORIZED', message);
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(message = '권한이 없습니다') {
    super(403, 'FORBIDDEN', message);
  }
}

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource}을(를) 찾을 수 없습니다`);
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

// 게임 로직 에러
export class GameError extends AppError {
  constructor(code: string, message: string) {
    super(400, code, message);
  }
}

// 자원 부족 에러
export class InsufficientResourceError extends GameError {
  constructor(resource: string) {
    super('INSUFFICIENT_RESOURCE', `${resource}이(가) 부족합니다`);
  }
}
```

### 12.2 에러 핸들링 미들웨어

```typescript
// /middlewares/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Zod 검증 에러
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '입력 데이터가 유효하지 않습니다',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // 커스텀 AppError
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // 예상치 못한 에러
  logger.error('Unexpected error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  // 프로덕션에서는 상세 정보 숨김
  const message =
    process.env.NODE_ENV === 'production'
      ? '서버 오류가 발생했습니다'
      : error.message;

  return res.status(500).json({
    success: false,
    error: {
      code: 'E9001',
      message,
    },
  });
};
```

### 12.3 프론트엔드 에러 처리

```typescript
// /hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { toast } from 'react-hot-toast'; // 또는 다른 토스트 라이브러리

interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export const useErrorHandler = () => {
  const handleError = useCallback((error: ApiError | Error) => {
    // API 에러
    if ('code' in error) {
      // 에러 코드별 처리
      switch (error.code) {
        case 'E1001':
        case 'E1002':
        case 'E1003':
          // 인증 에러 - 로그인 페이지로 리다이렉트
          toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
          break;

        case 'E5004':
          toast.error('골드가 부족합니다!');
          break;

        case 'E4007':
          toast.error('이전 스테이지를 먼저 클리어해주세요.');
          break;

        default:
          toast.error(error.message);
      }
    } else {
      // 일반 에러
      console.error('Unexpected error:', error);
      toast.error('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }, []);

  return { handleError };
};

// 사용 예시
const MyComponent = () => {
  const { handleError } = useErrorHandler();

  const handleSubmit = async () => {
    try {
      await battleService.startBattle(params);
    } catch (error) {
      handleError(error as ApiError);
    }
  };
};
```

---

## 13. 보안 가이드라인

### 13.1 입력 검증 (Zod)

```typescript
// /validators/characterValidator.ts
import { z } from 'zod';

export const createCharacterSchema = z.object({
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 합니다')
    .max(8, '닉네임은 8자 이하여야 합니다')
    .regex(/^[가-힣a-zA-Z0-9]+$/, '한글, 영문, 숫자만 사용 가능합니다'),

  appearance: z.object({
    eye: z.number().int().min(1).max(5),
    nose: z.number().int().min(1).max(3),
    mouth: z.number().int().min(1).max(4),
    hair: z.number().int().min(1).max(6),
    skin: z.number().int().min(1).max(5),
  }),

  element: z
    .object({
      primary: z.enum(['earth', 'wind', 'fire', 'water']),
      secondary: z.enum(['earth', 'wind', 'fire', 'water']).optional(),
      primaryRatio: z.number().int().min(50).max(100).default(100),
    })
    .refine(
      (data) => {
        if (!data.secondary) return true;
        // 인접 속성 검증
        const adjacent: Record<string, string[]> = {
          earth: ['wind', 'water'],
          wind: ['earth', 'fire'],
          fire: ['wind', 'water'],
          water: ['fire', 'earth'],
        };
        return adjacent[data.primary].includes(data.secondary);
      },
      { message: '인접 속성만 조합할 수 있습니다' }
    ),

  stats: z
    .object({
      str: z.number().int().min(5),
      agi: z.number().int().min(5),
      vit: z.number().int().min(5),
      con: z.number().int().min(5),
      int: z.number().int().min(5),
    })
    .refine(
      (data) => {
        const total = data.str + data.agi + data.vit + data.con + data.int;
        return total === 45; // 기본 25 + 보너스 20
      },
      { message: '스탯 총합은 45여야 합니다' }
    ),
});

// 타입 추론
export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
```

### 13.2 Rate Limiting

```typescript
// /middlewares/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@/config/redis';

// 일반 API: 분당 100회
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args) as any,
  }),
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
    },
  },
  keyGenerator: (req) => req.ip || 'unknown',
});

// 인증 API: 분당 10회
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args) as any,
  }),
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.',
    },
  },
});

// 전투 시작: 분당 5회
export const battleStartLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args) as any,
  }),
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req: any) => req.characterId || req.ip || 'unknown',
});
```

### 13.3 보안 체크리스트

```typescript
// /app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';

const app = express();

// 1. 보안 헤더 (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", env.SOCKET_URL],
      },
    },
  })
);

// 2. CORS 설정
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body 파싱 제한
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Rate Limiting (라우트별 적용)
// ...

export default app;
```

---

## 14. 테스트 가이드

### 14.1 유닛 테스트 (Jest)

```typescript
// /services/battle/__tests__/damageCalculator.test.ts
import { DamageCalculator } from '../damageCalculator';
import type { BattleUnit } from '@/types/battle';

describe('DamageCalculator', () => {
  let calculator: DamageCalculator;

  beforeEach(() => {
    calculator = new DamageCalculator();
  });

  // 기본 유닛 생성 헬퍼
  const createUnit = (overrides: Partial<BattleUnit> = {}): BattleUnit => ({
    id: 'test-unit',
    type: 'character',
    name: 'Test',
    level: 10,
    hp: 200,
    maxHp: 200,
    mp: 100,
    maxMp: 100,
    stats: { atk: 50, def: 20, spd: 30, eva: 5 },
    element: { primary: 'fire', primaryRatio: 100 },
    statusEffects: [],
    isAlive: true,
    isDefending: false,
    ...overrides,
  });

  describe('calculate', () => {
    it('기본 데미지 계산', () => {
      const attacker = createUnit({ stats: { atk: 50, def: 0, spd: 0, eva: 0 } });
      const defender = createUnit({ stats: { atk: 0, def: 20, spd: 0, eva: 0 } });

      const result = calculator.calculate(attacker, defender);

      // 데미지 = ATK(50) - DEF(20) = 30
      expect(result.damage).toBe(30);
      expect(result.isCritical).toBe(false);
    });

    it('속성 상성 우위 시 130% 데미지', () => {
      const attacker = createUnit({ element: { primary: 'fire', primaryRatio: 100 } });
      const defender = createUnit({ element: { primary: 'water', primaryRatio: 100 } });

      // 화(火) → 수(水) 는 상성 우위
      const result = calculator.calculate(attacker, defender);

      expect(result.elementMultiplier).toBe(1.3);
    });

    it('속성 상성 열위 시 70% 데미지', () => {
      const attacker = createUnit({ element: { primary: 'fire', primaryRatio: 100 } });
      const defender = createUnit({ element: { primary: 'wind', primaryRatio: 100 } });

      // 화(火) ← 풍(風) 는 상성 열위
      const result = calculator.calculate(attacker, defender);

      expect(result.elementMultiplier).toBe(0.7);
    });

    it('크리티컬 시 방어력 무시', () => {
      const attacker = createUnit({ stats: { atk: 50, def: 0, spd: 0, eva: 0 } });
      const defender = createUnit({ stats: { atk: 0, def: 100, spd: 0, eva: 0 } });

      // 100% 크리티컬 확률로 설정
      const result = calculator.calculate(attacker, defender, { critChance: 100 });

      // 크리티컬이면 방어력 무시 → ATK(50) 그대로
      expect(result.isCritical).toBe(true);
      expect(result.damage).toBe(50);
    });

    it('방어 상태면 데미지 50% 감소', () => {
      const attacker = createUnit({ stats: { atk: 100, def: 0, spd: 0, eva: 0 } });
      const defender = createUnit({
        stats: { atk: 0, def: 0, spd: 0, eva: 0 },
        isDefending: true,
      });

      const result = calculator.calculate(attacker, defender);

      expect(result.damage).toBe(50); // 100 * 0.5
      expect(result.wasDefending).toBe(true);
    });
  });

  describe('calculateHit', () => {
    it('명중률 100%면 항상 명중', () => {
      const attacker = createUnit();
      const defender = createUnit({ stats: { atk: 0, def: 0, spd: 0, eva: 0 } });

      // 100번 테스트
      for (let i = 0; i < 100; i++) {
        const result = calculator.calculateHit(attacker, defender, 100);
        expect(result.hit).toBe(true);
      }
    });

    it('회피율이 높으면 회피 가능', () => {
      const attacker = createUnit();
      const defender = createUnit({ stats: { atk: 0, def: 0, spd: 0, eva: 100 } });

      // 100% 회피율이면 항상 회피
      const result = calculator.calculateHit(attacker, defender, 100);
      expect(result.evaded).toBe(true);
    });
  });
});
```

### 14.2 통합 테스트

```typescript
// /routes/__tests__/battle.test.ts
import request from 'supertest';
import app from '@/app';
import { supabase } from '@/config/database';

describe('Battle Routes', () => {
  let authToken: string;
  let characterId: string;

  beforeAll(async () => {
    // 테스트 유저 생성 및 로그인
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });

    authToken = loginRes.body.data.token;

    // 테스트 캐릭터 생성
    const charRes = await request(app)
      .post('/api/characters')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        nickname: 'TestChar',
        appearance: { eye: 1, nose: 1, mouth: 1, hair: 1, skin: 1 },
        element: { primary: 'fire', primaryRatio: 100 },
        stats: { str: 10, agi: 10, vit: 10, con: 10, int: 5 },
      });

    characterId = charRes.body.data.character.id;
    authToken = charRes.body.data.token; // 캐릭터 포함된 새 토큰
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await supabase.from('characters').delete().eq('id', characterId);
  });

  describe('POST /api/battles/start', () => {
    it('전투 시작 성공', async () => {
      const res = await request(app)
        .post('/api/battles/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          stageId: 1,
          partyPetIds: [],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.battleId).toBeDefined();
      expect(res.body.data.allies).toHaveLength(1); // 캐릭터만
      expect(res.body.data.enemies.length).toBeGreaterThan(0);
    });

    it('잠긴 스테이지 접근 시 403', async () => {
      const res = await request(app)
        .post('/api/battles/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          stageId: 100, // 해금되지 않은 스테이지
          partyPetIds: [],
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
```

---

## 15. 배포 가이드

### 15.1 환경별 설정

```typescript
// /config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),

  REDIS_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SOCKET_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

### 15.2 Docker 설정

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 의존성 설치
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 빌드
COPY . .
RUN pnpm build

# 프로덕션 이미지
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### 15.3 CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Railway 또는 다른 플랫폼 배포
      - name: Deploy to Railway
        uses: railway/deploy@v1
        with:
          service: uglynos-api
          environment: production
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Vercel 배포
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 16. 참조 문서

개발 시 다음 문서들을 참고하세요:

| 문서 | 설명 | 경로 |
|------|------|------|
| 00_PROJECT_OVERVIEW.md | 프로젝트 전체 개요 | /docs/ |
| 01_PHASE_ROADMAP.md | 개발 로드맵 | /docs/ |
| 02_FRONTEND_SPEC.md | 프론트엔드 상세 | /docs/ |
| 03_BACKEND_SPEC.md | 백엔드 상세 | /docs/ |
| 04_DATABASE_SCHEMA.md | DB 스키마 | /docs/ |
| 05_API_SPECIFICATION.md | API 명세 | /docs/ |
| 06_ASSET_GUIDELINES.md | 에셋 가이드 | /docs/ |
| 07_GAME_SYSTEMS.md | 게임 시스템 공식 | /docs/ |

### 주요 참조 포인트

- **데미지 계산:** 07_GAME_SYSTEMS.md → 4. 전투 시스템
- **속성 상성:** 07_GAME_SYSTEMS.md → 3. 속성 시스템
- **충성도:** 07_GAME_SYSTEMS.md → 2. 충성도 시스템
- **다굴 시스템:** 07_GAME_SYSTEMS.md → 5. 다굴 시스템
- **경험치 공식:** 07_GAME_SYSTEMS.md → 15. 경험치/레벨업 시스템
- **API 엔드포인트:** 05_API_SPECIFICATION.md
- **WebSocket 이벤트:** 05_API_SPECIFICATION.md → 6. WebSocket 이벤트
- **DB 테이블 구조:** 04_DATABASE_SCHEMA.md

---

## 📝 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-01-13 | 초기 작성 |

---

> 💡 **이 문서는 지속적으로 업데이트됩니다. 코드 작성 전 항상 최신 버전을 확인하세요.**
