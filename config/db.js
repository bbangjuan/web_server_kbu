const { Pool } = require('pg');

// DATABASE_URL이 있으면 파싱해서 사용, 없으면 개별 변수 사용
let dbConfig;

if (process.env.DATABASE_URL) {
    // DATABASE_URL 파싱: postgres://user:password@host:port/database
    const dbUrl = new URL(process.env.DATABASE_URL);
    dbConfig = {
        host: dbUrl.hostname,
        port: parseInt(dbUrl.port) || 5432,
        user: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.substring(1), // 첫 번째 '/' 제거
        ssl: process.env.DB_SSL === 'true' || dbUrl.searchParams.get('sslmode') === 'require' 
            ? { rejectUnauthorized: false } 
            : false,
    };
    console.log('📦 DATABASE_URL을 사용하여 연결합니다.');
} else {
    // 개별 환경 변수 사용
    dbConfig = {
        host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
        user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
        password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || '',
        database: process.env.DB_DATABASE || process.env.POSTGRES_DATABASE || 'aicar_db',
        port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || 5432),
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
    
    // Render 외부 호스트인 경우 자동으로 .render.com 추가
    if (dbConfig.host && dbConfig.host.startsWith('dpg-') && !dbConfig.host.includes('.')) {
        dbConfig.host = `${dbConfig.host}.render.com`;
        console.log('🔧 Render 호스트 자동 수정:', dbConfig.host);
    }
    
    console.log('📦 개별 환경 변수를 사용하여 연결합니다.');
}

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

// 테이블 준비 상태 플래그
let tablesReady = false;

// 테이블 생성 함수
async function initTables() {
    try {
        // 연결 확인
        const connectionTest = await pool.query('SELECT NOW()');
        console.log('✅ 데이터베이스 연결 성공:', connectionTest.rows[0].now);
        
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
        
        tablesReady = true;
        console.log('✅ 데이터베이스 테이블이 준비되었습니다.');
    } catch (error) {
        console.error('❌ 테이블 생성 오류:', error.message);
        console.error('오류 코드:', error.code);
        
        // 연결 오류인 경우 더 자세한 정보 제공
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.error('');
            console.error('💡 해결 방법:');
            console.error('   1. 로컬 개발: .env 파일에서 다음과 같이 설정하세요:');
            console.error('      DB_HOST=localhost');
            console.error('      DB_USER=postgres');
            console.error('      DB_PASSWORD=your_password');
            console.error('      DB_DATABASE=aicar_db');
            console.error('      DB_SSL=false');
            console.error('');
            console.error('   2. Render 외부 연결: Render 대시보드에서 "External Database URL"을 확인하세요.');
            console.error('      예: postgres://user:pass@host.render.com:5432/db');
            console.error('');
            console.error('   3. 로컬 PostgreSQL 확인:');
            console.error('      - PostgreSQL이 설치되어 있고 실행 중인지 확인');
            console.error('      - 데이터베이스가 생성되어 있는지 확인');
        }
        console.error('오류 상세:', error);
    }
}

// 서버 시작 시 즉시 테이블 초기화 시도
let initTablesPromise = null;

async function initializeTables() {
    if (initTablesPromise) {
        return initTablesPromise;
    }
    
    initTablesPromise = (async () => {
        try {
            await initTables();
        } catch (err) {
            console.error('테이블 초기화 실패:', err);
            // 실패해도 계속 시도할 수 있도록 플래그 리셋
            initTablesPromise = null;
            throw err;
        }
        return tablesReady;
    })();
    
    return initTablesPromise;
}

// 서버 시작 시 즉시 테이블 초기화
initializeTables().catch(() => {
    // 에러는 이미 initTables에서 로그되었음
});

// 테이블 준비 상태 확인 함수
async function ensureTablesReady() {
    if (tablesReady) return true;
    
    // 최대 10초간 대기 (더 긴 대기 시간)
    for (let i = 0; i < 100; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (tablesReady) return true;
    }
    
    // 여전히 준비되지 않았다면 테이블 존재 여부 직접 확인 및 생성 시도
    try {
        // 먼저 테이블 존재 확인
        const result = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        const tableExists = result.rows[0].exists;
        
        if (tableExists) {
            console.log('✅ users 테이블이 존재합니다. 플래그를 업데이트합니다.');
            tablesReady = true;
            return true;
        } else {
            console.log('⚠️ users 테이블이 존재하지 않습니다. 테이블을 생성합니다...');
            // 테이블이 없으면 직접 생성 시도
            try {
                // initTables 함수 직접 실행
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        username VARCHAR(50) UNIQUE NOT NULL,
                        email VARCHAR(100) UNIQUE NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
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
                
                console.log('✅ 테이블 생성 완료');
                tablesReady = true;
                return true;
            } catch (createError) {
                console.error('❌ 테이블 생성 재시도 실패:', createError.message);
                console.error('오류 코드:', createError.code);
                return false;
            }
        }
    } catch (error) {
        console.error('❌ 테이블 존재 확인 중 오류:', error.message);
        console.error('오류 상세:', error);
        // 연결 오류가 아니면 테이블 생성 다시 시도
        if (error.code !== 'ECONNREFUSED' && error.code !== 'ENOTFOUND') {
            try {
                await initializeTables();
                return tablesReady;
            } catch (createError) {
                return false;
            }
        }
        return false;
    }
}

// 쿼리 헬퍼 함수 (모델에서 사용)
pool.queryWithParams = async (text, params) => {
    try {
        const result = await pool.query(text, params);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

module.exports = { pool, ensureTablesReady, tablesReady: () => tablesReady };
