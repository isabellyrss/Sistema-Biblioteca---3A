CREATE DATABASE IF NOT EXISTS biblioteca
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE biblioteca;

CREATE TABLE alunos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  matricula VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(150),
  telefone VARCHAR(30),
  serie VARCHAR(50),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE livros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(150) NOT NULL,
  isbn VARCHAR(30),
  editora VARCHAR(100),
  ano INT,
  genero VARCHAR(80),
  quantidade INT NOT NULL DEFAULT 1,
  disponiveis INT NOT NULL DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE emprestimos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  livro_id INT NOT NULL,
  aluno_id INT NOT NULL,
  data_emprestimo DATE NOT NULL,
  data_prevista DATE NOT NULL,
  data_devolucao DATE NULL,
  status ENUM('emprestado','devolvido') DEFAULT 'emprestado',
  FOREIGN KEY (livro_id) REFERENCES livros(id) ON DELETE CASCADE,
  FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
);

-- Dados de exemplo
INSERT INTO livros (titulo, autor, isbn, editora, ano, genero, quantidade, disponiveis) VALUES
('Dom Casmurro', 'Machado de Assis', '978-85-0001', 'Companhia', 1899, 'Romance', 3, 3),
('O Pequeno Príncipe', 'Antoine de Saint-Exupéry', '978-85-0002', 'Agir', 1943, 'Infantil', 5, 5),
('Capitães da Areia', 'Jorge Amado', '978-85-0003', 'Companhia', 1937, 'Romance', 2, 2),
('A Menina que Roubava Livros', 'Markus Zusak', '978-85-0004', 'Intrínseca', 2005, 'Drama', 4, 4),
('Harry Potter e a Pedra Filosofal', 'J.K. Rowling', '978-85-0005', 'Rocco', 1997, 'Fantasia', 6, 6),
('Vidas Secas', 'Graciliano Ramos', '978-85-0006', 'Record', 1938, 'Romance', 3, 3);

INSERT INTO alunos (nome, matricula, email, telefone, serie) VALUES
('Ana Beatriz Silva', '2024001', 'ana@email.com', '(11) 99999-0001', '1º Ano EM'),
('Carlos Eduardo Souza', '2024002', 'carlos@email.com', '(11) 99999-0002', '2º Ano EM'),
('Mariana Oliveira', '2024003', 'mariana@email.com', '(11) 99999-0003', '3º Ano EM'),
('Pedro Henrique Costa', '2024004', 'pedro@email.com', '(11) 99999-0004', '9º Ano');