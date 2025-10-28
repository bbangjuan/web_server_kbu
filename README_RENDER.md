# Render 배포 가이드

## 1. GitHub에 코드 업로드

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## 2. Render에서 웹 서비스 생성

### 1) Render 계정 생성 및 로그인
- https://render.com 접속
- GitHub로 로그인

### 2) PostgreSQL 데이터베이스 생성
1. "New +" 버튼 클릭
2. "PostgreSQL" 선택
3. 설정:
   - **Name**: aicar-db
   - **Database**: aicar_db
   - **User**: (자동 생성)
   - **Region**: 선택
   - **Plan**: Free
4. "Create Database" 클릭

### 3) 외부 데이터베이스 URL 복사
- 데이터베이스 설정에서 "External Database URL" 복사
- 예: `postgres://user:password@host:port/database?sslmode=require`

## 3. 환경 변수 설정

Render 대시보드에서:
1. "Environment" 탭으로 이동
2. 다음 환경 변수 추가:

```
NODE_ENV=production
DB_SSL=true
SESSION_SECRET=your-super-secret-key-here-change-this
```

**중요**: 외부 데이터베이스 URL을 추가합니다:
```
POSTGRES_HOST=your-host-name
POSTGRES_PORT=5432
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-password
POSTGRES_DATABASE=your-database-name
```

또는 전체 URL을 하나로:
```
DATABASE_URL=postgres://user:password@host:port/database
```

## 4. 웹 서비스 배포

1. "New +" 버튼 클릭
2. "Web Service" 선택
3. 설정:
   - **Repository**: GitHub 저장소 선택
   - **Name**: aicar-website
   - **Branch**: main
   - **Root Directory**: (비워둠)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. "Create Web Service" 클릭

## 5. 자동 배포

- GitHub에 푸시하면 자동 배포됩니다
- 배포 완료 후 URL을 확인하세요

## 환경 변수 예시

```
NODE_ENV=production
DB_SSL=true
SESSION_SECRET=aicar-secret-2024-render-deployment
POSTGRES_HOST=xxxxx.render.com
POSTGRES_PORT=5432
POSTGRES_USER=xxxxx
POSTGRES_PASSWORD=xxxxx
POSTGRES_DATABASE=aicar_db
```

## 문제 해결

### "No database configured"
- Render에서 PostgreSQL 데이터베이스를 먼저 생성해야 합니다
- 환경 변수가 올바르게 설정되었는지 확인하세요

### "Connection timeout"
- `DB_SSL=true` 설정을 확인하세요
- Render 데이터베이스 URL이 올바른지 확인하세요

### "Module not found"
- `package.json`에 모든 의존성이 포함되어 있는지 확인하세요
- `npm install`이 정상적으로 실행되는지 확인하세요

