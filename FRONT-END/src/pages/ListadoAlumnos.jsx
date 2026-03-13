import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon } from '@heroicons/react/24/outline';

const ESTATUS_CONFIG = {
  'BA': { etiqueta: 'Baja Académica', color: 'bg-red-100 text-red-800 border-red-200' },
  'BC': { etiqueta: 'Baja Disciplinaria', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  'BD': { etiqueta: 'Baja Reglamentaria', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  'BE': { etiqueta: 'Baja Económica', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  'BF': { etiqueta: 'Baja por Documentación Falsa', color: 'bg-lime-100 text-lime-800 border-lime-200' },
  'BI': { etiqueta: 'Baja por no inscripción', color: 'bg-green-100 text-green-800 border-green-200' },
  'BM': { etiqueta: 'Baja de materia', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  'BN': { etiqueta: 'Baja por no pago, no materias', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  'BP': { etiqueta: 'Baja por no pago', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  'BR': { etiqueta: 'Baja por no reinscripción', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  'BS': { etiqueta: 'Baja Voluntaria con Sanción', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'BU': { etiqueta: 'Baja por ID Duplicado', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  'BV': { etiqueta: 'Baja Voluntaria sin sanción', color: 'bg-violet-100 text-violet-800 border-violet-200' },
  'FI': { etiqueta: 'Baja por Defunción', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  'FP': { etiqueta: 'Baja Fuera de Procedimiento', color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' },
  'GC': { etiqueta: 'Baja por Grupo Cerrado', color: 'bg-pink-100 text-pink-800 border-pink-200' }
};

const MOCK_DATA = [
  { matricula: 111111, nombre_completo: 'Apellidop Apellidom Nombre', programa: 'MAE-MERP-22', estatus: 'BF' },
  { matricula: 222222, nombre_completo: 'García Pérez Juan', programa: 'ING-SOF-21', estatus: 'BR' },
  { matricula: 333333, nombre_completo: 'López Hernández Ana', programa: 'MAE-MERP-22', estatus: 'BA' },
  { matricula: 444444, nombre_completo: 'Martínez Ruiz Carlos', programa: 'LIC-ADM-19', estatus: 'BP' },
  { matricula: 555555, nombre_completo: 'Gómez Silva María', programa: 'ING-SOF-21', estatus: 'BV' }
];

export default function ListadoAlumnos() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);

  const alumnosFiltrados = MOCK_DATA.filter(alumno => {
    const coincideBusqueda = alumno.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             alumno.matricula.toString().includes(busqueda);
    const coincideEstatus = filtroEstatus ? alumno.estatus === filtroEstatus : true;
    return coincideBusqueda && coincideEstatus;
  });

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Listado de Alumnos Inactivos</h1>
        <button 
          onClick={() => setModalImportarAbierto(true)}
          className="bg-[#050C1C] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1A2233] transition-colors"
        >
          Importar Alumnos
        </button>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="flex gap-4 bg-gray-50 p-4 rounded-md border border-gray-200">
        <input 
          type="text" 
          placeholder="Buscar por nombre o matrícula..." 
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select 
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C] bg-white min-w-[300px]"
          value={filtroEstatus}
          onChange={(e) => setFiltroEstatus(e.target.value)}
        >
          <option value="">Todos los Estatus de Baja</option>
          {Object.entries(ESTATUS_CONFIG).map(([clave, config]) => (
            <option key={clave} value={clave}>
              {clave} - {config.etiqueta}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-[#050C1C] text-gray-300">
            <tr>
              <th className="px-6 py-4 font-medium">Matrícula</th>
              <th className="px-6 py-4 font-medium">Nombre Completo</th>
              <th className="px-6 py-4 font-medium">Programa</th>
              <th className="px-6 py-4 font-medium">Estatus</th>
              <th className="px-6 py-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {alumnosFiltrados.map((alumno) => {
              const estatusEstilo = ESTATUS_CONFIG[alumno.estatus]?.color || 'bg-gray-100 text-gray-800 border-gray-200';
              const estatusEtiqueta = ESTATUS_CONFIG[alumno.estatus]?.etiqueta || alumno.estatus;

              return (
                <tr key={alumno.matricula} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">{alumno.matricula}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{alumno.nombre_completo}</td>
                  <td className="px-6 py-4">{alumno.programa}</td>
                  <td className="px-6 py-4">
                    <span 
                      className={`px-2 py-1 rounded text-xs font-bold tracking-wide border ${estatusEstilo}`}
                      title={estatusEtiqueta}
                    >
                      {alumno.estatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/alumno/${alumno.matricula}`} 
                      className="inline-flex items-center justify-center gap-2 bg-[#050C1C] text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#1A2233] transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Detalles
                    </Link>
                  </td>
                </tr>
              );
            })}
            {alumnosFiltrados.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No se encontraron alumnos con los criterios actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Importación */}
      {modalImportarAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Importar Excel</h2>
            <p className="text-sm text-gray-600 mb-6">
              Selecciona el archivo proporcionado para actualizar la base de datos de alumnos.
            </p>
            
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-[#050C1C] hover:file:bg-gray-100 mb-6 border border-gray-200 rounded-md p-2"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setModalImportarAbierto(false)} 
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