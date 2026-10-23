-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: biblioteca
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alunos`
--

DROP TABLE IF EXISTS `alunos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alunos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `matricula` varchar(30) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telefone` varchar(30) DEFAULT NULL,
  `serie` varchar(50) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `senha` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricula` (`matricula`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alunos`
--

LOCK TABLES `alunos` WRITE;
/*!40000 ALTER TABLE `alunos` DISABLE KEYS */;
INSERT INTO `alunos` VALUES (5,'Isabelly Ramos dos Santos','110120','isabelly.ramos.santos@escola.pr.gov.br','43984555899','3° Ano EM','2026-10-20 15:30:15','110120'),(6,'Nicolly Caroline Santos Ribeiro','2001123','nicolly.santos.ribeiro@escola.pr.gov.br','43988694165','3° Ano EM','2026-10-23 11:01:49','2001123'),(7,'Isabella Cardoso','211367','isabella.cardoso@escola.pr.gov.br','43962439278','3° Ano EM','2026-10-23 11:37:19','211367');
/*!40000 ALTER TABLE `alunos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emprestimos`
--

DROP TABLE IF EXISTS `emprestimos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `emprestimos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `livro_id` int(11) NOT NULL,
  `aluno_id` int(11) NOT NULL,
  `data_emprestimo` date NOT NULL,
  `data_prevista` date NOT NULL,
  `data_devolucao` date DEFAULT NULL,
  `status` enum('emprestado','devolvido') DEFAULT 'emprestado',
  `renovacoes` int(11) DEFAULT 0,
  `aviso_renovacao` tinyint(1) DEFAULT 0,
  `aviso_emprestimo` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `livro_id` (`livro_id`),
  KEY `aluno_id` (`aluno_id`),
  CONSTRAINT `emprestimos_ibfk_1` FOREIGN KEY (`livro_id`) REFERENCES `livros` (`id`) ON DELETE CASCADE,
  CONSTRAINT `emprestimos_ibfk_2` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emprestimos`
--

LOCK TABLES `emprestimos` WRITE;
/*!40000 ALTER TABLE `emprestimos` DISABLE KEYS */;
INSERT INTO `emprestimos` VALUES (1,2,5,'2026-10-20','2026-11-03',NULL,'emprestado',1,0,0),(2,5,6,'2026-10-23','2026-10-30',NULL,'emprestado',1,0,0),(3,6,7,'2026-10-23','2026-11-06',NULL,'emprestado',1,0,0),(4,8,7,'2026-10-23','2026-11-06',NULL,'emprestado',1,0,0);
/*!40000 ALTER TABLE `emprestimos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `livros`
--

DROP TABLE IF EXISTS `livros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `livros` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `autor` varchar(150) NOT NULL,
  `isbn` varchar(30) DEFAULT NULL,
  `editora` varchar(100) DEFAULT NULL,
  `ano` int(11) DEFAULT NULL,
  `genero` varchar(80) DEFAULT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 1,
  `disponiveis` int(11) NOT NULL DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `capa_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `livros`
--

LOCK TABLES `livros` WRITE;
/*!40000 ALTER TABLE `livros` DISABLE KEYS */;
INSERT INTO `livros` VALUES (1,'Dom Casmurro','Machado de Assis','978-85-0001','Companhia',1899,'Romance',3,3,'2026-10-20 15:22:54','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMt76j895jT-kC3Kdtqr9kqqfUuXa9z8rQNZuJt3aUrw&s=10'),(2,'O Pequeno Príncipe','Antoine de Saint-Exupéry','978-85-0002','Agir',1943,'Infantil',5,4,'2026-10-20 15:22:54','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSuPYEoWRiSoECDXNGBGkIm33JW-iAaF1QowthXjyMCQ&s=10'),(3,'Capitães de Areia','Jorge Amado','978-85-0003','Companhia',1937,'Romance',2,2,'2026-10-20 15:22:54','https://m.media-amazon.com/images/I/81t7altQZxL.jpg'),(4,'A Menina que Roubava Livros','Markus Zusak','978-85-0004','Intr├¡nseca',2005,'Drama',4,4,'2026-10-20 15:22:54','https://m.media-amazon.com/images/I/61L+4OBhm-L._AC_UF1000,1000_QL80_.jpg'),(5,'Harry Potter e a Pedra Filosofal','J.K. Rowling','978-85-0005','Rocco',1997,'Fantasia',6,5,'2026-10-20 15:22:54','https://livrariascuritiba.vteximg.com.br/arquivos/ids/1663114-1000-1000/LV417866.jpg?v=638761783514030000'),(6,'Vidas Secas','Graciliano Ramos','978-85-0006','Record',1938,'Romance',3,2,'2026-10-20 15:22:54','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTL3ZzHwEn28fNVuCAWd0lxAwWq3eDVYd05dlVGsoQkwg&s=10'),(7,'Percy Jackson e o Ladrão de Raios','Rick Riordan','','',2005,'Fantasia',3,3,'2026-10-23 13:41:19','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqIUPyBNiKBLmyPuPtu_XmNERFL7ML_BogHV0e0V0rKA&s=10'),(8,'Heartstopper: Dois Garotos, Um Encontro','Alice Oseman','','',2016,'Romance/Graphic Novel',5,4,'2026-10-23 13:45:50','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0RTZvXZPQVlalPeItPNOJoGTDkWZ2JBbdUGDtU_DpDw&s=10'),(9,'Diário de um Banana','Jeff Kinney','','',2007,'Comédia',5,5,'2026-10-23 13:46:41','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQajpN-QGfzA2typFt59DtjZNxm697NqTYNp8xhZPJ5A&s=10'),(10,'O Diário de Anne Frank','Anne Frank','','',1947,'Biografia/História',2,2,'2026-10-23 13:47:42','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBw1TQhP6sGxV6Wzfk3IIomk5WUspzm664EE1QMzxFlg&s=10');
/*!40000 ALTER TABLE `livros` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-23 11:13:38
