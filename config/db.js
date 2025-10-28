const { Pool } = require('pg');

// 환경 변수에서 데이터베이스 연결 설정 가져오기
const dbConfig = {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || '',
    database: process.env.DB_DATABASE || process.env.POSTGRES_DATABASE || 'aicar_db',
    port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// PostgreSQL 연결 풀 생성
const pool = new Pool(dbConfig);

// 연결 테스트
pool.on('error', (err) => {
    console.error('❌ PostgreSQL 연결 오류:', err);
});

// 데이터베이스와 연결이 없으면 자동 생성
async function ensureDatabase() {
    try {
        // 테스트 쿼리로 연결 확인
        const result = await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL 데이터베이스 연결 확인:', result.rows[0].now);
    } catch (error) {
        console.error('⚠️ 데이터베이스 연결 오류:', error.message);
        console.log('💡 Render에서는 데이터베이스가 자동으로 생성됩니다.');
    }
}

// 데이터베이스 연결 확인
ensureDatabase();

// 테이블 생성 함수
async function initTables() {
    try {
        // users 테이블
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // posts 테이블
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                username VARCHAR(50) NOT NULL,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        // comments 테이블
        await pool.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                post_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                username VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        console.log('✅ 데이터베이스 테이블이 준비되었습니다.');
    } catch (error) {
        console.error('❌ 테이블 생성 오류:', error.message);
        console.log('💡 데이터베이스 연결을 확인해주세요.');
    }
}

// 약간의 지연 후 테이블 초기화
setTimeout(() => {
    initTables();
}, 1000);

// 쿼리 헬퍼 함수 (모델에서 사용)
pool.queryWithParams = async (text, params) => {
    try {
        const result = await pool.query(text, params);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

module.exports = pool;
