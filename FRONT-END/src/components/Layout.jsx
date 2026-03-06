import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <aside className="w-56 bg-[#050C1C] text-gray-400 flex flex-col pt-10">
        <nav className="flex flex-col">
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
        </nav>
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
