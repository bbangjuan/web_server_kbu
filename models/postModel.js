const pool = require('../config/db');

// 게시글 작성
async function createPost(userId, username, title, content) {
    return new Promise(async (resolve, reject) => {
        try {
            const [result] = await pool.execute(
                'INSERT INTO posts (user_id, username, title, content) VALUES (?, ?, ?, ?)',
                [userId, username, title, content]
            );
            resolve(result.insertId);
        } catch (error) {
            reject(error);
        }
    });
}

// 모든 게시글 조회
async function getAllPosts() {
    return new Promise(async (resolve, reject) => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM posts ORDER BY created_at DESC'
            );
            resolve(rows);
        } catch (error) {
            reject(error);
        }
    });
}

// 게시글 ID로 조회
async function getPostById(postId) {
    return new Promise(async (resolve, reject) => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM posts WHERE id = ?',
                [postId]
            );
            resolve(rows[0] || null);
        } catch (error) {
            reject(error);
        }
    });
}

// 사용자 ID로 게시글 조회
async function getPostsByUserId(userId) {
    return new Promise(async (resolve, reject) => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
            resolve(rows);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    getPostsByUserId
};
