let API_URL;
let API_TOKEN = localStorage.getItem('token') || null;

document.addEventListener('DOMContentLoaded', () => {
  API_URL = document.body.dataset.apiUrl;
  
  // Configurar Axios con token si existe
  if (API_TOKEN) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${API_TOKEN}`;
    actualizarEstadoAutenticacion(true);
    cargarTareas();
  }
  
  // Event listeners
  document.getElementById('formLogin')?.addEventListener('submit', login);
  document.getElementById('formRegister')?.addEventListener('submit', register);
  document.getElementById('formCrearTarea')?.addEventListener('submit', crearTarea);
  document.getElementById('formEditarTarea')?.addEventListener('submit', actualizarTarea);
  document.getElementById('btnLogout')?.addEventListener('click', logout);
});

// ========== Funciones de Autenticación ==========
async function login(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    API_TOKEN = response.data.token;
    
    // Guardar token y configurar axios
    localStorage.setItem('token', API_TOKEN);
    axios.defaults.headers.common['Authorization'] = `Bearer ${API_TOKEN}`;
    
    // Actualizar UI
    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    actualizarEstadoAutenticacion(true);
    cargarTareas();
    mostrarExito('Sesión iniciada correctamente');
  } catch (error) {
    mostrarError('Credenciales incorrectas');
  }
}

async function register(e) {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
  
  if (password !== passwordConfirm) {
    mostrarError('Las contraseñas no coinciden');
    return;
  }
  
  try {
    await axios.post(`${API_URL}/api/auth/register`, { email, password });
    bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
    mostrarExito('Usuario registrado. Ahora puedes iniciar sesión');
  } catch (error) {
    mostrarError('Error al registrar usuario');
  }
}

function logout() {
  localStorage.removeItem('token');
  API_TOKEN = null;
  delete axios.defaults.headers.common['Authorization'];
  actualizarEstadoAutenticacion(false);
  mostrarExito('Sesión cerrada correctamente');
}

function actualizarEstadoAutenticacion(autenticado) {
  const navbar = document.querySelector('.navbar .d-flex');
  const tareasContainer = document.getElementById('tareasContainer');
  
  if (autenticado) {
    navbar.innerHTML = `
      <button id="btnLogout" class="btn btn-outline-light" type="button">Cerrar sesión</button>
    `;
    document.getElementById('btnLogout').addEventListener('click', logout);
    tareasContainer.innerHTML = `
      <div class="d-flex justify-content-between mb-4">
        <h1>Mis Tareas</h1>
        <button class="btn btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#crearTareaModal">
          <i class="bi bi-plus-lg"></i> Nueva Tarea
        </button>
      </div>
      <div class="table-responsive">
        <table id="tablaTareas" class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Título</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `;
  } else {
    navbar.innerHTML = `
      <button class="btn btn-light me-2" type="button" data-bs-toggle="modal" data-bs-target="#loginModal">Iniciar Sesión</button>
      <button class="btn btn-success" type="button" data-bs-toggle="modal" data-bs-target="#registerModal">Registrarse</button>
    `;
    tareasContainer.innerHTML = `
      <div class="text-center py-5">
        <h2>Bienvenido a la App de Tareas</h2>
        <p class="mb-4">Inicia sesión o regístrate para gestionar tus tareas</p>
        <div class="d-flex justify-content-center gap-3">
          <button class="btn btn-primary btn-lg" type="button" data-bs-toggle="modal" data-bs-target="#loginModal">Iniciar Sesión</button>
          <button class="btn btn-success btn-lg" type="button" data-bs-toggle="modal" data-bs-target="#registerModal">Registrarse</button>
        </div>
      </div>
    `;
  }
}

// ========== Funciones CRUD ==========
async function cargarTareas() {
  try {
    const response = await axios.get(`${API_URL}/api/tareas`);
    renderizarTareas(response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      mostrarError('Sesión expirada. Por favor inicia sesión nuevamente');
      logout();
    } else {
      mostrarError('Error al cargar tareas');
    }
  }
}

function renderizarTareas(tareas) {
  const tbody = document.querySelector('#tablaTareas tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  tareas.forEach(tarea => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${tarea.titulo}</td>
      <td>
        <span class="badge ${tarea.completado ? 'bg-success' : 'bg-secondary'}">
          ${tarea.completado ? 'Completado' : 'Pendiente'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-warning me-2" onclick="abrirEditarModal(${tarea.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" 
                data-bs-toggle="modal" 
                data-bs-target="#eliminarTareaModal"
                onclick="document.getElementById('eliminarId').value = ${tarea.id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function abrirEditarModal(id) {
  try {
    const response = await axios.get(`${API_URL}/api/tareas/${id}`);
    const tarea = response.data;
    
    document.getElementById('editarId').value = tarea.id;
    document.getElementById('editarTitulo').value = tarea.titulo;
    document.getElementById('editarCompletado').checked = tarea.completado;
    
    new bootstrap.Modal(document.getElementById('editarTareaModal')).show();
  } catch (error) {
    mostrarError('Error al cargar tarea');
  }
}

async function crearTarea(e) {
  e.preventDefault();
  const titulo = document.getElementById('tituloTarea').value;
  
  try {
    await axios.post(`${API_URL}/api/tareas`, { titulo });
    document.getElementById('formCrearTarea').reset();
    bootstrap.Modal.getInstance(document.getElementById('crearTareaModal')).hide();
    cargarTareas();
    mostrarExito('Tarea creada correctamente');
  } catch (error) {
    mostrarError('Error al crear tarea');
  }
}

async function actualizarTarea(e) {
  e.preventDefault();
  const id = document.getElementById('editarId').value;
  const datos = {
    titulo: document.getElementById('editarTitulo').value,
    completado: document.getElementById('editarCompletado').checked
  };
  
  try {
    await axios.put(`${API_URL}/api/tareas/${id}`, datos);
    bootstrap.Modal.getInstance(document.getElementById('editarTareaModal')).hide();
    cargarTareas();
    mostrarExito('Tarea actualizada correctamente');
  } catch (error) {
    mostrarError('Error al actualizar tarea');
  }
}

async function confirmarEliminacion() {
  const id = document.getElementById('eliminarId').value;
  
  try {
    await axios.delete(`${API_URL}/api/tareas/${id}`);
    bootstrap.Modal.getInstance(document.getElementById('eliminarTareaModal')).hide();
    cargarTareas();
    mostrarExito('Tarea eliminada correctamente');
  } catch (error) {
    mostrarError('Error al eliminar tarea');
  }
}

// ========== Funciones Auxiliares ==========
function mostrarError(mensaje) {
  const alerta = document.createElement('div');
  alerta.className = 'alert alert-danger alert-dismissible fade show';
  alerta.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  const container = document.getElementById('alertaContainer');
  container.innerHTML = '';
  container.appendChild(alerta);
  
  setTimeout(() => {
    alerta.remove();
  }, 5000);
}

function mostrarExito(mensaje) {
  const alerta = document.createElement('div');
  alerta.className = 'alert alert-success alert-dismissible fade show';
  alerta.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  const container = document.getElementById('alertaContainer');
  container.innerHTML = '';
  container.appendChild(alerta);
  
  setTimeout(() => {
    alerta.remove();
  }, 5000);
}

// Funciones globales para acceso desde HTML
window.abrirEditarModal = abrirEditarModal;
window.confirmarEliminacion = confirmarEliminacion;