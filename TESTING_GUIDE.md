# Prehistoric Life - 시스템 테스트 가이드

이 문서는 구현된 기능들을 테스트하기 위한 가이드입니다.

---

## 🚀 서버 실행 방법

```bash
# 백엔드 서버 실행
cd server
npm install
npm run dev

# 프론트엔드 실행 (별도 터미널)
cd client
npm install
npm run dev
```

- **백엔드**: http://localhost:3000
- **프론트엔드**: http://localhost:5173

---

## 1. 인증 시스템 (Authentication)

### 1.1 회원가입
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "nickname": "TestUser"
  }'
```

### 1.2 로그인
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```
**응답**: JWT 토큰 반환 (이후 요청에 사용)

### 1.3 내 정보 조회
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 1.4 토큰 갱신
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## 2. 캐릭터 시스템 (Character)

### 2.1 캐릭터 생성
```bash
curl -X POST http://localhost:3000/api/characters \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyCharacter",
    "appearance": {
      "eye": 1,
      "nose": 2,
      "mouth": 1,
      "hair": 3,
      "skin": 1
    },
    "element": {
      "primary": "fire",
      "secondary": "wind",
      "ratio": 70
    },
    "stats": {
      "str": 10,
      "agi": 8,
      "vit": 7,
      "con": 5,
      "int": 15
    }
  }'
```

**커스터마이징 옵션**:
- **외형**: eye, nose, mouth, hair, skin (각 1-5)
- **원소**: earth, wind, fire, water
- **듀얼 원소**: primary + secondary + ratio(%)
- **스탯**: STR, AGI, VIT, CON, INT (총 45포인트 분배)

### 2.2 내 캐릭터 목록
```bash
curl -X GET http://localhost:3000/api/characters \
  -H "Authorization: Bearer <TOKEN>"
```

### 2.3 캐릭터 선택 (활성화)
```bash
curl -X POST http://localhost:3000/api/characters/<CHARACTER_ID>/select \
  -H "Authorization: Bearer <TOKEN>"
```

### 2.4 스탯 포인트 분배
```bash
curl -X PATCH http://localhost:3000/api/characters/<CHARACTER_ID>/stats \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "str": 5,
    "agi": 3,
    "vit": 2,
    "con": 0,
    "int": 0
  }'
```

---

## 3. 펫 시스템 (Pet)

### 3.1 보유 펫 목록
```bash
curl -X GET http://localhost:3000/api/pets \
  -H "Authorization: Bearer <TOKEN>"
```

### 3.2 펫 상세 정보
```bash
curl -X GET http://localhost:3000/api/pets/<PET_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

### 3.3 펫 닉네임 변경
```bash
curl -X PATCH http://localhost:3000/api/pets/<PET_ID>/nickname \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"nickname": "MyPetName"}'
```

### 3.4 파티에 펫 추가 (최대 3마리)
```bash
curl -X POST http://localhost:3000/api/pets/<PET_ID>/party \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"slot": 1}'
```

### 3.5 펫 라이딩 설정
```bash
curl -X POST http://localhost:3000/api/pets/<PET_ID>/ride \
  -H "Authorization: Bearer <TOKEN>"
```

### 3.6 펫 방출 (영구 삭제)
```bash
curl -X DELETE http://localhost:3000/api/pets/<PET_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 4. 전투 시스템 (Battle)

### 4.1 전투 시작
```bash
curl -X POST http://localhost:3000/api/battles/start \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "stageId": 1,
    "partyPets": [<PET_ID_1>, <PET_ID_2>]
  }'
```

### 4.2 전투 상태 조회
```bash
curl -X GET http://localhost:3000/api/battles/<BATTLE_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

### 4.3 전투 액션 수행
```bash
curl -X POST http://localhost:3000/api/battles/<BATTLE_ID>/action \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "unitId": "<CHARACTER_OR_PET_ID>",
    "actionType": "attack",
    "targetId": "<ENEMY_ID>"
  }'
```

**액션 타입**:
| 타입 | 설명 | 추가 파라미터 |
|------|------|--------------|
| `attack` | 기본 공격 | targetId |
| `defend` | 방어 (50% 피해 감소) | - |
| `spell` | 마법 사용 | targetId, spellId |
| `item` | 아이템 사용 | targetId, itemId |
| `capture` | 펫 포획 시도 | targetId |

### 4.4 전투 도주
```bash
curl -X POST http://localhost:3000/api/battles/<BATTLE_ID>/flee \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 5. 인벤토리 시스템 (Inventory)

### 5.1 전체 인벤토리 조회
```bash
curl -X GET http://localhost:3000/api/inventory \
  -H "Authorization: Bearer <TOKEN>"
```

### 5.2 장착 아이템만 조회
```bash
curl -X GET http://localhost:3000/api/inventory/equipped \
  -H "Authorization: Bearer <TOKEN>"
```

### 5.3 아이템 장착
```bash
curl -X POST http://localhost:3000/api/inventory/<INVENTORY_ID>/equip \
  -H "Authorization: Bearer <TOKEN>"
```

### 5.4 아이템 해제
```bash
curl -X POST http://localhost:3000/api/inventory/<INVENTORY_ID>/unequip \
  -H "Authorization: Bearer <TOKEN>"
```

### 5.5 소비 아이템 사용
```bash
curl -X POST http://localhost:3000/api/inventory/<INVENTORY_ID>/use \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 1}'
```

### 5.6 아이템 판매
```bash
curl -X POST http://localhost:3000/api/inventory/<INVENTORY_ID>/sell \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 1}'
```

---

## 6. 스테이지 시스템 (Stage)

### 6.1 전체 스테이지 목록
```bash
curl -X GET http://localhost:3000/api/stages \
  -H "Authorization: Bearer <TOKEN>"
```

### 6.2 스테이지 상세 정보
```bash
curl -X GET http://localhost:3000/api/stages/<STAGE_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

### 6.3 스테이지 진행 상황 (별점)
```bash
curl -X GET http://localhost:3000/api/stages/<STAGE_ID>/progress \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 7. 상점 시스템 (Shop)

### 7.1 상점 목록
```bash
curl -X GET http://localhost:3000/api/shops \
  -H "Authorization: Bearer <TOKEN>"
```

### 7.2 상점 아이템 목록
```bash
curl -X GET http://localhost:3000/api/shops/<SHOP_ID>/items \
  -H "Authorization: Bearer <TOKEN>"
```

### 7.3 아이템 구매
```bash
curl -X POST http://localhost:3000/api/shops/<SHOP_ID>/buy \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "<ITEM_ID>",
    "quantity": 1
  }'
```

### 7.4 NPC 목록
```bash
curl -X GET http://localhost:3000/api/shops/npcs/all \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 8. WebSocket 실시간 테스트 (전투)

### Socket.io 연결 예시 (JavaScript)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: '<YOUR_JWT_TOKEN>' }
});

// 연결 확인
socket.on('connect', () => {
  console.log('Connected!');
});

// 전투 참가
socket.emit('battle:join', { battleId: '<BATTLE_ID>' });

// 전투 이벤트 수신
socket.on('battle:joined', (data) => console.log('Battle joined:', data));
socket.on('battle:turn_start', (data) => console.log('Turn start:', data));
socket.on('battle:action_result', (data) => console.log('Action result:', data));
socket.on('battle:victory', (data) => console.log('Victory!', data));
socket.on('battle:defeat', (data) => console.log('Defeat...', data));

// 액션 전송
socket.emit('battle:action', {
  battleId: '<BATTLE_ID>',
  unitId: '<UNIT_ID>',
  actionType: 'attack',
  targetId: '<TARGET_ID>'
});

// 도주
socket.emit('battle:flee', { battleId: '<BATTLE_ID>' });
```

---

## 9. 게임 시스템 핵심 공식

### 9.1 원소 상성
```
Earth → Wind → Fire → Water → Earth (순환)

- 유리: 1.3x 데미지
- 불리: 0.7x 데미지
```

### 9.2 데미지 계산
```
기본 데미지 = ATK × (100 / (100 + 적 DEF))
크리티컬 = 데미지 × 1.5
갱업 보너스 = +10% 크리티컬 확률
```

### 9.3 펫 포획 확률
```
기본 확률: 3%
수정자: 적 HP%, 캐릭터 레벨, 충성도
```

### 9.4 상태이상 9종
| 상태 | 효과 |
|------|------|
| Poison | 턴마다 피해 |
| Petrification | 행동 불가 |
| Confusion | 랜덤 타겟 |
| Freeze | 행동 지연 |
| Paralysis | 턴 스킵 |
| Blindness | 명중률 감소 |
| Silence | 마법 사용 불가 |
| Fear | 도주 시도 |
| Burn | 지속 피해 |

---

## 10. 프론트엔드 UI 테스트

브라우저에서 http://localhost:5173 접속 후:

| 페이지 | 경로 | 테스트 항목 |
|--------|------|------------|
| 로그인 | `/login` | 이메일/비밀번호 입력, 에러 표시 |
| 회원가입 | `/register` | 계정 생성, 유효성 검사 |
| 캐릭터 선택 | `/characters` | 캐릭터 목록, 생성 모달 |
| 게임 | `/game` | Phaser 캔버스, 게임 UI 오버레이 |

### 테스트 시나리오

1. **회원가입 → 로그인 플로우**
   - 새 계정 생성
   - 로그인 성공 확인
   - JWT 토큰 저장 확인

2. **캐릭터 생성 플로우**
   - 외형 커스터마이징
   - 원소 선택 (싱글/듀얼)
   - 스탯 분배 (총 45포인트)
   - 캐릭터 생성 완료

3. **전투 플로우**
   - 스테이지 선택
   - 펫 파티 구성
   - 전투 시작
   - 턴제 액션 수행
   - 보상 획득

4. **인벤토리/상점 플로우**
   - 아이템 구매
   - 장비 장착/해제
   - 소비 아이템 사용

---

## 11. 단위 테스트 실행

```bash
cd server
npm test
```

### 테스트 파일
- `damageCalculator.test.ts` - 데미지 계산 로직
- `formulas.test.ts` - 게임 공식
- `monster.test.ts` - 몬스터 생성
- `turnManager.test.ts` - 턴 순서 관리

---

## 12. 환경 변수 설정

`.env` 파일 예시:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-key>

# Auth
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=7d

# Redis (optional)
REDIS_URL=<your-redis-url>
```

---

## 빠른 테스트 체크리스트

- [ ] 서버 정상 실행 (`npm run dev`)
- [ ] 회원가입 성공
- [ ] 로그인 후 토큰 발급
- [ ] 캐릭터 생성
- [ ] 캐릭터 선택
- [ ] 인벤토리 조회
- [ ] 스테이지 목록 조회
- [ ] 전투 시작
- [ ] 전투 액션 수행
- [ ] 전투 완료 (승리/패배)
- [ ] 상점 아이템 구매
- [ ] 펫 관리 (닉네임, 파티)
