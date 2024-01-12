const express = require(`express`);
const database = require("./../db");

const routerPedidos = express.Router();

routerPedidos.get("/api/pedidos/entregados", async (req, res) => {
  res.status(200);
});
module.exports = routerPedidos;
