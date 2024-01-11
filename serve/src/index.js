const express = require("express");
const morgan = require("morgan");
const database = require("./db");
const mysql = require("promise-mysql");
const cors = require("cors"); // Importa el paquete cors
const multer = require("multer");
const fs = require("node:fs");
const jwt = require("jsonwebtoken");

// import mercadopago from "mercadopago"
const mercadopago = require("mercadopago");

const app = express();

const upload = multer({
  dest: "upload/",
});

app.use("/upload", express.static("upload"));

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

const routerProductos = require("./routers/API-productos.js");

app.use("/", routerProductos);


const routerUsuarios = require("./routers/router-usuarios.js");
app.use("/", routerUsuarios);

const routerVentas = require("./routers/router-ventas.js");
app.use("/", routerVentas);

app.listen(3001, () => {
  console.log(`corriendo por el puerto 3001`);
});
