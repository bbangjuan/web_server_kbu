// 환경 변수 로드
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const userModel = require('./models/userModel');
const postModel = require('./models/postModel');
const commentModel = require('./models/commentModel');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('.'));

// 세션 설정
app.use(session({
    secret: process.env.SESSION_SECRET || 'aicar-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24시간
}));

// 인증 미들웨어
function requireLogin(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: '로그인이 필요합니다.' });
    }
}

// ==================== API 라우트 ====================

// 회원가입
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });
    }

    try {
        await userModel.createUser(username, email, password);
        res.json({ success: true, message: '회원가입이 완료되었습니다.' });
    } catch (error) {
        // PostgreSQL 에러 코드 처리
        if (error.code === '23505') { // unique constraint violation
            return res.status(400).json({ error: '이미 존재하는 사용자명 또는 이메일입니다.' });
        }
        if (error.code === '42P01') { // table does not exist
            return res.status(503).json({ error: '데이터베이스 테이블이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.' });
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return res.status(503).json({ error: '데이터베이스에 연결할 수 없습니다. 데이터베이스 설정을 확인해주세요.' });
        }
        if (error.code === '28P01') { // invalid password
            return res.status(503).json({ error: '데이터베이스 인증 오류가 발생했습니다. 데이터베이스 설정을 확인해주세요.' });
        }
        if (error.code === '3D000') { // database does not exist
            return res.status(503).json({ error: '데이터베이스를 찾을 수 없습니다. 데이터베이스 이름을 확인해주세요.' });
        }
        
        // 다른 에러들
        console.error('='.repeat(50));
        console.error('회원가입 오류 상세 정보:');
        console.error('에러 코드:', error.code);
        console.error('에러 메시지:', error.message);
        console.error('에러 상세:', error.detail || 'N/A');
        console.error('제약 조건:', error.constraint || 'N/A');
        console.error('에러 스택:', error.stack);
        console.error('='.repeat(50));
        
        // 사용자에게 보여줄 메시지 결정
        let errorMessage = '서버 오류가 발생했습니다.';
        
        if (error.message) {
            // 일반적인 데이터베이스 오류 메시지 필터링
            if (error.message.includes('테이블') || error.message.includes('table')) {
                errorMessage = '데이터베이스 테이블 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            } else if (error.message.includes('연결') || error.message.includes('connection')) {
                errorMessage = '데이터베이스 연결 오류가 발생했습니다.';
            } else {
                // 개발 환경에서만 상세 메시지 표시
                errorMessage = process.env.NODE_ENV === 'development' 
                    ? error.message 
                    : '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
});

// 로그인
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '사용자명과 비밀번호를 입력해주세요.' });
    }

    try {
        const user = await userModel.findByUsername(username);
        
        if (!user) {
            return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
        }

        const validPassword = await userModel.comparePassword(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ success: true, username: user.username, message: '로그인 성공' });
    } catch (error) {
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 로그아웃
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: '로그아웃되었습니다.' });
});

// 현재 사용자 정보
app.get('/api/user', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, username: req.session.username, userId: req.session.userId });
    } else {
        res.json({ loggedIn: false });
    }
});

// 게시글 작성
app.post('/api/posts', requireLogin, async (req, res) => {
    const { title, content } = req.body;
    const userId = req.session.userId;
    const username = req.session.username;

    if (!title || !content) {
        return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
    }

    try {
        const postId = await postModel.createPost(userId, username, title, content);
        res.json({ success: true, postId, message: '게시글이 작성되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: '게시글 작성에 실패했습니다.' });
    }
});

// 게시글 목록
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await postModel.getAllPosts();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: '게시글을 불러올 수 없습니다.' });
    }
});

// 게시글 조회
app.get('/api/posts/:id', async (req, res) => {
    const postId = req.params.id;
    try {
        const post = await postModel.getPostById(postId);
        if (!post) {
            return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: '게시글을 불러올 수 없습니다.' });
    }
});

// 댓글 작성
app.post('/api/posts/:id/comments', requireLogin, async (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;
    const userId = req.session.userId;
    const username = req.session.username;

    if (!content) {
        return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
    }

    try {
        await commentModel.createComment(postId, userId, username, content);
        res.json({ success: true, message: '댓글이 작성되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: '댓글 작성에 실패했습니다.' });
    }
});

// 댓글 조회
app.get('/api/posts/:id/comments', async (req, res) => {
    const postId = req.params.id;
    try {
        const comments = await commentModel.getCommentsByPostId(postId);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: '댓글을 불러올 수 없습니다.' });
    }
});

// 서버 시작 전 테이블 초기화 대기 (Render 배포 환경 고려)
const { waitForTablesReady } = require('./config/db');

// 헬스 체크 엔드포인트 추가 (Render에서 사용)
app.get('/health', async (req, res) => {
    try {
        const { pool, tablesReady } = require('./config/db');
        await pool.query('SELECT 1');
        const ready = tablesReady(); // 함수 호출
        res.status(ready ? 200 : 503).json({ 
            status: ready ? 'healthy' : 'initializing',
            tablesReady: ready 
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'unhealthy',
            error: error.message 
        });
    }
});

// 서버 시작 (Render 호환)
async function startServer() {
    // Render 환경에서는 테이블 초기화 완료까지 최대 10초 대기
    const isRender = process.env.RENDER || process.env.NODE_ENV === 'production';
    
    if (isRender) {
        console.log('🔧 Render 배포 환경 감지 - 테이블 초기화 완료까지 대기 중...');
        const { tablesReady: getTablesReady } = require('./config/db');
        const maxWaitTime = 10000; // 10초
        const startTime = Date.now();
        
        while (!getTablesReady() && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (getTablesReady()) {
            console.log('✅ 테이블 초기화 완료 - 서버 시작');
        } else {
            console.log('⚠️ 테이블 초기화 대기 시간 초과 - 서버 시작 (나중에 자동 재시도됨)');
        }
    }
    
    const server = app.listen(PORT, '0.0.0.0', () => {
        const { tablesReady: getTablesReady } = require('./config/db');
        console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
        console.log(`📡 http://localhost:${PORT}`);
        if (getTablesReady()) {
            console.log(`💾 PostgreSQL 데이터베이스 준비 완료`);
        } else {
            console.log(`💾 PostgreSQL 데이터베이스 연결 대기 중...`);
        }
    });
    
    return server;
}

const server = startServer();
