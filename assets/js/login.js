document.addEventListener('DOMContentLoaded', () => {
  const SUPABASE_URL = 'https://mtlylondrcooutpvjmfz.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bHlsb25kcmNvb3V0cHZqbWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg2MTM4MywiZXhwIjoyMDY1NDM3MzgzfQ.ohwmSF14P_ElTMEgtCP_TyrMupED6FOmTVqGgsMCmmY';
  const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const loginForm = document.getElementById('loginForm');
  const mensajeError = document.getElementById('mensajeError');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const contrasena = document.getElementById('contrasena').value.trim();

    if (!usuario || !contrasena) {
      mensajeError.textContent = 'Por favor completa todos los campos.';
      return;
    }

    try {
      // Trae el campo Nombre además de Usuario, Contrasena, Rol
      const { data, error } = await client
        .from('Usuario')  // usa el nombre correcto de tu tabla
        .select('Usuario, Contrasena, Rol, Nombre')
        .eq('Usuario', usuario)
        .limit(1)
        .single();

      if (error) {
        mensajeError.textContent = 'Error en la consulta: ' + error.message;
        return;
      }

      if (!data) {
        mensajeError.textContent = 'Usuario o contraseña incorrectos.';
        return;
      }

      if (data.Contrasena !== contrasena) {
        mensajeError.textContent = 'Usuario o contraseña incorrectos.';
        return;
      }

      // Login correcto
      const rol = data.Rol === 1 ? 'admin' : 'usuario';
      localStorage.setItem('rol', rol);
      localStorage.setItem('usuario', data.Usuario);
      localStorage.setItem('nombreUsuario', data.Nombre);  // <--- guardo el nombre completo

      // Redirigir según rol
      if (rol === 'admin') {
        window.location.href = 'menuadmin.html';
      } else {
        window.location.href = 'menu.html';
      }
    } catch (err) {
      console.error(err);
      mensajeError.textContent = 'Error inesperado: ' + err.message;
    }
  });
});
