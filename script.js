// server.js - Servidor backend para Alto Relieve
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexión a base de datos gratuita en la nube (MongoDB Atlas)
const MONGO_URI = process.env.MONGO_URI || "tu_cadena_de_conexion_de_mongodb";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Conectado a la Base de Datos en la Nube"))
  .catch(err => console.error("Error de conexión:", err));

// Esquema del Pedido
const pedidoSchema = new mongoose.Schema({
  cliente: String,
  telefono: String,
  descripcion: String,
  tipo: String,
  costo: Number,
  estado: String, // 'cola', 'proceso', 'pausa', 'finalizado'
  prioridad: String,
  tiempoEstimado: Number,
  fechaIngreso: String,
  fechaEntrega: String,
  motivoCancelacion: String,
  createdAt: { type: Date, default: Date.now }
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

// Rutas API
// 1. Obtener todos los pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// 2. Crear un nuevo pedido
app.post('/api/pedidos', async (req, res) => {
  try {
    const nuevoPedido = new Pedido(req.body);
    await nuevoPedido.save();
    res.status(201).json(nuevoPedido);
  } catch (error) {
    res.status(500).json({ error: "Error al guardar el pedido" });
  }
});

// 3. Actualizar estado o datos
app.put('/api/pedidos/:id', async (req, res) => {
  try {
    const actualizado = await Pedido.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar pedido" });
  }
});

// 4. Eliminar o registrar motivo
app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    await Pedido.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Pedido eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar pedido" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

function enviarWhatsApp(telefonoCliente, nombreCliente, descripcionTrabajo, costo, estado) {
    // Reemplaza '5491112345678' con TU número de WhatsApp (Código país 54 + 9 + característica + número sin 0 ni 15)
    const miNumeroWhatsApp = "541135911475"; 

    // Si quieres que el mensaje le llegue al cliente, puedes usar 'telefonoCliente'. 
    // Pero si quieres que el mensaje se abra EN TU PROPIO WHATSAPP para enviárselo a alguien, 
    // o si prefieres que se abra al número del cliente cargado en el pedido, puedes elegir:
    
    // Opción A: Que se abra para enviárselo al cliente registrado en el pedido:
    const telefonoDestino = telefonoCliente ? telefonoCliente.replace(/\D/g, '') : miNumeroWhatsApp;

    // Redactamos el mensaje según el estado del trabajo
    let textoMensaje = `¡Hola ${nombreCliente}! Te escribimos de *Alto Relieve* (Impresión 3D y Cartelería). `;
    
    if (estado === 'finalizado') {
        textoMensaje += `Te contamos que tu trabajo (*${descripcionTrabajo}*) ya está *FINALIZADO* y listo para retirar/entregar. El costo total es de $${costo}. ¡Esperamos que te encante!`;
    } else {
        textoMensaje += `Queríamos informarte sobre el estado de tu pedido (*${descripcionTrabajo}*). Comunicate con nosotros para más detalles.`;
    }

    // Codificamos el texto para que funcione bien en la URL
    const mensajeCodificado = encodeURIComponent(textoMensaje);

    // Abrimos WhatsApp (funciona tanto en compu como en celular)
    const urlWhatsApp = `https://wa.me/${telefonoDestino}?text=${mensajeCodificado}`;
    window.open(urlWhatsApp, '_blank');
}
