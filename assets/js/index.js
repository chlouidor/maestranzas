const SUPABASE_URL = 'https://mtlylondrcooutpvjmfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bHlsb25kcmNvb3V0cHZqbWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg2MTM4MywiZXhwIjoyMDY1NDM3MzgzfQ.ohwmSF14P_ElTMEgtCP_TyrMupED6FOmTVqGgsMCmmY';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('formPieza');
const mensaje = document.getElementById('mensaje');
const tabla = document.getElementById('tablaPiezas');
const filtroEtiqueta = document.getElementById('filtroEtiqueta');
const botonFiltrar = document.getElementById('botonFiltrar');


const piezas = [];

let idEditadoRecientemente = null; // Variable para resaltar fila editada

// Cargar piezas al iniciar
window.addEventListener('load', async () => {
  await cargarPiezas();
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
  };

  if (new Date(pieza.vencimiento) < new Date().setHours(0, 0, 0, 0)) {
    mensaje.style.color = 'red';
    mensaje.textContent = 'No se puede registrar un producto vencido.';
    return;
  }

  // Insertar en la tabla de inventario
  const { data, error } = await client.from('inventario').insert([pieza]).select();

  if (error) {
    mensaje.style.color = 'red';
    mensaje.textContent = 'Error al guardar: ' + error.message;
  } else {
    mensaje.style.color = 'lightgreen';
    mensaje.textContent = 'Pieza agregada con éxito.';
    form.reset();
    await cargarPiezas();

    // Insertar en la tabla de registros_eliminados con acción "agregada"
    const piezaInsertada = data[0]; 

    const registro = {
      id_producto: piezaInsertada.id || null,
      descripcion: piezaInsertada.descripcion,
      numero_serie: piezaInsertada.numeroSerie,
      ubicacion: piezaInsertada.ubicacion,
      etiqueta: piezaInsertada.etiqueta,
      fecha_vencimiento: piezaInsertada.vencimiento,
      fecha: new Date().toISOString(),
      responsable: localStorage.getItem('rol') || 'desconocido',
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
      <td>${pieza.numeroSerie}</td>
      <td>${pieza.descripcion}</td>
      <td>${pieza.ubicacion}</td>
      <td>${pieza.etiqueta}</td>
      <td>${new Date(pieza.vencimiento).toLocaleDateString()}</td>
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
    alert(`Detalles:\nSerie: ${pieza.numeroSerie}\nDescripción: ${pieza.descripcion}\nUbicación: ${pieza.ubicacion}\nEtiqueta: ${pieza.etiqueta}\nVence: ${new Date(pieza.vencimiento).toLocaleDateString()}`);
  }
}

// Filtro
function filtrarPorEtiqueta() {
  const etiquetaSeleccionada = filtroEtiqueta.value;
  const filtradas = etiquetaSeleccionada ? piezas.filter(p => p.etiqueta === etiquetaSeleccionada) : piezas;
  renderizarTabla(filtradas);
  localStorage.setItem('ultimoFiltro', etiquetaSeleccionada);
}

// Dropdown dinámico
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

// Cargar desde Supabase
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

// Abrir modal para editar
function abrirModalEditar(id) {
  const pieza = piezas.find(p => p.id === id);
  if (!pieza) return;

  document.getElementById('editarId').value = pieza.id;               
  document.getElementById('editarSerie').value = pieza.numeroSerie;   
  document.getElementById('editarDescripcion').value = pieza.descripcion;
  document.getElementById('editarUbicacion').value = pieza.ubicacion;
  document.getElementById('editarEtiqueta').value = pieza.etiqueta;
  document.getElementById('editarVencimiento').value = pieza.vencimiento.split('T')[0];

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

  try {
    // 1. Obtener los datos actuales antes de actualizar
    const { data: datosOriginales, error: errorConsulta } = await client
      .from('inventario')
      .select('*')
      .eq('id', id)
      .single();

    if (errorConsulta || !datosOriginales) {
      throw new Error('No se pudo obtener la pieza original.');
    }

    // 2. Obtener datos de usuario y rol desde localStorage
    const rol = localStorage.getItem('rol') || 'Desconocido';
    const responsable = `${rol}`;

    // 3. Insertar en registros_eliminados como movimiento de tipo "editar"
    const fechaActual = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    const registroEdicion = {
      id_producto: datosOriginales.id,
      descripcion: datosOriginales.descripcion,
      numero_serie: datosOriginales.numeroSerie,
      ubicacion: datosOriginales.ubicacion,
      etiqueta: datosOriginales.etiqueta,
      fecha_vencimiento: datosOriginales.vencimiento,
      fecha: fechaActual,
      responsable: responsable,
      accion: 'editada'
    };

    const { error: errorHistorial } = await client
      .from('registros_eliminados')
      .insert([registroEdicion]);

    if (errorHistorial) {
      throw new Error('No se pudo guardar el historial de edición: ' + errorHistorial.message);
    }

    // 4. Actualizar la pieza
    const { error } = await client
      .from('inventario')
      .update({
        descripcion: nuevaDescripcion,
        ubicacion: nuevaUbicacion,
        etiqueta: nuevaEtiqueta,
        vencimiento: nuevoVencimiento,
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
    const fechaActual = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD

    // Obtener usuario y rol desde localStorage
    const rol = localStorage.getItem('rol') || 'Desconocido';

    // Componer responsable
    const responsable = `${rol}`;

    const piezaEliminada = {
      id_producto: pieza.id,
      descripcion: pieza.descripcion,
      numero_serie: pieza.numeroSerie,
      ubicacion: pieza.ubicacion,
      etiqueta: pieza.etiqueta,
      fecha_vencimiento: pieza.vencimiento,
      fecha: fechaActual,
      responsable: responsable,
      accion: 'eliminada'  
    };

    // Insertar en registros_eliminados
    const { error: insertError } = await client
      .from('registros_eliminados')
      .insert([piezaEliminada]);

    if (insertError) {
      throw new Error("Error al guardar en registros_eliminados: " + insertError.message);
    }

    // Eliminar del inventario
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







