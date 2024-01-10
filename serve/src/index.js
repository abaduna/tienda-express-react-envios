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
mercadopago.configure({
  access_token:
    "TEST-1883969381916870-010923-95908d7a70ab03a3b9c6d4f6f8f43739-207725092",
});

app.post("/mercadopago", async (req, res) => {
  const { data } = req.body;
  const { total, caritoDeCompras, nombre } = data;
  console.log(req.body);
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
        success: "http://localhost:3000/success/",
        failure: "http://localhost:3000/fallo",
      },
      auto_return: "approved",
    };
    llemaralaapiComprarProducto(caritoDeCompras, nombre);
    const respons = await mercadopago.preferences.create(preference);
    console.log(respons);

    res.status(200).json(respons.response.init_point);
  } catch (error) {
    console.log(error.menssage);
    res.status(500).json({ message: "error en el post" });
  }
});
const axios = require("axios");

const llemaralaapiComprarProducto = async (caritoDeCompras, nombre) => {
  const apiUrl = "http://localhost:3001/producBought";
  const dataBody = {
    caritoDeCompras,
    nombre,
  };
  axios
    .post(apiUrl,dataBody)
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.error(`Error al realizar la solicitud: ${error.message}`);
    });
  
};
app.post("producBought", (req, res) => {
  const { caritoDeCompras, nombre } = req.body;
  console.log(req.body);
});
app.listen(3001, () => {
  console.log(`corriendo por el puerto 3001`);
});

/*
este codigo necesita una refactorizacion urgente
RowDataPacket { coreo: 'admin@gmail.com', password: '123456' },   
RowDataPacket { coreo: 'artuelrey@gmail.com', password: '123456' }
*/
