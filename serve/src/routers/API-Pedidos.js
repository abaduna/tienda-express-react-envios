const express = require(`express`);
const database = require("./../db");

const routerPedidos = express.Router();
//obterner pedidos
routerPedidos.get("/pedidos/entregados", async (req, res) => {
  const connection = await database.getConnection();
  try {
    const result = await connection.query(
      "SELECT * FROM tablaprincipalproductoscomprados;"
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error en la consulta:", error);
    await connection.end();
    res.status(500).json({ error: "Error en la consulta" });
  }
});
//obtener productos
routerPedidos.get("/pedidos/productList/:id", async (req, res) => {
  const id_orden = req.params.id;
  const connection = await database.getConnection();
  try {
    const result = await connection.query(
      "SELECT * FROM tabladeproductos WHERE  id_orden = ?;",
      [id_orden]
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error en la consulta:", error);
    await connection.end();
    res.status(500).json({ error: "Error en la consulta" });
  }
});

routerPedidos.put("/pedidos/ModifyProductList/:id", async (req, res) => {
  const id_orden = req.params.id;
  const { nombre, precio, descripcion } = req.body;
  try {
    const SQLquery =
      "INSERT INTO `tabladeproductos` (id_orden, nombre, precio,descripcion) VALUES (?, ?, ?.?);";
    await connection.query(SQLquery, [id_orden, nombre, precio, descripcion]);

    res.json({ mensaje: "Producto actualizado exitosamente" });
  } catch (error) {
    console.error("Error en la consulta:", error);
    await connection.end();
    res.status(500).json({ error: "Error en la consulta" });
  }
});
//sdfgfhsdgkhusdgksdglsdglkh.usdglkh.ufsdglkh.ufsdglkh.ufsdglhfsdglkhufsdgfsdglkhufsdglh abaajo este bien
routerPedidos.put("/pedidos/ModifyProduct/:id", async (req, res) => {
  const id_orden = req.params.id;
  const { nombre, total, descripcion } = req.body;
  try {
    const SQLquery =
      "INSERT INTO `tablaprincipalproductoscomprados` (id_orden, nombre,cuando_fue_comprado ,estado,total) VALUES (?, ?, ?.?);";
    await connection.query(SQLquery, [id_orden, total, precio, descripcion]);

    await connection.end();
    res.json({ mensaje: "Producto actualizado exitosamente" });
  } catch (error) {
    console.error("Error en la consulta:", error);
    await connection.end();
    res.status(500).json({ error: "Error en la consulta" });
  }
});
//cambio de estado

routerPedidos.patch("/pedidos/ModifyStatus/:id",async(req,res)=>{
  const {estado} = req.body
  const id_orden = req.params.id;
  const connection = await database.getConnection();
  const SQLquery =
  "UPDATE `tablaprincipalproductoscomprados` SET estado = ? WHERE id_orden = ?;";
try {
  const result = await connection.query(SQLquery,[estado,id_orden]);
  res.status(200).json({message:"modificacion de estado exitosa"});
  
} catch (error) {
  console.error("Error en la consulta:", error);
 
    res.status(500).json({ error: "Error en la consulta" });
}
  
})
//paneles especificos
routerPedidos.get("/pedidos/entregados/:estado", async (req, res) => {
  const estado = req.params.estado;
  const connection = await database.getConnection();
  try {
    const result = await connection.query(
      "SELECT * FROM tablaprincipalproductoscomprados WHERE estado= ? ORDER BY id DESC;",
      [estado]
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error en la consulta:", error);
    await connection.end();
    res.status(500).json({ error: "Error en la consulta" });
  }
});

module.exports = routerPedidos;
