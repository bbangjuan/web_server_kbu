const { pool } = require('../config/db');

// 댓글 작성
async function createComment(postId, userId, username, content) {
    const result = await pool.query(
        'INSERT INTO comments (post_id, user_id, username, content) VALUES ($1, $2, $3, $4) RETURNING id',
        [postId, userId, username, content]
    );
    return result.rows[0].id;
}

// 게시글의 모든 댓글 조회
async function getCommentsByPostId(postId) {
    const result = await pool.query(
        'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC',
        [postId]
    );
    return result.rows;
}

// 사용자의 모든 댓글 조회
async function getCommentsByUserId(userId) {
    const result = await pool.query(
        'SELECT * FROM comments WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
    );
    return result.rows;
}

module.exports = {
    createComment,
    getCommentsByPostId,
    getCommentsByUserId
};
