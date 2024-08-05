const express = require("express");
const morgan = require("morgan");
const database = require("./db");
const path = require('path');
const cors = require("cors");
const multer = require("multer");
const fs = require("fs"); // Corrected import statement
const jwt = require("jsonwebtoken");

// import mercadopago from "mercadopago"
const mercadopago = require("mercadopago");

const app = express();

const upload = multer({
  dest: "upload/",
});

app.use( express.static("upload"));

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

const routerProductos = require("./routers/API-productos.js");

app.use("/", routerProductos);

const routerUsuarios = require("./routers/router-usuarios.js");
app.use("/", routerUsuarios);

const routerVentas = require("./routers/router-ventas.js");
app.use("/", routerVentas);

const routerPedidos = require("./routers/API-Pedidos.js");
app.use("/api", routerPedidos);

// Servir los archivos estáticos de la carpeta build de React
app.use(express.static(path.join(__dirname, '../build')));


// Manejar todas las rutas y devolver el archivo index.html de React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

require("dotenv").config();
const PORT =  3001
app.listen(PORT, () => {
  console.log(`corriendo por el puerto 3001`);
});