require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { connect } = require('@tidbcloud/serverless'); // <-- Novo Driver

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conecta ao banco usando a URL do TiDB
const db = connect({ url: process.env.DATABASE_URL });

// ---------- DASHBOARD ----------
app.get('/api/dashboard', async (req, res) => {
  try {
    const [totalLivros] = await db.execute('SELECT COUNT(*) AS total FROM livros');
    const [totalAlunos] = await db.execute('SELECT COUNT(*) AS total FROM alunos');
    const [ativos] = await db.execute("SELECT COUNT(*) AS total FROM emprestimos WHERE status='emprestado'");
    const [atrasados] = await db.execute("SELECT COUNT(*) AS total FROM emprestimos WHERE status='emprestado' AND data_prevista < CURDATE()");
    
    const recentes = await db.execute(`
      SELECT e.*, l.titulo, a.nome AS aluno_nome
      FROM emprestimos e
      JOIN livros l ON l.id = e.livro_id
      JOIN alunos a ON a.id = e.aluno_id
      ORDER BY e.id DESC LIMIT 6`);

    res.json({ 
      totalLivros: totalLivros.total, 
      totalAlunos: totalAlunos.total, 
      ativos: ativos.total, 
      atrasados: atrasados.total, 
      recentes 
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- LIVROS ----------
app.get('/api/livros', async (req, res) => {
  try {
    const rows = await db.execute('SELECT * FROM livros ORDER BY titulo');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/livros', async (req, res) => {
  const { titulo, autor, isbn, editora, ano, genero, quantidade, capa_url } = req.body;
  const q = Number(quantidade) || 1;
  try {
    await db.execute(
      `INSERT INTO livros (titulo,autor,isbn,editora,ano,genero,quantidade,disponiveis,capa_url)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [titulo, autor, isbn, editora, ano, genero, q, q, capa_url]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/livros/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, autor, isbn, editora, ano, genero, quantidade, capa_url } = req.body;
  try {
    const [livro] = await db.execute('SELECT * FROM livros WHERE id=?', [id]);
    if (!livro) return res.status(404).json({ error: 'Livro não encontrado' });
    
    const emprestados = livro.quantidade - livro.disponiveis;
    const novaQtd = Number(quantidade) || 1;
    if (novaQtd < emprestados) return res.status(400).json({ error: 'Quantidade menor que livros emprestados' });
    
    await db.execute(
      `UPDATE livros SET titulo=?,autor=?,isbn=?,editora=?,ano=?,genero=?,quantidade=?,disponiveis=?,capa_url=?
       WHERE id=?`,
      [titulo, autor, isbn, editora, ano, genero, novaQtd, novaQtd - emprestados, capa_url, id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/livros/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM livros WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- ALUNOS ----------
app.get('/api/alunos', async (req, res) => {
  try {
    const rows = await db.execute('SELECT * FROM alunos ORDER BY nome');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/alunos', async (req, res) => {
  const { nome, matricula, email, telefone, serie } = req.body;
  try {
    await db.execute(
      'INSERT INTO alunos (nome,matricula,email,telefone,serie, senha) VALUES (?,?,?,?,?,?)',
      [nome, matricula, email, telefone, serie, matricula] 
    );
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: 'Matrícula já existe' }); }
});

app.put('/api/alunos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, matricula, email, telefone, serie } = req.body;
  try {
    await db.execute(
      'UPDATE alunos SET nome=?,matricula=?,email=?,telefone=?,serie=? WHERE id=?',
      [nome, matricula, email, telefone, serie, id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/alunos/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM alunos WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- EMPRÉSTIMOS ----------
app.get('/api/emprestimos', async (req, res) => {
  try {
    const rows = await db.execute(`
      SELECT e.*, l.titulo, a.nome AS aluno_nome, a.matricula
      FROM emprestimos e
      JOIN livros l ON l.id = e.livro_id
      JOIN alunos a ON a.id = e.aluno_id
      ORDER BY e.id DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/emprestimos', async (req, res) => {
  const { livro_id, aluno_id, data_prevista } = req.body;
  try {
    const [livro] = await db.execute('SELECT disponiveis FROM livros WHERE id=?', [livro_id]);
    if (!livro || livro.disponiveis < 1) throw new Error('Livro indisponível');
    
    await db.execute(
      `INSERT INTO emprestimos (livro_id,aluno_id,data_emprestimo,data_prevista,status, aviso_emprestimo)
       VALUES (?,?,CURDATE(),?, 'emprestado', 1)`,
      [livro_id, aluno_id, data_prevista]
    );
    
    await db.execute('UPDATE livros SET disponiveis = disponiveis - 1 WHERE id=?', [livro_id]);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/emprestimos/:id/devolver', async (req, res) => {
  const { id } = req.params;
  try {
    const [emp] = await db.execute('SELECT * FROM emprestimos WHERE id=?', [id]);
    if (!emp || emp.status === 'devolvido') throw new Error('Empréstimo inválido');
    
    await db.execute("UPDATE emprestimos SET data_devolucao = CURDATE(), status='devolvido' WHERE id=?", [id]);
    await db.execute('UPDATE livros SET disponiveis = disponiveis + 1 WHERE id=?', [emp.livro_id]);
    
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/emprestimos/:id/renovar', async (req, res) => {
  const { id } = req.params;
  try {
    const [emp] = await db.execute('SELECT * FROM emprestimos WHERE id=?', [id]);
    if (!emp || emp.status === 'devolvido') throw new Error('Empréstimo inválido');
    if (emp.renovacoes >= 1) throw new Error('Limite de renovações atingido');

    const hoje = new Date().toISOString().slice(0, 10);
    const baseDate = emp.data_prevista < hoje ? hoje : emp.data_prevista;
    
    const novaData = new Date(baseDate);
    novaData.setDate(novaData.getDate() + 7);
    const novaDataStr = novaData.toISOString().slice(0, 10);

    await db.execute(
      'UPDATE emprestimos SET data_prevista=?, renovacoes = renovacoes + 1, aviso_renovacao = 1 WHERE id=?', 
      [novaDataStr, id]
    );
    res.json({ ok: true, novaData: novaDataStr });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ---------- LOGIN E NOTIFICAÇÕES ----------
app.post('/api/login-aluno', async (req, res) => {
  const { matricula, senha } = req.body;
  try {
    const [aluno] = await db.execute(
      'SELECT id, nome, matricula, serie, email FROM alunos WHERE matricula=? AND senha=?',
      [matricula, senha]
    );
    if (!aluno) return res.status(401).json({ error: 'Matrícula ou senha incorretos' });
    res.json(aluno);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notificacoes', async (req, res) => {
  try {
    const rows = await db.execute(`
      SELECT e.id, l.titulo, a.nome AS aluno_nome, e.aviso_emprestimo, e.aviso_renovacao
      FROM emprestimos e
      JOIN livros l ON l.id = e.livro_id
      JOIN alunos a ON a.id = e.aluno_id
      WHERE e.aviso_emprestimo = 1 OR e.aviso_renovacao = 1
      ORDER BY e.id DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/notificacoes/ler', async (req, res) => {
  try {
    await db.execute('UPDATE emprestimos SET aviso_emprestimo = 0, aviso_renovacao = 0 WHERE aviso_emprestimo = 1 OR aviso_renovacao = 1');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Exporta para a Vercel
module.exports = app;