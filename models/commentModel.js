const pool = require('../config/db');

// 댓글 작성
async function createComment(postId, userId, username, content) {
    return new Promise(async (resolve, reject) => {
        try {
            const [result] = await pool.execute(
                'INSERT INTO comments (post_id, user_id, username, content) VALUES (?, ?, ?, ?)',
                [postId, userId, username, content]
            );
            resolve(result.insertId);
        } catch (error) {
            reject(error);
        }
    });
}

// 게시글의 모든 댓글 조회
async function getCommentsByPostId(postId) {
    return new Promise(async (resolve, reject) => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC',
                [postId]
            );
            resolve(rows);
        } catch (error) {
            reject(error);
        }
    });
}

// 사용자의 모든 댓글 조회
async function getCommentsByUserId(userId) {
    return new Promise(async (resolve, reject) => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM comments WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
            resolve(rows);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    createComment,
    getCommentsByPostId,
    getCommentsByUserId
};
