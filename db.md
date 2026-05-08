# DB 구조 및 구현 정리

## 개요

- **DB 엔진**: MySQL (mysql2/promise 드라이버)
- **DB 이름**: `khuthon`
- **문자셋**: utf8mb4 / utf8mb4_unicode_ci
- **연결 방식**: Connection Pool (connectionLimit: 10)
- **설정 파일**: `BACKEND_/.../config/db.js`

```js
// config/db.js
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'khuthon',
  connectionLimit: 10,
});
```

---

## 테이블 목록

| 테이블 | 역할 |
|---|---|
| `genres` | 음악 장르 마스터 |
| `users` | 회원 정보 |
| `user_genres` | 유저-관심장르 매핑 (M:N) |
| `songs` | 음원 정보 |
| `likes` | 좋아요 |
| `comments` | 댓글 |
| `saves` | 내 보관함 |
| `plays` | 재생 기록 |

---

## 테이블 상세

### genres
```sql
id       INT  AUTO_INCREMENT PK
name     VARCHAR(50) NOT NULL UNIQUE
```
- 초기 데이터: 팝, 힙합, R&B, 록, 재즈, 클래식, 일렉트로닉, 인디, 발라드, 트로트, OST, 기타

---

### users
```sql
id          INT  AUTO_INCREMENT PK
email       VARCHAR(100) NOT NULL UNIQUE
password    VARCHAR(255) NOT NULL       -- bcrypt 해시
nickname    VARCHAR(50)  NOT NULL UNIQUE -- 랜덤 자동 생성
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

### user_genres
```sql
user_id   INT  FK → users(id)  ON DELETE CASCADE
genre_id  INT  FK → genres(id) ON DELETE CASCADE
PK(user_id, genre_id)
```
- 유저가 선택한 관심 장르 저장
- 추천/랜덤 재생 시 이 테이블 기준으로 필터링

---

### songs
```sql
id          INT  AUTO_INCREMENT PK
user_id     INT  FK → users(id)  ON DELETE CASCADE
title       VARCHAR(200) NOT NULL
file_path   VARCHAR(500) NOT NULL   -- uploads/songs/ 경로
cover_path  VARCHAR(500)            -- uploads/covers/ 경로 (nullable)
genre_id    INT  FK → genres(id)   ON DELETE SET NULL
play_count  INT  DEFAULT 0         -- 스트리밍 시 즉시 +1
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

### likes
```sql
id         INT  AUTO_INCREMENT PK
user_id    INT  FK → users(id) ON DELETE CASCADE
song_id    INT  FK → songs(id) ON DELETE CASCADE
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
UNIQUE KEY (user_id, song_id)
```

---

### comments
```sql
id         INT  AUTO_INCREMENT PK
user_id    INT  FK → users(id) ON DELETE CASCADE
song_id    INT  FK → songs(id) ON DELETE CASCADE
content    TEXT NOT NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

### saves
```sql
id           INT  AUTO_INCREMENT PK
user_id      INT  FK → users(id) ON DELETE CASCADE
song_id      INT  FK → songs(id) ON DELETE CASCADE
custom_title VARCHAR(200) NOT NULL   -- 유저가 직접 지정한 제목
created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
UNIQUE KEY (user_id, song_id)
```
- UPSERT(`ON DUPLICATE KEY UPDATE`) 방식으로 제목 변경 지원

---

### plays
```sql
id         INT  AUTO_INCREMENT PK
user_id    INT  (nullable, 비로그인도 기록)
song_id    INT  FK → songs(id) ON DELETE CASCADE
played_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
- 차트 점수 집계 시 기간 필터(daily/monthly/yearly) 기준으로 사용

---

## ERD (텍스트)

```
genres ──< user_genres >── users
              │                │
              │              songs ──< likes
              └──────────────/    ──< comments
                                  ──< saves
                                  ──< plays
```

---

## 차트 점수 공식

```
score = play_count + (like_count × 2) + (save_count × 3)
```

기간 필터는 `plays.played_at` 기준으로 적용:
- `daily`: 최근 1일
- `monthly`: 최근 1달
- `yearly`: 최근 1년

---

## 추천 로직

1. `user_genres`에 관심 장르가 있으면 → 해당 장르 곡 중 인기순 30개
2. 관심 장르 없으면 → 전체 곡 인기순 20개 (cold-start fallback)

**인기 점수**: `play_count + like_count × 2`

---

## 주요 API 엔드포인트 ↔ DB 매핑

| 메서드 | 경로 | 테이블 조작 |
|---|---|---|
| POST | /api/auth/register | users INSERT, user_genres INSERT |
| POST | /api/auth/login | users SELECT |
| GET  | /api/auth/me | users + user_genres + genres JOIN |
| PATCH| /api/auth/genres | user_genres DELETE → INSERT |
| GET  | /api/songs | songs + users + genres + likes + comments JOIN |
| POST | /api/songs | songs INSERT |
| GET  | /api/songs/:id/stream | plays INSERT, songs.play_count +1 |
| DELETE| /api/songs/:id | songs DELETE (파일도 삭제) |
| POST | /api/songs/:id/like | likes INSERT/DELETE (토글) |
| POST | /api/songs/:id/save | saves UPSERT |
| GET  | /api/songs/:id/comments | comments + users JOIN |
| POST | /api/songs/:id/comments | comments INSERT |
| GET  | /api/charts | songs + plays + likes + saves 집계 |
| GET  | /api/recommend | user_genres → songs 필터 |
| GET  | /api/genres | genres SELECT |

---

## 인증 방식

- **JWT** (jsonwebtoken), 유효기간 7일
- Payload: `{ id, nickname }`
- 미들웨어: `authRequired` (없으면 401), `authOptional` (없어도 통과)
- 비밀번호: **bcrypt** (salt rounds: 10)

---

## 파일 저장

| 종류 | 경로 |
|---|---|
| 음원 | `uploads/songs/` |
| 커버 이미지 | `uploads/covers/` |

- 정적 서빙: `GET /uploads/*`
- 음원 스트리밍: HTTP Range Request 지원 (206 Partial Content)
- 음원 삭제 시 DB 레코드 + 실제 파일 동시 삭제

---

## 두 번째 백엔드 (`backend/` 폴더)

별도의 `blind_music` DB를 사용하는 초기 버전. 구조가 유사하나 차이점:

| | `BACKEND_` (메인) | `backend/` (구버전) |
|---|---|---|
| DB 이름 | khuthon | blind_music |
| 음악 단위 | songs | tracks |
| 분류 | genres | categories |
| 저장 테이블 | saves | saved_tracks |
| 차트 캐시 | 없음 (실시간) | chart_daily 테이블 |
| 재생 로그 | plays | play_logs (BIGINT PK) |

현재 활성 백엔드는 **`BACKEND_/team-khm-.../`** 기준.

---

# API 명세서

## 공통 규칙

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json` (파일 업로드 시 `multipart/form-data`)
- **인증**: `Authorization: Bearer <JWT토큰>` 헤더 사용
- **에러 응답 형식**: `{ "message": "에러 메시지" }`

| 상태코드 | 의미 |
|---|---|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (필수값 누락 등) |
| 401 | 인증 필요 / 토큰 만료 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 중복 (이메일 등) |
| 500 | 서버 오류 |

---

## Auth

### POST /api/auth/register
회원가입. 닉네임은 서버에서 자동 생성.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "비밀번호",
  "genres": [1, 3, 5]
}
```
- `genres`: 관심 장르 ID 배열 (선택, 없으면 빈 배열)

**Response 201**
```json
{
  "token": "eyJhbGci...",
  "nickname": "멋진고양이"
}
```

**에러**
- `400` 이메일 또는 비밀번호 누락
- `409` 이미 사용 중인 이메일

---

### POST /api/auth/login
로그인.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "비밀번호"
}
```

**Response 200**
```json
{
  "token": "eyJhbGci...",
  "nickname": "멋진고양이"
}
```

**에러**
- `400` 이메일 또는 비밀번호 누락
- `401` 이메일/비밀번호 불일치

---

### GET /api/auth/me
내 정보 조회. **인증 필요**

**Response 200**
```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "멋진고양이",
  "created_at": "2026-05-08T12:00:00.000Z",
  "genres": [
    { "id": 1, "name": "팝" },
    { "id": 3, "name": "R&B" }
  ]
}
```

---

### PUT /api/auth/me/genres
관심 장르 수정. **인증 필요**

**Request Body**
```json
{
  "genres": [2, 4, 6]
}
```
- 기존 관심 장르를 전부 교체 (덮어쓰기)

**Response 200**
```json
{
  "message": "관심 장르가 업데이트되었습니다."
}
```

---

## Songs

### GET /api/songs
음원 목록 조회.

**Query Parameters**
| 파라미터 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| genre_id | number | - | 장르 필터 |
| page | number | 1 | 페이지 번호 |
| limit | number | 20 | 페이지당 항목 수 |

**Response 200**
```json
[
  {
    "id": 1,
    "title": "My Song",
    "file_path": "uploads/songs/uuid.mp3",
    "cover_path": "uploads/covers/uuid.jpg",
    "play_count": 42,
    "created_at": "2026-05-08T12:00:00.000Z",
    "uploader": "멋진고양이",
    "genre_id": 1,
    "genre": "팝",
    "like_count": 10,
    "comment_count": 3
  }
]
```

---

### POST /api/songs
음원 업로드. **인증 필요** / `multipart/form-data`

**Form Fields**
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| song | file | O | 오디오 파일 (mp3, wav, flac, m4a, ogg / 최대 50MB) |
| cover | file | X | 커버 이미지 (jpg, jpeg, png, webp / 최대 5MB) |
| title | string | O | 음원 제목 |
| genre_id | number | X | 장르 ID |

**Response 201**
```json
{
  "id": 5,
  "message": "음원이 업로드되었습니다."
}
```

---

### GET /api/songs/:id
단일 음원 상세 조회.

**Response 200**
```json
{
  "id": 1,
  "title": "My Song",
  "file_path": "uploads/songs/uuid.mp3",
  "cover_path": "uploads/covers/uuid.jpg",
  "play_count": 42,
  "created_at": "2026-05-08T12:00:00.000Z",
  "uploader": "멋진고양이",
  "genre_id": 1,
  "genre": "팝",
  "like_count": 10,
  "comment_count": 3
}
```

**에러**
- `404` 음원 없음

---

### DELETE /api/songs/:id
음원 삭제. **인증 필요** (본인만 가능)

**Response 200**
```json
{
  "message": "음원이 삭제되었습니다."
}
```

**에러**
- `403` 본인 음원 아님
- `404` 음원 없음

---

### GET /api/songs/:id/stream
음원 스트리밍. **인증 선택**

- `Range` 헤더 지원 → 206 Partial Content 응답
- 재생 시 `plays` 테이블에 기록 + `songs.play_count` +1
- 비로그인도 재생 가능 (user_id는 null로 기록)

**Request Headers (선택)**
```
Range: bytes=0-
Authorization: Bearer <token>
```

**Response**
- `200` 전체 스트림 (`audio/mpeg`)
- `206` 부분 스트림 (`Content-Range: bytes start-end/total`)

---

## Likes (좋아요)

### POST /api/songs/:id/like
좋아요 토글. **인증 필요**

- 이미 좋아요 상태면 취소, 아니면 추가

**Response 200**
```json
{ "liked": true }
```
또는
```json
{ "liked": false }
```

---

### GET /api/songs/:id/like
좋아요 상태 확인. **인증 필요**

**Response 200**
```json
{ "liked": true }
```

---

## Comments (댓글)

### GET /api/songs/:id/comments
댓글 목록 조회.

**Query Parameters**
| 파라미터 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| page | number | 1 | 페이지 번호 |
| limit | number | 30 | 페이지당 항목 수 |

**Response 200**
```json
[
  {
    "id": 1,
    "content": "좋은 음악이에요!",
    "created_at": "2026-05-08T12:00:00.000Z",
    "nickname": "멋진고양이"
  }
]
```

---

### POST /api/songs/:id/comments
댓글 작성. **인증 필요**

**Request Body**
```json
{
  "content": "좋은 음악이에요!"
}
```

**Response 201**
```json
{
  "id": 7,
  "message": "댓글이 등록되었습니다."
}
```

**에러**
- `400` content 누락

---

### DELETE /api/songs/:id/comments/:commentId
댓글 삭제. **인증 필요** (본인만 가능)

**Response 200**
```json
{
  "message": "댓글이 삭제되었습니다."
}
```

**에러**
- `403` 본인 댓글 아님
- `404` 댓글 없음

---

## Saves (보관함)

### POST /api/songs/:id/save
음원 보관함에 저장. **인증 필요**

- 이미 저장된 경우 `custom_title`만 업데이트 (UPSERT)

**Request Body**
```json
{
  "custom_title": "내가 붙인 제목"
}
```

**Response 201**
```json
{
  "message": "저장되었습니다."
}
```

**에러**
- `400` custom_title 누락

---

### DELETE /api/songs/:id/save
보관함에서 제거. **인증 필요**

**Response 200**
```json
{
  "message": "저장이 취소되었습니다."
}
```

---

### GET /api/saves/me
내 보관함 목록. **인증 필요**

**Response 200**
```json
[
  {
    "id": 1,
    "custom_title": "내가 붙인 제목",
    "created_at": "2026-05-08T12:00:00.000Z",
    "song_id": 3,
    "original_title": "My Song",
    "cover_path": "uploads/covers/uuid.jpg",
    "uploader": "멋진고양이",
    "genre": "팝"
  }
]
```

---

## Charts (차트)

### GET /api/charts
차트 조회.

**Query Parameters**
| 파라미터 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| period | string | `daily` | `daily` / `monthly` / `yearly` |
| genre_id | number | - | 장르 필터 |
| limit | number | 100 | 최대 항목 수 |

**Response 200**
```json
{
  "period": "daily",
  "rows": [
    {
      "id": 1,
      "title": "My Song",
      "cover_path": "uploads/covers/uuid.jpg",
      "play_count": 42,
      "uploader": "멋진고양이",
      "genre": "팝",
      "like_count": 10,
      "score": 72
    }
  ]
}
```

> `score = play_count + like_count × 2 + save_count × 3`, 높을수록 상위

---

## Recommend (추천)

### GET /api/recommend
맞춤 추천. **인증 필요**

- 관심 장르 있으면 → 해당 장르 인기곡 30개 (`type: "personalized"`)
- 관심 장르 없으면 → 전체 인기곡 20개 (`type: "popular"`)

**Response 200 - 개인화**
```json
{
  "type": "personalized",
  "genres": [1, 3],
  "songs": [
    {
      "id": 2,
      "title": "My Song",
      "cover_path": "uploads/covers/uuid.jpg",
      "play_count": 30,
      "uploader": "멋진고양이",
      "genre": "팝",
      "like_count": 5
    }
  ]
}
```

**Response 200 - 인기순 fallback**
```json
{
  "type": "popular",
  "songs": [ ... ]
}
```

---

### GET /api/recommend/random
랜덤 재생 목록. **인증 필요**

- 관심 장르 있으면 해당 장르에서, 없으면 전체에서 랜덤 20곡

**Response 200**
```json
[
  {
    "id": 4,
    "title": "My Song",
    "cover_path": "uploads/covers/uuid.jpg",
    "file_path": "uploads/songs/uuid.mp3"
  }
]
```

---

## Genres (장르)

### GET /api/genres
전체 장르 목록 조회.

**Response 200**
```json
[
  { "id": 1, "name": "팝" },
  { "id": 2, "name": "힙합" },
  { "id": 3, "name": "R&B" },
  { "id": 4, "name": "록" },
  { "id": 5, "name": "재즈" },
  { "id": 6, "name": "클래식" },
  { "id": 7, "name": "일렉트로닉" },
  { "id": 8, "name": "인디" },
  { "id": 9, "name": "발라드" },
  { "id": 10, "name": "트로트" },
  { "id": 11, "name": "OST" },
  { "id": 12, "name": "기타" }
]
```

---

## Health Check

### GET /api/health
서버 상태 확인.

**Response 200**
```json
{ "status": "ok" }
```

---

## 정적 파일

| 경로 | 설명 |
|---|---|
| `GET /uploads/songs/:filename` | 음원 파일 직접 접근 |
| `GET /uploads/covers/:filename` | 커버 이미지 직접 접근 |

> 스트리밍은 `/api/songs/:id/stream` 사용 권장 (재생 기록 자동 처리)
