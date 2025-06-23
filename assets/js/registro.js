document.addEventListener('DOMContentLoaded', () => {
  const SUPABASE_URL = 'https://mtlylondrcooutpvjmfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bHlsb25kcmNvb3V0cHZqbWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg2MTM4MywiZXhwIjoyMDY1NDM3MzgzfQ.ohwmSF14P_ElTMEgtCP_TyrMupED6FOmTVqGgsMCmmY';


  const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const formRegistro = document.getElementById('registroForm');
  const mensajeRegistro = document.getElementById('mensaje');

  if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
      e.preventDefault();

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

      const rol = rolSeleccionado === 'admin' ? 1 : 2;

      const { data, error } = await client
        .from('Usuario') // sin comillas dobles
        .insert([
          {
            Nombre: nombre,
            Usuario: usuario,
            Contrasena: contrasena,
            Rol: rol
          }
        ]);

      if (error) {
        console.error('Supabase error:', error); // <-- útil para depuración
        mensajeRegistro.style.color = 'red';
        mensajeRegistro.textContent = 'Error al registrar usuario: ' + error.message;
        return;
      }

      mensajeRegistro.style.color = 'lightgreen';
      mensajeRegistro.textContent = 'Usuario registrado con éxito.';
      formRegistro.reset();

      setTimeout(() => {
        window.location.href = 'configuracion.html';
      }, 1500);
    });
  }
});