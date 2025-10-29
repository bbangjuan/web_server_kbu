const { pool, ensureTablesReady } = require('../config/db');

// 회원가입
async function createUser(username, email, password) {
    // 테이블이 준비될 때까지 대기
    const ready = await ensureTablesReady();
    if (!ready) {
        throw new Error('데이터베이스 테이블이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
    }
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword]
        );
        
        return result.rows[0].id;
    } catch (error) {
        // 에러를 다시 던져서 상위에서 처리하도록
        throw error;
    }
}

// 사용자명으로 사용자 조회
async function findByUsername(username) {
    const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
    );
    return result.rows[0] || null;
}

// 이메일로 사용자 조회
async function findByEmail(email) {
    const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );
    return result.rows[0] || null;
}

// 비밀번호 확인
async function comparePassword(password, hashedPassword) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, hashedPassword);
}

module.exports = {
    createUser,
    findByUsername,
    findByEmail,
    comparePassword
};
