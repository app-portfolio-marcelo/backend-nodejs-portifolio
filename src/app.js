const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.use((req, res, next) => {
  console.log(`Recebida requisição: ${req.method} ${req.url}`);
  next();
});


app.use(cors());
app.use(bodyParser.json());

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});