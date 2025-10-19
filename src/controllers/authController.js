const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

function gerarToken(usuario) {
  return jwt.sign(usuario, process.env.JWT_SECRET, { expiresIn: '5m' });
}

exports.loginLocal = async (req, res) => {
  const { email, senha } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ? AND provedor = "local"', [email]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

    const usuario = rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) return res.status(401).json({ message: 'Senha incorreta' });

    const token = gerarToken({ id: usuario.id, nome: usuario.nome, email: usuario.email, provedor: usuario.provedor });
    res.json({ token, nome: usuario.nome });
  } catch (err) {
    res.status(500).json({ message: 'Erro no login', error: err });
  }
};

exports.loginOAuth = async (req, res) => {
  const { nome, email, id_provedor, provedor } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ? AND provedor = ?', [email, provedor]);
    let usuario = rows[0];

    if (!usuario) {
      const [result] = await pool.query(
        'INSERT INTO usuarios (nome, email, provedor, id_provedor) VALUES (?, ?, ?, ?)',
        [nome, email, provedor, id_provedor]
      );
      usuario = { id: result.insertId, nome, email, provedor };
    }

    const token = gerarToken({ id: usuario.id, nome: usuario.nome, email: usuario.email, provedor: usuario.provedor });
    res.json({ token, nome: usuario.nome });
  } catch (err) {
    res.status(500).json({ message: 'Erro no login OAuth', error: err });
  }
};

exports.refreshToken = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token não fornecido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido ou expirado' });
    const novoToken = gerarToken({ id: user.id, nome: user.nome, email: user.email, provedor: user.provedor });
    res.json({ token: novoToken });
  });
};

exports.registerUsuario = async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    console.log('Recebendo dados:', { nome, email });

    const [existe] = await pool.query('SELECT id FROM usuarios WHERE email = ? AND provedor = "local"', [email]);
    if (existe.length > 0) {
      return res.status(409).json({ message: 'Usuário já existe com esse e-mail' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, provedor) VALUES (?, ?, ?, "local")',
      [nome, email, senhaHash]
    );

    const token = gerarToken({ id: result.insertId, nome, email, provedor: 'local' });
    res.status(201).json({ token, nome });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ message: 'Erro ao registrar usuário', error: err.message });
  }
};
