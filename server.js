require('dotenv').config(); // <-- ADICIONE ESTA LINHA
const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

  const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'biblioteca',
  port: process.env.DB_PORT || 3306,
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10
});
// ---------- DASHBOARD ----------
app.get('/api/dashboard', async (req, res) => {
  try {
    const [[{ totalLivros }]] = await db.query('SELECT COUNT(*) AS totalLivros FROM livros');
    const [[{ totalAlunos }]] = await db.query('SELECT COUNT(*) AS totalAlunos FROM alunos');
    const [[{ ativos }]]     = await db.query("SELECT COUNT(*) AS ativos FROM emprestimos WHERE status='emprestado'");
    const [[{ atrasados }]]  = await db.query("SELECT COUNT(*) AS atrasados FROM emprestimos WHERE status='emprestado' AND data_prevista < CURDATE()");
    const [[{ devolvidos }]] = await db.query("SELECT COUNT(*) AS devolvidos FROM emprestimos WHERE status='devolvido'");
    const [recentes] = await db.query(`
      SELECT e.*, l.titulo, a.nome AS aluno_nome
      FROM emprestimos e
      JOIN livros l ON l.id = e.livro_id
      JOIN alunos a ON a.id = e.aluno_id
      ORDER BY e.id DESC LIMIT 6`);
    res.json({ totalLivros, totalAlunos, ativos, atrasados, devolvidos, recentes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- LIVROS ----------
app.get('/api/livros', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM livros ORDER BY titulo');
  res.json(rows);
});

app.post('/api/livros', async (req, res) => {
  const { titulo, autor, isbn, editora, ano, genero, quantidade, capa_url } = req.body;
  const q = Number(quantidade) || 1;
  const [r] = await db.query(
    `INSERT INTO livros (titulo,autor,isbn,editora,ano,genero,quantidade,disponiveis,capa_url)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [titulo, autor, isbn, editora, ano, genero, q, q, capa_url]
  );
  res.json({ id: r.insertId });
});

app.put('/api/livros/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, autor, isbn, editora, ano, genero, quantidade, capa_url } = req.body;
  const [[livro]] = await db.query('SELECT * FROM livros WHERE id=?', [id]);
  if (!livro) return res.status(404).json({ error: 'Livro não encontrado' });
  const emprestados = livro.quantidade - livro.disponiveis;
  const novaQtd = Number(quantidade) || 1;
  
  if (novaQtd < emprestados) return res.status(400).json({ error: 'Quantidade menor que livros emprestados' });
  
  await db.query(
    `UPDATE livros SET titulo=?,autor=?,isbn=?,editora=?,ano=?,genero=?,quantidade=?,disponiveis=?,capa_url=?
     WHERE id=?`,
    [titulo, autor, isbn, editora, ano, genero, novaQtd, novaQtd - emprestados, capa_url, id]
  );
  res.json({ ok: true });
});

app.delete('/api/livros/:id', async (req, res) => {
  await db.query('DELETE FROM livros WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- ALUNOS ----------
app.get('/api/alunos', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM alunos ORDER BY nome');
  res.json(rows);
});

app.post('/api/alunos', async (req, res) => {
  const { nome, matricula, email, telefone, serie } = req.body;
  try {
    // A senha padrão será a própria matrícula
    const [r] = await db.query(
      'INSERT INTO alunos (nome,matricula,email,telefone,serie, senha) VALUES (?,?,?,?,?,?)',
      [nome, matricula, email, telefone, serie, matricula] 
    );
    res.json({ id: r.insertId });
  } catch (e) { res.status(400).json({ error: 'Matrícula já existe' }); }
});

app.put('/api/alunos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, matricula, email, telefone, serie } = req.body;
  await db.query(
    'UPDATE alunos SET nome=?,matricula=?,email=?,telefone=?,serie=? WHERE id=?',
    [nome, matricula, email, telefone, serie, id]
  );
  res.json({ ok: true });
});

app.delete('/api/alunos/:id', async (req, res) => {
  await db.query('DELETE FROM alunos WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- EMPRÉSTIMOS ----------
app.get('/api/emprestimos', async (req, res) => {
  const [rows] = await db.query(`
    SELECT e.*, l.titulo, a.nome AS aluno_nome, a.matricula
    FROM emprestimos e
    JOIN livros l ON l.id = e.livro_id
    JOIN alunos a ON a.id = e.aluno_id
    ORDER BY e.id DESC`);
  res.json(rows);
});

app.post('/api/emprestimos', async (req, res) => {
  const { livro_id, aluno_id, data_prevista } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[livro]] = await conn.query('SELECT disponiveis FROM livros WHERE id=?', [livro_id]);
    if (!livro || livro.disponiveis < 1) throw new Error('Livro indisponível');
    
    await conn.query(
      `INSERT INTO emprestimos (livro_id,aluno_id,data_emprestimo,data_prevista,status, aviso_emprestimo)
       VALUES (?,?,CURDATE(),?, 'emprestado', 1)`,
      [livro_id, aluno_id, data_prevista]
    );
    
    await conn.query('UPDATE livros SET disponiveis = disponiveis - 1 WHERE id=?', [livro_id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ error: e.message });
  } finally { conn.release(); }
});

app.put('/api/emprestimos/:id/devolver', async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[emp]] = await conn.query('SELECT * FROM emprestimos WHERE id=?', [id]);
    if (!emp || emp.status === 'devolvido') throw new Error('Empréstimo inválido');
    await conn.query(
      "UPDATE emprestimos SET data_devolucao = CURDATE(), status='devolvido' WHERE id=?",
      [id]
    );
    await conn.query('UPDATE livros SET disponiveis = disponiveis + 1 WHERE id=?', [emp.livro_id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ error: e.message });
  } finally { conn.release(); }
});

// ---------- LOGIN DO ALUNO ----------
app.post('/api/login-aluno', async (req, res) => {
  const { matricula, senha } = req.body;
  try {
    const [[aluno]] = await db.query(
      'SELECT id, nome, matricula, serie, email FROM alunos WHERE matricula=? AND senha=?',
      [matricula, senha]
    );
    
    if (!aluno) return res.status(401).json({ error: 'Matrícula ou senha incorretos' });
    
    res.json(aluno);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- RENOVAR EMPRÉSTIMO ----------
app.put('/api/emprestimos/:id/renovar', async (req, res) => {
  const { id } = req.params;
  try {
    const [[emp]] = await db.query('SELECT * FROM emprestimos WHERE id=?', [id]);
    
    if (!emp || emp.status === 'devolvido') {
      return res.status(400).json({ error: 'Empréstimo inválido ou já devolvido' });
    }
    
    if (emp.renovacoes >= 1) {
      return res.status(400).json({ error: 'Limite de renovações atingido (máximo de 1 vez)' });
    }

    const hoje = new Date().toISOString().slice(0, 10);
    const baseDate = emp.data_prevista < hoje ? hoje : emp.data_prevista;
    
    const novaData = new Date(baseDate);
    novaData.setDate(novaData.getDate() + 7);
    const novaDataStr = novaData.toISOString().slice(0, 10);

        await db.query(
      'UPDATE emprestimos SET data_prevista=?, renovacoes = renovacoes + 1, aviso_renovacao = 1 WHERE id=?', 
      [novaDataStr, id]
    );
    
    res.json({ ok: true, novaData: novaDataStr });
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});


// ---------- NOTIFICAÇÕES ----------
app.get('/api/notificacoes', async (req, res) => {
  const [rows] = await db.query(`
    SELECT e.id, l.titulo, a.nome AS aluno_nome, e.aviso_emprestimo, e.aviso_renovacao
    FROM emprestimos e
    JOIN livros l ON l.id = e.livro_id
    JOIN alunos a ON a.id = e.aluno_id
    WHERE e.aviso_emprestimo = 1 OR e.aviso_renovacao = 1
    ORDER BY e.id DESC
  `);
  res.json(rows);
});

app.put('/api/notificacoes/ler', async (req, res) => {
  await db.query('UPDATE emprestimos SET aviso_emprestimo = 0, aviso_renovacao = 0 WHERE aviso_emprestimo = 1 OR aviso_renovacao = 1');
  res.json({ ok: true });
});

app.listen(3000, () => console.log('✅ http://localhost:3000'));