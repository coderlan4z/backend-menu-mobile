const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Configuração da conexão com o banco de dados MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Lan4z16@',
  database: 'jurassic_db',
  port: '3306'
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
  } else {
    console.log('Conectado ao MySQL');
  }
});

// Usar bcrypt para gerar o hash da senha
const saltRounds = 10;
const mockUser = {
  username: "TESTE",
  password: "TESTE123"
};

bcrypt.hash(mockUser.password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar o hash da senha:', err);
  } else {
    mockUser.passwordHash = hash;
  }
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Comparar a senha fornecida com o hash armazenado
  bcrypt.compare(password, mockUser.passwordHash, (err, result) => {
    if (err) {
      console.error('Erro ao comparar senha e hash:', err);
      res.status(500).json({ error: 'Erro ao comparar senha' });
      return;
    }

    if (result) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: "Unauthorized" });
    }
  });
});

// Rota para obter todos os produtos
app.get('/api/produtos', (req, res) => {
  const query = 'SELECT * FROM products';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao obter produtos do MySQL:', err);
      res.status(500).json({ error: 'Erro ao obter produtos' });
    } else {
      res.json(results);
    }
  });
});

// Rota para obter todas as categorias
app.get('/api/categorias', (req, res) => {
  const query = 'SELECT * FROM categorias';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao obter categorias do MySQL:', err);
      res.status(500).json({ error: 'Erro ao obter categorias' });
    } else {
      res.json(results);
    }
  });
});

// Rota para obter detalhes de um produto específico
app.get('/api/produtos/:id', (req, res) => {
  const productId = req.params.id;
  const query = 'SELECT * FROM products WHERE id = ?';

  connection.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Erro ao obter detalhes do produto do MySQL:', err);
      res.status(500).json({ error: 'Erro ao obter detalhes do produto' });
    } else {
      if (results.length > 0) {
        res.json(results[0]); // Retorna apenas o primeiro resultado (o produto específico)
      } else {
        res.status(404).json({ error: 'Produto não encontrado' });
      }
    }
  });
});

// Rota para adicionar um novo produto
app.post('/api/produtos-add', async (req, res) => {
  const { name, price, description, image, availability, category } = req.body;

  // Validação de campos obrigatórios
  if (!name || !price || !description || !category) {
    return res.status(400).json({ error: 'Fields name, price, description, and category are required' });
  }

  const numericPrice = parseFloat(price);

  // Validação de tipos de dados
  if (isNaN(numericPrice)) {
    return res.status(400).json({ error: 'Fields price must be numbers' });
  }

  // Obtenha o ID da categoria com base no nome da categoria fornecido
  const getCategoryQuery = 'SELECT id FROM categorias WHERE nome = ?';
  connection.query(getCategoryQuery, [category], async (err, results) => {
    if (err) {
      console.error('Error getting category ID:', err);
      return res.status(500).json({ error: 'Error getting category ID' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const categoryId = results[0].id;

    // Insira o produto com o ID da categoria
    const insertProductQuery = 'INSERT INTO products (name, price, description, image, availability,  category_id) VALUES (?, ?, ?, ?, ?, ?)';
    connection.query(insertProductQuery, [name, numericPrice, description, image, availability, categoryId], (err, results) => {
      if (err) {
        console.error('Error inserting product into MySQL:', err);
        return res.status(500).json({ error: 'Error inserting product' });
      } else {
        return res.json({ id: results.insertId, message: 'Product inserted successfully' });
      }
    });
  });
});

// Rota para atualizar a disponibilidade de um produto
app.patch('/api/produtos/:id', (req, res) => {
  const productId = req.params.id;
  const newAvailability = req.body.availability;

  const query = 'UPDATE products SET availability = ? WHERE id = ?';

  connection.query(query, [newAvailability, productId], (err, results) => {
    if (err) {
      console.error('Erro ao atualizar disponibilidade:', err);
      res.status(500).json({ error: 'Erro ao atualizar disponibilidade' });
    } else {
      res.json({ success: true, message: 'Disponibilidade atualizada com sucesso' });
    }
  });
});

// Rota para adicionar uma nova categoria
app.post('/api/categorias-add', (req, res) => {
  const { name } = req.body;

  // Validação de campos obrigatórios
  if (!name) {
    return res.status(400).json({ error: 'Campo name é obrigatório' });
  }

  const query = 'INSERT INTO categorias (name) VALUES (?)';

  connection.query(query, [name], (err, results) => {
    if (err) {
      console.error('Erro ao inserir categoria no MySQL:', err);
      return res.status(500).json({ error: 'Erro ao inserir categoria' });
    } else {
      return res.json({ id: results.insertId, message: 'Categoria inserida com sucesso' });
    }
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
