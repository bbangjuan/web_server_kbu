const pool = require('../config/db');

// 회원가입
async function createUser(username, email, password) {
    return new Promise(async (resolve, reject) => {
        try {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const connection = await pool.getConnection();
            const [result] = await connection.execute(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPassword]
            );
            connection.release();
            
            resolve(result.insertId);
        } catch (error) {
            reject(error);
        }
    });
}

// 사용자명으로 사용자 조회
async function findByUsername(username) {
    return new Promise(async (resolve, reject) => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            resolve(rows[0] || null);
        } catch (error) {
            reject(error);
        }
    });
}

// 이메일로 사용자 조회
async function findByEmail(email) {
    return new Promise(async (resolve, reject) => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            resolve(rows[0] || null);
        } catch (error) {
            reject(error);
        }
    });
}

// 비밀번호 확인
async function comparePassword(password, hashedPassword) {
    return new Promise(async (resolve, reject) => {
        try {
            const bcrypt = require('bcryptjs');
            const result = await bcrypt.compare(password, hashedPassword);
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    createUser,
    findByUsername,
    findByEmail,
    comparePassword
};
