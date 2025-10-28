# MySQL 설정 가이드

AI카 웹사이트를 MySQL 데이터베이스와 연동하기 위한 설정 가이드입니다.

## 1. MySQL 설치

Windows에서 MySQL 설치:
1. [MySQL 공식 사이트](https://dev.mysql.com/downloads/mysql/)에서 MySQL 다운로드
2. 설치 후 MySQL 서버 시작

MySQL 설치 확인:
```bash
mysql --version
```

## 2. 데이터베이스 생성

### 방법 1: SQL 파일 실행
```bash
mysql -u root -p < .sql_database_setup.sql
```

### 방법 2: 수동 생성
MySQL에 접속:
```bash
mysql -u root -p
```

데이터베이스 생성:
```sql
CREATE DATABASE aicar_db;
```

데이터베이스 선택:
```sql
USE aicar_db;
```

## 3. 연결 설정 수정

`config/db.js` 파일에서 MySQL 연결 정보를 수정하세요:

```javascript
const dbConfig = {
    host: 'localhost',        // MySQL 호스트 주소
    user: 'root',             // MySQL 사용자명 (기본: root)
    password: '',              // MySQL 비밀번호 (설치 시 설정한 비밀번호)
    database: 'aicar_db',     // 데이터베이스 이름
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
```

### 비밀번호 설정 방법

MySQL에 root 계정 비밀번호 설정:
```bash
mysql -u root -p
```

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### 4. .env 파일 설정

`.env` 파일을 생성하고 MySQL 연결 정보를 입력하세요:

```bash
# .env 파일 내용
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_DATABASE=aicar_db
```

## 5. 서버 실행

MySQL 서버가 실행 중인지 확인한 후:

```bash
npm start
```

서버가 실행되면 자동으로 테이블이 생성됩니다:
- ✅ 데이터베이스 테이블이 초기화되었습니다.

## 5. 문제 해결

### "Access denied" 오류
- MySQL 비밀번호가 잘못되었습니다
- `.env` 파일에서 비밀번호 확인

### "Unknown database" 오류
- 데이터베이스가 생성되지 않았습니다
- 위의 "데이터베이스 생성" 단계를 수행하세요

### "Can't connect to MySQL server" 오류
- MySQL 서버가 실행되지 않았습니다
- Windows 서비스에서 MySQL을 시작하세요

### Windows 서비스에서 MySQL 시작
1. Win + R 키를 누르고 `services.msc` 입력
2. "MySQL" 서비스 찾기
3. 우클릭 → 시작

## 6. 기존 SQLite 데이터 마이그레이션 (선택사항)

SQLite에서 MySQL로 데이터를 옮기려면:

```bash
# SQLite 데이터베이스를 확인
sqlite3 aicar.db ".dump" > export.sql

# MySQL로 가져오기
mysql -u root -p aicar_db < export.sql
```

## 참고

- 테이블은 자동으로 생성되므로 수동으로 만들 필요가 없습니다
- 데이터베이스 이름은 기본적으로 `aicar_db`입니다
- 서버 실행 시 자동으로 필요한 테이블들이 생성됩니다

