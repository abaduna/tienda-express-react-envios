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

//obtener productos
app.get("/api/productos", async (req, res) => {
  const connection = await database.getConnection();
  try {
    const result = await connection.query("SELECT * FROM productos  ");
    res.status(200).json(result);
  } catch (error) {
    console.error("Error en la consulta:", error);
    await connection.end();
    res.status(500).json({ error: "Error en la consulta" });
  }
});
//subir un producto
app.post(
  "/api/productos",
  upload.single("imageUpLoading"),
  async (req, res) => {
    const connection = await database.getConnection();
    console.log(req.body);
    let { title, description, category, precio } = req.body;
    console.log(req.file);
    const origianlNameee = saveImage(req.file);
    let imagenurl = `http://localhost:3001/upload/${origianlNameee}`;
    try {
      const result = await connection.query(
        `INSERT INTO productos ( title, descripction,category,imagenurl,precio) VALUES (?,?,?,?,?);`,
        [title, description, category, imagenurl, precio]
      );
      res.status(200).json({ message: "salio bien" });
    } catch (error) {
      console.error("Error en la consulta:", error);
      await connection.end();
      res.status(500).json({ error: "Error en la consulta" });
    }
  }
);

function saveImage(file) {
  console.log(`file ${file}`);
  const newPath = `./upload/-${file.originalname}`;
  fs.renameSync(file.path, newPath);
  let origianlNameee = file.originalname;
  return origianlNameee;
}

//deletd producto
app.delete("/api/productos/:id", async (req, res) => {
  const connection = await database.getConnection();
  const id = req.params.id;
  try {
    const result = await connection.query(
      `DELETE FROM productos WHERE id = ?;`,
      [id]
    );

    const response = { message: "Producto eliminado correctamente" };
    console.log(result);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error en la consulta:", error);
    await connection.end();
    res.status(500).json({ error: "Error en la consulta" });
  }
});
//hacer una ruta aparte
//ver por categoria
app.get("/api/categoria/:category", async (req, res) => {
  const connection = await database.getConnection();
  const category = req.params.category;
  try {
    const result = await connection.query(
      "SELECT * FROM productos WHERE category = ?",
      [category]
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error en la consulta:", error);
    await connection.end();
    res.status(500).json({ error: "Error en la consulta" });
  }
});

//get de categorias
app.get("/api/categoria", async (req, res) => {
  const connection = await database.getConnection();
  try {
    const result = await connection.query("SELECT * FROM category");
    res.status(200).json(result);
  } catch (error) {
    console.error("Error en la consulta:", error);
    await connection.end();
    res.status(500).json({ error: "Error en la consulta" });
  }
});

//insertar categorias
app.post("/api/categoria", async (req, res) => {
  const connection = await database.getConnection();
  let { category } = req.body;
  try {
    const result = await connection.query(
      `INSERT INTO category ( category) VALUES (?);`,
      [category]
    );
    res.status(200).json(result);
  } catch (error) {}
});

//router the usaris
//buscar uusario
app.post("/api/users", async (req, res) => {
  let { username, password } = req.body;
  console.log(req.body);

  const consult = `SELECT * FROM login WHERE username=? and password=? ;`;
  const connection = await database.getConnection();
  try {
    const result = await connection.query(consult, [username, password]);
    console.log("try");
    console.log(result.length);
    if (result.length > 0) {
      const token = jwt.sign(
        {
          tipo: "admin",
          username,
          password,
        },
        "tienda",
        {
          expiresIn: "3h",
        }
      );
      console.log("token", token);
      console.log(result);
      res.status(200).send({ token });
    } else {
      res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error de la consulta" });
  }
});
require("dotenv").config();
mercadopago.configure({
  access_token: process.env.ACCESS_TOKEN,
});

app.post("/mercadopago", async (req, res) => {
  const { data } = req.body;
  const { total, caritoDeCompras, nombre } = data;
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
        success: "http://localhost:3000/felicitaciones",
        failure: "http://localhost:3000/fallo",
      },
      auto_return: "approved",
    };
    try {
      console.log(`dataBody ${(caritoDeCompras, nombre, total)}`);
      await llemaralaapiComprarProducto(caritoDeCompras, nombre, total); // vaa tener que ser un useEffec()
    } catch (error) {
      console.log(`error en llemaralaapiComprarProducto ${error}`);
    }

    const respons = await mercadopago.preferences.create(preference);
    console.log(respons.status); //201

    res.status(200).json(respons.response.init_point);
  } catch (error) {
    console.log(error.menssage);
    res.status(500).json({ message: "error en el post" });
  }
});
const fetch = require("node-fetch");

const llemaralaapiComprarProducto = async (caritoDeCompras, nombre, total) => {
  const dataBody = {
    caritoDeCompras,
    nombre: nombre,
    total,
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
var uniqid = require("uniqid");

app.post("/producBough", async (req, res) => {
  const id_orden = await uniqid();
  console.log(id_orden);
  const { nombre, caritoDeCompras, total } = req.body;
  console.log(`api /producBough`);
  console.log(req.body);

  console.log(`caritoDeCompras`);
  console.log(caritoDeCompras);
  addTablaPrincipalProductosComprados(id_orden, nombre, total);
  addTablaDeProductos(id_orden, caritoDeCompras);

  res.status(200).send("Agregado con exito la compra");
});
const addTablaPrincipalProductosComprados = async (id_orden, nombre, total) => {
  let cuando_fue_comprado = Date.now(); //numero en millisegundos pasar a fecha desde 1 de enero 1970
  console.log(cuando_fue_comprado);
  const estado = "por entregar";
  const connection = await database.getConnection();
  console.log(nombre);
  console.log(cuando_fue_comprado);
  console.log(id_orden);
  console.log(estado);
  console.log(total);

  try {
    const consult =
      "INSERT INTO `tablaprincipalproductoscomprados` (`nombre`, `cuando_fue_comprado`, `id_orden`,`estado`,`total`) VALUES (?,?,?,?,?);";
    const variables = [nombre, cuando_fue_comprado, id_orden, estado, total];
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
app.listen(3001, () => {
  console.log(`corriendo por el puerto 3001`);
});
