import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <aside className="w-56 bg-[#050C1C] text-gray-400 flex flex-col pt-10">
        <nav className="flex flex-col flex-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `block w-full px-6 py-4 text-sm transition-colors ${
                isActive ? 'text-white font-semibold bg-[#1A2233]' : 'hover:bg-[#1A2233] hover:text-white'
              }`
            }
          >
            Listado de Alumnos
          </NavLink>
          <NavLink
            to="/planes-estudio"
            className={({ isActive }) =>
              `block w-full px-6 py-4 text-sm transition-colors ${
                isActive ? 'text-white font-semibold bg-[#1A2233]' : 'hover:bg-[#1A2233] hover:text-white'
              }`
            }
          >
            Planes de Estudio
          </NavLink>

          <NavLink
            to="/logs"
            className={({ isActive }) =>
              `block w-full px-6 py-4 text-sm transition-colors ${
                isActive ? 'text-white font-semibold bg-[#1A2233]' : 'hover:bg-[#1A2233] hover:text-white'
              }`
            }
          >
            Registro de Actividad
          </NavLink>

        </nav>
        
        {/* Panel de Usuario al final del sidebar */}
        <div className="p-4 bg-[#0a1428] border-t border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Sesión activa:</p>
          <p className="text-sm text-white truncate mb-3" title={currentUser?.email}>
            {currentUser?.email}
          </p>
          <button 
            onClick={handleLogout}
            className="w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-white p-10 shadow-inner">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}