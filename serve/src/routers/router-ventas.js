const express = require(`express`);
const database = require("./../db");
const jwt = require("jsonwebtoken");
const mercadopago = require("mercadopago");
const fetch = require("node-fetch");
const uniqid = require("uniqid");
const crypto = require("crypto");
const routerVentas = express.Router();

require("dotenv").config();
mercadopago.configure({
  access_token: process.env.ACCESS_TOKEN,
});
routerVentas.post("/mercadopago", async (req, res) => {
  const { data } = req.body;
  const id = new Date().getTime();
  const { total, caritoDeCompras, name, phone, addres, city } = data;
  try {
    const preference = {
      items: [
        {
          title: "tu compra",
          unit_price: total,
          currency_id: "ARS",
          description: " ",
          quantity: 1,
        },
      ],
      notification_url: `https://776a-190-195-87-149.ngrok-free.app/notificar/${id}`,
      back_urls: {
        success: `http://localhost:3000/felicitaciones/${name}/`,
        failure: "http://localhost:3000/CompraFalida",
      },
      auto_return: "approved",
    };
    const respons = await mercadopago.preferences.create(preference);
    console.log("respons", respons.body.init_point);

    try {
      
      if (respons) {
         await llemaralaapiComprarProducto( total,caritoDeCompras, name, phone, addres,city,id); 
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
  city,
  id
) => {
  const dataBody = {
    caritoDeCompras,
    nombre: name,
    total,
    phone,
    addres,
    city,
    id,
  };

  const response = await fetch("http://localhost:3001/producBough", {
    method: "POST",
    body: JSON.stringify(dataBody),
    headers: {
      "Content-Type": "application/json", // Specify content type
    },
  });
  const data = await response.json();
};
/**
 *  
  }
 */
routerVentas.post("/notificar/:id", async (req, res) => {
  try {
    const idItem = req.params.id;
    console.log(idItem);
    const { type, data } = req.body;
    console.log(data);
    switch (type) {
      case "payment": {
        const paymentId = data.id;
        const payment = await mercadopago.payment.findById(paymentId);
        console.log("Payment:", payment.body.status_detail);
        console.log(payment.body.items);
        if (payment.body.status_detail === "accredited") {
          console.log(`writing`);
          const connection = await database.getConnection();
          try {
            await connection.query(
            "UPDATE tablaprincipalproductoscomprados SET pagado = 1 WHERE cuando_fue_comprado = ?",
            [idItem]
          );
          } catch (error) {
            console.log(`error`);
            console.log(error);
          }
          
        }
        break;
      }
      case "plan": {
        const planId = data.id;
        const plan = await mercadopago.plan.findById(planId);
        console.log("Plan:", plan);
        // Realizar acciones con el objeto `plan`
        break;
      }
      case "subscription": {
        const subscriptionId = data.id;
        const subscription = await mercadopago.subscription.findById(
          subscriptionId
        );
        console.log("Subscription:", subscription);
        // Realizar acciones con el objeto `subscription`
        break;
      }
      case "invoice": {
        const invoiceId = data.id;
        const invoice = await mercadopago.invoice.findById(invoiceId);
        console.log("Invoice:", invoice);
        // Realizar acciones con el objeto `invoice`
        break;
      }
      case "point_integration_wh": {
        // La notificación puede contener otros datos que debes manejar aquí
        console.log("Point Integration:", req.body);
        break;
      }
      default: {
        console.warn("Unknown type:", type);
        break;
      }
    }

    // Responder para confirmar que se recibió la notificación
    res.status(200).send("Notification received");
  } catch (error) {
    console.error("Error handling notification:", error);
    res.status(500).send("Error handling notification");
  }
});
/** 
 * 
 * // Obtain the x-signature and x-request-id from the request headers
const xSignature = req.headers['x-signature'];
const xRequestId = req.headers['x-request-id'];

// Obtain query parameters from the request URL
const queryParams = req.query;

// Extract the "data.id" from the query params
const dataID = queryParams['data.id'] || '';

// Separate the x-signature into parts
const parts = xSignature.split(',');

let ts = null;
let hash = null;

// Iterate over the parts to obtain 'ts' and 'v1'
for (const part of parts) {
  const [key, value] = part.split('=').map(item => item.trim());
  if (key === 'ts') {
    ts = value;
  } else if (key === 'v1') {
    hash = value;
  }
}

// Obtain the secret key for the user/application
const secret = process.env.SECRET;

// Generate the manifest string
const manifest = `id:${dataID};request-id:${xRequestId};ts:${ts};`;

// Create an HMAC signature defining the hash type and the key
const sha = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

// Check if the calculated hash matches the given hash
if (sha === hash) {
  // HMAC verification passed
  res.send("HMAC verification passed");
} else {
  // HMAC verification failed
  res.status(400).send("HMAC verification failed");
}
})
*/
routerVentas.post("/producBough", async (req, res) => {
  console.log(`producBough`);
  const id_orden = await uniqid();

  const { caritoDeCompras, name, total, phone, addres, city, id } = req.body;

  addTablaPrincipalProductosComprados(
    id_orden,
    name,
    total,
    phone,
    addres,
    city,
    id
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
  city,
  id
) => {
  // let cuando_fue_comprado = id;
  const estado = "por entregar";
  const connection = await database.getConnection();

  try {
    const consult =
      "INSERT INTO `tablaprincipalproductoscomprados` (`nombre`, `cuando_fue_comprado`, `id_orden`,`estado`,`total`,`phone`,`addres`,`city`) VALUES (?,?,?,?,?,?,?,?);";
    const variables = [
      name,
      id,
      id_orden,
      estado,
      total,
      phone,
      addres,
      city,
    ];
    await connection.query(consult, variables);
  } catch (error) {
    console.log(error);
  }
};
const addTablaDeProductos = async (id_orden, caritoDeCompras) => {
  const connection = await database.getConnection();

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
