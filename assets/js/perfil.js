document.addEventListener('DOMContentLoaded', async () => {
  const SUPABASE_URL = 'https://mtlylondrcooutpvjmfz.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bHlsb25kcmNvb3V0cHZqbWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg2MTM4MywiZXhwIjoyMDY1NDM3MzgzfQ.ohwmSF14P_ElTMEgtCP_TyrMupED6FOmTVqGgsMCmmY';
  const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const nombreUsuarioSpan = document.getElementById('nombreUsuario');
  const nombreCompletoSpan = document.getElementById('nombreCompleto');
  const rolSpan = document.getElementById('rol');
  const fotoPerfil = document.getElementById('fotoPerfil');

  const usuarioLogueado = localStorage.getItem('usuario');
  const rolLocal = localStorage.getItem('rol');

  if (!usuarioLogueado) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const { data, error } = await client
      .from('Usuario')
      .select('Nombre, Usuario, Rol')
      .eq('Usuario', usuarioLogueado)
      .single();

    if (error || !data) {
      console.error('Error al obtener datos del usuario:', error);
      nombreUsuarioSpan.textContent = `Usuario: ${usuarioLogueado}`;
      nombreCompletoSpan.textContent = usuarioLogueado;
      rolSpan.textContent = rolLocal ? capitalize(rolLocal) : 'Desconocido';
      setFotoPerfil(rolLocal);
      return;
    }

    nombreUsuarioSpan.textContent = `Usuario: ${data.Nombre || data.Usuario}`;
    nombreCompletoSpan.textContent = data.Nombre || data.Usuario;

    let rolTexto = 'Desconocido';
    let rolNum = data.Rol;
    if (rolNum === 1) rolTexto = 'Administrador';
    else if (rolNum === 2) rolTexto = 'Usuario';
    else rolTexto = rolLocal ? capitalize(rolLocal) : 'Desconocido';

    rolSpan.textContent = rolTexto;
    setFotoPerfil(rolTexto.toLowerCase());

  } catch (err) {
    console.error('Error inesperado:', err);
  }
});

function setFotoPerfil(rol) {
  const fotoPerfil = document.getElementById('fotoPerfil');
  if (!fotoPerfil) return;

  // URLs de las imágenes externas para admin y usuario
  const fotos = {
    administrador: 'https://www.creativefabrica.com/wp-content/uploads/2022/10/25/Support-Admin-icon-Graphics-43209390-1.jpg',
    admin: 'https://www.creativefabrica.com/wp-content/uploads/2022/10/25/Support-Admin-icon-Graphics-43209390-1.jpg',
    usuario: 'https://img.freepik.com/vector-premium/icono-perfil-usuario-estilo-plano-ilustracion-vector-avatar-miembro-sobre-fondo-aislado-concepto-negocio-signo-permiso-humano_157943-15752.jpg?semt=ais_hybrid&w=740',
    empleado: 'https://img.freepik.com/vector-premium/icono-perfil-usuario-estilo-plano-ilustracion-vector-avatar-miembro-sobre-fondo-aislado-concepto-negocio-signo-permiso-humano_157943-15752.jpg?semt=ais_hybrid&w=740'
  };

  fotoPerfil.src = fotos[rol] || 'https://img.freepik.com/vector-premium/icono-perfil-usuario-estilo-plano-ilustracion-vector-avatar-miembro-sobre-fondo-aislado-concepto-negocio-signo-permiso-humano_157943-15752.jpg?semt=ais_hybrid&w=740';
  fotoPerfil.alt = `Foto de perfil de ${rol}`;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function cerrarSesion() {
  localStorage.clear();
  window.location.href = 'login.html';
}
