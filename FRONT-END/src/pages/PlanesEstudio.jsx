import { useState } from 'react';
import { EyeIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const MOCK_PLANES = [
  { id: 1, codigo: 'MAE-MERP-22', nombre: 'Maestría en Relaciones Públicas', nivel: 'Posgrado', tabla_equivalencia: 'equiv_merp_22.xlsx' },
  { id: 2, codigo: 'ING-SOF-21', nombre: 'Ingeniería en Software', nivel: 'Licenciatura', tabla_equivalencia: null },
  { id: 3, codigo: 'LIC-ADM-19', nombre: 'Licenciatura en Administración', nivel: 'Licenciatura', tabla_equivalencia: 'equiv_adm_19.csv' }
];

export default function PlanesEstudio() {
  const [busqueda, setBusqueda] = useState('');
  const [modalImportarPlanes, setModalImportarPlanes] = useState(false);
  
  const [modalEquivalenciaAbierto, setModalEquivalenciaAbierto] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);

  const planesFiltrados = MOCK_PLANES.filter(plan => 
    plan.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    plan.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirModalEquivalencia = (plan) => {
    setPlanSeleccionado(plan);
    setModalEquivalenciaAbierto(true);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Planes de Estudio</h1>
        <button 
          onClick={() => setModalImportarPlanes(true)}
          className="bg-[#050C1C] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1A2233] transition-colors"
        >
          Importar Planes
        </button>
      </div>

      {/* Controles de Búsqueda */}
      <div className="flex gap-4 bg-gray-50 p-4 rounded-md border border-gray-200">
        <input 
          type="text" 
          placeholder="Buscar por código o nombre del programa..." 
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-[#050C1C] text-gray-300">
            <tr>
              <th className="px-6 py-4 font-medium">Código</th>
              <th className="px-6 py-4 font-medium">Nombre del Programa</th>
              <th className="px-6 py-4 font-medium">Nivel</th>
              <th className="px-6 py-4 font-medium">Tabla de Equivalencias</th>
              <th className="px-6 py-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {planesFiltrados.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{plan.codigo}</td>
                <td className="px-6 py-4">{plan.nombre}</td>
                <td className="px-6 py-4">{plan.nivel}</td>
                <td className="px-6 py-4">
                  {plan.tabla_equivalencia ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                      {plan.tabla_equivalencia}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100">
                      Faltante
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => abrirModalEquivalencia(plan)}
                      className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
                      title="Subir tabla de equivalencias"
                    >
                      <ArrowUpTrayIcon className="w-4 h-4" />
                    </button>
                    <button className="inline-flex items-center justify-center gap-2 bg-[#050C1C] text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#1A2233] transition-colors">
                      <EyeIcon className="w-4 h-4" />
                      Detalles
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {planesFiltrados.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No se encontraron planes de estudio.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Importación de Planes */}
      {modalImportarPlanes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Importar Planes de Estudio</h2>
            <p className="text-sm text-gray-600 mb-6">
              Selecciona el archivo para actualizar el catálogo general de planes.
            </p>
            
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-[#050C1C] hover:file:bg-gray-100 mb-6 border border-gray-200 rounded-md p-2"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setModalImportarPlanes(false)} 
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={(e) => e.preventDefault()} 
                className="bg-[#050C1C] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1A2233] transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación de Equivalencias */}
      {modalEquivalenciaAbierto && planSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Subir Tabla de Equivalencias</h2>
            <p className="text-sm text-gray-600 mb-6">
              Asignando tabla para el plan: <span className="font-bold text-[#050C1C]">{planSeleccionado.codigo}</span>
            </p>
            
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-[#050C1C] hover:file:bg-gray-100 mb-6 border border-gray-200 rounded-md p-2"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setModalEquivalenciaAbierto(false)} 
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={(e) => e.preventDefault()} 
                className="bg-[#050C1C] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1A2233] transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}