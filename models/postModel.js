const pool = require('../config/db');

// 게시글 작성
async function createPost(userId, username, title, content) {
    const result = await pool.query(
        'INSERT INTO posts (user_id, username, title, content) VALUES ($1, $2, $3, $4) RETURNING id',
        [userId, username, title, content]
    );
    return result.rows[0].id;
}

// 모든 게시글 조회
async function getAllPosts() {
    const result = await pool.query(
        'SELECT * FROM posts ORDER BY created_at DESC'
    );
    return result.rows;
}

// 게시글 ID로 조회
async function getPostById(postId) {
    const result = await pool.query(
        'SELECT * FROM posts WHERE id = $1',
        [postId]
    );
    return result.rows[0] || null;
}

// 사용자 ID로 게시글 조회
async function getPostsByUserId(userId) {
    const result = await pool.query(
        'SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
    );
    return result.rows;
}

module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    getPostsByUserId
};
