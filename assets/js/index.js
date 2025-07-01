const SUPABASE_URL = 'https://mtlylondrcooutpvjmfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bHlsb25kcmNvb3V0cHZqbWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg2MTM4MywiZXhwIjoyMDY1NDM3MzgzfQ.ohwmSF14P_ElTMEgtCP_TyrMupED6FOmTVqGgsMCmmY';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('formPieza');
const mensaje = document.getElementById('mensaje');
const tabla = document.getElementById('tablaPiezas');
const filtroEtiqueta = document.getElementById('filtroEtiqueta');
const botonFiltrar = document.getElementById('botonFiltrar');

const piezas = [];

let idEditadoRecientemente = null;

// Cargar piezas al iniciar
window.addEventListener('load', async () => {
  await cargarPiezas();
  mostrarNotificaciones();  

  const ultimo = localStorage.getItem('ultimoFiltro');
  if (ultimo) {
    filtroEtiqueta.value = ultimo;
    filtrarPorEtiqueta();
  } else {
    renderizarTabla();
  }
});


// Agregar pieza
form.addEventListener('submit', async (e) => {
  e.preventDefault();

const pieza = {
  numeroSerie: document.getElementById('numeroSerie').value.trim(),
  descripcion: document.getElementById('descripcion').value.trim(),
  ubicacion: document.getElementById('ubicacion').value,
  etiqueta: document.getElementById('etiqueta').value.trim(),
  vencimiento: document.getElementById('vencimiento').value,
  cantidad: parseInt(document.getElementById('cantidad').value),
  precio: parseFloat(document.getElementById('precio').value),
  stockmin: 5
};


  if (new Date(pieza.vencimiento) < new Date().setHours(0, 0, 0, 0)) {
    mensaje.style.color = 'red';
    mensaje.textContent = 'No se puede registrar un producto vencido.';
    return;
  }
  const { data, error } = await client.from('inventario').insert([pieza]).select();

  if (error) {
    mensaje.style.color = 'red';
    mensaje.textContent = 'Error al guardar: ' + error.message;
  } else {
    mensaje.style.color = 'lightgreen';
    mensaje.textContent = 'Pieza agregada con éxito.';
    form.reset();
    await cargarPiezas();

    const piezaInsertada = data[0];
   const registro = {
  id_producto: piezaInsertada.id || null,
  descripcion: piezaInsertada.descripcion,
  numero_serie: piezaInsertada.numeroSerie,
  ubicacion: piezaInsertada.ubicacion,
  etiqueta: piezaInsertada.etiqueta,
  fecha_vencimiento: piezaInsertada.vencimiento,
  cantidad: piezaInsertada.cantidad,
  precio: piezaInsertada.precio,
  precio_anterior: '-', 
  fecha: new Date().toISOString(),
  responsable: localStorage.getItem('nombreUsuario') || 'Desconocido',
  accion: 'agregada'
};



    await client.from('registros_eliminados').insert([registro]);
  }
});

// Botón de filtro
botonFiltrar.addEventListener('click', filtrarPorEtiqueta);

// Renderizar la tabla
function renderizarTabla(lista = piezas) {
  tabla.innerHTML = '';
  const hoy = new Date();
  lista.forEach(pieza => {
    const dias = (new Date(pieza.vencimiento) - hoy) / (1000 * 60 * 60 * 24);
    const tr = document.createElement('tr');

    if (dias <= 30) tr.classList.add('destacado');

   tr.innerHTML = `
  <td>${pieza.id}</td>
  <td>${pieza.numeroSerie}</td>
  <td>${pieza.descripcion}</td>
  <td>${pieza.ubicacion}</td>
  <td>${pieza.etiqueta}</td>
  <td>${new Date(pieza.vencimiento).toLocaleDateString()}</td>
  <td>${!isNaN(parseFloat(pieza.precio)) ? '$' + parseInt(pieza.precio) : '-'}</td>
  <td>${pieza.cantidad}</td>
  <td>
    <button onclick="verDetalle(${pieza.id})">Ver</button>
    <button onclick="abrirModalEditar(${pieza.id})">Editar</button>
    <button class="btn-eliminar" onclick="eliminarPieza(${pieza.id})">Eliminar</button>
  </td>
`;


    tabla.appendChild(tr);

    if (pieza.id === idEditadoRecientemente) {
      tr.style.transition = 'background-color 0.5s ease';
      tr.style.backgroundColor = '#9b9b9b';
      setTimeout(() => {
        tr.style.backgroundColor = '';
        idEditadoRecientemente = null;
      }, 200);
    }
  });
  actualizarDropdownEtiquetas();
}

function verDetalle(id) {
  const pieza = piezas.find(p => p.id === id);
  if (pieza) {
    alert(`Detalles:\nID: ${pieza.id}\nSerie: ${pieza.numeroSerie}\nDescripción: ${pieza.descripcion}\nUbicación: ${pieza.ubicacion}\nEtiqueta: ${pieza.etiqueta}\nVence: ${new Date(pieza.vencimiento).toLocaleDateString()}\nCantidad: ${pieza.cantidad}\nPrecio: $${pieza.precio.toFixed(2)}`);
}
}

function filtrarPorEtiqueta() {
  const etiquetaSeleccionada = filtroEtiqueta.value;
  const filtradas = etiquetaSeleccionada ? piezas.filter(p => p.etiqueta === etiquetaSeleccionada) : piezas;
  renderizarTabla(filtradas);
  localStorage.setItem('ultimoFiltro', etiquetaSeleccionada);
}

function actualizarDropdownEtiquetas() {
  const etiquetas = [...new Set(piezas.map(p => p.etiqueta))];
  const seleccionActual = filtroEtiqueta.value;
  filtroEtiqueta.innerHTML = '<option value="">Todas las categorías</option>';
  etiquetas.forEach(et => {
    const option = document.createElement('option');
    option.value = et;
    option.textContent = et;
    filtroEtiqueta.appendChild(option);
  });
  if (seleccionActual) filtroEtiqueta.value = seleccionActual;
}

async function cargarPiezas() {
  const { data, error } = await client.from('inventario').select('*');
  if (data) {
    piezas.length = 0;
    piezas.push(...data);
    renderizarTabla();
  } else {
    mensaje.style.color = 'red';
    mensaje.textContent = 'Error al cargar datos.';
  }
}

function abrirModalEditar(id) {
  const pieza = piezas.find(p => p.id === id);
  if (!pieza) return;

  document.getElementById('editarId').value = pieza.id;
  document.getElementById('editarSerie').value = pieza.numeroSerie;
  document.getElementById('editarDescripcion').value = pieza.descripcion;
  document.getElementById('editarUbicacion').value = pieza.ubicacion;
  document.getElementById('editarEtiqueta').value = pieza.etiqueta;
  document.getElementById('editarVencimiento').value = pieza.vencimiento.split('T')[0];
  document.getElementById('editarCantidad').value = pieza.cantidad;
  document.getElementById('editarPrecio').value = pieza.precio;


  document.getElementById('modalEditar').style.display = 'flex';
}

function cerrarModal() {
  document.getElementById('modalEditar').style.display = 'none';
}

document.getElementById('formEditar').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = Number(document.getElementById('editarId').value);
  const nuevaDescripcion = document.getElementById('editarDescripcion').value.trim();
  const nuevaUbicacion = document.getElementById('editarUbicacion').value;
  const nuevaEtiqueta = document.getElementById('editarEtiqueta').value.trim();
  const nuevoVencimiento = document.getElementById('editarVencimiento').value;
  const nuevaCantidad = parseInt(document.getElementById('editarCantidad').value);
  const nuevoPrecio = parseFloat(document.getElementById('editarPrecio').value);


  try {
    const { data: datosOriginales, error: errorConsulta } = await client
      .from('inventario')
      .select('*')
      .eq('id', id)
      .single();

    if (errorConsulta || !datosOriginales) {
      throw new Error('No se pudo obtener la pieza original.');
    }

    const responsable = localStorage.getItem('nombreUsuario') || 'Desconocido';
    const registroEdicion = {
    id_producto: datosOriginales.id,
    descripcion: datosOriginales.descripcion,
    numero_serie: datosOriginales.numeroSerie,
    ubicacion: datosOriginales.ubicacion,
    etiqueta: datosOriginales.etiqueta,
    fecha_vencimiento: datosOriginales.vencimiento,
    cantidad: datosOriginales.cantidad,
    precio: nuevoPrecio, 
    precio_anterior: datosOriginales.precio != null ? datosOriginales.precio.toString() : '-', // el viejo
    fecha: new Date().toISOString().split('T')[0],
    responsable: responsable,
    accion: 'editada'
};



    const { error: errorHistorial } = await client
      .from('registros_eliminados')
      .insert([registroEdicion]);

    if (errorHistorial) {
      throw new Error('No se pudo guardar el historial de edición: ' + errorHistorial.message);
    }

    const { error } = await client
      .from('inventario')
      .update({
        descripcion: nuevaDescripcion,
        ubicacion: nuevaUbicacion,
        etiqueta: nuevaEtiqueta,
        vencimiento: nuevoVencimiento,
        cantidad: nuevaCantidad,
        precio: nuevoPrecio,
        stockmin: 5
          })

      .eq('id', id);

    if (error) {
      throw new Error('Error al actualizar la pieza: ' + error.message);
    }

    alert('Pieza actualizada y registrada en historial de edición.');
    cerrarModal();
    idEditadoRecientemente = id;
    await cargarPiezas();

  } catch (err) {
    alert('Error: ' + err.message);
    console.error(err);
  }
});

async function eliminarPieza(id) {
  const pieza = piezas.find(p => p.id === id);
  if (!pieza) {
    alert('No se encontró la pieza.');
    return;
  }

  const confirmar = confirm(`¿Estás seguro de eliminar la pieza con número de serie "${pieza.numeroSerie}"?`);
  if (!confirmar) return;

  try {
    const fechaActual = new Date().toISOString().split('T')[0];
    const responsable = localStorage.getItem('nombreUsuario') || 'Desconocido';

    const piezaEliminada = {
  id_producto: pieza.id,
  descripcion: pieza.descripcion,
  numero_serie: pieza.numeroSerie,
  ubicacion: pieza.ubicacion,
  etiqueta: pieza.etiqueta,
  fecha_vencimiento: pieza.vencimiento,
  cantidad: pieza.cantidad,
  precio: pieza.precio,
  precio_anterior: pieza.precio != null ? pieza.precio.toString() : '-', 
  fecha: fechaActual,
  responsable: responsable,
  accion: 'eliminada'
};


    const { error: insertError } = await client
      .from('registros_eliminados')
      .insert([piezaEliminada]);

    if (insertError) {
      throw new Error("Error al guardar en registros_eliminados: " + insertError.message);
    }

    const { error: deleteError } = await client
      .from('inventario')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error("Error al eliminar del inventario: " + deleteError.message);
    }

    alert('Pieza eliminada correctamente y registrada en historial.');
    await cargarPiezas();

  } catch (error) {
    alert('Error al eliminar: ' + error.message);
    console.error(error);
  }
}

function mostrarNotificaciones() {
  const main = document.querySelector('main');
  
  // Limpiar notificaciones previas
  const prevNotifs = document.querySelectorAll('.notificacion-alerta');
  prevNotifs.forEach(n => n.remove());
  
  const hoy = new Date();
  const diasParaAviso = 30;
  
  const piezasBajoStock = piezas.filter(p => p.cantidad <= p.stockmin);
  const piezasPorCaducar = piezas.filter(p => {
    const diffDias = (new Date(p.vencimiento) - hoy) / (1000 * 60 * 60 * 24);
    return diffDias > 0 && diffDias <= diasParaAviso;
  });

  // Crear contenedor de notificaciones si hay algo
  if (piezasBajoStock.length === 0 && piezasPorCaducar.length === 0) {
    return; // No hay notificaciones
  }

  const contenedor = document.createElement('div');
  contenedor.classList.add('notificacion-alerta');
  contenedor.style.backgroundColor = '#ff4444';
  contenedor.style.padding = '1rem';
  contenedor.style.borderRadius = '8px';
  contenedor.style.marginBottom = '1rem';
  contenedor.style.color = 'white';
  contenedor.style.fontWeight = 'bold';

  if (piezasBajoStock.length > 0) {
    const listaStock = piezasBajoStock.map(p => `- ${p.descripcion} (Stock: ${p.cantidad})`).join('<br>');
    const alertaStock = document.createElement('p');
    alertaStock.innerHTML = `<strong>¡Atención! Stock bajo en los siguientes productos:</strong><br>${listaStock}`;
    contenedor.appendChild(alertaStock);
  }

  if (piezasPorCaducar.length > 0) {
    const listaVencimiento = piezasPorCaducar.map(p => {
      const diasRestantes = Math.ceil((new Date(p.vencimiento) - hoy) / (1000 * 60 * 60 * 24));
      return `- ${p.descripcion} (vence en ${diasRestantes} día(s))`;
    }).join('<br>');
    const alertaVencimiento = document.createElement('p');
    alertaVencimiento.style.marginTop = '1rem';
    alertaVencimiento.innerHTML = `<strong>¡Alerta! Los siguientes productos están por caducar:</strong><br>${listaVencimiento}`;
    contenedor.appendChild(alertaVencimiento);
  }

  main.prepend(contenedor);
}
