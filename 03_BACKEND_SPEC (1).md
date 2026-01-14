# 🔧 백엔드 스펙 (Backend Specification)

**uglynos** MVP 백엔드 설계 문서입니다.

**기술 스택:** Node.js + Express + Socket.io + Supabase (PostgreSQL) + Redis

> **📌 참고:** API 엔드포인트 및 WebSocket 이벤트 상세는 `05_API_SPECIFICATION.md` 참조

---

## 📋 목차

1. [기술 스택 상세](#1-기술-스택-상세)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [인증 시스템](#3-인증-시스템)
4. [전투 시스템 서버 로직](#4-전투-시스템-서버-로직)
5. [게임 공식 구현](#5-게임-공식-구현)
6. [데이터 검증](#6-데이터-검증)
7. [에러 처리](#7-에러-처리)
8. [캐싱 전략](#8-캐싱-전략)
9. [보안 체크리스트](#9-보안-체크리스트)

---

## 1. 기술 스택 상세

### 1.1 핵심 라이브러리

| 라이브러리 | 버전 | 용도 |
|------------|------|------|
| **Node.js** | 20.x LTS | 런타임 |
| **Express** | 4.x | REST API 프레임워크 |
| **Socket.io** | 4.x | 실시간 통신 (전투, 파티) |
| **@supabase/supabase-js** | 2.x | PostgreSQL 클라이언트 |
| **Redis (ioredis)** | 5.x | 세션, 캐싱, 전투 상태 |
| **jsonwebtoken** | 9.x | JWT 인증 |
| **bcrypt** | 5.x | 비밀번호 해싱 |
| **zod** | 3.x | 요청 데이터 검증 |
| **helmet** | 7.x | HTTP 보안 헤더 |
| **cors** | 2.x | CORS 설정 |
| **morgan** | 1.x | HTTP 로깅 |
| **winston** | 3.x | 애플리케이션 로깅 |

### 1.2 개발 도구

| 도구 | 용도 |
|------|------|
| TypeScript | 타입 안정성 |
| tsx | TypeScript 실행 |
| nodemon | 개발 서버 자동 재시작 |
| ESLint | 코드 품질 |
| Prettier | 코드 포맷팅 |
| Jest | 테스트 |

### 1.3 환경 변수

```env
# .env.example

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
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 2. 프로젝트 구조

```
/src
├── /config                 # 설정 파일
│   ├── database.ts         # Supabase 연결
│   ├── redis.ts            # Redis 연결
│   ├── socket.ts           # Socket.io 설정
│   └── env.ts              # 환경 변수 로드
│
├── /controllers            # 요청 처리
│   ├── authController.ts
│   ├── characterController.ts
│   ├── petController.ts
│   ├── battleController.ts
│   ├── stageController.ts
│   ├── shopController.ts
│   ├── craftController.ts
│   └── inventoryController.ts
│
├── /services               # 비즈니스 로직
│   ├── authService.ts
│   ├── characterService.ts
│   ├── petService.ts
│   ├── battleService.ts
│   ├── stageService.ts
│   ├── shopService.ts
│   ├── craftService.ts
│   ├── inventoryService.ts
│   └── /battle             # 전투 관련 서비스
│       ├── turnManager.ts
│       ├── damageCalculator.ts
│       ├── statusEffectManager.ts
│       ├── captureManager.ts
│       ├── loyaltyManager.ts
│       └── rewardCalculator.ts
│
├── /models                 # 데이터 모델 (타입 정의)
│   ├── User.ts
│   ├── Character.ts
│   ├── Pet.ts
│   ├── Equipment.ts
│   ├── Battle.ts
│   ├── Stage.ts
│   └── index.ts
│
├── /routes                 # 라우트 정의
│   ├── authRoutes.ts
│   ├── characterRoutes.ts
│   ├── petRoutes.ts
│   ├── battleRoutes.ts
│   ├── stageRoutes.ts
│   ├── shopRoutes.ts
│   ├── craftRoutes.ts
│   ├── inventoryRoutes.ts
│   └── index.ts
│
├── /socket                 # Socket.io 핸들러
│   ├── index.ts            # 소켓 초기화
│   ├── battleSocket.ts     # 전투 이벤트
│   ├── partySocket.ts      # 파티 이벤트
│   └── handlers/
│       ├── onBattleAction.ts
│       ├── onPartyJoin.ts
│       └── ...
│
├── /middlewares            # 미들웨어
│   ├── authMiddleware.ts   # JWT 검증
│   ├── errorMiddleware.ts  # 에러 핸들링
│   ├── rateLimiter.ts      # 요청 제한
│   └── validator.ts        # Zod 검증
│
├── /utils                  # 유틸리티
│   ├── logger.ts           # Winston 로거
│   ├── random.ts           # 랜덤 함수
│   ├── formulas.ts         # 게임 공식
│   ├── errors.ts           # 커스텀 에러
│   └── constants.ts        # 상수 정의
│
├── /types                  # TypeScript 타입
│   ├── express.d.ts        # Express 확장
│   ├── socket.d.ts         # Socket 타입
│   └── game.ts             # 게임 관련 타입
│
├── /validators             # Zod 스키마
│   ├── authValidator.ts
│   ├── characterValidator.ts
│   ├── battleValidator.ts
│   └── ...
│
├── app.ts                  # Express 앱 설정
├── server.ts               # 서버 시작점
└── index.ts                # 진입점
```

---

## 3. 인증 시스템

### 3.1 인증 플로우

```
[회원가입] → 비밀번호 해싱 → DB 저장 → JWT 발급
[로그인] → 비밀번호 검증 → JWT 발급 → 클라이언트 저장
[요청] → JWT 헤더 첨부 → 서버 검증 → 요청 처리
```

### 3.2 JWT 구조

```typescript
interface JwtPayload {
  userId: string;       // UUID
  characterId?: string; // 캐릭터 선택 후
  iat: number;          // 발급 시간
  exp: number;          // 만료 시간
}
```

### 3.3 인증 미들웨어

```typescript
// /middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  characterId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.userId = decoded.userId;
    req.characterId = decoded.characterId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// 캐릭터 필수 미들웨어
export const requireCharacter = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.characterId) {
    return res.status(403).json({ error: 'Character required' });
  }
  next();
};
```

### 3.4 Socket.io 인증

```typescript
// /socket/index.ts

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export const setupSocket = (io: Server) => {
  // 인증 미들웨어
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      socket.data.userId = decoded.userId;
      socket.data.characterId = decoded.characterId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.userId}`);
    
    // 이벤트 핸들러 등록
    registerBattleHandlers(socket);
    registerPartyHandlers(socket);
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.userId}`);
    });
  });
};
```

---

## 4. 전투 시스템 서버 로직

### 4.1 전투 상태 관리 (Redis)

```typescript
// Redis 키 구조
const BATTLE_KEY = `battle:${battleId}`;
const BATTLE_STATE_KEY = `battle:${battleId}:state`;
const BATTLE_ACTIONS_KEY = `battle:${battleId}:actions`;

// 전투 상태 인터페이스
interface BattleState {
  id: string;
  stageId: number;
  phase: 'waiting' | 'in_progress' | 'victory' | 'defeat' | 'fled';
  turnNumber: number;
  
  // 유닛 상태
  units: Map<string, BattleUnit>;
  
  // 턴 순서 (민첩 기반 정렬)
  turnOrder: string[];
  currentTurnIndex: number;
  
  // 대기 중인 행동
  pendingActions: Map<string, BattleAction>;
  
  // 파티 (멀티플레이)
  partyId?: string;
  participants: string[];  // characterId 목록
  
  // 타이머
  turnStartedAt: number;
  turnTimeout: number;  // 30초
  
  // 드랍 예정
  potentialDrops: Drop[];
  
  createdAt: number;
  updatedAt: number;
}

interface BattleUnit {
  id: string;
  type: 'character' | 'pet' | 'enemy';
  templateId?: number;  // 펫/몬스터 템플릿
  ownerId?: string;     // 소유 캐릭터 ID
  
  name: string;
  level: number;
  
  // 현재 상태
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  
  // 전투 스탯
  stats: {
    atk: number;
    def: number;
    spd: number;
    eva: number;
  };
  
  // 속성
  element: {
    primary: ElementType;
    secondary?: ElementType;
    primaryRatio: number;
  };
  
  // 상태이상
  statusEffects: StatusEffect[];
  
  // 장비 정보 (캐릭터만)
  equipment?: {
    weapon?: EquipmentInfo;
    armor?: EquipmentInfo;
    helmet?: EquipmentInfo;
    bracelet?: EquipmentInfo;
    necklace?: EquipmentInfo;
  };
  
  // 스킬 (펫만)
  skills?: PetSkill[];
  
  // 충성도 (펫만)
  loyalty?: number;
  
  // 탑승 상태
  isRiding?: boolean;
  ridingPetId?: string;
  
  // 포획 가능 여부 (적만)
  isCapturable?: boolean;
  isRareColor?: boolean;
  
  // 상태
  isAlive: boolean;
  isDefending: boolean;
}
```

### 4.2 턴 매니저

```typescript
// /services/battle/turnManager.ts

export class TurnManager {
  
  /**
   * 턴 순서 계산 (민첩 기반)
   */
  calculateTurnOrder(units: BattleUnit[]): string[] {
    const aliveUnits = units.filter(u => u.isAlive);
    
    // 민첩 순 정렬 (높은 순)
    const sorted = aliveUnits.sort((a, b) => {
      // 기본 민첩 비교
      if (a.stats.spd !== b.stats.spd) {
        return b.stats.spd - a.stats.spd;
      }
      // 동일하면 랜덤
      return Math.random() - 0.5;
    });
    
    return sorted.map(u => u.id);
  }
  
  /**
   * 다굴 그룹 찾기 (민첩 ±10% 이내 아군)
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
    
    // 연속된 아군 찾기
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
   * 다굴 크리티컬 보너스 계산
   */
  getGangUpCritBonus(participantCount: number): number {
    // 2명: +10%, 3명: +20%, ..., 최대 +50%
    const bonus = Math.min((participantCount - 1) * 10, 50);
    return bonus;
  }
  
  /**
   * 턴 타임아웃 처리
   */
  handleTurnTimeout(battleState: BattleState): BattleAction[] {
    const waitingUnits = this.getWaitingUnits(battleState);
    
    // 타임아웃된 유닛은 대기 상태 (아무것도 안함)
    return waitingUnits.map(unitId => ({
      actorId: unitId,
      type: 'wait',
      reason: 'timeout'
    }));
  }
  
  private getWaitingUnits(battleState: BattleState): string[] {
    // 아직 행동을 제출하지 않은 유닛 ID 반환
    const submitted = new Set(battleState.pendingActions.keys());
    return Array.from(battleState.units.values())
      .filter(u => u.isAlive && u.type !== 'enemy' && !submitted.has(u.id))
      .map(u => u.id);
  }
}
```

### 4.3 데미지 계산기

```typescript
// /services/battle/damageCalculator.ts

export class DamageCalculator {
  
  /**
   * 메인 데미지 계산
   */
  calculate(
    attacker: BattleUnit,
    defender: BattleUnit,
    options: DamageOptions
  ): DamageResult {
    
    // 1단계: 기본 공격력 계산
    let baseDamage = this.calculateBaseDamage(attacker, options);
    
    // 2단계: 무기 배율 적용
    if (options.weaponInfo) {
      baseDamage = this.applyWeaponMultiplier(baseDamage, options.weaponInfo);
    }
    
    // 3단계: 속성 배율 적용
    const elementMultiplier = this.calculateElementMultiplier(
      options.attackElement || attacker.element,
      defender.element
    );
    baseDamage *= elementMultiplier;
    
    // 4단계: 크리티컬 판정
    const isCritical = this.rollCritical(options.critChance || 5);
    
    // 5단계: 방어력 적용 (크리티컬이면 무시)
    let finalDamage = baseDamage;
    if (!isCritical) {
      finalDamage = Math.max(1, baseDamage - defender.stats.def);
    }
    
    // 6단계: 방어 상태 체크
    if (defender.isDefending) {
      finalDamage = Math.floor(finalDamage * 0.5);
    }
    
    // 7단계: 상태이상 약점 적용
    const statusWeaknessMultiplier = this.getStatusWeaknessMultiplier(
      defender.statusEffects,
      options.attackElement
    );
    finalDamage *= statusWeaknessMultiplier;
    
    // 최종 데미지 반올림
    finalDamage = Math.round(finalDamage);
    
    return {
      damage: finalDamage,
      isCritical,
      elementMultiplier,
      statusWeaknessMultiplier,
      wasDefending: defender.isDefending
    };
  }
  
  /**
   * 기본 데미지 = ATK (이미 파생 스탯으로 계산됨)
   */
  private calculateBaseDamage(attacker: BattleUnit, options: DamageOptions): number {
    return attacker.stats.atk;
  }
  
  /**
   * 무기 배율 적용
   */
  private applyWeaponMultiplier(damage: number, weapon: WeaponInfo): number {
    // 칼: 150%, 곤봉: 100%, 도끼: 200%, 창: 90%x2, 손톱: 40%x3, 활: 80%x1~n
    return damage * (weapon.attackRatio / 100);
  }
  
  /**
   * 속성 배율 계산 (복합 속성 지원)
   * 상성: 지→풍→화→수→지
   */
  private calculateElementMultiplier(
    attackElement: ElementInfo,
    defenderElement: ElementInfo
  ): number {
    const ADVANTAGE = { earth: 'wind', wind: 'fire', fire: 'water', water: 'earth' };
    const DISADVANTAGE = { earth: 'water', wind: 'earth', fire: 'wind', water: 'fire' };
    
    let totalMultiplier = 0;
    
    // 공격자 속성 비율 적용
    const attackPrimaryRatio = attackElement.primaryRatio / 100;
    const attackSecondaryRatio = attackElement.secondary 
      ? (100 - attackElement.primaryRatio) / 100 
      : 0;
    
    // 방어자 속성 비율 적용
    const defPrimaryRatio = defenderElement.primaryRatio / 100;
    const defSecondaryRatio = defenderElement.secondary 
      ? (100 - defenderElement.primaryRatio) / 100 
      : 0;
    
    // 각 속성 조합에 대해 배율 계산
    const combinations = [
      { atk: attackElement.primary, def: defenderElement.primary, ratio: attackPrimaryRatio * defPrimaryRatio },
      { atk: attackElement.primary, def: defenderElement.secondary, ratio: attackPrimaryRatio * defSecondaryRatio },
      { atk: attackElement.secondary, def: defenderElement.primary, ratio: attackSecondaryRatio * defPrimaryRatio },
      { atk: attackElement.secondary, def: defenderElement.secondary, ratio: attackSecondaryRatio * defSecondaryRatio },
    ];
    
    for (const combo of combinations) {
      if (!combo.atk || !combo.def || combo.ratio === 0) continue;
      
      let multiplier = 1.0;
      if (ADVANTAGE[combo.atk] === combo.def) {
        multiplier = 1.3;  // 상성 우위: 130%
      } else if (DISADVANTAGE[combo.atk] === combo.def) {
        multiplier = 0.7;  // 상성 열위: 70%
      }
      
      totalMultiplier += multiplier * combo.ratio;
    }
    
    return totalMultiplier || 1.0;
  }
  
  /**
   * 크리티컬 판정
   */
  private rollCritical(critChance: number): boolean {
    return Math.random() * 100 < critChance;
  }
  
  /**
   * 상태이상 약점 배율
   * 독-화: 120%, 석화-풍: 120%, 마비-지: 120%, 화상-수: 120%
   */
  private getStatusWeaknessMultiplier(
    statusEffects: StatusEffect[],
    attackElement?: ElementInfo
  ): number {
    if (!attackElement) return 1.0;
    
    const WEAKNESS_MAP = {
      poison: 'fire',
      petrify: 'wind',
      paralysis: 'earth',
      burn: 'water'
    };
    
    for (const effect of statusEffects) {
      const weakElement = WEAKNESS_MAP[effect.type];
      if (weakElement === attackElement.primary || weakElement === attackElement.secondary) {
        return 1.2;  // 120%
      }
    }
    
    return 1.0;
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
    const hitRoll = Math.random() * 100;
    if (hitRoll > weaponAccuracy) {
      return { hit: false, evaded: false };  // 무기 빗나감
    }
    
    // 2단계: 회피 판정 (민첩 × 0.3 = EVA%)
    const evasionRate = defender.stats.eva;
    const evadeRoll = Math.random() * 100;
    
    if (evadeRoll < evasionRate) {
      return { hit: false, evaded: true };  // 회피 성공
    }
    
    return { hit: true, evaded: false };
  }
}
```

### 4.4 상태이상 매니저

```typescript
// /services/battle/statusEffectManager.ts

export class StatusEffectManager {
  
  private static STATUS_EFFECTS = {
    poison: {
      name: '독',
      onTurnStart: (unit: BattleUnit) => {
        // 최대 HP의 5~10% 피해
        const damage = Math.floor(unit.maxHp * (0.05 + Math.random() * 0.05));
        return { type: 'damage', value: damage };
      }
    },
    petrify: {
      name: '석화',
      preventsAction: true,
      damageReduction: 0.2  // 받는 데미지 -20%
    },
    confusion: {
      name: '혼란',
      modifyTarget: (allies: string[], enemies: string[]) => {
        // 33% 자신, 33% 적, 33% 아군
        const roll = Math.random();
        if (roll < 0.33) return 'self';
        if (roll < 0.66) return enemies[Math.floor(Math.random() * enemies.length)];
        return allies[Math.floor(Math.random() * allies.length)];
      }
    },
    freeze: {
      name: '동결',
      preventsAction: true,
      curedByElement: 'fire'
    },
    paralysis: {
      name: '마비',
      actionChance: 0.5,  // 50% 확률로 행동 가능
      spdReduction: 0.3   // 민첩 -30%
    },
    blind: {
      name: '실명',
      accuracyReduction: 0.3  // 명중률 -30%
    },
    silence: {
      name: '침묵',
      preventsSpells: true,
      preventsSkills: true
    },
    fear: {
      name: '공포',
      allowedActions: ['defend', 'flee']
    },
    burn: {
      name: '화상',
      atkReduction: 0.2,  // 공격력 -20%
      onTurnStart: (unit: BattleUnit) => {
        // 최대 HP의 3~5% 피해
        const damage = Math.floor(unit.maxHp * (0.03 + Math.random() * 0.02));
        return { type: 'damage', value: damage };
      }
    }
  };
  
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
    
    // 이미 다른 상태이상이 있으면 덮어쓰기
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
      appliedAt: Date.now()
    });
    
    return { applied: true };
  }
  
  /**
   * 턴 시작 시 상태이상 처리
   */
  processTurnStart(unit: BattleUnit): StatusEffectResult[] {
    const results: StatusEffectResult[] = [];
    
    for (const effect of unit.statusEffects) {
      const config = StatusEffectManager.STATUS_EFFECTS[effect.type];
      
      if (config.onTurnStart) {
        const result = config.onTurnStart(unit);
        results.push({
          type: effect.type,
          ...result
        });
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
   * 특정 속성 공격으로 상태이상 해제
   */
  checkElementCure(unit: BattleUnit, attackElement: ElementType): string | null {
    // 동결은 화 속성에 즉시 해제
    const freezeEffect = unit.statusEffects.find(e => e.type === 'freeze');
    if (freezeEffect && attackElement === 'fire') {
      unit.statusEffects = unit.statusEffects.filter(e => e.type !== 'freeze');
      return 'freeze';
    }
    
    return null;
  }
}
```

### 4.5 포획 매니저

```typescript
// /services/battle/captureManager.ts

export class CaptureManager {
  
  /**
   * 포획 시도
   * - 1레벨 펫만 포획 가능
   * - 기본 확률 + 보정
   */
  tryCatch(
    target: BattleUnit,
    catcher: BattleUnit,
    captureItem?: CaptureItem
  ): CaptureResult {
    
    // 1레벨 펫만 포획 가능
    if (!target.isCapturable || target.level !== 1) {
      return { success: false, reason: 'not_capturable' };
    }
    
    // 기본 포획 확률 (HP 비례)
    const hpRatio = target.hp / target.maxHp;
    let catchRate = (1 - hpRatio) * 50 + 10;  // HP 낮을수록 높음, 10~60%
    
    // 아이템 보정
    if (captureItem) {
      catchRate += captureItem.catchBonus;
    }
    
    // 숨겨진 행운 보정 (장비, 칭호 등)
    if (catcher.luckBonus) {
      catchRate += catcher.luckBonus;
    }
    
    // 최대 95%
    catchRate = Math.min(catchRate, 95);
    
    const roll = Math.random() * 100;
    const success = roll < catchRate;
    
    return {
      success,
      catchRate,
      roll,
      isRareColor: target.isRareColor
    };
  }
  
  /**
   * 포획 성공 시 펫 생성
   */
  createCapturedPet(
    enemyUnit: BattleUnit,
    characterId: string
  ): CapturedPetData {
    // 개체 스탯 랜덤 생성
    const stats = this.generateRandomStats();
    
    // 성장률 랜덤 생성
    const growthRates = this.generateGrowthRates();
    
    return {
      templateId: enemyUnit.templateId,
      characterId,
      nickname: null,
      level: 1,
      exp: 0,
      ...stats,
      ...growthRates,
      loyalty: 50,  // 초기 충성도
      isRareColor: enemyUnit.isRareColor,
      isStarter: false
    };
  }
  
  private generateRandomStats(): PetStats {
    // 각 스탯 5 + (0~5) 랜덤
    return {
      stat_str: 5 + Math.floor(Math.random() * 6),
      stat_agi: 5 + Math.floor(Math.random() * 6),
      stat_vit: 5 + Math.floor(Math.random() * 6),
      stat_con: 5 + Math.floor(Math.random() * 6),
      stat_int: 5 + Math.floor(Math.random() * 6),
    };
  }
  
  private generateGrowthRates(): PetGrowthRates {
    // 각 성장률 80~120% 랜덤
    return {
      growth_str: 80 + Math.floor(Math.random() * 41),
      growth_agi: 80 + Math.floor(Math.random() * 41),
      growth_vit: 80 + Math.floor(Math.random() * 41),
      growth_con: 80 + Math.floor(Math.random() * 41),
      growth_int: 80 + Math.floor(Math.random() * 41),
    };
  }
}
```

### 4.6 충성도 매니저

```typescript
// /services/battle/loyaltyManager.ts

export class LoyaltyManager {
  
  /**
   * 불복 판정
   */
  checkDisobey(pet: BattleUnit): DisobeyResult {
    const loyalty = pet.loyalty;
    
    // 불복 확률
    let disobeyChance = 0;
    if (loyalty >= 100) disobeyChance = 0;
    else if (loyalty >= 70) disobeyChance = 5;
    else if (loyalty >= 50) disobeyChance = 15;
    else if (loyalty >= 30) disobeyChance = 30;
    else disobeyChance = 50;
    
    const disobeys = Math.random() * 100 < disobeyChance;
    
    if (!disobeys) {
      return { disobeyed: false };
    }
    
    // 불복 행동 결정
    const actions = ['idle', 'attack_random', 'defend'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    return {
      disobeyed: true,
      action,
      message: this.getDisobeyMessage(pet.name, action)
    };
  }
  
  /**
   * 도주 판정 (충성도 30 이하)
   */
  checkRunaway(pet: BattleUnit): boolean {
    if (pet.loyalty > 30) return false;
    
    // 충성도 30 이하: 전투 중 탈주 가능
    const runawayChance = (30 - pet.loyalty) * 2;  // 최대 60%
    return Math.random() * 100 < runawayChance;
  }
  
  /**
   * 전투 후 충성도 변화
   */
  updateLoyaltyAfterBattle(
    pet: BattleUnit,
    result: 'victory' | 'defeat',
    wasKnockedOut: boolean
  ): number {
    let change = 0;
    
    if (result === 'victory') {
      change = Math.floor(Math.random() * 2) + 1;  // +1~2
    }
    
    if (wasKnockedOut) {
      change -= 5;  // 기절 시 -5
    }
    
    const newLoyalty = Math.max(0, Math.min(100, pet.loyalty + change));
    return newLoyalty;
  }
  
  /**
   * 레벨 차이에 따른 충성도 감소
   */
  applyLevelDifferenceDecay(pet: BattleUnit, characterLevel: number): number {
    const levelDiff = pet.level - characterLevel;
    
    if (levelDiff <= 0) return pet.loyalty;
    
    let decayPercent = 0;
    if (levelDiff >= 20) decayPercent = 50;
    else if (levelDiff >= 10) decayPercent = 20;
    else if (levelDiff >= 5) decayPercent = 10;
    
    return Math.floor(pet.loyalty * (1 - decayPercent / 100));
  }
  
  private getDisobeyMessage(petName: string, action: string): string {
    const messages: Record<string, string> = {
      idle: `${petName}이(가) 멍하니 서있다...`,
      attack_random: `${petName}이(가) 마음대로 공격했다!`,
      defend: `${petName}이(가) 방어 자세를 취했다.`
    };
    return messages[action] || `${petName}이(가) 명령을 따르지 않았다.`;
  }
}
```

### 4.7 보상 계산기

```typescript
// /services/battle/rewardCalculator.ts

export class RewardCalculator {
  
  /**
   * 전투 승리 보상 계산
   */
  calculateRewards(
    battleState: BattleState,
    stageInfo: StageTemplate,
    participants: CharacterInfo[]
  ): BattleRewards {
    
    // 경험치 계산
    const expRewards = this.calculateExp(
      battleState.defeatedEnemies,
      participants
    );
    
    // 골드 계산
    const goldReward = stageInfo.goldReward;
    
    // 드랍 아이템
    const drops = this.rollDrops(stageInfo.drops);
    
    // 별점 계산
    const stars = this.calculateStars(battleState, stageInfo);
    
    return {
      exp: expRewards,
      gold: goldReward,
      drops,
      stars
    };
  }
  
  /**
   * 경험치 계산
   * - 참전자만 획득
   * - 파티 보너스 적용
   * - 레벨 차이 페널티 적용
   */
  private calculateExp(
    enemies: DefeatedEnemy[],
    participants: CharacterInfo[]
  ): ExpReward[] {
    
    // 파티 인원 보너스
    const partyBonus = this.getPartyExpBonus(participants.length);
    
    // 총 경험치
    let totalExp = 0;
    for (const enemy of enemies) {
      // 몬스터 경험치 = Lv × (2 + Lv/20)
      let exp = enemy.level * (2 + enemy.level / 20);
      
      // 보스 배율 ×1.1
      if (enemy.isBoss) {
        exp *= 1.1;
      }
      
      // 1레벨 펫은 1 EXP
      if (enemy.level === 1 && enemy.isCapturable) {
        exp = 1;
      }
      
      totalExp += Math.floor(exp);
    }
    
    // 참전자별 경험치 배분
    return participants.map(char => {
      let charExp = totalExp * partyBonus;
      
      // 레벨 차이 페널티
      const avgEnemyLevel = enemies.reduce((sum, e) => sum + e.level, 0) / enemies.length;
      const levelDiff = char.level - avgEnemyLevel;
      const penalty = this.getLevelPenalty(levelDiff);
      
      charExp *= penalty;
      
      return {
        characterId: char.id,
        exp: Math.floor(charExp)
      };
    });
  }
  
  /**
   * 파티 경험치 보너스
   * 1인: 100%, 2인: 103%, 3인: 106%, 4인: 109%, 5인: 120%
   */
  private getPartyExpBonus(memberCount: number): number {
    const bonuses = { 1: 1.0, 2: 1.03, 3: 1.06, 4: 1.09, 5: 1.20 };
    return bonuses[memberCount] || 1.0;
  }
  
  /**
   * 레벨 차이 페널티
   * 1~10: 없음, 11~20: -1~5%, 21~30: -6~20%, 31+: -50%
   */
  private getLevelPenalty(levelDiff: number): number {
    if (levelDiff <= 10) return 1.0;
    if (levelDiff <= 20) return 1.0 - (levelDiff - 10) * 0.005;
    if (levelDiff <= 30) return 0.95 - (levelDiff - 20) * 0.014;
    return 0.5;
  }
  
  /**
   * 드랍 아이템 롤
   */
  private rollDrops(dropTable: StageDrop[]): DroppedItem[] {
    const drops: DroppedItem[] = [];
    
    for (const drop of dropTable) {
      const roll = Math.random() * 100;
      
      if (roll < drop.dropRate) {
        const quantity = drop.quantityMin + 
          Math.floor(Math.random() * (drop.quantityMax - drop.quantityMin + 1));
        
        drops.push({
          itemType: drop.itemType,
          itemId: drop.itemId,
          quantity
        });
      }
    }
    
    return drops;
  }
  
  /**
   * 별점 계산
   * ⭐1: 모두 생존
   * ⭐2: N턴 이내 클리어
   * ⭐3: 특수 조건
   */
  private calculateStars(
    battleState: BattleState,
    stageInfo: StageTemplate
  ): number {
    let stars = 0;
    
    // ⭐1: 모두 생존
    const allAlliesAlive = Array.from(battleState.units.values())
      .filter(u => u.type !== 'enemy')
      .every(u => u.isAlive);
    if (allAlliesAlive) stars++;
    
    // ⭐2: N턴 이내 클리어
    if (battleState.turnNumber <= stageInfo.star_condition_2_turns) {
      stars++;
    }
    
    // ⭐3: 특수 조건 (스테이지별 다름)
    // TODO: 스테이지별 특수 조건 구현
    
    return stars;
  }
}
```

---

## 5. 게임 공식 구현

### 5.1 파생 스탯 공식

```typescript
// /utils/formulas.ts

/**
 * 파생 스탯 계산
 */
export const calculateDerivedStats = (
  baseStats: BaseStats,
  level: number
): DerivedStats => {
  return {
    maxHp: 100 + (baseStats.vit * 10) + (level * 5),
    maxMp: 50 + (baseStats.int * 5) + (level * 2),
    atk: 10 + (baseStats.str * 2) + Math.floor(level * 1.5),
    def: 5 + (baseStats.con * 2) + Math.floor(level * 0.8),
    spd: 10 + (baseStats.agi * 2),
    eva: baseStats.agi * 0.3  // 회피율 (%)
  };
};
```

### 5.2 경험치 테이블

```typescript
// /utils/formulas.ts

/**
 * 레벨업 필요 경험치
 */
export const getRequiredExp = (level: number): number => {
  // 레벨 1~4 고정값
  const earlyLevels: Record<number, number> = {
    1: 8,
    2: 20,
    3: 40,
    4: 100
  };
  
  if (earlyLevels[level]) {
    return earlyLevels[level];
  }
  
  // 레벨 5 이후: 지수형 증가 (구간별 성장 속도)
  if (level < 30) {
    // 빠른 성장
    return Math.floor(100 * Math.pow(1.15, level - 4));
  } else if (level < 70) {
    // 보통 성장
    return Math.floor(100 * Math.pow(1.15, 26) * Math.pow(1.2, level - 30));
  } else {
    // 매우 느린 성장
    return Math.floor(100 * Math.pow(1.15, 26) * Math.pow(1.2, 40) * Math.pow(1.3, level - 70));
  }
};

/**
 * 몬스터 경험치 계산
 * 공식: Lv × (2 + Lv/20)
 */
export const calculateMonsterExp = (level: number, isBoss: boolean): number => {
  const base = level * (2 + level / 20);
  return Math.floor(isBoss ? base * 1.1 : base);
};
```

### 5.3 무기 관련 공식

```typescript
// /utils/formulas.ts

/**
 * 무기 정확도
 */
export const getWeaponAccuracy = (weaponType: string): number => {
  const accuracies: Record<string, number> = {
    sword: 90,
    club: 100,
    axe: 90,
    spear: 80,
    claw: 90,
    bow: 80
  };
  return accuracies[weaponType] || 100;
};

/**
 * 무기 배율
 */
export const getWeaponMultiplier = (weaponType: string): number => {
  const multipliers: Record<string, number> = {
    sword: 1.5,    // 칼: 150%
    club: 1.0,     // 곤봉: 100%
    axe: 2.0,      // 도끼: 200%
    spear: 0.9,    // 창: 90% × 2회
    claw: 0.4,     // 손톱: 40% × 3회
    bow: 0.8       // 활: 80% × 랜덤 횟수
  };
  return multipliers[weaponType] || 1.0;
};

/**
 * 무기 타격 횟수
 */
export const getWeaponHitCount = (weaponType: string, enemyCount?: number): number => {
  switch (weaponType) {
    case 'spear':
      return 2;
    case 'claw':
      return 3;
    case 'bow':
      // 1 ~ 적 수 랜덤
      const max = enemyCount || 1;
      return Math.floor(Math.random() * max) + 1;
    default:
      return 1;
  }
};

/**
 * 무기 패널티
 */
export const getWeaponPenalty = (weaponType: string): WeaponPenalty => {
  const penalties: Record<string, WeaponPenalty> = {
    sword: { agi: -10, con: 0 },
    club: { agi: 0, con: 0 },
    axe: { agi: -20, con: -20 },
    spear: { agi: -20, con: 0 },
    claw: { agi: 0, con: 0 },
    bow: { agi: 0, con: 0 }
  };
  return penalties[weaponType] || { agi: 0, con: 0 };
};
```

### 5.4 충성도 공식

```typescript
// /utils/formulas.ts

/**
 * 충성도 효과
 */
export const getLoyaltyEffects = (loyalty: number) => {
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
 * 레벨 차이에 따른 충성도 감소
 */
export const calculateLevelDiffPenalty = (charLevel: number, petLevel: number): number => {
  const diff = petLevel - charLevel;
  if (diff <= 0) return 0;
  if (diff <= 5) return 0;
  if (diff <= 10) return -10;
  if (diff <= 20) return -20;
  return -50;
};
```

### 5.5 내구도 시스템

```typescript
// /utils/formulas.ts

/**
 * 내구도 감소량 계산
 */
export const calculateDurabilityLoss = (
  equipmentType: EquipmentType,
  isCriticalHit: boolean
): number => {
  const baseLoss: Record<string, number> = {
    weapon: 0.5,
    armor: 1.0,
    helmet: 0.5,
    bracelet: 0.5,
    necklace: 0.5
  };
  
  const loss = baseLoss[equipmentType] || 0.5;
  return isCriticalHit ? loss * 2 : loss;
};

/**
 * 수리 비용 계산
 */
export const calculateRepairCost = (
  equipment: Equipment,
  currentDurability: number
): { gold: number; materials: MaterialCost[] } => {
  const missingDurability = 100 - currentDurability;
  const level = equipment.requiredLevel;
  
  // 골드 비용: (레벨 × 10) × (수리량 / 100)
  const goldCost = Math.floor((level * 10) * (missingDurability / 100));
  
  // 재료 비용: 레벨에 따라 다름
  const materialGrade = Math.ceil(level / 10);
  const materialCount = Math.ceil(missingDurability / 20);
  
  return {
    gold: goldCost,
    materials: [{
      type: equipment.slotType,
      grade: materialGrade,
      quantity: materialCount
    }]
  };
};
```

---

## 6. 데이터 검증

### 6.1 Zod 스키마

```typescript
// /validators/authValidator.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .max(100, '비밀번호는 100자 이하여야 합니다')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
```

```typescript
// /validators/characterValidator.ts
import { z } from 'zod';

export const createCharacterSchema = z.object({
  nickname: z.string()
    .min(2, '닉네임은 2자 이상이어야 합니다')
    .max(8, '닉네임은 8자 이하여야 합니다')
    .regex(/^[가-힣a-zA-Z0-9]+$/, '한글, 영문, 숫자만 사용 가능합니다'),
  
  appearance: z.object({
    eye: z.number().int().min(1).max(5),
    nose: z.number().int().min(1).max(3),
    mouth: z.number().int().min(1).max(4),
    hair: z.number().int().min(1).max(6),
    skin: z.number().int().min(1).max(5)
  }),
  
  element: z.object({
    primary: z.enum(['earth', 'wind', 'fire', 'water']),
    secondary: z.enum(['earth', 'wind', 'fire', 'water']).optional(),
    primaryRatio: z.number().int().min(50).max(100).default(100)
  }).refine(data => {
    // 복합 속성은 인접 속성만 허용
    if (!data.secondary) return true;
    const adjacent = {
      earth: ['wind', 'water'],
      wind: ['earth', 'fire'],
      fire: ['wind', 'water'],
      water: ['fire', 'earth']
    };
    return adjacent[data.primary].includes(data.secondary);
  }, '인접 속성만 조합할 수 있습니다'),
  
  stats: z.object({
    str: z.number().int().min(5),
    agi: z.number().int().min(5),
    vit: z.number().int().min(5),
    con: z.number().int().min(5),
    int: z.number().int().min(5)
  }).refine(data => {
    const total = data.str + data.agi + data.vit + data.con + data.int;
    return total === 45;  // 초기 25 + 보너스 20
  }, '스탯 총합은 45여야 합니다')
});
```

```typescript
// /validators/battleValidator.ts
import { z } from 'zod';

export const startBattleSchema = z.object({
  stageId: z.number().int().positive(),
  partyPetIds: z.array(z.string().uuid()).max(3),
  ridingPetId: z.string().uuid().nullable().optional()
});

export const battleActionSchema = z.object({
  battleId: z.string().uuid(),
  
  characterAction: z.object({
    type: z.enum(['attack', 'defend', 'magic', 'item', 'capture']),
    targetId: z.string().optional(),
    spellId: z.number().int().optional(),
    itemId: z.string().uuid().optional()
  }),
  
  petActions: z.array(z.object({
    petId: z.string().uuid(),
    skillId: z.number().int().min(1).max(2),
    targetId: z.string()
  }))
});
```

### 6.2 검증 미들웨어

```typescript
// /middlewares/validator.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 데이터가 유효하지 않습니다',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          }
        });
      }
      next(error);
    }
  };
};
```

---

## 7. 에러 처리

### 7.1 커스텀 에러 클래스

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
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource}을(를) 찾을 수 없습니다`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '권한이 없습니다') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class InsufficientResourceError extends AppError {
  constructor(resource: string) {
    super(400, 'INSUFFICIENT_RESOURCE', `${resource}이(가) 부족합니다`);
  }
}

export class BattleError extends AppError {
  constructor(code: string, message: string) {
    super(400, code, message);
  }
}
```

### 7.2 에러 코드 목록

| 코드 | HTTP | 설명 |
|------|------|------|
| `VALIDATION_ERROR` | 400 | 입력 데이터 검증 실패 |
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `CONFLICT` | 409 | 충돌 (중복 등) |
| `INSUFFICIENT_RESOURCE` | 400 | 자원 부족 |
| `BATTLE_NOT_FOUND` | 404 | 전투 세션 없음 |
| `BATTLE_INVALID_ACTION` | 400 | 유효하지 않은 전투 행동 |
| `BATTLE_NOT_YOUR_TURN` | 400 | 본인 턴이 아님 |
| `BATTLE_ALREADY_ENDED` | 400 | 이미 종료된 전투 |
| `PET_STORAGE_FULL` | 400 | 펫 보관소 가득 참 |
| `INVENTORY_FULL` | 400 | 인벤토리 가득 참 |
| `EQUIPMENT_BROKEN` | 400 | 장비 파손됨 |
| `STAGE_LOCKED` | 403 | 스테이지 잠김 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

### 7.3 에러 핸들링 미들웨어

```typescript
// /middlewares/errorMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // AppError 인스턴스
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }
  
  // 예상치 못한 에러
  logger.error('Unexpected error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  
  // 프로덕션에서는 상세 에러 숨김
  const message = process.env.NODE_ENV === 'production'
    ? '서버 오류가 발생했습니다'
    : error.message;
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message
    }
  });
};
```

---

## 8. 캐싱 전략

### 8.1 Redis 키 구조

```typescript
// /config/redisKeys.ts

export const REDIS_KEYS = {
  // 세션
  SESSION: (userId: string) => `session:${userId}`,
  
  // 전투 상태
  BATTLE: (battleId: string) => `battle:${battleId}`,
  BATTLE_STATE: (battleId: string) => `battle:${battleId}:state`,
  BATTLE_ACTIONS: (battleId: string) => `battle:${battleId}:actions`,
  BATTLE_TIMER: (battleId: string) => `battle:${battleId}:timer`,
  
  // 파티
  PARTY: (partyId: string) => `party:${partyId}`,
  PARTY_MEMBERS: (partyId: string) => `party:${partyId}:members`,
  PARTY_WAITING: () => 'party:waiting',
  
  // 캐시
  CACHE_STAGE: (stageId: number) => `cache:stage:${stageId}`,
  CACHE_SHOP: () => `cache:shop`,
  CACHE_RECIPES: () => `cache:recipes`,
  
  // 템플릿 캐시 (정적 데이터)
  TEMPLATE: (type: string, id: number) => `template:${type}:${id}`,
  
  // 속도 제한
  RATE_LIMIT: (ip: string) => `ratelimit:${ip}`,
  
  // 온라인 상태
  ONLINE_USERS: () => 'online:users',
  USER_SOCKET: (userId: string) => `socket:${userId}`
};
```

### 8.2 캐싱 서비스

```typescript
// /services/cacheService.ts

import { redis } from '../config/redis';
import { REDIS_KEYS } from '../config/redisKeys';

export class CacheService {
  
  // 기본 TTL (초)
  private static TTL = {
    SESSION: 86400,      // 24시간
    BATTLE: 3600,        // 1시간
    PARTY: 1800,         // 30분
    TEMPLATE: 86400 * 7  // 7일
  };
  
  /**
   * 전투 상태 저장
   */
  static async setBattleState(battleId: string, state: BattleState): Promise<void> {
    const key = REDIS_KEYS.BATTLE_STATE(battleId);
    await redis.setex(key, this.TTL.BATTLE, JSON.stringify(state));
  }
  
  /**
   * 전투 상태 조회
   */
  static async getBattleState(battleId: string): Promise<BattleState | null> {
    const key = REDIS_KEYS.BATTLE_STATE(battleId);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  /**
   * 전투 타이머 설정
   */
  static async setBattleTimer(battleId: string, seconds: number): Promise<void> {
    const key = REDIS_KEYS.BATTLE_TIMER(battleId);
    await redis.setex(key, seconds + 10, Date.now() + seconds * 1000);
  }
  
  /**
   * 스테이지 정보 캐시 (1시간)
   */
  static async getStage(stageId: number, loader: () => Promise<StageTemplate>): Promise<StageTemplate> {
    const key = REDIS_KEYS.CACHE_STAGE(stageId);
    const cached = await redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const stage = await loader();
    await redis.setex(key, 3600, JSON.stringify(stage));
    
    return stage;
  }
  
  /**
   * 템플릿 캐시 (with lazy loading)
   */
  static async getTemplate<T>(
    type: string,
    id: number,
    loader: () => Promise<T>
  ): Promise<T> {
    const key = REDIS_KEYS.TEMPLATE(type, id);
    const cached = await redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const data = await loader();
    await redis.setex(key, this.TTL.TEMPLATE, JSON.stringify(data));
    return data;
  }
  
  /**
   * 세션 관리
   */
  static async setSession(userId: string, data: SessionData): Promise<void> {
    const key = REDIS_KEYS.SESSION(userId);
    await redis.setex(key, this.TTL.SESSION, JSON.stringify(data));
  }
  
  static async getSession(userId: string): Promise<SessionData | null> {
    const key = REDIS_KEYS.SESSION(userId);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  /**
   * 캐시 무효화
   */
  static async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

---

## 9. 보안 체크리스트

### 9.1 인증/인가

- [x] JWT 토큰 기반 인증
- [x] 비밀번호 bcrypt 해싱 (salt rounds: 12)
- [x] 토큰 만료 시간 설정 (7일)
- [x] 캐릭터 소유권 검증
- [x] API별 권한 체크

### 9.2 입력 검증

- [x] Zod를 통한 요청 데이터 검증
- [x] SQL Injection 방지 (Supabase 파라미터 바인딩)
- [x] XSS 방지 (입력 이스케이프)
- [x] 닉네임 특수문자 제한

### 9.3 속도 제한

```typescript
// /middlewares/rateLimiter.ts

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';

// 일반 API: 분당 100회
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args)
  }),
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.'
    }
  }
});

// 인증 API: 분당 10회
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args)
  }),
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.'
    }
  }
});

// 전투 시작: 분당 5회
export const battleStartLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args)
  }),
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.userId || req.ip
});
```

### 9.4 HTTP 보안

```typescript
// /app.ts

import helmet from 'helmet';
import cors from 'cors';

// 보안 헤더
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.SOCKET_URL]
    }
  }
}));

// CORS 설정
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### 9.5 게임 로직 보안

- [x] 서버 사이드 데미지 계산
- [x] 서버 사이드 드랍 계산
- [x] 전투 상태 서버에서 관리
- [x] 클라이언트 요청 검증
- [x] 타임아웃 처리

### 9.6 로깅/모니터링

```typescript
// /utils/logger.ts

import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'uglynos-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// 개발 환경에서는 콘솔 출력
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}
```

---

## 📋 MVP 체크리스트

### 필수 구현
- [ ] 인증 시스템 (JWT, bcrypt)
- [ ] 전투 시스템 (턴제, 데미지 계산)
- [ ] 펫 시스템 (파티, 충성도)
- [ ] 포획 시스템
- [ ] 보상 계산

### 중요
- [ ] 상태이상 시스템
- [ ] 내구도/수리 시스템
- [ ] 제작 시스템

### 나중에
- [ ] 멀티플레이 파티
- [ ] 이상 행동 탐지

---

## 📝 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1.0 | 2026-01-13 | 초기 작성 |
| v1.1 | 2026-01-13 | API 명세 분리, 백엔드 아키텍처만 유지 |
