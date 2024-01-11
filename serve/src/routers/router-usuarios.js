const database = require("./../db");
const express = require(`express`);

const routerUsuarios = express.Router();

routerUsuarios.post("/api/users", async (req, res) => {
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

module.exports = routerUsuarios;