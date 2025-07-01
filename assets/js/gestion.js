const SUPABASE_URL = 'https://mtlylondrcooutpvjmfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bHlsb25kcmNvb3V0cHZqbWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg2MTM4MywiZXhwIjoyMDY1NDM3MzgzfQ.ohwmSF14P_ElTMEgtCP_TyrMupED6FOmTVqGgsMCmmY';
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const piezaSelect = document.getElementById('piezaSelect');
const cantidadAsignar = document.getElementById('cantidadAsignar');
const proyectoInput = document.getElementById('proyecto');
const faseSelect = document.getElementById('fase');
const asignacionForm = document.getElementById('asignacionForm');
const mensajeAsignacion = document.getElementById('mensajeAsignacion');
const cuerpoAsignaciones = document.getElementById('cuerpoAsignaciones');
const btnDeshacer = document.getElementById('btnDeshacer');

const filtroProyecto = document.getElementById('filtroProyecto');
const fechaInicio = document.getElementById('fechaInicio');
const fechaFin = document.getElementById('fechaFin');
const btnFiltrar = document.getElementById('btnFiltrar');
const cuerpoInformes = document.getElementById('cuerpoInformes');

let piezasInventario = [];
let asignaciones = [];
let historialAsignaciones = [];

async function cargarDatos() {
  let { data: inventario, error: errorInv } = await client.from('inventario').select('*');
  if (errorInv) {
    mensajeAsignacion.textContent = "Error al cargar inventario: " + errorInv.message;
    return;
  }
  piezasInventario = inventario || [];

  let { data: asigns, error: errorAsigns } = await client.from('asignaciones').select('*');
  if (errorAsigns) {
    mensajeAsignacion.textContent = "Error al cargar asignaciones: " + errorAsigns.message;
    return;
  }
  asignaciones = asigns || [];

  llenarSelectPiezas();
  renderizarAsignaciones();
  llenarSelectProyectos();
}

function llenarSelectPiezas() {
  piezaSelect.innerHTML = '<option value="" disabled selected>-- Seleccione una pieza --</option>';
  piezasInventario.forEach(pieza => {
    const asignadas = asignaciones
      .filter(a => a.numero_serie === pieza.numeroSerie)
      .reduce((sum, a) => sum + a.cantidad, 0);

    const cantidadDisponible = (pieza.cantidad || 1) - asignadas;

    if (cantidadDisponible > 0) {
      const option = document.createElement('option');
      option.value = pieza.numeroSerie;
      option.textContent = `${pieza.numeroSerie} - ${pieza.descripcion} (Disponible: ${cantidadDisponible})`;
      piezaSelect.appendChild(option);
    }
  });
}

function renderizarAsignaciones() {
  cuerpoAsignaciones.innerHTML = '';
  asignaciones.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.numero_serie}</td>
      <td>${a.descripcion}</td>
      <td>${a.cantidad}</td>
      <td>${a.proyecto}</td>
      <td>${a.fase}</td>
      <td>${new Date(a.fecha_asignacion).toLocaleString()}</td>
      <td><button data-id="${a.id}" class="btnEliminarAsignacion">Eliminar</button></td>
    `;
    cuerpoAsignaciones.appendChild(tr);
  });

  document.querySelectorAll('.btnEliminarAsignacion').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if (confirm('¿Desea eliminar esta asignación?')) {
        await eliminarAsignacion(id);
      }
    });
  });
}

asignacionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensajeAsignacion.textContent = '';

  const numeroSerie = piezaSelect.value;
  const cantidad = parseInt(cantidadAsignar.value);
  const proyecto = proyectoInput.value.trim();
  const fase = faseSelect.value;

  if (!numeroSerie || !cantidad || !proyecto || !fase) {
    mensajeAsignacion.textContent = 'Por favor complete todos los campos.';
    return;
  }
  if (cantidad <= 0) {
    mensajeAsignacion.textContent = 'La cantidad debe ser mayor que cero.';
    return;
  }

  const pieza = piezasInventario.find(p => p.numeroSerie === numeroSerie);
  if (!pieza) {
    mensajeAsignacion.textContent = 'Pieza no encontrada en inventario.';
    return;
  }

  const cantidadTotal = pieza.cantidad || 1;
  const cantidadAsignadaActual = asignaciones
    .filter(a => a.numero_serie === numeroSerie)
    .reduce((sum, a) => sum + a.cantidad, 0);

  const disponible = cantidadTotal - cantidadAsignadaActual;

  if (cantidad > disponible) {
    mensajeAsignacion.textContent = `Cantidad insuficiente. Disponible: ${disponible}`;
    return;
  }

  const nuevaAsignacion = {
    numero_serie: numeroSerie,
    descripcion: pieza.descripcion,
    cantidad: cantidad,
    proyecto: proyecto,
    fase: fase,
    fecha_asignacion: new Date().toISOString()
  };

  const { data, error } = await client.from('asignaciones').insert([nuevaAsignacion]).select();

  if (error) {
    mensajeAsignacion.style.color = 'red';
    mensajeAsignacion.textContent = 'Error al guardar asignación: ' + error.message;
    return;
  }

  asignaciones.push(data[0]);
  historialAsignaciones.push(data[0]);

  mensajeAsignacion.style.color = 'green';
  mensajeAsignacion.textContent = 'Asignación guardada correctamente.';

  asignionFormReset();
  llenarSelectPiezas();
  renderizarAsignaciones();
  llenarSelectProyectos();
});

btnDeshacer.addEventListener('click', async () => {
  if (historialAsignaciones.length === 0) {
    mensajeAsignacion.style.color = 'orange';
    mensajeAsignacion.textContent = 'No hay asignaciones para deshacer.';
    return;
  }

  const ultima = historialAsignaciones.pop();

  if (confirm(`¿Desea deshacer la última asignación de la pieza ${ultima.numero_serie} (cantidad: ${ultima.cantidad})?`)) {
    await eliminarAsignacion(ultima.id);
    mensajeAsignacion.style.color = 'green';
    mensajeAsignacion.textContent = 'Última asignación deshecha correctamente.';
  } else {
    historialAsignaciones.push(ultima);
  }
});

async function eliminarAsignacion(id) {
  const { error } = await client.from('asignaciones').delete().eq('id', id);
  if (error) {
    alert('Error al eliminar asignación: ' + error.message);
    return;
  }

  asignaciones = asignaciones.filter(a => a.id != id);
  historialAsignaciones = historialAsignaciones.filter(a => a.id != id);

  llenarSelectPiezas();
  renderizarAsignaciones();
  llenarSelectProyectos();
}

function asignionFormReset() {
  asignacionForm.reset();
  faseSelect.value = '';
  piezaSelect.value = '';
  cantidadAsignar.value = 1;
}

// ✅ Esta función estaba mal ubicada. Ahora está fuera y lista.
function llenarSelectProyectos() {
  const proyectosUnicos = [...new Set(asignaciones.map(a => a.proyecto))].sort();
  filtroProyecto.innerHTML = '<option value="" selected>-- Todos los proyectos --</option>';
  proyectosUnicos.forEach(proy => {
    const option = document.createElement('option');
    option.value = proy;
    option.textContent = proy;
    filtroProyecto.appendChild(option);
  });
}

// ✅ Filtro por proyecto y fechas
btnFiltrar.addEventListener('click', () => {
  const proyecto = filtroProyecto.value;
  const inicio = fechaInicio.value ? new Date(fechaInicio.value) : null;
  const fin = fechaFin.value ? new Date(fechaFin.value) : null;

  const filtradas = asignaciones.filter(a => {
    const fecha = new Date(a.fecha_asignacion);
    return (!proyecto || a.proyecto === proyecto) &&
           (!inicio || fecha >= inicio) &&
           (!fin || fecha <= fin);
  });

  cuerpoInformes.innerHTML = '';
  if (filtradas.length === 0) {
    cuerpoInformes.innerHTML = '<tr><td colspan="6">No se encontraron asignaciones.</td></tr>';
    return;
  }

  filtradas.forEach(a => {
    const fila = `
      <tr>
        <td>${a.numero_serie}</td>
        <td>${a.descripcion}</td>
        <td>${a.cantidad}</td>
        <td>${a.proyecto}</td>
        <td>${a.fase}</td>
        <td>${new Date(a.fecha_asignacion).toLocaleDateString()}</td>
      </tr>`;
    cuerpoInformes.insertAdjacentHTML('beforeend', fila);
  });
});


document.getElementById('exportarExcel').addEventListener('click', () => {
  const tabla = document.getElementById('tablaInformes');
  const wb = XLSX.utils.table_to_book(tabla, { sheet: "Informe" });
  XLSX.writeFile(wb, 'informe_asignaciones.xlsx');
});

document.getElementById('exportarPDF').addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Informe de Asignaciones", 10, 10);
  let y = 20;

  asignaciones.slice(0, 20).forEach((a, i) => {
    doc.text(`${i + 1}. ${a.numero_serie} - ${a.descripcion} - ${a.cantidad} - ${a.proyecto}`, 10, y);
    y += 10;
  });

  doc.save("informe_asignaciones.pdf");
});


window.addEventListener('load', cargarDatos);
