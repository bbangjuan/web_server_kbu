const pool = require('../config/db');

// 회원가입
async function createUser(username, email, password) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
        [username, email, hashedPassword]
    );
    
    return result.rows[0].id;
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
