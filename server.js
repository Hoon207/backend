// Express 및 필요한 모듈 불러오기
const express = require('express');
const cors = require('cors'); // CORS 허용을 위한 미들웨어
const mysql = require('mysql'); // MySQL DB 연결을 위한 모듈
const bcrypt = require('bcrypt'); // 비밀번호 암호화를 위한 모듈 (오타: bcrypt가 맞음)
const SECRET_KEY = 'test'; // JWT 토큰 발급에 사용할 비밀 키
const jwt = require('jsonwebtoken'); // JWT 토큰 생성을 위한 모듈
const app = express();
const port = 9000; // 백엔드 서버가 실행될 포트 번호

// 미들웨어 등록
app.use(cors()); // 모든 도메인에서 요청 허용
app.use(express.json()); // JSON 형식의 요청 본문 파싱

// MySQL DB 연결 설정
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'kdt'
});

// MySQL 연결 시도 및 서버 실행
connection.connect((error) => {
  if (error) {
    console.error('MySQL 연결 실패:', error);
    return;
  }
  console.log('MySQL 연결 성공');
  app.listen(port, () => {
    console.log(`서버 실행 중... 포트: ${port}`);
  });
});
//로그인1
//포스트방식으로 전달받은 데이터를 db에 조회하여 결과값을 리턴함
app.post('/login', (req, res) => {
  const {username, password} = req.body;
  connection.query('SELECT * FROM users WHERE username = ?', [username], async(err, result) => {
    if(err || result.length === 0) {
      return res.status(400).json({success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.'});
    }
  
    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      return res.status(401).json({success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.'});
    }
    const token = jwt.sign({id: user.id, username:user.name}, SECRET_KEY, {expiresIn: '1h'});
    res.json({ success: true, token, user: {id: user.id, username: user.username}});   
  });
});

//로그인2
//포스트방식으로 전달받은 데이터를 db에 조회하여 결과값을 리턴함
app.post('/login2', (req, res)=>{
  const{ username, password} = req.body;
  connection.query('SELECT * FROM users2 WHERE username= ?',
    [username], async(err, result)=>{
      if(err || result.length ===0){
        return res.status(400).json({success:false, message: '아이디 또는 비밀번호가 잘못되었습니다.'});
      }
      const user = result[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if(!isMatch){return res.status(401).json({success:false, message: '아이디 또는 비밀번호가 잘못되었습니다.'});}
      // 비밀번호가 일치하면 JWT 토큰을 생성
      const token = jwt.sign({id:user.id, username:user.username}, SECRET_KEY, {expiresIn: '1h'});  
      res.json({success:true, token, user:{id:user.id,
        username: username,password:password}});
    });
})

//회원가입2
//register2.js에서 넘겨받은 회원가입 정보를 sql에 입력하여 추가
app.post('/register2', async (req,res)=>{
  const {username, password, email,tel} = req.body;
  const hash = await bcrypt.hash(password, 10);
  connection.query(
    'INSERT INTO users2 (username, password,email, tel) VALUES (?, ?, ?, ?)',
    [username, hash, email, tel], (err) => {
      if(err) {
        if(err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: '이미 존재하는 아이디입니다.' });
        }
        return res.status(500).json({ success: false, message: '회원가입 실패' });
      }
      res.json({ success: true });
      }
    );
});

//회원가입1
//register.js 에서 넘겨받은 username, password 를 sql db에 입력하여 추가한다
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
 const hash = await bcrypt.hash(password, 10); // 비밀번호 해싱
  connection.query(
    'INSERT INTO users (username, password) VALUES (?, ?)',
  [username, hash], (err)=>{if(err) {
    if(err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '이미 존재하는 아이디입니다.' });
    }return res.status(500).json({ success: false, message: '회원가입 실패' });
  }
res.json({success:true})}
)
});


// ========== [goods] CRUD ========== //

// CREATE - 상품 추가
app.post('/goods', (req, res) => {
  const { g_name, g_cost } = req.body;
  if (!g_name || !g_cost) {
    return res.status(400).json({ error: '필수 항목 누락' });
  }
  connection.query(
    'INSERT INTO goods (g_name, g_cost) VALUES (?, ?)',
    [g_name, g_cost],
    (err, result) => {
      if (err) return res.status(500).json({ error: '등록 실패' });
      res.json({ success: true, g_code: result.insertId });
    }
  );
});

// READ - 전체 상품 조회
app.get('/goods', (req, res) => {
  connection.query('SELECT * FROM goods ORDER BY g_code DESC', (err, results) => {
    if (err) return res.status(500).json({ error: '조회 실패' });
    res.json(results);
  });
});

// READ - 특정 상품 조회
app.get('/goods/:g_code', (req, res) => {
  connection.query(
    'SELECT * FROM goods WHERE g_code = ?',
    [req.params.g_code],
    (err, results) => {
      if (err) return res.status(500).json({ error: '조회 실패' });
      if (results.length === 0) return res.status(404).json({ error: '상품 없음' });
      res.json(results[0]);
    }
  );
});

// UPDATE - 상품 수정
app.put('/goods/update/:g_code', (req, res) => {
  const { g_name, g_cost } = req.body;
  connection.query(
    'UPDATE goods SET g_name = ?, g_cost = ? WHERE g_code = ?',
    [g_name, g_cost, req.params.g_code],
    (err) => {
      if (err) return res.status(500).json({ error: '수정 실패' });
      res.json({ success: true });
    }
  );
});

// DELETE - 상품 삭제
app.delete('/goods/:g_code', (req, res) => {
  connection.query(
    'DELETE FROM goods WHERE g_code = ?',
    [req.params.g_code],
    (err) => {
      if (err) return res.status(500).json({ error: '삭제 실패' });
      res.json({ success: true });
    }
  );
});

// ========== [book_store] CRUD ========== //

// CREATE - 책방 정보 추가
app.post('/books', (req, res) => {
  const { NAME, ARENA1, ARENA2, ARENA3, BOOK_CNT, OWNER_NM, TEL_NUM } = req.body;
  if (!NAME || !ARENA1 || !BOOK_CNT || !OWNER_NM) {
    return res.status(400).json({ error: '필수 항목 누락' });
  }
  connection.query(
    `INSERT INTO book_store 
     (NAME, ARENA1, ARENA2, ARENA3, BOOK_CNT, OWNER_NM, TEL_NUM) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [NAME, ARENA1, ARENA2, ARENA3, BOOK_CNT, OWNER_NM, TEL_NUM],
    (err, result) => {
      if (err) return res.status(500).json({ error: '등록 실패' });
      res.json({ success: true, insertId: result.insertId });
    }
  );
});

// READ - 책방 전체 목록 조회
app.get('/books', (req, res) => {
  connection.query('SELECT * FROM book_store', (err, results) => {
    if (err) return res.status(500).json({ error: '조회 실패' });
    res.json(results);
  });
});

// UPDATE - 책방 정보 수정
app.put('/books/update/:CODE', (req, res) => {
  const { NAME, ARENA1, ARENA2, ARENA3, BOOK_CNT, OWNER_NM, TEL_NUM } = req.body;
  connection.query(
    `UPDATE book_store SET NAME = ?, ARENA1 = ?, ARENA2 = ?, ARENA3 = ?, BOOK_CNT = ?, OWNER_NM = ?, TEL_NUM = ? WHERE CODE = ?`,
    [NAME, ARENA1, ARENA2, ARENA3, BOOK_CNT, OWNER_NM, TEL_NUM, req.params.CODE],
    (err) => {
      if (err) return res.status(500).json({ error: '수정 실패' });
      res.json({ success: true });
    }
  );
});

// DELETE - 책방 삭제
app.delete('/books/:CODE', (req, res) => {
  connection.query(
    'DELETE FROM book_store WHERE CODE = ?',
    [req.params.CODE],
    (err) => {
      if (err) return res.status(500).json({ error: '삭제 실패' });
      res.json({ success: true });
    }
  );
});

// ========== [fruit] CRUD ========== //

// CREATE - 과일 등록
app.post('/fruit', (req, res) => {
  const { name, price, country, color } = req.body;
  if (!name || !price || !country || !color) {
    return res.status(400).json({ error: '필수 항목 누락' });
  }
  connection.query(
    'INSERT INTO fruit (name, price, color, country) VALUES (?, ?, ?, ?)',
    [name, price, color, country],
    (err, result) => {
      if (err) return res.status(500).json({ error: '등록 실패' });
      res.json({ success: true, num: result.insertId });
    }
  );
});

// READ - 전체 과일 조회
app.get('/fruit', (req, res) => {
  connection.query('SELECT * FROM fruit ORDER BY num DESC', (err, results) => {
    if (err) return res.status(500).json({ error: '조회 실패' });
    res.json(results);
  });
});

// READ - 특정 과일 조회
app.get('/fruit/:num', (req, res) => {
  connection.query(
    'SELECT * FROM fruit WHERE num = ?',
    [req.params.num],
    (err, results) => {
      if (err) return res.status(500).json({ error: '조회 실패' });
      if (results.length === 0) return res.status(404).json({ error: '상품 없음' });
      res.json(results[0]);
    }
  );
});

// UPDATE - 과일 정보 수정
app.put('/fruit/update/:num', (req, res) => {
  const { name, price } = req.body;
  connection.query(
    'UPDATE fruit SET name = ?, price = ? WHERE num = ?',
    [name, price, req.params.num],
    (err) => {
      if (err) return res.status(500).json({ error: '수정 실패' });
      res.json({ success: true });
    }
  );
});

// DELETE - 과일 삭제
app.delete('/fruit/:num', (req, res) => {
  connection.query(
    'DELETE FROM fruit WHERE num = ?',
    [req.params.num],
    (err) => {
      if (err) return res.status(500).json({ error: '삭제 실패' });
      res.json({ success: true });
    }
  );
});

// ========== [question] 등록 ========== //

// CREATE - 질문 등록
app.post('/question', (req, res) => {
  const { name, tel, email, text } = req.body;
  if (!name || !tel || !email || !text) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
  }

  connection.query(
    'INSERT INTO question (name, tel, email, text) VALUES (?, ?, ?, ?)',
    [name, tel, email, text],
    (err, result) => {
      if (err) {
        console.log('등록 오류:', err);
        return res.status(500).json({ error: '데이터 입력 오류' });
      }
      res.status(200).json({ message: '질문 등록 완료', insertId: result.insertId });
    }
  );
});