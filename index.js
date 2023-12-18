const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();

require('dotenv').config();

app.use(cors());
app.use(express.json());

const saltRounds = 10;

// Configurar conexão com o banco de dados usando variáveis de ambiente
const dbConfig = {
  host: '35.223.48.38',
  user: 'root',
  password: '{GFNqk]rFh/sM#y(',
  database: 'jurassic_db',
};

let connection; // Declare a variável connection aqui

// Função para criar conexão com o banco de dados
async function createConnection() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexão bem-sucedida ao banco de dados');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

// Rota para obter todos os produtos
app.get('/api/produtos', async (req, res) => {
  try {
    if (!connection) {
      await createConnection();
    }

    const query = 'SELECT * FROM products';
    const [results] = await connection.query(query);
    res.json(results);
  } catch (error) {
    console.error('Erro ao obter produtos do MySQL:', error);
    res.status(500).json({ error: 'Erro ao obter produtos' });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!connection) {
      await createConnection();
    }

    const [results] = await connection.execute('SELECT passwordHash FROM users WHERE username = ?', [username]);

    if (results.length > 0) {
      const storedHash = results[0].passwordHash;

      bcrypt.compare(password, storedHash, (err, result) => {
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
    } else {
      res.status(401).json({ success: false, error: "Unauthorized" });
    }
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    res.status(500).json({ error: 'Erro ao conectar ao banco de dados' });
  }
});

// Rota para obter todas as categorias
app.get('/api/categorias', async (req, res) => {
  try {
    if (!connection) {
      await createConnection();
    }

    const query = 'SELECT * FROM categorias';
    const [results] = await connection.query(query);
    res.json(results);
  } catch (error) {
    console.error('Erro ao obter categorias do MySQL:', error);
    res.status(500).json({ error: 'Erro ao obter categorias' });
  }
});



app.get('/api/produtos/:id', async (req, res) => {
  try {
    await createConnection();
    const productId = req.params.id;
    const query = 'SELECT * FROM products WHERE id = ?';
    const [results] = await connection.execute(query, [productId]);
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: 'Produto não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao obter detalhes do produto do MySQL:', error);
    res.status(500).json({ error: 'Erro ao obter detalhes do produto' });
  }
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
