import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function LogsActividad() {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [filtros, setFiltros] = useState({
    usuario: '',
    accion: '',
    coleccion: '',
    documento_id: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  const [opcionesFiltro, setOpcionesFiltro] = useState({
    usuarios: [],
    acciones: [],
    colecciones: [],
    documentos: []
  });

  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 15;

  useEffect(() => {
    const cargarLogs = async () => {
      try {
        const q = query(collection(db, 'logs_actividad'), orderBy('fecha', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setLogs(data);

        const getUnicos = (key) => [...new Set(data.map(item => item[key]).filter(Boolean))];
        
        setOpcionesFiltro({
          usuarios: getUnicos('usuario'),
          acciones: getUnicos('accion'),
          colecciones: getUnicos('coleccion'),
          documentos: getUnicos('documento_id')
        });
      } catch (error) {
        console.error("Error al cargar logs:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarLogs();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros]);

  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      usuario: '', accion: '', coleccion: '', documento_id: '', fechaDesde: '', fechaHasta: ''
    });
  };

  const logsFiltrados = logs.filter(log => {
    const matchUsuario = !filtros.usuario || log.usuario === filtros.usuario;
    const matchAccion = !filtros.accion || log.accion === filtros.accion;
    const matchColeccion = !filtros.coleccion || log.coleccion === filtros.coleccion;
    const matchDocumento = !filtros.documento_id || log.documento_id === filtros.documento_id;

    let matchFechaDesde = true;
    let matchFechaHasta = true;
    const fechaLog = log.fecha.split('T')[0]; // Extraer solo la parte YYYY-MM-DD

    if (filtros.fechaDesde) {
      matchFechaDesde = fechaLog >= filtros.fechaDesde;
    }
    if (filtros.fechaHasta) {
      matchFechaHasta = fechaLog <= filtros.fechaHasta;
    }

    return matchUsuario && matchAccion && matchColeccion && matchDocumento && matchFechaDesde && matchFechaHasta;
  });

  const indiceUltimoLog = paginaActual * elementosPorPagina;
  const indicePrimerLog = indiceUltimoLog - elementosPorPagina;
  const logsPaginados = logsFiltrados.slice(indicePrimerLog, indiceUltimoLog);
  const totalPaginas = Math.ceil(logsFiltrados.length / elementosPorPagina);

  const formatearFecha = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('es-MX', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-4 relative w-full h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Logs de Actividad</h1>

      {/* Panel de Filtros */}
      <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1">Desde Fecha</label>
          <input 
            type="date" 
            name="fechaDesde"
            value={filtros.fechaDesde}
            max={filtros.fechaHasta || undefined} 
            onChange={handleChangeFiltro}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1">Hasta Fecha</label>
          <input 
            type="date" 
            name="fechaHasta"
            value={filtros.fechaHasta}
            min={filtros.fechaDesde || undefined}
            onChange={handleChangeFiltro}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1">Usuario</label>
          <select name="usuario" value={filtros.usuario} onChange={handleChangeFiltro} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]">
            <option value="">Todos</option>
            {opcionesFiltro.usuarios.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1">Acción</label>
          <select name="accion" value={filtros.accion} onChange={handleChangeFiltro} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]">
            <option value="">Todas</option>
            {opcionesFiltro.acciones.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1">Colección</label>
          <select name="coleccion" value={filtros.coleccion} onChange={handleChangeFiltro} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]">
            <option value="">Todas</option>
            {opcionesFiltro.colecciones.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1">ID Documento / Matrícula</label>
          <select name="documento_id" value={filtros.documento_id} onChange={handleChangeFiltro} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]">
            <option value="">Todos</option>
            {opcionesFiltro.documentos.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="md:col-span-3 flex justify-end">
          <button onClick={limpiarFiltros} className="text-sm text-gray-500 hover:text-gray-800 transition-colors underline">
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-[#050C1C] text-gray-300">
              <tr>
                <th className="px-4 py-2.5 font-medium">Fecha y Hora</th>
                <th className="px-4 py-2.5 font-medium">Usuario</th>
                <th className="px-4 py-2.5 font-medium">Acción</th>
                <th className="px-4 py-2.5 font-medium">Colección</th>
                <th className="px-4 py-2.5 font-medium">Documento ID</th>
                <th className="px-4 py-2.5 font-medium w-1/3">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cargando ? (
                <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-500">Cargando registros...</td></tr>
              ) : logsPaginados.length > 0 ? (
                logsPaginados.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">{formatearFecha(log.fecha)}</td>
                    <td className="px-4 py-2 font-medium">{log.usuario}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                        log.accion === 'LOGIN' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        log.accion === 'CREATE' ? 'bg-green-100 text-green-800 border-green-200' :
                        log.accion === 'UPDATE' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        log.accion === 'IMPORT' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="px-4 py-2 uppercase text-xs font-semibold">{log.coleccion}</td>
                    <td className="px-4 py-2">{log.documento_id || '-'}</td>
                    <td className="px-4 py-2">
                      {log.campo_afectado && <span className="block text-xs text-gray-400 mb-0.5">Campo: {log.campo_afectado}</span>}
                      {log.detalles || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-500">No hay registros que coincidan con los filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {logsFiltrados.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2.5">
            <div className="text-sm text-gray-700">
              Mostrando del <span className="font-medium">{indicePrimerLog + 1}</span> al{' '}
              <span className="font-medium">{Math.min(indiceUltimoLog, logsFiltrados.length)}</span>{' '}
              de <span className="font-medium">{logsFiltrados.length}</span> registros
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} disabled={paginaActual === 1} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50">Anterior</button>
              <span className="px-3 py-1 text-sm font-medium">Página {paginaActual} de {totalPaginas}</span>
              <button onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaActual === totalPaginas} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}