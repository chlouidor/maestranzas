document.addEventListener('DOMContentLoaded', () => {
  const SUPABASE_URL = 'https://mtlylondrcooutpvjmfz.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bHlsb25kcmNvb3V0cHZqbWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg2MTM4MywiZXhwIjoyMDY1NDM3MzgzfQ.ohwmSF14P_ElTMEgtCP_TyrMupED6FOmTVqGgsMCmmY';
  const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const piezas = [];

  const stockMinimoContainer = document.getElementById('stockMinimoContainer');
  const tablaStockMinimo = document.getElementById('tablaStockMinimo')?.querySelector('tbody');
  const toggleStockMinimo = document.getElementById('toggleStockMinimo');
  const mensaje = document.getElementById('mensaje');

  const notificacion = document.getElementById('notificacionStockBajo');
  const reportesDiv = document.getElementById('reportesContenido');

  if (stockMinimoContainer) {
    stockMinimoContainer.style.display = 'block';
  }

  function renderizarStockMinimo(filtrarSoloAlertas = true) {
    if (!tablaStockMinimo) return;

    tablaStockMinimo.innerHTML = '';
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(hoy.getDate() + 30);

    const piezasFiltradas = filtrarSoloAlertas
      ? piezas.filter(p => {
          const cantidad = parseInt(p.cantidad);
          const stockmin = parseInt(p.stockmin);
          const vencimiento = p.vencimiento ? new Date(p.vencimiento) : null;
          return (
            (!isNaN(cantidad) && !isNaN(stockmin) && cantidad < stockmin) ||
            (vencimiento && !isNaN(vencimiento.getTime()) && vencimiento >= hoy && vencimiento <= en30Dias)
          );
        })
      : piezas;

    if (piezasFiltradas.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="6" style="text-align:center;">No hay productos que mostrar.</td>`;
      tablaStockMinimo.appendChild(tr);
      return;
    }

    piezasFiltradas.forEach(pieza => {
      const vencimiento = pieza.vencimiento ? new Date(pieza.vencimiento) : null;
      const cantidad = parseInt(pieza.cantidad);
      const stockmin = parseInt(pieza.stockmin);

      let alerta = '';
      if (!isNaN(cantidad) && !isNaN(stockmin) && cantidad < stockmin) alerta += '⚠️ Bajo stock ';
      if (vencimiento && !isNaN(vencimiento.getTime()) && vencimiento >= hoy && vencimiento <= en30Dias)
        alerta += '⏰ Por vencer';

      const tr = document.createElement('tr');
      const estaBajoStock = cantidad < stockmin;
      const estaPorVencer = vencimiento && vencimiento >= hoy && vencimiento <= en30Dias;

      if (estaBajoStock && estaPorVencer) {
        tr.style.backgroundColor = '#999999';
      } else if (estaPorVencer) {
        tr.style.backgroundColor = '#81816b';
      } else if (estaBajoStock) {
        tr.style.backgroundColor = '#a4a4a3';
      }

      tr.innerHTML = `
        <td>${pieza.id}</td>
        <td>${pieza.numeroSerie || '-'}</td>
        <td>${pieza.descripcion || '-'}</td>
        <td>${pieza.cantidad}</td>
        <td>${pieza.stockmin}</td>
        <td style="text-align:center;">${alerta}</td>
      `;
      tablaStockMinimo.appendChild(tr);
    });
  }

  if (toggleStockMinimo) {
    toggleStockMinimo.addEventListener('change', () => {
      renderizarStockMinimo(toggleStockMinimo.checked);
    });
  }

  async function cargarReportes() {
    const { data, error } = await client.from('reportes').select('*');
    if (error) {
      reportesDiv.innerHTML = '<p style="color:red;">Error al cargar los reportes.</p>';
      return;
    }

    if (!data || data.length === 0) {
      reportesDiv.innerHTML = '<p>No hay reportes disponibles.</p>';
      return;
    }

    let html = `<table style="width:100%; border-collapse:collapse; background:#fff; color:#000;">
      <thead>
        <tr>${Object.keys(data[0]).map(col => `<th style="border:1px solid #ccc; padding:5px;">${col}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${data.map(row => `<tr>${Object.values(row).map(val => `<td style="border:1px solid #ccc; padding:5px;">${val}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>`;

    reportesDiv.innerHTML = html;
  }

  function animarNotificacion() {
    if (!notificacion) return;

    notificacion.style.opacity = '0';
    notificacion.style.display = 'block';
    notificacion.style.transition = 'opacity 0.6s ease-in-out';
    setTimeout(() => {
      notificacion.style.opacity = '1';
    }, 50);
  }

  async function verificarAlertasYMostrarNotificacion() {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(hoy.getDate() + 30);

    const hayAlerta = piezas.some(p => {
      const cantidad = parseInt(p.cantidad);
      const stockmin = parseInt(p.stockmin);
      const vencimiento = p.vencimiento ? new Date(p.vencimiento) : null;

      return (
        (!isNaN(cantidad) && !isNaN(stockmin) && cantidad < stockmin) ||
        (vencimiento && !isNaN(vencimiento.getTime()) && vencimiento >= hoy && vencimiento <= en30Dias)
      );
    });

    if (hayAlerta) {
      animarNotificacion();
      await cargarReportes();
    } else {
      if (notificacion) notificacion.style.display = 'none';
      if (reportesDiv) reportesDiv.innerHTML = '';
    }
  }

  async function cargarPiezas() {
    const { data, error } = await client.from('inventario').select('*');
    if (error) {
      console.error('Error al cargar datos:', error);
      if (mensaje) {
        mensaje.style.color = 'red';
        mensaje.textContent = 'Error al cargar datos.';
      }
      return;
    }

    piezas.length = 0;
    piezas.push(...data);

    renderizarStockMinimo(toggleStockMinimo?.checked ?? true);
    await verificarAlertasYMostrarNotificacion();
  }

  cargarPiezas();
});