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

  let piezasInventario = [];
  let asignaciones = [];
  let historialAsignaciones = []; // Para deshacer (última asignación)

  // Cargar piezas desde inventario y asignaciones desde supabase
  async function cargarDatos() {
    // Cargar inventario con cantidad disponible (suponemos que tienes campo "cantidad")
    let { data: inventario, error: errorInv } = await client.from('inventario').select('*');
    if(errorInv){
      mensajeAsignacion.textContent = "Error al cargar inventario: " + errorInv.message;
      return;
    }
    piezasInventario = inventario || [];

    // Cargar asignaciones
    let { data: asigns, error: errorAsigns } = await client.from('asignaciones').select('*');
    if(errorAsigns){
      mensajeAsignacion.textContent = "Error al cargar asignaciones: " + errorAsigns.message;
      return;
    }
    asignaciones = asigns || [];

    llenarSelectPiezas();
    renderizarAsignaciones();
  }

  // Llenar select de piezas con inventario (número de serie)
  function llenarSelectPiezas() {
    piezaSelect.innerHTML = '<option value="" disabled selected>-- Seleccione una pieza --</option>';
    piezasInventario.forEach(pieza => {
      // Asumimos que la cantidad total está en campo "cantidad" (si no, ajusta)
      // Para validar cantidad disponible, calculamos cantidad asignada
      const asignadas = asignaciones
        .filter(a => a.numero_serie === pieza.numeroSerie)
        .reduce((sum, a) => sum + a.cantidad, 0);

      const cantidadDisponible = (pieza.cantidad || 1) - asignadas;

      // Solo mostrar piezas con cantidad disponible > 0
      if (cantidadDisponible > 0) {
        const option = document.createElement('option');
        option.value = pieza.numeroSerie;
        option.textContent = `${pieza.numeroSerie} - ${pieza.descripcion} (Disponible: ${cantidadDisponible})`;
        piezaSelect.appendChild(option);
      }
    });
  }

  // Renderiza tabla de asignaciones
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

    // Asignar evento a botones eliminar asignación
    document.querySelectorAll('.btnEliminarAsignacion').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if(confirm('¿Desea eliminar esta asignación?')){
          await eliminarAsignacion(id);
        }
      });
    });
  }

  // Validar y confirmar asignación
  asignacionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeAsignacion.textContent = '';

    const numeroSerie = piezaSelect.value;
    const cantidad = parseInt(cantidadAsignar.value);
    const proyecto = proyectoInput.value.trim();
    const fase = faseSelect.value;

    if(!numeroSerie || !cantidad || !proyecto || !fase){
      mensajeAsignacion.textContent = 'Por favor complete todos los campos.';
      return;
    }
    if(cantidad <= 0){
      mensajeAsignacion.textContent = 'La cantidad debe ser mayor que cero.';
      return;
    }

    // Validar cantidad disponible
    const pieza = piezasInventario.find(p => p.numeroSerie === numeroSerie);
    if(!pieza){
      mensajeAsignacion.textContent = 'Pieza no encontrada en inventario.';
      return;
    }

    const cantidadTotal = pieza.cantidad || 1;
    const cantidadAsignadaActual = asignaciones
      .filter(a => a.numero_serie === numeroSerie)
      .reduce((sum, a) => sum + a.cantidad, 0);

    const disponible = cantidadTotal - cantidadAsignadaActual;

    if(cantidad > disponible){
      mensajeAsignacion.textContent = `Cantidad insuficiente. Disponible: ${disponible}`;
      return;
    }

    // Insertar asignación en tabla 'asignaciones' en Supabase
    const nuevaAsignacion = {
      numero_serie: numeroSerie,
      descripcion: pieza.descripcion,
      cantidad: cantidad,
      proyecto: proyecto,
      fase: fase,
      fecha_asignacion: new Date().toISOString()
    };

    const { data, error } = await client.from('asignaciones').insert([nuevaAsignacion]).select();

    if(error){
      mensajeAsignacion.style.color = 'red';
      mensajeAsignacion.textContent = 'Error al guardar asignación: ' + error.message;
      return;
    }

    // Agregar a la lista local y al historial para poder deshacer
    asignaciones.push(data[0]);
    historialAsignaciones.push(data[0]);

    mensajeAsignacion.style.color = 'green';
    mensajeAsignacion.textContent = 'Asignación guardada correctamente.';

    asignionFormReset();
    llenarSelectPiezas();
    renderizarAsignaciones();
  });

  // Deshacer última asignación
  btnDeshacer.addEventListener('click', async () => {
    if(historialAsignaciones.length === 0){
      mensajeAsignacion.style.color = 'orange';
      mensajeAsignacion.textContent = 'No hay asignaciones para deshacer.';
      return;
    }

    const ultima = historialAsignaciones.pop();

    if(confirm(`¿Desea deshacer la última asignación de la pieza ${ultima.numero_serie} (cantidad: ${ultima.cantidad})?`)){
      await eliminarAsignacion(ultima.id);
      mensajeAsignacion.style.color = 'green';
      mensajeAsignacion.textContent = 'Última asignación deshecha correctamente.';
    } else {
      // Si no quiere eliminar, la vuelve a agregar al historial
      historialAsignaciones.push(ultima);
    }
  });

  async function eliminarAsignacion(id) {
    // Elimina asignación por id en Supabase
    const { error } = await client.from('asignaciones').delete().eq('id', id);

    if(error){
      alert('Error al eliminar asignación: ' + error.message);
      return;
    }

    // Eliminar localmente
    asignaciones = asignaciones.filter(a => a.id != id);
    historialAsignaciones = historialAsignaciones.filter(a => a.id != id);

    llenarSelectPiezas();
    renderizarAsignaciones();
  }

  function asignionFormReset(){
    asignacionForm.reset();
    // Reset fase select porque tiene opción disabled selected
    faseSelect.value = '';
    piezaSelect.value = '';
    cantidadAsignar.value = 1;
  }

  // Al cargar la página
  window.addEventListener('load', cargarDatos);