const API = '/api';
let livrosCache = [], alunosCache = [], emprestimosCache = [];

// ---------- NAVEGAÇÃO ----------
document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click',()=>{
    document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
    item.classList.add('active');
    const page = item.dataset.page;
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-'+page).classList.add('active');
    document.getElementById('page-title').textContent =
      item.querySelector('span').textContent;
    carregarPagina(page);
  });
});

function carregarPagina(page){
  if(page==='dashboard') carregarDashboard();
  if(page==='livros') carregarLivros();
  if(page==='alunos') carregarAlunos();
  if(page==='emprestimos') carregarEmprestimos();
}

const escapeHtml = s => String(s||'').replace(/[&<>"']/g,
  c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ---------- MODAIS ----------
function abrir(id){document.getElementById(id).classList.add('show');}
function fechar(id){document.getElementById(id).classList.remove('show');}

// ---------- DASHBOARD ----------
async function carregarDashboard(){
  const r = await fetch(API+'/dashboard');
  const d = await r.json();
  document.getElementById('stat-livros').textContent = d.totalLivros;
  document.getElementById('stat-alunos').textContent = d.totalAlunos;
  document.getElementById('stat-ativos').textContent = d.ativos;
  document.getElementById('stat-atrasados').textContent = d.atrasados;

  const el = document.getElementById('recentes');
  if(!d.recentes.length){ el.innerHTML='<div class="empty">Sem movimentações ainda</div>'; return;}
  el.innerHTML = d.recentes.map(e=>{
    const status = statusEmprestimo(e);
    return `<div class="recente-item">
      <div class="emoji">📖</div>
      <div style="flex:1">
        <strong>${escapeHtml(e.titulo)}</strong>
        <small>para ${escapeHtml(e.aluno_nome)} · ${formatData(e.data_emprestimo)}</small>
      </div>
      <span class="status ${status.cls}">${status.label}</span>
    </div>`;
  }).join('');
}

// ---------- LIVROS ----------
async function carregarLivros(){
  const r = await fetch(API+'/livros');
  livrosCache = await r.json();
  renderLivros();
}

function renderLivros(){
  const busca = document.getElementById('busca-livros').value.toLowerCase();
  const filtro = document.querySelector('#filtros-livros .chip.active').dataset.filter;
  const grid = document.getElementById('grid-livros');

  const lista = livrosCache.filter(l=>{
    const okBusca = l.titulo.toLowerCase().includes(busca) ||
                    l.autor.toLowerCase().includes(busca);
    let okFiltro = true;
    if(filtro==='disponiveis') okFiltro = l.disponiveis > 0;
    if(filtro==='emprestados') okFiltro = l.disponiveis < l.quantidade;
    return okBusca && okFiltro;
  });

  if(!lista.length){
    grid.innerHTML = '<div class="empty">Nenhum livro encontrado 📚</div>';
    return;
  }

  grid.innerHTML = lista.map(l=>{
    const emprestados = l.quantidade - l.disponiveis;
    const cls = l.disponiveis===0 ? 'todos-emprestados'
              : emprestados>0 ? 'parcial' : 'disponivel';
    const label = l.disponiveis===0 ? 'Indisponível'
                : emprestados>0 ? `${l.disponiveis} disp.` : 'Disponível';
    return `<div class="book-card">
                  <div class="book-cover">
        ${l.capa_url 
          ? `<img src="${l.capa_url}" alt="Capa" onerror="this.style.display='none'; this.parentElement.innerHTML='📕';">` 
          : '📕'}
      </div>
      <div class="book-info">
        <h4>${escapeHtml(l.titulo)}</h4>
        <p class="author">${escapeHtml(l.autor)}</p>
        <div class="book-meta">
          <span class="badge ${cls}">${label}</span>
          <span class="qty">${l.disponiveis}/${l.quantidade}</span>
        </div>
        <div class="book-actions">
          <button onclick="abrirLivro(${l.id})" title="Editar">✏️</button>
          <button onclick="excluirLivro(${l.id})" title="Excluir">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

document.getElementById('busca-livros').addEventListener('input',renderLivros);
document.querySelectorAll('#filtros-livros .chip').forEach(c=>{
  c.addEventListener('click',()=>{
    document.querySelectorAll('#filtros-livros .chip').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    renderLivros();
  });
});

function abrirLivro(id=null){
  const f = document.getElementById('form-livro');
  f.reset();
  document.getElementById('livro-id').value = '';
  document.getElementById('titulo-modal-livro').textContent = 'Novo Livro';
  if(id){
    const l = livrosCache.find(x=>x.id===id);
    if(!l) return;
    document.getElementById('titulo-modal-livro').textContent = 'Editar Livro';
    document.getElementById('livro-id').value = l.id;
    document.getElementById('livro-titulo').value = l.titulo;
    document.getElementById('livro-autor').value = l.autor;
    document.getElementById('livro-genero').value = l.genero||'';
    document.getElementById('livro-ano').value = l.ano||'';
    document.getElementById('livro-editora').value = l.editora||'';
    document.getElementById('livro-isbn').value = l.isbn||'';
    document.getElementById('livro-quantidade').value = l.quantidade;
        document.getElementById('livro-isbn').value = l.isbn||'';
    document.getElementById('livro-capa').value = l.capa_url||''; // <-- ADICIONE AQUI
    document.getElementById('livro-quantidade').value = l.quantidade;
  }
  abrir('modal-livro');
}

document.getElementById('form-livro').addEventListener('submit', async e=>{
  e.preventDefault();
  const id = document.getElementById('livro-id').value;
    const payload = {
    titulo: document.getElementById('livro-titulo').value,
    autor: document.getElementById('livro-autor').value,
    genero: document.getElementById('livro-genero').value,
    ano: document.getElementById('livro-ano').value || null,
    editora: document.getElementById('livro-editora').value,
    isbn: document.getElementById('livro-isbn').value,
    capa_url: document.getElementById('livro-capa').value, // <-- ADICIONE AQUI
    quantidade: document.getElementById('livro-quantidade').value
  };
  const url = id ? `${API}/livros/${id}` : `${API}/livros`;
  const method = id ? 'PUT' : 'POST';
  const r = await fetch(url,{method,headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)});
  if(!r.ok){ const err = await r.json(); return alert(err.error||'Erro'); }
  fechar('modal-livro');
  carregarLivros();
});

async function excluirLivro(id){
  if(!confirm('Excluir este livro?')) return;
  await fetch(`${API}/livros/${id}`,{method:'DELETE'});
  carregarLivros();
}

// ---------- ALUNOS ----------
async function carregarAlunos(){
  const r = await fetch(API+'/alunos');
  alunosCache = await r.json();
  renderAlunos();
}

function renderAlunos(){
  const busca = document.getElementById('busca-alunos').value.toLowerCase();
  const lista = alunosCache.filter(a=>
    a.nome.toLowerCase().includes(busca) ||
    a.matricula.toLowerCase().includes(busca));
  const tbody = document.getElementById('tbody-alunos');

  if(!lista.length){
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty">Nenhum aluno encontrado 🎓</div></td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(a=>`
    <tr>
      <td><strong>${escapeHtml(a.nome)}</strong></td>
      <td>${escapeHtml(a.matricula)}</td>
      <td>${escapeHtml(a.serie||'-')}</td>
      <td>${escapeHtml(a.email||a.telefone||'-')}</td>
      <td style="text-align:right">
        <button class="btn ghost small" onclick="abrirAluno(${a.id})">Editar</button>
        <button class="btn rosa small" onclick="excluirAluno(${a.id})">Excluir</button>
      </td>
    </tr>`).join('');
}

document.getElementById('busca-alunos').addEventListener('input',renderAlunos);

function abrirAluno(id=null){
  document.getElementById('form-aluno').reset();
  document.getElementById('aluno-id').value = '';
  document.getElementById('titulo-modal-aluno').textContent = 'Novo Aluno';
  if(id){
    const a = alunosCache.find(x=>x.id===id);
    if(!a) return;
    document.getElementById('titulo-modal-aluno').textContent = 'Editar Aluno';
    document.getElementById('aluno-id').value = a.id;
    document.getElementById('aluno-nome').value = a.nome;
    document.getElementById('aluno-matricula').value = a.matricula;
    document.getElementById('aluno-serie').value = a.serie||'';
    document.getElementById('aluno-email').value = a.email||'';
    document.getElementById('aluno-telefone').value = a.telefone||'';
  }
  abrir('modal-aluno');
}

document.getElementById('form-aluno').addEventListener('submit', async e=>{
  e.preventDefault();
  const id = document.getElementById('aluno-id').value;
  const payload = {
    nome: document.getElementById('aluno-nome').value,
    matricula: document.getElementById('aluno-matricula').value,
    serie: document.getElementById('aluno-serie').value,
    email: document.getElementById('aluno-email').value,
    telefone: document.getElementById('aluno-telefone').value
  };
  const url = id ? `${API}/alunos/${id}` : `${API}/alunos`;
  const method = id ? 'PUT' : 'POST';
  const r = await fetch(url,{method,headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)});
  if(!r.ok){ const err = await r.json(); return alert(err.error||'Erro'); }
  fechar('modal-aluno');
  carregarAlunos();
});

async function excluirAluno(id){
  if(!confirm('Excluir este aluno?')) return;
  await fetch(`${API}/alunos/${id}`,{method:'DELETE'});
  carregarAlunos();
}

// ---------- EMPRÉSTIMOS ----------
async function carregarEmprestimos(){
  const r = await fetch(API+'/emprestimos');
  emprestimosCache = await r.json();
  renderEmprestimos();
}

function statusEmprestimo(e){
  if(e.status==='devolvido') return {cls:'devolvido', label:'Devolvido'};
  const hoje = new Date().toISOString().slice(0,10);
  if(e.data_prevista < hoje) return {cls:'atrasado', label:'Atrasado'};
  return {cls:'andamento', label:'Em andamento'};
}

function formatData(iso){
  if(!iso) return '-';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function renderEmprestimos(){
  const tbody = document.getElementById('tbody-emprestimos');
  if(!emprestimosCache.length){
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty">Nenhum empréstimo registrado 🔁</div></td></tr>';
    return;
  }
  tbody.innerHTML = emprestimosCache.map(e=>{
    const s = statusEmprestimo(e);
    const acao = e.status!=='devolvido'
      ? `<button class="btn rosa small" onclick="devolver(${e.id})">Devolver</button>`
      : '';
    return `<tr>
      <td><strong>${escapeHtml(e.titulo)}</strong></td>
      <td>${escapeHtml(e.aluno_nome)}<br><small class="muted">${escapeHtml(e.matricula)}</small></td>
      <td>${formatData(e.data_emprestimo)}</td>
      <td>${formatData(e.data_prevista)}</td>
      <td><span class="status ${s.cls}">${s.label}</span></td>
      <td style="text-align:right">${acao}</td>
    </tr>`;
  }).join('');
}

async function abrirEmprestimo(){
  const [rLivros,rAlunos] = await Promise.all([
    fetch(API+'/livros'), fetch(API+'/alunos')
  ]);
  const livros = (await rLivros.json()).filter(l=>l.disponiveis>0);
  const alunos = await rAlunos.json();

  document.getElementById('emp-livro').innerHTML = livros.length
    ? livros.map(l=>`<option value="${l.id}">${escapeHtml(l.titulo)} (${l.disponiveis} disp.)</option>`).join('')
    : '<option value="">Nenhum livro disponível</option>';

  document.getElementById('emp-aluno').innerHTML = alunos.length
    ? alunos.map(a=>`<option value="${a.id}">${escapeHtml(a.nome)} — ${a.matricula}</option>`).join('')
    : '<option value="">Nenhum aluno cadastrado</option>';

  document.getElementById('emp-data').value =
    new Date(Date.now()+7*86400000).toISOString().slice(0,10);

  abrir('modal-emprestimo');
}

document.getElementById('form-emprestimo').addEventListener('submit', async e=>{
  e.preventDefault();
  const payload = {
    livro_id: Number(document.getElementById('emp-livro').value),
    aluno_id: Number(document.getElementById('emp-aluno').value),
    data_prevista: document.getElementById('emp-data').value
  };
  if(!payload.livro_id || !payload.aluno_id) return alert('Selecione livro e aluno');
  const r = await fetch(`${API}/emprestimos`,{
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  if(!r.ok){ const err = await r.json(); return alert(err.error); }
  fechar('modal-emprestimo');
  carregarEmprestimos();
});

async function devolver(id){
  if(!confirm('Confirmar devolução?')) return;
  await fetch(`${API}/emprestimos/${id}/devolver`,{method:'PUT'});
  carregarEmprestimos();
}

// ---------- INICIAL ----------
carregarDashboard();

// ---------- EXPORTAR RELATÓRIO ----------
function exportarCSV() {
  if (!emprestimosCache.length) {
    return alert('Nenhum empréstimo registrado para exportar.');
  }
  
  let csv = 'ID,Livro,Aluno,Matrícula,Data Empréstimo,Data Prevista,Status\n';
  
  emprestimosCache.forEach(e => {
    const s = statusEmprestimo(e).label;
    const titulo = e.titulo.replace(/"/g, '""');
    const aluno = e.aluno_nome.replace(/"/g, '""');
    const dataEmp = formatData(e.data_emprestimo);
    const dataPrev = formatData(e.data_prevista);
    
    csv += `"${e.id}","${titulo}","${aluno}","${e.matricula}","${dataEmp}","${dataPrev}","${s}"\n`;
  });
  
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'relatorio_emprestimos.csv';
  link.click();
}

// ---------- SISTEMA DE NOTIFICAÇÕES (SINO) ----------
let notificacoesAbertas = false;

function toggleNotificacoes(event) {
  event.stopPropagation(); // Evita que o clique feche o menu na mesma hora
  const dropdown = document.getElementById('dropdown-notificacoes');
  notificacoesAbertas = !notificacoesAbertas;
  
  if (notificacoesAbertas) {
    dropdown.classList.add('show');
    document.getElementById('badge-notificacao').style.display = 'none'; // Esconde a bolinha vermelha
    fetch(API + '/notificacoes/ler', { method: 'PUT' }); // Marca como lidas no banco
  } else {
    dropdown.classList.remove('show');
  }
}

// Fecha o menu se clicar em qualquer outro lugar da tela
document.addEventListener('click', () => {
  if (notificacoesAbertas) {
    document.getElementById('dropdown-notificacoes').classList.remove('show');
    notificacoesAbertas = false;
  }
});

// Função que busca as notificações no servidor a cada 3 segundos
async function checarNotificacoes() {
  try {
    const res = await fetch(API + '/notificacoes');
    const dados = await res.json();
    
    const badge = document.getElementById('badge-notificacao');
    const lista = document.getElementById('lista-notificacoes');
    
    if (dados.length > 0) {
      badge.style.display = 'block'; // Mostra a bolinha vermelha
      
      // Atualiza o dropdown com as novas notificações
      lista.innerHTML = dados.map(n => {
        let icone = n.aviso_emprestimo === 1 ? '📖' : '🔄';
        let texto = n.aviso_emprestimo === 1 
          ? `<strong>${n.aluno_nome}</strong> pegou o livro <strong>"${n.titulo}"</strong>` 
          : `<strong>${n.aluno_nome}</strong> renovou o livro <strong>"${n.titulo}"</strong>`;
          
        return `
          <div class="notificacao-item">
            <div class="icon">${icone}</div>
            <div>
              <h5>${n.aviso_emprestimo === 1 ? 'Novo Empréstimo' : 'Renovação'}</h5>
              <p>${texto}</p>
            </div>
          </div>
        `;
      }).join('');
      
      // Atualiza a tabela do painel se o bibliotecário estiver na aba de empréstimos
      if (document.getElementById('page-emprestimos').classList.contains('active')) {
        carregarEmprestimos();
      }
    } else {
      if (!notificacoesAbertas) {
        badge.style.display = 'none';
      }
      lista.innerHTML = '<div class="dropdown-vazio">Nenhuma notificação nova.</div>';
    }
  } catch (e) { console.log(e); }
}

// Verifica a cada 3 segundos
setInterval(checarNotificacoes, 3000);