const express = require(`express`);
const multer = require("multer");
const database = require("./../db");
const fs = require("fs"); // Corrected import statement
const routerProductos = express.Router();
//obtener productos
routerProductos.get("/api/productos", async (req, res) => {
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

const upload = multer({
  dest: "upload/",
});

//subir un producto
routerProductos.post(
  "/api/productos",
  upload.single("imageUpLoading"),
  async (req, res) => {
    const connection = await database.getConnection();
    console.log(req.body);
    let { title, description, category, precio } = req.body;
    console.log(req.file);
    console.log(req.file);
    const origianlNameee = saveImage(req.file);
    let imagenurl = `http://localhost:3001/${origianlNameee}`;
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
  const newPath = `./upload/${file.originalname}`;
  fs.renameSync(file.path, newPath);
  let origianlNameee = file.originalname;
  return origianlNameee;
}

//deletd producto
routerProductos.delete("/api/productos/:id", async (req, res) => {
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
routerProductos.get("/api/categoria/:category", async (req, res) => {
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
routerProductos.get("/api/categoria", async (req, res) => {
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
routerProductos.post("/api/categoria", async (req, res) => {
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

module.exports = routerProductos;
