const { pool, ensureTablesReady } = require('../config/db');

// 회원가입
async function createUser(username, email, password) {
    // 테이블이 준비될 때까지 대기 (더 적극적으로)
    console.log('[createUser] 회원가입 시도 - 테이블 준비 확인 중...');
    
    let ready = await ensureTablesReady();
    
    // 준비되지 않았다면 최대 3번 더 재시도
    if (!ready) {
        console.log('[createUser] 테이블이 준비되지 않음. 재시도 중...');
        for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            ready = await ensureTablesReady();
            if (ready) {
                console.log('[createUser] 재시도 성공 - 테이블 준비 완료');
                break;
            }
        }
    }
    
    if (!ready) {
        console.error('[createUser] ❌ 테이블 준비 실패 - 회원가입 불가');
        const error = new Error('데이터베이스 테이블이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
        error.code = '42P01'; // table does not exist
        throw error;
    }
    
    console.log('[createUser] ✅ 테이블 준비 완료 - 회원가입 진행');
    
    const bcrypt = require('bcryptjs');
    let hashedPassword;
    
    try {
        hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashError) {
        console.error('비밀번호 해싱 오류:', hashError);
        throw new Error('비밀번호 처리 중 오류가 발생했습니다.');
    }
    
    try {
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword]
        );
        
        if (!result || !result.rows || !result.rows[0]) {
            throw new Error('회원가입은 완료되었지만 사용자 ID를 가져올 수 없습니다.');
        }
        
        return result.rows[0].id;
    } catch (error) {
        // PostgreSQL 에러는 그대로 전달
        console.error('사용자 생성 중 데이터베이스 오류:', {
            code: error.code,
            message: error.message,
            detail: error.detail,
            constraint: error.constraint
        });
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
