const mysql = require('mysql2/promise');

// 환경 변수에서 데이터베이스 연결 설정 가져오기
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'aicar_db',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0
};

// 데이터베이스가 없으면 자동 생성
async function ensureDatabase() {
    try {
        // 데이터베이스 이름을 제외한 연결로 데이터베이스 생성
        const dbName = dbConfig.database;
        const tempConfig = { ...dbConfig };
        delete tempConfig.database;
        
        const tempPool = mysql.createPool(tempConfig);
        await tempPool.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await tempPool.end();
        console.log(`✅ 데이터베이스 '${dbName}' 확인 완료`);
    } catch (error) {
        console.error('⚠️ 데이터베이스 자동 생성 오류:', error.message);
        console.log('💡 데이터베이스를 수동으로 생성해주세요:');
        console.log(`   CREATE DATABASE ${dbConfig.database};`);
    }
}

// 연결 풀 생성
const pool = mysql.createPool(dbConfig);

// 데이터베이스가 존재하는지 확인하고 없으면 생성
ensureDatabase();

// 테이블 생성 함수
async function initTables() {
    try {
        const connection = await pool.getConnection();
        
        // users 테이블
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // posts 테이블
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                username VARCHAR(50) NOT NULL,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        // comments 테이블
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                username VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        connection.release();
        console.log('✅ 데이터베이스 테이블이 준비되었습니다.');
    } catch (error) {
        console.error('❌ 테이블 생성 오류:', error.message);
        console.log('💡 MySQL 서버가 실행 중인지, 데이터베이스가 생성되었는지 확인해주세요.');
    }
}

// 약간의 지연 후 테이블 초기화 (데이터베이스 생성 후)
setTimeout(() => {
    initTables();
}, 1000);

module.exports = pool;

