import { useState, useEffect } from 'react';
import { EyeIcon, ArrowUpTrayIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { procesarPDF } from '../utils/procesarPDF';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function PlanesEstudio() {
  const [planes, setPlanes] = useState([]); 
  const [busqueda, setBusqueda] = useState('');
  const [cargandoDatos, setCargandoDatos] = useState(false);
  
  const [modalImportarPlanes, setModalImportarPlanes] = useState(false);
  const [materiasPlan, setMateriasPlan] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datosPlan, setDatosPlan] = useState({ codigo: '', nombre: '', nivel: 'Licenciatura' });
  const [planEnEdicion, setPlanEnEdicion] = useState(null);

  const [modalEquivalenciaAbierto, setModalEquivalenciaAbierto] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [procesandoPDF, setProcesandoPDF] = useState(false);
  const [nombreArchivoPDF, setNombreArchivoPDF] = useState('');

  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  const cargarPlanes = async () => {
    setCargandoDatos(true);
    try {
      const planesSnapshot = await getDocs(collection(db, 'planes'));
      const planesData = [];
      planesSnapshot.forEach((documento) => {
        planesData.push({ id: documento.id, ...documento.data() });
      });
      setPlanes(planesData);
    } catch (error) {
      console.error("Error al obtener planes:", error);
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    cargarPlanes();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') return;

    setNombreArchivoPDF(file.name);
    setProcesandoPDF(true);
    try {
      const materias = await procesarPDF(file, datosPlan.nivel);
      if (materias.length === 0) {
        alert("No se detectaron materias. El archivo PDF podría no coincidir con el formato esperado.");
      }
      setMateriasPlan(materias);
    } catch (error) {
      console.error("Error en lectura de PDF:", error);
      alert("Error crítico al procesar el archivo PDF.");
    } finally {
      setProcesandoPDF(false);
    }
  };

const guardarImportacion = async () => {
    if (!datosPlan.codigo.trim() || !datosPlan.nombre.trim()) {
      alert("Debes ingresar el código y el nombre del plan.");
      return;
    }

    if (!planEnEdicion && materiasPlan.length === 0) {
      alert("Debes extraer las materias del PDF para crear un nuevo plan.");
      return;
    }

    setIsSubmitting(true);

    try {
      const batch = writeBatch(db);
      let planRef;

      if (planEnEdicion) {
        planRef = doc(db, 'planes', planEnEdicion.id);
        batch.set(planRef, {
          codigo: datosPlan.codigo,
          nombre: datosPlan.nombre,
          nivel: datosPlan.nivel,
          ultima_edicion: new Date()
        }, { merge: true });

        if (materiasPlan.length > 0) {
          const materiasAntiguasRef = collection(db, 'planes', planEnEdicion.id, 'materias');
          const materiasAntiguasSnapshot = await getDocs(materiasAntiguasRef);
          materiasAntiguasSnapshot.forEach((materiaDoc) => {
            batch.delete(materiaDoc.ref);
          });
        }
      } else {
        planRef = doc(collection(db, 'planes'));
        batch.set(planRef, {
          codigo: datosPlan.codigo,
          nombre: datosPlan.nombre,
          nivel: datosPlan.nivel,
          fecha_importacion: new Date()
        });
      }

      if (materiasPlan.length > 0) {
        materiasPlan.forEach((materia) => {
          const materiaRef = doc(db, 'planes', planRef.id, 'materias', materia.clave);
          batch.set(materiaRef, {
            nombre: materia.nombre,
            clave: materia.clave
          });
        });
      }

      await batch.commit();
      alert(planEnEdicion ? "Plan actualizado correctamente." : `Se ha guardado el plan con ${materiasPlan.length} materias.`);
      
      cerrarModalImportar();
      await cargarPlanes();

    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      alert("Hubo un error al guardar los datos en la base de datos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const abrirModalCrear = () => {
    setPlanEnEdicion(null);
    setDatosPlan({ codigo: '', nombre: '', nivel: 'Licenciatura' });
    setMateriasPlan([]);
    setNombreArchivoPDF('');
    setModalImportarPlanes(true);
  };

  const abrirModalEditar = (plan) => {
    setPlanEnEdicion(plan);
    setDatosPlan({ codigo: plan.codigo || '', nombre: plan.nombre || '', nivel: plan.nivel || 'Licenciatura' });
    setMateriasPlan([]);
    setNombreArchivoPDF('');
    setModalImportarPlanes(true);
  };

  const cerrarModalImportar = () => {
    setModalImportarPlanes(false);
    setMateriasPlan([]);
    setPlanEnEdicion(null);
    setDatosPlan({ codigo: '', nombre: '', nivel: 'Licenciatura' });
    setNombreArchivoPDF('');
    const fileInput = document.getElementById('input-pdf-plan');
    if (fileInput) fileInput.value = '';
  };

  const abrirModalEquivalencia = (plan) => {
    setPlanSeleccionado(plan);
    setModalEquivalenciaAbierto(true);
  };

  const planesFiltrados = planes.filter(plan => 
    (plan.codigo && plan.codigo.toLowerCase().includes(busqueda.toLowerCase())) ||
    (plan.nombre && plan.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const indiceUltimoPlan = paginaActual * elementosPorPagina;
  const indicePrimerPlan = indiceUltimoPlan - elementosPorPagina;
  const planesPaginados = planesFiltrados.slice(indicePrimerPlan, indiceUltimoPlan);
  const totalPaginas = Math.ceil(planesFiltrados.length / elementosPorPagina);

  return (
    <div className="flex flex-col gap-4 relative w-full h-full">
      
      {/* Controles Top */}
      <div className="flex flex-wrap gap-4 bg-gray-50 p-3 rounded-md border border-gray-200 items-center justify-between">
        <div className="flex flex-1 gap-4 min-w-[300px]">
          <input 
            type="text" 
            placeholder="Buscar por código o nombre del programa..." 
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button 
          onClick={abrirModalCrear}
          className="bg-[#050C1C] text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[#1A2233] transition-colors whitespace-nowrap"
        >
          Importar Plan (PDF)
        </button>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-[#050C1C] text-gray-300">
              <tr>
                <th className="px-4 py-2.5 font-medium">Código</th>
                <th className="px-4 py-2.5 font-medium">Nombre del Programa</th>
                <th className="px-4 py-2.5 font-medium">Nivel</th>
                <th className="px-4 py-2.5 font-medium">Tabla de Equivalencias</th>
                <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cargandoDatos ? (
                 <tr>
                   <td colSpan="5" className="px-4 py-6 text-center text-gray-500">Cargando datos...</td>
                 </tr>
              ) : planesPaginados.length > 0 ? (
                planesPaginados.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 font-medium text-gray-900">{plan.codigo}</td>
                    <td className="px-4 py-2">{plan.nombre}</td>
                    <td className="px-4 py-2">{plan.nivel}</td>
                    <td className="px-4 py-2">
                      {plan.tabla_equivalencia ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                          Faltante
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => abrirModalEquivalencia(plan)}
                          className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
                          title="Subir tabla de equivalencias"
                        >
                          <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => abrirModalEditar(plan)}
                          className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
                          title="Editar información"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                        </button>
                        <button className="inline-flex items-center justify-center gap-1.5 bg-[#050C1C] text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-[#1A2233] transition-colors">
                          <EyeIcon className="w-3.5 h-3.5" />
                          Detalles
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                    No se encontraron planes de estudio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {planesFiltrados.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2.5">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando del <span className="font-medium">{indicePrimerPlan + 1}</span> al{' '}
                  <span className="font-medium">
                    {Math.min(indiceUltimoPlan, planesFiltrados.length)}
                  </span>{' '}
                  de <span className="font-medium">{planesFiltrados.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                    disabled={paginaActual === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-1.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Anterior</span>
                    <span className="text-sm px-2">Anterior</span>
                  </button>
                  <div className="relative inline-flex items-center px-3 py-1.5 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                    Página {paginaActual} de {totalPaginas}
                  </div>
                  <button
                    onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaActual === totalPaginas}
                    className="relative inline-flex items-center rounded-r-md px-2 py-1.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Siguiente</span>
                    <span className="text-sm px-2">Siguiente</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Plan */}
      {modalImportarPlanes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {planEnEdicion ? 'Editar Plan de Estudios' : 'Importar Plan de Estudios'}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {planEnEdicion 
                ? 'Actualiza la información del plan. Sube un nuevo PDF solo si deseas sobrescribir las materias extraídas previamente.'
                : 'Ingresa los datos del plan y selecciona el mapa curricular en PDF para extraer las materias.'}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código del Plan</label>
                <input 
                  type="text" 
                  placeholder="Ej. LIC-SYSC-18" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
                  value={datosPlan.codigo}
                  onChange={(e) => setDatosPlan({...datosPlan, codigo: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
                  value={datosPlan.nivel}
                  onChange={(e) => setDatosPlan({...datosPlan, nivel: e.target.value})}
                >
                  <option value="Licenciatura">Licenciatura</option>
                  <option value="Maestría">Maestría</option>
                  <option value="Especialidad">Especialidad</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Programa</label>
                <input 
                  type="text" 
                  placeholder="Ej. INGENIERÍA DE SOFTWARE" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
                  value={datosPlan.nombre}
                  onChange={(e) => setDatosPlan({...datosPlan, nombre: e.target.value})}
                />
              </div>
            </div>
            
            {/* Custom File Input */}
            <div className={`relative flex items-center border border-gray-200 rounded-md overflow-hidden mb-4 ${procesandoPDF ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-white hover:bg-gray-50'} transition-colors`}>
              <input 
                id="input-pdf-plan"
                type="file" 
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={procesandoPDF}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="px-4 py-2 bg-gray-50 text-[#050C1C] font-semibold text-sm border-r border-gray-200 pointer-events-none">
                Buscar...
              </div>
              <div className="px-4 py-2 text-sm text-gray-500 truncate pointer-events-none">
                {nombreArchivoPDF 
                  ? nombreArchivoPDF 
                  : (planEnEdicion ? 'Sin archivo seleccionado (opcional para actualizar)' : 'Ningún archivo seleccionado')}
              </div>
            </div>
            
            {procesandoPDF && (
              <p className="text-sm font-semibold text-[#050C1C] mb-4">Procesando documento, por favor espera...</p>
            )}

            {materiasPlan.length > 0 && (
              <div className="p-3 mb-6 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-semibold text-green-800">
                  ✓ {materiasPlan.length} nuevas materias extraídas listas para guardar.
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                onClick={cerrarModalImportar} 
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={guardarImportacion}
                disabled={(!planEnEdicion && materiasPlan.length === 0) || !datosPlan.codigo.trim() || !datosPlan.nombre.trim() || isSubmitting}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  ((planEnEdicion || materiasPlan.length > 0) && datosPlan.codigo.trim() && datosPlan.nombre.trim() && !isSubmitting)
                    ? 'bg-[#050C1C] text-white hover:bg-[#1A2233]' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Guardando...' : (planEnEdicion ? 'Guardar Cambios' : 'Guardar Plan')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Equivalencias */}
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