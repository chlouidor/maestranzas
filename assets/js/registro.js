document.addEventListener('DOMContentLoaded', () => {
  const SUPABASE_URL = 'https://mtlylondrcooutpvjmfz.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bHlsb25kcmNvb3V0cHZqbWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg2MTM4MywiZXhwIjoyMDY1NDM3MzgzfQ.ohwmSF14P_ElTMEgtCP_TyrMupED6FOmTVqGgsMCmmY';

  const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const formRegistro = document.getElementById('registroForm');
  const mensajeRegistro = document.getElementById('mensaje');
  const tablaUsuarios = document.getElementById('tablaUsuarios').getElementsByTagName('tbody')[0];

  // Función para mostrar usuarios en la tabla
  async function cargarUsuarios() {
    const { data, error } = await client
      .from('Usuario')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error al cargar usuarios:', error);
      return;
    }

    // Limpiar tabla
    tablaUsuarios.innerHTML = '';

    data.forEach((usuario) => {
      // Convertir rol numérico a texto
      let rolTexto = 'Usuario';
      if (usuario.Rol === 1) rolTexto = 'Administrador';
      else if (usuario.Rol === 3) rolTexto = 'Proveedor';

      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${usuario.id}</td>
        <td>${usuario.Nombre}</td>
        <td>${usuario.Usuario}</td>
        <td>${rolTexto}</td>
        <td><button data-id="${usuario.id}" class="btnEditar">Editar</button></td>
      `;
      tablaUsuarios.appendChild(fila);
    });

    // Agregar evento a botones editar
    document.querySelectorAll('.btnEditar').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        cargarUsuario(id);
      });
    });
  }

  // Cargar datos de usuario en el formulario para editar
  async function cargarUsuario(id) {
    const { data, error } = await client
      .from('Usuario')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al cargar usuario:', error);
      return;
    }

    document.getElementById('usuarioId').value = data.id;
    document.getElementById('nombre').value = data.Nombre;
    document.getElementById('usuario').value = data.Usuario;
    document.getElementById('contrasena').value = '';
    document.getElementById('confirmar').value = '';

    let rolTexto = 'usuario';
    if (data.Rol === 1) rolTexto = 'admin';
    else if (data.Rol === 3) rolTexto = 'proveedor';

    document.getElementById('rol').value = rolTexto;

    // Mostrar mensaje que está en modo edición
    mensajeRegistro.style.color = 'blue';
    mensajeRegistro.textContent = `Editando usuario ID ${id}. Modifica los datos y guarda.`;
  }

  if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = document.getElementById('usuarioId')?.value || '';
      const nombre = document.getElementById('nombre').value.trim();
      const usuario = document.getElementById('usuario').value.trim();
      const contrasena = document.getElementById('contrasena').value;
      const confContrasena = document.getElementById('confirmar').value;
      const rolSeleccionado = document.getElementById('rol').value;

      if (!nombre || !usuario || !contrasena || !confContrasena || !rolSeleccionado) {
        mensajeRegistro.style.color = 'red';
        mensajeRegistro.textContent = 'Todos los campos son obligatorios.';
        return;
      }

      if (contrasena !== confContrasena) {
        mensajeRegistro.style.color = 'red';
        mensajeRegistro.textContent = 'Las contraseñas no coinciden.';
        return;
      }

      let rol = 2;
      if (rolSeleccionado === 'admin') {
        rol = 1;
      } else if (rolSeleccionado === 'proveedor') {
        rol = 3;
      }

      if (id) {
        // Editar usuario
        const { data, error } = await client
          .from('Usuario')
          .update({
            Nombre: nombre,
            Usuario: usuario,
            Contrasena: contrasena,
            Rol: rol
          })
          .eq('id', id);

        if (error) {
          console.error('Error al actualizar usuario:', error);
          mensajeRegistro.style.color = 'red';
          mensajeRegistro.textContent = 'Error al actualizar usuario: ' + error.message;
          return;
        }

        mensajeRegistro.style.color = 'lightgreen';
        mensajeRegistro.textContent = 'Usuario actualizado con éxito.';
      } else {
        // Crear usuario nuevo
        const { data, error } = await client
          .from('Usuario')
          .insert([
            {
              Nombre: nombre,
              Usuario: usuario,
              Contrasena: contrasena,
              Rol: rol
            }
          ]);

        if (error) {
          console.error('Error al registrar usuario:', error);
          mensajeRegistro.style.color = 'red';
          mensajeRegistro.textContent = 'Error al registrar usuario: ' + error.message;
          return;
        }

        mensajeRegistro.style.color = 'lightgreen';
        mensajeRegistro.textContent = 'Usuario registrado con éxito.';
      }

      formRegistro.reset();
      document.getElementById('usuarioId').value = '';

      // Recargar tabla con datos actualizados
      cargarUsuarios();

      setTimeout(() => {
        mensajeRegistro.textContent = '';
      }, 3000);
    });
  }

  // Carga inicial de usuarios al cargar la página
  cargarUsuarios();
});
