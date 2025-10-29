# AI카 - 자율주행 자동차 정보 웹사이트

자율주행 자동차에 대한 정보를 제공하고 사용자들이 의견을 나눌 수 있는 커뮤니티 웹사이트입니다.

## 주요 기능

- 📱 **자율주행 정보**: 자율주행의 개념, 작동 원리, 레벨, 장점, 주의사항 등 포괄적인 정보 제공
- 💬 **게시판**: 사용자들이 자율주행에 대한 의견을 나눌 수 있는 커뮤니티
- 🔐 **회원 시스템**: 로그인 및 회원가입 기능
- 💾 **데이터베이스**: PostgreSQL을 사용한 사용자 및 게시글 관리 (Render 호환)

## 설치 및 실행

### 1. PostgreSQL 설치 (로컬 개발용)

**Render 배포**: Render에서는 PostgreSQL 데이터베이스가 자동으로 설정됩니다. `render.yaml` 파일을 참고하세요.

**로컬 개발**: 로컬에서 개발하려면 PostgreSQL이 필요합니다.

- Windows: [PostgreSQL 다운로드](https://www.postgresql.org/download/windows/)
- Mac: `brew install postgresql`
- Linux: `sudo apt-get install postgresql`

**✨ 자동 생성 기능**: 서버를 시작하면 테이블이 **자동으로 생성**됩니다!

#### 자동 생성 (권장)
서버를 실행하면 자동으로 필요한 테이블이 생성됩니다:
```bash
npm start
```

### 2. 데이터베이스 연결 설정

`.env` 파일을 생성하고 PostgreSQL 연결 정보를 설정하세요:

```bash
# .env 파일 복사 (있는 경우)
cp .env.example .env

# 또는 직접 .env 파일을 생성하고 다음과 같이 수정:
```

**로컬 개발용 `.env` 파일 내용:**
```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_DATABASE=aicar_db
DB_PORT=5432
PORT=3000
SESSION_SECRET=your-super-secret-key-here
```

**Render 배포용**: 
Render에서는 자동으로 다음 환경 변수가 설정됩니다:
- `POSTGRES_HOST`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`
- `POSTGRES_PORT`

또는 Render 대시보드에서 다음 환경 변수를 설정할 수 있습니다:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `DB_PORT`
- `DB_SSL=true` (Render에서는 SSL 연결 필요)

**중요**: `.env` 파일은 Git에 올라가지 않습니다 (`.gitignore`에 포함).

### 3. 의존성 설치

```bash
npm install
```

### 4. 서버 실행

```bash
npm start
```

또는 개발 모드로 실행 (nodemon 사용):

```bash
npm run dev
```

### 5. 웹사이트 접속

브라우저에서 다음 주소로 접속하세요:
```
http://localhost:3000
```

## 사용 방법

### 회원가입
1. 웹사이트 상단의 "로그인" 버튼 클릭
2. "회원가입" 탭 선택
3. 사용자명, 이메일, 비밀번호(6자 이상) 입력
4. 회원가입 버튼 클릭

### 게시글 작성
1. 로그인 후 "게시판" 메뉴 클릭
2. "새 글 작성" 버튼 클릭
3. 제목과 내용 입력 후 작성 완료

### 댓글 작성
1. 게시판에서 원하는 게시글 클릭
2. 하단 댓글 입력창에 내용 작성
3. "댓글 작성" 버튼 클릭

## 프로젝트 구조

```
Aicar/
├── index.html          # 메인 페이지
├── auth.html           # 로그인/회원가입 페이지
├── forum.html          # 게시판 페이지
├── styles.css          # 스타일시트
├── script.js           # 클라이언트 JavaScript
├── server.js           # Express 서버 (라우트)
├── config/
│   └── db.js          # 데이터베이스 연결 설정
├── models/            # 데이터베이스 모델
│   ├── userModel.js   # 사용자 관련 쿼리
│   ├── postModel.js   # 게시글 관련 쿼리
│   └── commentModel.js # 댓글 관련 쿼리
├── package.json       # 프로젝트 설정
└── aicar.db          # SQLite 데이터베이스 (자동 생성)
```

## 기술 스택

- **프론트엔드**: HTML, CSS, JavaScript
- **백엔드**: Node.js, Express
- **데이터베이스**: PostgreSQL (Render 호환)
- **인증**: Session 기반 인증, bcryptjs 비밀번호 해싱
- **배포**: Render.com

## API 엔드포인트

### 인증
- `POST /api/register` - 회원가입
- `POST /api/login` - 로그인
- `POST /api/logout` - 로그아웃
- `GET /api/user` - 현재 사용자 정보

### 게시판
- `GET /api/posts` - 게시글 목록 조회
- `POST /api/posts` - 게시글 작성
- `GET /api/posts/:id` - 게시글 상세 조회
- `POST /api/posts/:id/comments` - 댓글 작성
- `GET /api/posts/:id/comments` - 댓글 목록 조회

## 특징

✨ **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기에서 완벽하게 작동
🎨 **모던한 UI**: 그라데이션, 애니메이션, 호버 효과 등 현대적인 디자인
🚗 **인터랙티브**: 자동차 애니메이션, 부드러운 스크롤, 카드 효과
🔒 **안전한 인증**: bcryptjs를 사용한 비밀번호 해싱
💬 **실시간 커뮤니티**: 사용자 간 의견 교환 가능
🗄️ **PostgreSQL 데이터베이스**: Render 호환, 안정적이고 확장 가능한 데이터 관리
📦 **모듈화된 구조**: 코드 분리 및 유지보수성 향상

## 개발 정보

- 포트: 3000 (기본값)
- 세션 만료: 24시간
- 최소 비밀번호 길이: 6자

## 라이선스

ISC

