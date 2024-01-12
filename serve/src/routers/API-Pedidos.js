const express = require(`express`);
const database = require("./../db");

const routerPedidos = express.Router();

routerPedidos.get("/pedidos/entregados", async (req, res) => {
  res.status(200).json({ message: "Delivered orders retrieved successfully" });
});
module.exports = routerPedidos;
