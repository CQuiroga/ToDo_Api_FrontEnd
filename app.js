require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.render('index', { 
    apiUrl: process.env.API_URL,
    isAuthenticated: false
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});