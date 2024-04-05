const express = require(`express`);
const database = require("./../db");
const jwt = require("jsonwebtoken");
const mercadopago = require("mercadopago");
const fetch = require("node-fetch");
const uniqid = require("uniqid");

const routerVentas = express.Router();

require("dotenv").config();
mercadopago.configure({
  access_token: process.env.ACCESS_TOKEN,
});
routerVentas.post("/mercadopago", async (req, res) => {
  const { data } = req.body;
  console.log(req.body);
  const { total, caritoDeCompras, name, phone, addres, city } = data;
  try {
    const preference = {
      items: [
        {
          title: "no tiene titulo",
          unit_price: total,
          currency_id: "ARS",
          description: "no tiene descrption",
          quantity: 1,
        },
      ],

      back_urls: {
        success: `http://localhost:3000/felicitaciones/${name}`,
        failure: "http://localhost:3000/CompraFalida",
      },
      auto_return: "approved",
    };
    const respons = await mercadopago.preferences.create(preference);
    console.log(respons.status); //201
    try {
      console.log(
        `dataBody ${(total, caritoDeCompras, name, phone, addres, city)}`
      );
      if (respons.status === 201) {
        await llemaralaapiComprarProducto(
          total,
          caritoDeCompras,
          name,
          phone,
          addres,
          city
        ); // vaa tener que ser un useEffec()
      }
    } catch (error) {
      console.log(`error en llemaralaapiComprarProducto ${error}`);
    }

    res.status(200).json(respons.response.init_point);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "error en el post" });
  }
});

const llemaralaapiComprarProducto = async (
  total,
  caritoDeCompras,
  name,
  phone,
  addres,
  city
) => {
  const dataBody = {
    caritoDeCompras,
    nombre: name,
    total,
    phone,
    addres,
    city,
  };
  console.log(`dataBody`);
  console.log(dataBody);
  const response = await fetch("http://localhost:3001/producBough", {
    method: "POST",
    body: JSON.stringify(dataBody),
    headers: {
      "Content-Type": "application/json", // Specify content type
    },
  });
  const data = await response.json();
  console.log(`data`);
  console.log(data);
};

routerVentas.post("/producBough", async (req, res) => {
  const id_orden = await uniqid();
  console.log(id_orden);
  const {
    caritoDeCompras,
    name,
    total,
    phone,
    addres,
    city,
  } = req.body;
  console.log(`api /producBough`);
  console.log(req.body);

  console.log(`caritoDeCompras`);
  console.log(caritoDeCompras);
  addTablaPrincipalProductosComprados(
    id_orden,
    name,
    total,
    phone,
    addres,
    city
  );
  addTablaDeProductos(id_orden, caritoDeCompras);

  res.status(200).send("Agregado con exito la compra");
});
const addTablaPrincipalProductosComprados = async (
  id_orden,
  name,
  total,
  phone,
  addres,
  city
) => {
  let cuando_fue_comprado = Date.now(); //numero en millisegundos pasar a fecha desde 1 de enero 1970
  const estado = "por entregar";
  const connection = await database.getConnection();

  try {
    const consult =
      "INSERT INTO `tablaprincipalproductoscomprados` (`nombre`, `cuando_fue_comprado`, `id_orden`,`estado`,`total`,`phone`,`addres`,`city`) VALUES (?,?,?,?,?,?,?,?);";
    const variables = [name, cuando_fue_comprado, id_orden, estado, total,phone,addres,city];
    await connection.query(consult, variables);
  } catch (error) {
    console.log(error);
  }
};
const addTablaDeProductos = async (id_orden, caritoDeCompras) => {
  const connection = await database.getConnection();
  console.log(`caritoDeCompras`);
  console.log(caritoDeCompras);
  // for (const producto of caritoDeCompras) {
  //   await connection.execute('INSERT INTO tabladeproductos (id_orden, nombre, precio,descripcion) VALUES (?, ?, ?, ?)', [id_orden, producto.title, producto.precio, producto.descripction]);
  // }}
  for (let index = 0; index < caritoDeCompras.length; index++) {
    const producto = caritoDeCompras[index];
    await connection.query(
      "INSERT INTO tabladeproductos (id_orden, nombre, precio,descripcion) VALUES (?, ?, ?, ?)",
      [id_orden, producto.title, producto.precio, producto.descripction]
    );
  }
};

module.exports = routerVentas;
