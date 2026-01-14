# 📡 API 명세서 (API Specification)

**uglynos** MVP REST API 및 WebSocket 이벤트 명세서입니다.

**Base URL:** `https://api.uglynos.com/v1` (예정)  
**WebSocket URL:** `wss://api.uglynos.com` (예정)

---

## 📋 목차

1. [개요](#1-개요)
2. [인증](#2-인증)
3. [공통 응답 형식](#3-공통-응답-형식)
4. [에러 코드](#4-에러-코드)
5. [REST API 엔드포인트](#5-rest-api-엔드포인트)
   - [5.1 인증 (Auth)](#51-인증-auth)
   - [5.2 캐릭터 (Character)](#52-캐릭터-character)
   - [5.3 펫 (Pet)](#53-펫-pet)
   - [5.4 펫 보관소 (Pet Storage)](#54-펫-보관소-pet-storage)
   - [5.5 인벤토리 (Inventory)](#55-인벤토리-inventory)
   - [5.6 스테이지 (Stage)](#56-스테이지-stage)
   - [5.7 요일 던전 (Daily Dungeon)](#57-요일-던전-daily-dungeon)
   - [5.8 전투 (Battle)](#58-전투-battle)
   - [5.9 상점 (Shop)](#59-상점-shop)
   - [5.10 제작 (Craft)](#510-제작-craft)
   - [5.11 템플릿 (Templates)](#511-템플릿-templates)
6. [WebSocket 이벤트](#6-websocket-이벤트)
   - [6.1 연결 및 인증](#61-연결-및-인증)
   - [6.2 전투 이벤트](#62-전투-이벤트)
   - [6.3 파티 이벤트](#63-파티-이벤트)
7. [데이터 타입 정의](#7-데이터-타입-정의)

---

## 1. 개요

### 1.1 API 버전

| 버전 | 상태 | 설명 |
|------|------|------|
| v1 | 현재 | MVP 버전 |

### 1.2 요청 헤더

```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

### 1.3 Rate Limiting

| 엔드포인트 | 제한 | 윈도우 |
|------------|------|--------|
| 일반 API | 100회 | 1분 |
| 인증 API | 10회 | 1분 |
| 전투 액션 | 30회 | 1분 |

---

## 2. 인증

### 2.1 JWT 토큰

모든 인증이 필요한 API는 `Authorization` 헤더에 JWT 토큰을 포함해야 합니다.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 토큰 페이로드

```typescript
interface JwtPayload {
  userId: string;        // UUID
  characterId?: string;  // 캐릭터 선택 후 포함
  iat: number;           // 발급 시간
  exp: number;           // 만료 시간 (7일)
}
```

### 2.3 토큰 갱신

토큰 만료 전 `/api/auth/refresh`로 갱신 가능합니다.

---

## 3. 공통 응답 형식

### 3.1 성공 응답

**단일 데이터:**
```json
{
  "success": true,
  "data": { ... }
}
```

**목록 데이터:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 3.2 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "E1001",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다.",
    "details": { ... }
  }
}
```

---

## 4. 에러 코드

### 4.1 인증 에러 (1xxx)

| 코드 | HTTP | 설명 |
|------|------|------|
| E1001 | 401 | 이메일 또는 비밀번호 불일치 |
| E1002 | 401 | 토큰 만료 |
| E1003 | 401 | 유효하지 않은 토큰 |
| E1004 | 401 | 인증 필요 |
| E1005 | 409 | 이미 존재하는 이메일 |

### 4.2 캐릭터 에러 (2xxx)

| 코드 | HTTP | 설명 |
|------|------|------|
| E2001 | 404 | 캐릭터를 찾을 수 없음 |
| E2002 | 409 | 닉네임 중복 |
| E2003 | 400 | 스탯 합계 오류 |
| E2004 | 403 | 캐릭터 선택 필요 |
| E2005 | 400 | 유효하지 않은 속성 조합 |

### 4.3 펫 에러 (3xxx)

| 코드 | HTTP | 설명 |
|------|------|------|
| E3001 | 404 | 펫을 찾을 수 없음 |
| E3002 | 400 | 펫 보관소가 가득 참 (10마리) |
| E3003 | 400 | 파티가 가득 참 (3마리) |
| E3004 | 403 | 소유하지 않은 펫 |
| E3005 | 400 | 이미 파티에 편성됨 |

### 4.4 전투 에러 (4xxx)

| 코드 | HTTP | 설명 |
|------|------|------|
| E4001 | 404 | 전투를 찾을 수 없음 |
| E4002 | 400 | 이미 종료된 전투 |
| E4003 | 400 | 유효하지 않은 행동 |
| E4004 | 400 | 본인 턴이 아님 |
| E4005 | 400 | 유효하지 않은 타겟 |
| E4006 | 400 | MP 부족 |
| E4007 | 403 | 스테이지 잠김 |
| E4008 | 400 | 포획 불가 대상 |
| E4009 | 400 | 턴 타임아웃 |

### 4.5 인벤토리 에러 (5xxx)

| 코드 | HTTP | 설명 |
|------|------|------|
| E5001 | 404 | 아이템을 찾을 수 없음 |
| E5002 | 400 | 수량 부족 |
| E5003 | 400 | 인벤토리 가득 참 |
| E5004 | 400 | 골드 부족 |

### 4.6 장비 에러 (6xxx)

| 코드 | HTTP | 설명 |
|------|------|------|
| E6001 | 404 | 장비를 찾을 수 없음 |
| E6002 | 400 | 장비 파손됨 |
| E6003 | 400 | 착용 레벨 미달 |
| E6004 | 400 | 이미 장착됨 |

### 4.7 제작 에러 (7xxx)

| 코드 | HTTP | 설명 |
|------|------|------|
| E7001 | 404 | 레시피를 찾을 수 없음 |
| E7002 | 400 | 재료 부족 |

### 4.8 서버 에러 (9xxx)

| 코드 | HTTP | 설명 |
|------|------|------|
| E9001 | 500 | 내부 서버 오류 |
| E9002 | 500 | 데이터베이스 오류 |
| E9003 | 500 | Redis 오류 |

---

## 5. REST API 엔드포인트

### 5.1 인증 (Auth)

#### POST `/api/auth/register` - 회원가입

**인증:** ❌ 불필요

**Request:**
```json
{
  "email": "player@example.com",
  "password": "securePassword123"
}
```

**Validation:**
- `email`: 유효한 이메일 형식
- `password`: 8~100자

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "player@example.com",
      "createdAt": "2026-01-13T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors:**
- E1005: 이미 존재하는 이메일

---

#### POST `/api/auth/login` - 로그인

**인증:** ❌ 불필요

**Request:**
```json
{
  "email": "player@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "player@example.com",
      "hasCharacter": true
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors:**
- E1001: 이메일 또는 비밀번호 불일치

---

#### POST `/api/auth/logout` - 로그아웃

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "로그아웃되었습니다."
  }
}
```

---

#### GET `/api/auth/me` - 현재 유저 정보

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "player@example.com",
      "createdAt": "2026-01-13T10:00:00Z",
      "lastLoginAt": "2026-01-13T12:00:00Z"
    },
    "character": {
      "id": "character-uuid",
      "nickname": "공룡왕",
      "level": 15
    }
  }
}
```

---

#### POST `/api/auth/refresh` - 토큰 갱신

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token..."
  }
}
```

---

### 5.2 캐릭터 (Character)

#### GET `/api/characters` - 내 캐릭터 목록

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "character-uuid",
      "nickname": "공룡왕",
      "level": 15,
      "elementPrimary": "fire",
      "elementSecondary": "wind",
      "createdAt": "2026-01-13T10:00:00Z"
    }
  ]
}
```

---

#### POST `/api/characters` - 캐릭터 생성

**인증:** ✅ 필요

**Request:**
```json
{
  "nickname": "공룡왕",
  "appearance": {
    "eye": 2,
    "nose": 1,
    "mouth": 3,
    "hair": 5,
    "skin": 2
  },
  "element": {
    "primary": "fire",
    "secondary": "wind",
    "primaryRatio": 70
  },
  "stats": {
    "str": 10,
    "agi": 8,
    "vit": 7,
    "con": 5,
    "int": 15
  }
}
```

**Validation:**
- `nickname`: 2~8자, 한글/영문/숫자만, 중복 불가
- `appearance`: 각 요소 유효 범위 내
- `element.primary/secondary`: earth, wind, fire, water 중 하나
- `element.primaryRatio`: 50~100 (복합 속성 시)
- `stats`: 각 최소 5, 총합 45 (기본 25 + 보너스 20)
- 복합 속성은 인접 속성만 가능 (지+풍, 풍+화, 화+수, 수+지)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "character": {
      "id": "character-uuid",
      "nickname": "공룡왕",
      "level": 1,
      "exp": 0,
      "gold": 100,
      "appearance": {
        "eye": 2,
        "nose": 1,
        "mouth": 3,
        "hair": 5,
        "skin": 2
      },
      "element": {
        "primary": "fire",
        "secondary": "wind",
        "primaryRatio": 70
      },
      "stats": {
        "str": 10,
        "agi": 8,
        "vit": 7,
        "con": 5,
        "int": 15
      },
      "derivedStats": {
        "maxHp": 175,
        "maxMp": 127,
        "atk": 31,
        "def": 15,
        "spd": 26,
        "eva": 2.4
      },
      "currentHp": 175,
      "currentMp": 127,
      "statPoints": 0,
      "createdAt": "2026-01-13T10:00:00Z"
    },
    "starterPet": {
      "id": "pet-uuid",
      "templateId": 1,
      "name": "아기 공룡",
      "nickname": null,
      "level": 1,
      "exp": 0,
      "stats": {
        "str": 7,
        "agi": 6,
        "vit": 8,
        "con": 5,
        "int": 4
      },
      "growth": {
        "str": 95,
        "agi": 110,
        "vit": 100,
        "con": 85,
        "int": 90
      },
      "loyalty": 50,
      "partySlot": 1,
      "isRareColor": false,
      "isStarter": true
    },
    "token": "new-jwt-with-characterId..."
  }
}
```

**Errors:**
- E2002: 닉네임 중복
- E2003: 스탯 합계 오류
- E2005: 유효하지 않은 속성 조합

---

#### GET `/api/characters/:id` - 캐릭터 상세

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "character-uuid",
    "nickname": "공룡왕",
    "level": 15,
    "exp": 2500,
    "expToNext": 3200,
    "gold": 12500,
    "appearance": { ... },
    "element": {
      "primary": "fire",
      "secondary": "wind",
      "primaryRatio": 70
    },
    "stats": {
      "str": 25,
      "agi": 20,
      "vit": 18,
      "con": 12,
      "int": 30
    },
    "derivedStats": {
      "maxHp": 355,
      "maxMp": 230,
      "atk": 82,
      "def": 41,
      "spd": 50,
      "eva": 6.0
    },
    "currentHp": 355,
    "currentMp": 230,
    "statPoints": 5,
    "equipment": {
      "weapon": { ... },
      "armor": { ... },
      "helmet": { ... },
      "bracelet": null,
      "necklace": null
    },
    "equippedSpells": [
      {
        "id": 1,
        "name": "화염구",
        "mpCost": 15,
        "slot": "weapon"
      }
    ],
    "party": [
      { "slot": 1, "pet": { ... } },
      { "slot": 2, "pet": { ... } },
      { "slot": 3, "pet": null }
    ],
    "ridingPetId": null,
    "createdAt": "2026-01-13T10:00:00Z",
    "updatedAt": "2026-01-15T14:30:00Z"
  }
}
```

---

#### PUT `/api/characters/:id/stats` - 스탯 배분

**인증:** ✅ 필요

**Request:**
```json
{
  "str": 2,
  "agi": 1,
  "vit": 1,
  "con": 0,
  "int": 1
}
```

**Validation:**
- 각 값 >= 0
- 총합 <= 보유 스탯 포인트

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "str": 27,
      "agi": 21,
      "vit": 19,
      "con": 12,
      "int": 31
    },
    "derivedStats": {
      "maxHp": 365,
      "maxMp": 235,
      "atk": 86,
      "def": 41,
      "spd": 52,
      "eva": 6.3
    },
    "remainingPoints": 0
  }
}
```

---

#### PUT `/api/characters/:id/select` - 캐릭터 선택

**인증:** ✅ 필요

캐릭터를 선택하고 새 JWT 토큰을 발급받습니다.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "character": { ... },
    "token": "new-jwt-with-characterId..."
  }
}
```

---

#### GET `/api/characters/:id/equipment` - 장착 장비 목록

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "weapon": {
      "id": "equipment-uuid",
      "templateId": 5,
      "name": "철 검",
      "slotType": "weapon",
      "weaponType": "sword",
      "stats": {
        "str": 15,
        "agi": -10
      },
      "spell": {
        "id": 1,
        "name": "화염구"
      },
      "durability": 85,
      "maxDurability": 100,
      "requiredLevel": 10
    },
    "armor": { ... },
    "helmet": { ... },
    "bracelet": null,
    "necklace": null
  }
}
```

---

#### PUT `/api/characters/:id/equipment` - 장비 장착/해제

**인증:** ✅ 필요

**Request (장착):**
```json
{
  "action": "equip",
  "equipmentId": "equipment-uuid"
}
```

**Request (해제):**
```json
{
  "action": "unequip",
  "slot": "weapon"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "equipment": {
      "weapon": { ... },
      "armor": { ... },
      ...
    },
    "derivedStats": { ... }
  }
}
```

**Errors:**
- E6001: 장비를 찾을 수 없음
- E6002: 장비 파손됨
- E6003: 착용 레벨 미달

---

### 5.3 펫 (Pet)

#### GET `/api/pets` - 보유 펫 목록

**인증:** ✅ 필요

**Query Parameters:**
- `includeStorage`: boolean (보관소 포함 여부, 기본 false)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "pet-uuid-1",
      "templateId": 1,
      "name": "아기 공룡",
      "nickname": "뚜비",
      "level": 12,
      "exp": 450,
      "expToNext": 600,
      "stats": {
        "str": 18,
        "agi": 22,
        "vit": 20,
        "con": 15,
        "int": 12
      },
      "derivedStats": {
        "maxHp": 320,
        "maxMp": 110,
        "atk": 58,
        "def": 42,
        "spd": 54,
        "eva": 6.6
      },
      "growth": {
        "str": 95,
        "agi": 110,
        "vit": 100,
        "con": 85,
        "int": 90
      },
      "element": {
        "primary": "earth",
        "secondary": null,
        "primaryRatio": 100
      },
      "skills": [
        {
          "id": 1,
          "name": "물기",
          "description": "적을 물어뜯어 공격한다.",
          "mpCost": 0,
          "damageRatio": 100
        },
        {
          "id": 2,
          "name": "돌진",
          "description": "빠르게 돌진하여 공격한다.",
          "mpCost": 15,
          "damageRatio": 150
        }
      ],
      "loyalty": 75,
      "partySlot": 1,
      "isRareColor": false,
      "isStarter": true,
      "currentHp": 320,
      "currentMp": 110
    },
    { ... }
  ]
}
```

---

#### GET `/api/pets/:id` - 펫 상세

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "pet-uuid",
    "templateId": 1,
    "template": {
      "name": "랩터",
      "description": "빠른 속도를 자랑하는 작은 공룡",
      "size": "M",
      "baseStats": { ... }
    },
    "nickname": "뚜비",
    "level": 12,
    "exp": 450,
    "expToNext": 600,
    "stats": { ... },
    "derivedStats": { ... },
    "growth": { ... },
    "element": { ... },
    "skills": [ ... ],
    "loyalty": 75,
    "loyaltyEffects": {
      "damageBonus": 0.05,
      "accuracyBonus": 0.02,
      "disobeyChance": 0.05,
      "fleeRisk": false
    },
    "partySlot": 1,
    "isRareColor": false,
    "isStarter": true,
    "isInStorage": false,
    "score": 1523,
    "capturedAt": "2026-01-13T10:00:00Z"
  }
}
```

---

#### PUT `/api/pets/:id/nickname` - 펫 닉네임 변경

**인증:** ✅ 필요

**Request:**
```json
{
  "nickname": "뚜비"
}
```

**Validation:**
- `nickname`: 1~20자, null 가능 (기본 이름 사용)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "pet-uuid",
    "nickname": "뚜비"
  }
}
```

---

#### PUT `/api/pets/:id/party` - 파티 슬롯 설정

**인증:** ✅ 필요

**Request:**
```json
{
  "slot": 2
}
```

**Validation:**
- `slot`: 1~3 또는 null (파티에서 제외)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "pet-uuid",
    "partySlot": 2,
    "party": [
      { "slot": 1, "petId": "pet-uuid-1" },
      { "slot": 2, "petId": "pet-uuid" },
      { "slot": 3, "petId": null }
    ]
  }
}
```

**Errors:**
- E3003: 파티가 가득 참
- E3005: 이미 파티에 편성됨

---

#### DELETE `/api/pets/:id` - 펫 방생

**인증:** ✅ 필요

펫을 영구 삭제합니다 (방생).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "펫을 방생했습니다.",
    "releasedPetId": "pet-uuid"
  }
}
```

**Errors:**
- E3001: 펫을 찾을 수 없음
- E3004: 소유하지 않은 펫

---

### 5.4 펫 보관소 (Pet Storage)

#### GET `/api/pet-storage` - 보관소 펫 목록

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "capacity": 10,
    "used": 3,
    "pets": [
      {
        "slot": 1,
        "pet": {
          "id": "pet-uuid",
          "templateId": 2,
          "name": "늑대",
          "nickname": null,
          "level": 5,
          "element": { ... },
          "loyalty": 50
        }
      },
      { "slot": 2, "pet": { ... } },
      { "slot": 3, "pet": { ... } },
      { "slot": 4, "pet": null },
      ...
    ]
  }
}
```

---

#### POST `/api/pet-storage/:petId` - 펫 보관

**인증:** ✅ 필요

파티에서 펫을 보관소로 이동합니다.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pet": {
      "id": "pet-uuid",
      "storageSlot": 4
    },
    "party": [ ... ],
    "storage": { ... }
  }
}
```

**Errors:**
- E3002: 펫 보관소가 가득 참

---

#### DELETE `/api/pet-storage/:petId` - 펫 꺼내기

**인증:** ✅ 필요

보관소에서 펫을 꺼냅니다 (파티에 자동 편성되지 않음).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pet": {
      "id": "pet-uuid",
      "storageSlot": null,
      "partySlot": null
    }
  }
}
```

---

### 5.5 인벤토리 (Inventory)

#### GET `/api/inventory` - 전체 인벤토리

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "gold": 12500,
    "equipment": [
      {
        "id": "equipment-uuid",
        "templateId": 5,
        "name": "철 검",
        "slotType": "weapon",
        "isEquipped": false,
        "durability": 100,
        "inventorySlot": 1
      },
      ...
    ],
    "consumables": [
      {
        "id": "consumable-uuid",
        "templateId": 1,
        "name": "상처약(소)",
        "quantity": 10,
        "inventorySlot": 1
      },
      ...
    ],
    "materials": [
      {
        "id": "material-uuid",
        "templateId": 1,
        "name": "뼈다귀1",
        "quantity": 25,
        "inventorySlot": 1
      },
      ...
    ]
  }
}
```

---

#### GET `/api/inventory/equipment` - 장비 목록

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "equipment-uuid",
      "templateId": 5,
      "name": "철 검",
      "slotType": "weapon",
      "weaponType": "sword",
      "stats": {
        "str": 15,
        "agi": -10
      },
      "spell": {
        "id": 1,
        "name": "화염구"
      },
      "durability": 85,
      "maxDurability": 100,
      "requiredLevel": 10,
      "isEquipped": true,
      "inventorySlot": null
    },
    ...
  ]
}
```

---

#### GET `/api/inventory/consumables` - 소모품 목록

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "consumable-uuid",
      "templateId": 1,
      "name": "상처약(소)",
      "description": "HP를 50 회복합니다.",
      "effectType": "heal_hp",
      "effectValue": 50,
      "quantity": 10,
      "inventorySlot": 1
    },
    ...
  ]
}
```

---

#### GET `/api/inventory/materials` - 재료 목록

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "material-uuid",
      "templateId": 1,
      "name": "뼈다귀1",
      "grade": 1,
      "materialType": "weapon",
      "quantity": 25,
      "inventorySlot": 1
    },
    ...
  ]
}
```

---

#### POST `/api/inventory/use/:itemId` - 아이템 사용

**인증:** ✅ 필요

전투 외에서 소모품을 사용합니다.

**Request:**
```json
{
  "targetId": "character-uuid",
  "targetType": "character"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "item": {
      "id": "consumable-uuid",
      "remainingQuantity": 9
    },
    "effect": {
      "type": "heal_hp",
      "value": 50,
      "targetHpBefore": 200,
      "targetHpAfter": 250
    }
  }
}
```

---

### 5.6 스테이지 (Stage)

#### GET `/api/stages` - 스테이지 목록

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "chapter": 1,
      "stageNumber": 1,
      "name": "초원의 시작",
      "description": "평화로운 초원에서 첫 전투를 시작합니다.",
      "stageType": "normal",
      "recommendedLevel": 1,
      "expReward": 20,
      "goldReward": 10,
      "isUnlocked": true,
      "isCleared": true,
      "bestStars": 3,
      "clearCount": 5
    },
    {
      "id": 5,
      "chapter": 1,
      "stageNumber": 5,
      "name": "초원의 우두머리",
      "stageType": "boss",
      "recommendedLevel": 5,
      "expReward": 120,
      "goldReward": 50,
      "isUnlocked": true,
      "isCleared": true,
      "bestStars": 2,
      "clearCount": 1
    },
    {
      "id": 11,
      "chapter": 2,
      "stageNumber": 1,
      "name": "숲으로의 진입",
      "stageType": "normal",
      "isUnlocked": false,
      "isCleared": false,
      "bestStars": 0,
      "clearCount": 0
    },
    ...
  ]
}
```

---

#### GET `/api/stages/:id` - 스테이지 상세

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "chapter": 1,
    "stageNumber": 5,
    "name": "초원의 우두머리",
    "description": "초원을 지배하는 강력한 몬스터를 처치하세요.",
    "stageType": "boss",
    "waveCount": 1,
    "recommendedLevel": 5,
    "monsterLevelMin": 3,
    "monsterLevelMax": 7,
    "expReward": 120,
    "goldReward": 50,
    "starConditions": {
      "star1": "모든 아군 생존",
      "star2": "10턴 이내 클리어",
      "star3": "아이템 미사용"
    },
    "possibleDrops": [
      {
        "type": "material",
        "name": "뼈다귀1",
        "dropRate": 50
      },
      {
        "type": "material",
        "name": "돌맹이1",
        "dropRate": 30
      }
    ],
    "background": "bg_grassland",
    "progress": {
      "isUnlocked": true,
      "isCleared": true,
      "bestStars": 2,
      "clearCount": 1,
      "firstClearAt": "2026-01-13T11:00:00Z",
      "lastClearAt": "2026-01-13T11:00:00Z"
    }
  }
}
```

---

#### GET `/api/stages/:id/monsters` - 스테이지 몬스터 정보

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stageId": 5,
    "waves": [
      {
        "waveNumber": 1,
        "monsters": [
          {
            "templateId": 10,
            "name": "초원 대장 랩터",
            "level": "5~7",
            "element": {
              "primary": "earth",
              "secondary": null
            },
            "isBoss": true,
            "count": 1
          },
          {
            "templateId": 3,
            "name": "야생 랩터",
            "level": "3~5",
            "element": {
              "primary": "earth",
              "secondary": null
            },
            "isBoss": false,
            "count": "2~3"
          }
        ]
      }
    ],
    "capturablePet": {
      "templateId": 1,
      "name": "랩터",
      "spawnChance": 3,
      "rareColorChance": 0.005
    }
  }
}
```

---

### 5.7 요일 던전 (Daily Dungeon)

#### GET `/api/daily-dungeons` - 오늘의 던전 목록

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "today": "monday",
    "availableDungeons": [
      {
        "id": 1,
        "dayOfWeek": 1,
        "dungeonLevel": 1,
        "name": "초급 무기 재료 던전",
        "materialType": "weapon",
        "recommendedLevel": 10,
        "expReward": 100,
        "goldReward": 50,
        "isUnlocked": true,
        "clearCount": 3
      },
      {
        "id": 2,
        "dayOfWeek": 1,
        "dungeonLevel": 2,
        "name": "중급 무기 재료 던전",
        "materialType": "weapon",
        "recommendedLevel": 30,
        "expReward": 300,
        "goldReward": 150,
        "isUnlocked": true,
        "clearCount": 0
      },
      ...
    ],
    "sundayNote": "일요일에는 모든 던전이 개방됩니다."
  }
}
```

---

#### GET `/api/daily-dungeons/:id` - 던전 상세

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "dayOfWeek": 1,
    "dungeonLevel": 1,
    "name": "초급 무기 재료 던전",
    "materialType": "weapon",
    "recommendedLevel": 10,
    "monsterLevel": 10,
    "expReward": 100,
    "goldReward": 50,
    "possibleDrops": [
      {
        "type": "material",
        "name": "뼈다귀1",
        "dropRate": 60
      },
      {
        "type": "material",
        "name": "뼈다귀2",
        "dropRate": 20
      }
    ],
    "progress": {
      "isUnlocked": true,
      "clearCount": 3,
      "lastClearAt": "2026-01-13T10:00:00Z"
    }
  }
}
```

---

### 5.8 전투 (Battle)

#### POST `/api/battles/start` - 전투 시작

**인증:** ✅ 필요

**Request:**
```json
{
  "stageId": 5,
  "partyPetIds": ["pet-uuid-1", "pet-uuid-2", "pet-uuid-3"],
  "ridingPetId": null
}
```

**Validation:**
- `stageId`: 해금된 스테이지만
- `partyPetIds`: 최대 3마리, 소유한 펫만
- `ridingPetId`: 탑승할 펫 ID (선택)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "battleId": "battle-uuid",
    "stage": {
      "id": 5,
      "name": "초원의 우두머리",
      "type": "boss",
      "background": "bg_grassland"
    },
    "allies": [
      {
        "id": "character-uuid",
        "type": "character",
        "name": "공룡왕",
        "level": 15,
        "currentHp": 355,
        "maxHp": 355,
        "currentMp": 230,
        "maxMp": 230,
        "stats": {
          "atk": 82,
          "def": 41,
          "spd": 50,
          "eva": 6.0
        },
        "element": {
          "primary": "fire",
          "secondary": "wind",
          "primaryRatio": 70
        },
        "equipment": {
          "weapon": {
            "type": "sword",
            "attackRatio": 150,
            "accuracy": 90
          }
        },
        "spells": [
          {
            "id": 1,
            "name": "화염구",
            "mpCost": 15,
            "element": "fire",
            "targetType": "single"
          }
        ],
        "statusEffect": null
      },
      {
        "id": "pet-uuid-1",
        "type": "pet",
        "templateId": 1,
        "name": "뚜비",
        "level": 12,
        "currentHp": 320,
        "maxHp": 320,
        "currentMp": 110,
        "maxMp": 110,
        "stats": {
          "atk": 58,
          "def": 42,
          "spd": 54,
          "eva": 6.6
        },
        "element": {
          "primary": "earth",
          "secondary": null,
          "primaryRatio": 100
        },
        "skills": [
          { "id": 1, "name": "물기", "mpCost": 0, "damageRatio": 100 },
          { "id": 2, "name": "돌진", "mpCost": 15, "damageRatio": 150 }
        ],
        "loyalty": 75,
        "statusEffect": null
      },
      ...
    ],
    "enemies": [
      {
        "id": "enemy-1",
        "type": "monster",
        "templateId": 10,
        "name": "초원 대장 랩터",
        "level": 7,
        "currentHp": 300,
        "maxHp": 300,
        "stats": {
          "atk": 45,
          "def": 25,
          "spd": 35,
          "eva": 3.0
        },
        "element": {
          "primary": "earth",
          "secondary": null,
          "primaryRatio": 100
        },
        "isBoss": true,
        "isCapturable": false,
        "statusEffect": null
      },
      {
        "id": "enemy-2",
        "type": "monster",
        "templateId": 1,
        "name": "랩터",
        "level": 1,
        "currentHp": 80,
        "maxHp": 80,
        "stats": { ... },
        "element": { ... },
        "isBoss": false,
        "isCapturable": true,
        "isRareColor": false,
        "statusEffect": null
      },
      ...
    ],
    "turnOrder": ["pet-uuid-1", "enemy-1", "character-uuid", "enemy-2", "pet-uuid-2"],
    "currentTurnIndex": 0,
    "turnNumber": 1,
    "turnTimeLimit": 30,
    "turnStartedAt": "2026-01-13T12:00:00Z"
  }
}
```

**Errors:**
- E4007: 스테이지 잠김

---

#### GET `/api/battles/:id` - 전투 상태 조회

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "battleId": "battle-uuid",
    "phase": "in_progress",
    "turnNumber": 3,
    "allies": [ ... ],
    "enemies": [ ... ],
    "turnOrder": [ ... ],
    "currentTurnIndex": 2,
    "turnTimeLimit": 30,
    "turnStartedAt": "2026-01-13T12:01:30Z",
    "battleLog": [
      {
        "turnNumber": 1,
        "actions": [ ... ]
      },
      {
        "turnNumber": 2,
        "actions": [ ... ]
      }
    ]
  }
}
```

---

#### POST `/api/battles/:id/action` - 행동 제출 (REST 백업)

**인증:** ✅ 필요

> **Note:** 주로 WebSocket으로 처리하며, 이 API는 백업용입니다.

**Request:**
```json
{
  "characterAction": {
    "type": "attack",
    "targetId": "enemy-1"
  },
  "petActions": [
    {
      "petId": "pet-uuid-1",
      "skillId": 2,
      "targetId": "enemy-1"
    },
    {
      "petId": "pet-uuid-2",
      "skillId": 1,
      "targetId": "enemy-2"
    }
  ]
}
```

**Action Types:**
- `attack`: 기본 공격
- `defend`: 방어
- `spell`: 주술 사용 (spellId 필요)
- `item`: 아이템 사용 (itemId 필요)
- `capture`: 포획 시도

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "행동이 제출되었습니다. WebSocket으로 결과를 확인하세요.",
    "submittedAt": "2026-01-13T12:01:35Z"
  }
}
```

---

#### POST `/api/battles/:id/flee` - 도주

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "fled": true,
    "penalties": {
      "durabilityLost": [
        { "equipmentId": "equipment-uuid", "lost": 5 }
      ]
    }
  }
}
```

---

### 5.9 상점 (Shop)

#### GET `/api/shop` - 상점 아이템 목록

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "playerGold": 12500,
    "categories": {
      "consumables": [
        {
          "id": 1,
          "templateId": 1,
          "name": "상처약(소)",
          "description": "HP를 50 회복합니다.",
          "price": 50,
          "icon": "item_potion_hp_s"
        },
        {
          "id": 2,
          "templateId": 2,
          "name": "상처약(중)",
          "description": "HP를 150 회복합니다.",
          "price": 150,
          "icon": "item_potion_hp_m"
        },
        ...
      ],
      "equipment": [
        {
          "id": 10,
          "templateId": 1,
          "name": "목검",
          "slotType": "weapon",
          "requiredLevel": 1,
          "price": 100,
          "icon": "wpn_sword_001"
        },
        ...
      ]
    }
  }
}
```

---

#### POST `/api/shop/buy` - 아이템 구매

**인증:** ✅ 필요

**Request:**
```json
{
  "shopItemId": 1,
  "quantity": 5
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "purchased": {
      "itemId": 1,
      "name": "상처약(소)",
      "quantity": 5,
      "totalCost": 250
    },
    "remainingGold": 12250,
    "inventory": {
      "itemId": "consumable-uuid",
      "newQuantity": 15
    }
  }
}
```

**Errors:**
- E5004: 골드 부족
- E5003: 인벤토리 가득 참

---

#### POST `/api/shop/sell` - 아이템 판매

**인증:** ✅ 필요

**Request:**
```json
{
  "itemType": "material",
  "itemId": "material-uuid",
  "quantity": 10
}
```

**Validation:**
- `itemType`: "consumable", "material", "equipment"
- `quantity`: 보유량 이하

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sold": {
      "itemType": "material",
      "itemId": "material-uuid",
      "name": "뼈다귀1",
      "quantity": 10,
      "unitPrice": 5,
      "totalGold": 50
    },
    "newGold": 12550,
    "remainingQuantity": 15
  }
}
```

---

### 5.10 제작 (Craft)

#### GET `/api/craft/recipes` - 제작 레시피 목록

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "resultEquipment": {
        "templateId": 5,
        "name": "철 검",
        "slotType": "weapon",
        "weaponType": "sword",
        "requiredLevel": 10,
        "stats": {
          "strMin": 12,
          "strMax": 18,
          "agiMin": -10,
          "agiMax": -10
        }
      },
      "goldCost": 500,
      "materials": [
        { "templateId": 1, "name": "뼈다귀1", "quantity": 10, "owned": 25 },
        { "templateId": 3, "name": "돌맹이1", "quantity": 5, "owned": 15 }
      ],
      "spellMaterials": [
        {
          "templateId": 101,
          "name": "불꽃 정수",
          "resultSpell": {
            "id": 1,
            "name": "화염구"
          },
          "owned": 2
        },
        {
          "templateId": 102,
          "name": "바람 정수",
          "resultSpell": {
            "id": 2,
            "name": "질풍"
          },
          "owned": 0
        }
      ],
      "canCraft": true,
      "missingMaterials": []
    },
    ...
  ]
}
```

---

#### GET `/api/craft/recipes/:id` - 레시피 상세

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "resultEquipment": {
      "templateId": 5,
      "name": "철 검",
      "description": "기본적인 철제 검",
      "slotType": "weapon",
      "weaponType": "sword",
      "requiredLevel": 10,
      "stats": {
        "strMin": 12,
        "strMax": 18,
        "agiMin": -10,
        "agiMax": -10
      },
      "attackRatio": 150,
      "accuracy": 90,
      "hitCount": 1
    },
    "goldCost": 500,
    "materials": [
      {
        "templateId": 1,
        "name": "뼈다귀1",
        "grade": 1,
        "requiredQuantity": 10,
        "ownedQuantity": 25
      },
      {
        "templateId": 3,
        "name": "돌맹이1",
        "grade": 1,
        "requiredQuantity": 5,
        "ownedQuantity": 15
      }
    ],
    "spellMaterials": [
      {
        "templateId": 101,
        "name": "불꽃 정수",
        "resultSpell": {
          "id": 1,
          "name": "화염구",
          "description": "화염 속성 데미지를 입힙니다.",
          "mpCost": 15,
          "element": "fire"
        },
        "ownedQuantity": 2
      }
    ],
    "requiredCharacterLevel": 10,
    "canCraft": true,
    "craftStatus": {
      "hasGold": true,
      "hasAllMaterials": true,
      "meetsLevelRequirement": true
    }
  }
}
```

---

#### POST `/api/craft` - 장비 제작

**인증:** ✅ 필요

**Request:**
```json
{
  "recipeId": 1,
  "spellMaterialId": 101
}
```

**Validation:**
- 충분한 재료 및 골드
- 캐릭터 레벨 충족
- 주술 재료는 선택 (없으면 주술 없는 장비)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "craftedEquipment": {
      "id": "equipment-uuid",
      "templateId": 5,
      "name": "철 검",
      "slotType": "weapon",
      "weaponType": "sword",
      "stats": {
        "str": 15,
        "agi": -10
      },
      "spell": {
        "id": 1,
        "name": "화염구"
      },
      "durability": 100,
      "maxDurability": 100,
      "requiredLevel": 10
    },
    "consumed": {
      "gold": 500,
      "materials": [
        { "name": "뼈다귀1", "quantity": 10 },
        { "name": "돌맹이1", "quantity": 5 }
      ],
      "spellMaterial": { "name": "불꽃 정수", "quantity": 1 }
    },
    "remainingGold": 12000
  }
}
```

**Errors:**
- E7001: 레시피를 찾을 수 없음
- E7002: 재료 부족
- E5004: 골드 부족

---

#### POST `/api/craft/repair` - 장비 수리

**인증:** ✅ 필요

**Request:**
```json
{
  "equipmentId": "equipment-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "equipment": {
      "id": "equipment-uuid",
      "name": "철 검",
      "durabilityBefore": 35,
      "durabilityAfter": 100
    },
    "cost": {
      "gold": 150,
      "materials": [
        { "name": "뼈다귀1", "quantity": 3 }
      ]
    },
    "remainingGold": 11850
  }
}
```

---

#### GET `/api/craft/repair-cost/:equipmentId` - 수리 비용 조회

**인증:** ✅ 필요

**Response (200):**
```json
{
  "success": true,
  "data": {
    "equipment": {
      "id": "equipment-uuid",
      "name": "철 검",
      "currentDurability": 35,
      "maxDurability": 100
    },
    "repairCost": {
      "gold": 150,
      "materials": [
        {
          "templateId": 1,
          "name": "뼈다귀1",
          "requiredQuantity": 3,
          "ownedQuantity": 22
        }
      ]
    },
    "canRepair": true
  }
}
```

---

### 5.11 템플릿 (Templates)

정적 데이터 조회 API입니다. 인증 없이 접근 가능합니다.

#### GET `/api/templates/pets` - 펫 종류 목록

**인증:** ❌ 불필요

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "랩터",
      "description": "빠른 속도를 자랑하는 작은 공룡",
      "size": "M",
      "element": {
        "primary": "earth",
        "secondary": null
      },
      "baseStats": {
        "str": 8,
        "agi": 12,
        "vit": 10,
        "con": 6,
        "int": 4
      },
      "skills": [
        { "id": 1, "name": "물기" },
        { "id": 2, "name": "돌진" }
      ],
      "spawnStageMin": 1,
      "spawnStageMax": 10,
      "sprite": "pet_001_raptor_m"
    },
    ...
  ]
}
```

---

#### GET `/api/templates/monsters` - 몬스터 종류 목록

**인증:** ❌ 불필요

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "야생 랩터",
      "description": "초원에 서식하는 야생 랩터",
      "element": {
        "primary": "earth",
        "secondary": null
      },
      "baseHp": 80,
      "baseMp": 30,
      "baseStr": 10,
      "baseAgi": 12,
      "baseCon": 8,
      "baseExp": 4,
      "isBoss": false,
      "linkedPetId": 1,
      "sprite": "pet_001_raptor_m"
    },
    ...
  ]
}
```

---

#### GET `/api/templates/equipment` - 장비 종류 목록

**인증:** ❌ 불필요

**Query Parameters:**
- `slotType`: weapon, armor, helmet, bracelet, necklace (선택)
- `weaponType`: sword, club, axe, spear, claw, bow (선택, weapon만)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "목검",
      "slotType": "weapon",
      "weaponType": "sword",
      "requiredLevel": 1,
      "stats": {
        "strMin": 3,
        "strMax": 5,
        "agiMin": -5,
        "agiMax": -5
      },
      "attackRatio": 150,
      "accuracy": 90,
      "hitCount": 1,
      "penaltyAgi": -10,
      "penaltyCon": 0,
      "buyPrice": 100,
      "icon": "wpn_sword_001"
    },
    ...
  ]
}
```

---

#### GET `/api/templates/spells` - 주술 목록

**인증:** ❌ 불필요

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "화염구",
      "description": "불꽃을 발사하여 단일 적에게 화속성 데미지를 입힙니다.",
      "element": "fire",
      "effectType": "damage",
      "damageRatio": 120,
      "mpCost": 15,
      "targetType": "single",
      "statusEffect": null
    },
    {
      "id": 5,
      "name": "독 안개",
      "description": "독 안개를 뿌려 모든 적에게 독 상태를 부여합니다.",
      "element": null,
      "effectType": "status",
      "mpCost": 20,
      "targetType": "all_enemies",
      "statusEffect": "poison",
      "statusChance": 80
    },
    ...
  ]
}
```

---

#### GET `/api/templates/consumables` - 소모품 종류

**인증:** ❌ 불필요

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "상처약(소)",
      "description": "HP를 50 회복합니다.",
      "effectType": "heal_hp",
      "effectValue": 50,
      "buyPrice": 50,
      "sellPrice": 25,
      "icon": "item_potion_hp_s"
    },
    ...
  ]
}
```

---

#### GET `/api/templates/materials` - 재료 종류

**인증:** ❌ 불필요

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "뼈다귀1",
      "description": "기본적인 제작 재료",
      "grade": 1,
      "materialType": "weapon",
      "sellPrice": 5,
      "icon": "mat_bone_1"
    },
    ...
  ]
}
```

---

## 6. WebSocket 이벤트

### 6.1 연결 및 인증

#### 연결

```typescript
import { io } from 'socket.io-client';

const socket = io('wss://api.uglynos.com', {
  auth: {
    token: 'jwt-token'
  }
});
```

#### 이벤트: `connect`

```typescript
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

#### 이벤트: `connect_error`

```typescript
socket.on('connect_error', (error) => {
  // error.message: "Authentication required" | "Invalid token"
});
```

#### 이벤트: `disconnect`

```typescript
socket.on('disconnect', (reason) => {
  // reason: "io server disconnect" | "io client disconnect" | "ping timeout"
});
```

---

### 6.2 전투 이벤트

#### 클라이언트 → 서버

##### `battle:join` - 전투 방 입장

```typescript
socket.emit('battle:join', {
  battleId: 'battle-uuid'
});
```

##### `battle:action` - 행동 제출

```typescript
socket.emit('battle:action', {
  battleId: 'battle-uuid',
  characterAction: {
    type: 'attack',  // attack | defend | spell | item | capture
    targetId: 'enemy-1',
    spellId: 1,      // spell 타입일 때
    itemId: 'item-uuid'  // item 타입일 때
  },
  petActions: [
    {
      petId: 'pet-uuid-1',
      skillId: 2,     // 1 또는 2 (기술1/기술2)
      targetId: 'enemy-1'
    },
    {
      petId: 'pet-uuid-2',
      skillId: 1,
      targetId: 'enemy-2'
    }
  ]
});
```

##### `battle:flee` - 도주 시도

```typescript
socket.emit('battle:flee', {
  battleId: 'battle-uuid'
});
```

##### `battle:leave` - 전투 방 퇴장

```typescript
socket.emit('battle:leave', {
  battleId: 'battle-uuid'
});
```

---

#### 서버 → 클라이언트

##### `battle:joined` - 전투 참가 완료

```typescript
socket.on('battle:joined', (data) => {
  // data: BattleState (전투 시작 API 응답과 동일)
});
```

##### `battle:turn_start` - 턴 시작

```typescript
socket.on('battle:turn_start', (data) => {
  /*
  {
    turnNumber: 3,
    turnOrder: ['pet-uuid-1', 'enemy-1', 'character-uuid', ...],
    currentTurnIndex: 0,
    waitingFor: ['character-uuid'],  // 행동 대기 중인 유저
    timeLimit: 30,
    startedAt: '2026-01-13T12:01:30Z'
  }
  */
});
```

##### `battle:action_result` - 행동 결과

```typescript
socket.on('battle:action_result', (data) => {
  /*
  {
    turnNumber: 3,
    results: [
      {
        actorId: 'pet-uuid-1',
        actorName: '뚜비',
        actorType: 'pet',
        actionType: 'attack',
        skillUsed: { id: 2, name: '돌진' },
        targetId: 'enemy-1',
        targetName: '초원 대장 랩터',
        
        hit: true,
        damage: 85,
        isCritical: false,
        elementMultiplier: 1.0,
        
        gangUp: {
          participants: ['pet-uuid-1', 'character-uuid'],
          bonusCritChance: 10
        },
        
        targetHpBefore: 300,
        targetHpAfter: 215,
        targetDead: false,
        
        actorMpBefore: 110,
        actorMpAfter: 95
      },
      {
        actorId: 'enemy-1',
        actorName: '초원 대장 랩터',
        actorType: 'monster',
        actionType: 'attack',
        targetId: 'character-uuid',
        targetName: '공룡왕',
        
        hit: false,
        evaded: true,
        
        targetHpBefore: 355,
        targetHpAfter: 355,
        targetDead: false
      },
      ...
    ],
    
    statusEffects: [
      {
        unitId: 'enemy-2',
        effectType: 'poison',
        applied: true,
        duration: 4
      }
    ],
    
    nextTurn: {
      turnNumber: 4,
      turnOrder: ['character-uuid', 'pet-uuid-1', 'enemy-1', ...],
      currentTurnIndex: 0
    }
  }
  */
});
```

##### `battle:unit_defeated` - 유닛 처치됨

```typescript
socket.on('battle:unit_defeated', (data) => {
  /*
  {
    unitId: 'enemy-2',
    unitName: '야생 랩터',
    isEnemy: true,
    killedBy: 'character-uuid',
    expGained: 4  // 적일 경우
  }
  */
});
```

##### `battle:capture_result` - 포획 결과

```typescript
socket.on('battle:capture_result', (data) => {
  /*
  성공 시:
  {
    success: true,
    targetId: 'enemy-2',
    targetName: '랩터',
    capturedPet: {
      id: 'new-pet-uuid',
      templateId: 1,
      name: '랩터',
      level: 1,
      stats: { ... },
      growth: { ... },
      loyalty: 50,
      isRareColor: false
    }
  }
  
  실패 시:
  {
    success: false,
    targetId: 'enemy-2',
    reason: 'failed',
    message: '포획에 실패했습니다.'
  }
  */
});
```

##### `battle:status_effect` - 상태이상 적용/해제

```typescript
socket.on('battle:status_effect', (data) => {
  /*
  적용:
  {
    action: 'apply',
    unitId: 'enemy-1',
    effectType: 'poison',
    duration: 4
  }
  
  해제:
  {
    action: 'remove',
    unitId: 'enemy-1',
    effectType: 'poison',
    reason: 'expired' | 'cured' | 'replaced'
  }
  
  피해:
  {
    action: 'damage',
    unitId: 'enemy-1',
    effectType: 'poison',
    damage: 15,
    hpAfter: 200
  }
  */
});
```

##### `battle:loyalty_event` - 충성도 이벤트

```typescript
socket.on('battle:loyalty_event', (data) => {
  /*
  불복:
  {
    type: 'disobey',
    petId: 'pet-uuid-1',
    petName: '뚜비',
    loyalty: 25,
    action: 'idle',  // idle | attack_random | defend
    message: '뚜비가 멍하니 서있다...'
  }
  
  도주:
  {
    type: 'runaway',
    petId: 'pet-uuid-1',
    petName: '뚜비',
    loyalty: 15,
    message: '뚜비가 도망쳤습니다! (영구 삭제)'
  }
  */
});
```

##### `battle:victory` - 승리

```typescript
socket.on('battle:victory', (data) => {
  /*
  {
    stageId: 5,
    stageName: '초원의 우두머리',
    turnsTaken: 8,
    
    stars: 2,
    starDetails: {
      star1: { condition: '모든 아군 생존', achieved: true },
      star2: { condition: '10턴 이내 클리어', achieved: true },
      star3: { condition: '아이템 미사용', achieved: false }
    },
    
    rewards: {
      exp: 120,
      gold: 50,
      drops: [
        { type: 'material', templateId: 1, name: '뼈다귀1', quantity: 3 },
        { type: 'material', templateId: 3, name: '돌맹이1', quantity: 2 }
      ]
    },
    
    levelUps: [
      {
        unitId: 'character-uuid',
        unitName: '공룡왕',
        levelBefore: 15,
        levelAfter: 16,
        statPointsGained: 5
      }
    ],
    
    loyaltyChanges: [
      { petId: 'pet-uuid-1', change: 2, newLoyalty: 77 }
    ],
    
    capturedPets: [
      { id: 'new-pet-uuid', name: '랩터', isRareColor: false }
    ],
    
    newUnlocks: [
      { type: 'stage', stageId: 6, stageName: '초원 심층' }
    ]
  }
  */
});
```

##### `battle:defeat` - 패배

```typescript
socket.on('battle:defeat', (data) => {
  /*
  {
    stageId: 5,
    stageName: '초원의 우두머리',
    turnsTaken: 12,
    
    penalties: {
      durabilityLost: [
        { equipmentId: 'equipment-uuid', name: '철 검', lost: 10, remaining: 75 }
      ]
    },
    
    loyaltyChanges: [
      { petId: 'pet-uuid-1', change: -5, newLoyalty: 70, reason: 'fainted' }
    ],
    
    partialExp: 30  // 일부 경험치 획득 (선택적)
  }
  */
});
```

##### `battle:fled` - 도주 결과

```typescript
socket.on('battle:fled', (data) => {
  /*
  {
    success: true,
    penalties: {
      durabilityLost: [
        { equipmentId: 'equipment-uuid', name: '철 검', lost: 5 }
      ]
    }
  }
  */
});
```

##### `battle:timeout` - 턴 타임아웃

```typescript
socket.on('battle:timeout', (data) => {
  /*
  {
    unitId: 'character-uuid',
    action: 'wait',  // 타임아웃 시 대기 상태
    message: '행동 시간 초과로 대기 상태가 됩니다.'
  }
  */
});
```

##### `battle:error` - 전투 에러

```typescript
socket.on('battle:error', (data) => {
  /*
  {
    code: 'E4003',
    message: '유효하지 않은 행동입니다.',
    details: { ... }
  }
  */
});
```

---

### 6.3 파티 이벤트 (멀티플레이)

#### 클라이언트 → 서버

##### `party:create` - 파티 생성

```typescript
socket.emit('party:create', {
  stageId: 10,
  maxMembers: 5
});
```

##### `party:join` - 파티 참가

```typescript
socket.emit('party:join', {
  partyId: 'party-uuid'
});
```

##### `party:leave` - 파티 탈퇴

```typescript
socket.emit('party:leave', {
  partyId: 'party-uuid'
});
```

##### `party:ready` - 준비 완료 토글

```typescript
socket.emit('party:ready', {
  partyId: 'party-uuid',
  ready: true
});
```

##### `party:kick` - 멤버 강퇴 (파티장만)

```typescript
socket.emit('party:kick', {
  partyId: 'party-uuid',
  characterId: 'character-uuid'
});
```

##### `party:start` - 전투 시작 (파티장만)

```typescript
socket.emit('party:start', {
  partyId: 'party-uuid'
});
```

---

#### 서버 → 클라이언트

##### `party:created` - 파티 생성됨

```typescript
socket.on('party:created', (data) => {
  /*
  {
    partyId: 'party-uuid',
    leaderId: 'character-uuid',
    stageId: 10,
    stageName: '숲의 심연',
    maxMembers: 5,
    members: [
      {
        characterId: 'character-uuid',
        nickname: '공룡왕',
        level: 15,
        isLeader: true,
        isReady: false
      }
    ],
    createdAt: '2026-01-13T12:00:00Z'
  }
  */
});
```

##### `party:joined` - 파티 참가 완료

```typescript
socket.on('party:joined', (data) => {
  // data: PartyState (위와 동일한 구조)
});
```

##### `party:member_joined` - 멤버 입장

```typescript
socket.on('party:member_joined', (data) => {
  /*
  {
    member: {
      characterId: 'character-uuid-2',
      nickname: '공룡사냥꾼',
      level: 18,
      isLeader: false,
      isReady: false
    }
  }
  */
});
```

##### `party:member_left` - 멤버 탈퇴

```typescript
socket.on('party:member_left', (data) => {
  /*
  {
    characterId: 'character-uuid-2',
    reason: 'left' | 'kicked' | 'disconnected'
  }
  */
});
```

##### `party:member_ready` - 준비 상태 변경

```typescript
socket.on('party:member_ready', (data) => {
  /*
  {
    characterId: 'character-uuid-2',
    ready: true
  }
  */
});
```

##### `party:kicked` - 강퇴됨

```typescript
socket.on('party:kicked', (data) => {
  /*
  {
    characterId: 'character-uuid',
    reason: '파티장에 의해 강퇴되었습니다.'
  }
  */
});
```

##### `party:starting` - 전투 시작 중

```typescript
socket.on('party:starting', (data) => {
  /*
  {
    countdown: 3,  // 3, 2, 1, 0
    battleId: 'battle-uuid'  // countdown 0일 때
  }
  */
});
```

##### `party:dissolved` - 파티 해산

```typescript
socket.on('party:dissolved', (data) => {
  /*
  {
    reason: 'leader_left' | 'all_left' | 'timeout'
  }
  */
});
```

---

## 7. 데이터 타입 정의

### 7.1 공통 타입

```typescript
// 속성
type ElementType = 'earth' | 'wind' | 'fire' | 'water';

interface ElementInfo {
  primary: ElementType;
  secondary: ElementType | null;
  primaryRatio: number;  // 50-100
}

// 기본 스탯
interface BaseStats {
  str: number;
  agi: number;
  vit: number;
  con: number;
  int: number;
}

// 파생 스탯
interface DerivedStats {
  maxHp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  eva: number;
}

// 성장률
interface GrowthRates {
  str: number;  // 50-150%
  agi: number;
  vit: number;
  con: number;
  int: number;
}

// 상태이상
type StatusEffectType = 
  | 'poison'     // 독
  | 'petrify'    // 석화
  | 'confusion'  // 혼란
  | 'freeze'     // 동결
  | 'paralysis'  // 마비
  | 'blind'      // 실명
  | 'silence'    // 침묵
  | 'fear'       // 공포
  | 'burn';      // 화상

interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  appliedAt: string;
}
```

### 7.2 캐릭터 타입

```typescript
interface Character {
  id: string;
  nickname: string;
  level: number;
  exp: number;
  expToNext: number;
  gold: number;
  appearance: CharacterAppearance;
  element: ElementInfo;
  stats: BaseStats;
  derivedStats: DerivedStats;
  currentHp: number;
  currentMp: number;
  statPoints: number;
  equipment: EquipmentSlots;
  equippedSpells: Spell[];
  ridingPetId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CharacterAppearance {
  eye: number;
  nose: number;
  mouth: number;
  hair: number;
  skin: number;
}

interface EquipmentSlots {
  weapon: Equipment | null;
  armor: Equipment | null;
  helmet: Equipment | null;
  bracelet: Equipment | null;
  necklace: Equipment | null;
}
```

### 7.3 펫 타입

```typescript
interface Pet {
  id: string;
  templateId: number;
  name: string;
  nickname: string | null;
  level: number;
  exp: number;
  expToNext: number;
  stats: BaseStats;
  derivedStats: DerivedStats;
  growth: GrowthRates;
  element: ElementInfo;
  skills: PetSkill[];
  loyalty: number;
  loyaltyEffects: LoyaltyEffects;
  currentHp: number;
  currentMp: number;
  partySlot: number | null;
  isRareColor: boolean;
  isStarter: boolean;
  isInStorage: boolean;
  score: number;
  capturedAt: string;
}

interface PetSkill {
  id: number;
  name: string;
  description: string;
  mpCost: number;
  damageRatio: number;
  effectType: string;
  statusEffect: StatusEffectType | null;
}

interface LoyaltyEffects {
  damageBonus: number;
  accuracyBonus: number;
  disobeyChance: number;
  fleeRisk: boolean;
}
```

### 7.4 장비 타입

```typescript
type SlotType = 'weapon' | 'armor' | 'helmet' | 'bracelet' | 'necklace';
type WeaponType = 'sword' | 'club' | 'axe' | 'spear' | 'claw' | 'bow';

interface Equipment {
  id: string;
  templateId: number;
  name: string;
  slotType: SlotType;
  weaponType: WeaponType | null;
  stats: Partial<BaseStats>;
  spell: Spell | null;
  durability: number;
  maxDurability: number;
  requiredLevel: number;
  isEquipped: boolean;
  inventorySlot: number | null;
  
  // 무기 전용
  attackRatio?: number;
  accuracy?: number;
  hitCount?: number;
}

interface Spell {
  id: number;
  name: string;
  description: string;
  element: ElementType | null;
  effectType: string;
  damageRatio?: number;
  healRatio?: number;
  mpCost: number;
  targetType: 'single' | 'all_enemies' | 'all_allies' | 'self';
  statusEffect?: StatusEffectType;
  statusChance?: number;
}
```

### 7.5 전투 타입

```typescript
type BattlePhase = 'waiting' | 'in_progress' | 'victory' | 'defeat' | 'fled';
type UnitType = 'character' | 'pet' | 'monster';
type ActionType = 'attack' | 'defend' | 'spell' | 'item' | 'capture' | 'wait';

interface BattleUnit {
  id: string;
  type: UnitType;
  templateId?: number;
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  stats: {
    atk: number;
    def: number;
    spd: number;
    eva: number;
  };
  element: ElementInfo;
  statusEffect: StatusEffect | null;
  isDefending: boolean;
  
  // 캐릭터 전용
  equipment?: {
    weapon?: WeaponInfo;
  };
  spells?: Spell[];
  
  // 펫 전용
  skills?: PetSkill[];
  loyalty?: number;
  
  // 몬스터 전용
  isBoss?: boolean;
  isCapturable?: boolean;
  isRareColor?: boolean;
}

interface WeaponInfo {
  type: WeaponType;
  attackRatio: number;
  accuracy: number;
  hitCount: number;
}

interface BattleAction {
  type: ActionType;
  targetId?: string;
  spellId?: number;
  itemId?: string;
  skillId?: number;
}

interface ActionResult {
  actorId: string;
  actorName: string;
  actorType: UnitType;
  actionType: ActionType;
  skillUsed?: { id: number; name: string };
  targetId?: string;
  targetName?: string;
  
  hit: boolean;
  evaded?: boolean;
  damage?: number;
  heal?: number;
  isCritical?: boolean;
  elementMultiplier?: number;
  
  gangUp?: {
    participants: string[];
    bonusCritChance: number;
  };
  
  targetHpBefore: number;
  targetHpAfter: number;
  targetDead: boolean;
  
  actorMpBefore?: number;
  actorMpAfter?: number;
}
```

---

## 📋 API 체크리스트

### MVP 필수
- [x] 인증 API (회원가입, 로그인, 토큰 갱신)
- [x] 캐릭터 API (생성, 조회, 스탯 배분)
- [x] 펫 API (목록, 상세, 파티 편성)
- [x] 인벤토리 API (조회, 아이템 사용)
- [x] 스테이지 API (목록, 상세)
- [x] 전투 API (시작, 행동, 도주)
- [x] WebSocket 전투 이벤트

### MVP 중요
- [x] 상점 API (구매, 판매)
- [x] 제작 API (레시피, 제작, 수리)
- [x] 펫 보관소 API
- [x] 요일 던전 API
- [x] 템플릿 API (정적 데이터)

### MVP 이후
- [ ] 멀티플레이 파티 API
- [ ] 퀘스트 API
- [ ] 거래소 API
- [ ] 랭킹 API

---

## 📝 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1.0 | 2026-01-13 | 초기 작성 |
