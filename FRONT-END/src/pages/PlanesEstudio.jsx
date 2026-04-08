import { useState, useEffect } from 'react';
import { EyeIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { procesarPDF } from '../utils/procesarPDF'; // Ajusta la ruta si es necesario
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase'; // Ajusta la ruta de tu config

export default function PlanesEstudio() {
  const [planes, setPlanes] = useState([]); 
  const [busqueda, setBusqueda] = useState('');
  const [cargandoDatos, setCargandoDatos] = useState(false);
  
  const [modalImportarPlanes, setModalImportarPlanes] = useState(false);
  const [materiasPlan, setMateriasPlan] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datosPlan, setDatosPlan] = useState({ codigo: '', nombre: '', nivel: 'Licenciatura' });

  const [modalEquivalenciaAbierto, setModalEquivalenciaAbierto] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [procesandoPDF, setProcesandoPDF] = useState(false);

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

  const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file || file.type !== 'application/pdf') return;

  setProcesandoPDF(true);
  try {
    const materias = await procesarPDF(file);
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
    if (materiasPlan.length === 0) {
      alert("No hay materias extraídas para guardar.");
      return;
    }
    
    
    if (!datosPlan.codigo.trim() || !datosPlan.nombre.trim()) {
      alert("Debes ingresar el código y el nombre del plan.");
      return;
    }

    setIsSubmitting(true);

    try {
      const batch = writeBatch(db);

      const planRef = doc(db, 'planes', datosPlan.codigo);
      batch.set(planRef, {
        codigo: datosPlan.codigo,
        nombre: datosPlan.nombre,
        nivel: datosPlan.nivel,
        fecha_importacion: new Date()
      }, { merge: true });

      materiasPlan.forEach((materia) => {
        const materiaRef = doc(db, 'planes', datosPlan.codigo, 'materias', materia.clave);
        batch.set(materiaRef, {
          nombre: materia.nombre,
          clave: materia.clave
        });
      });

      await batch.commit();
      alert(`Se ha guardado el plan ${datosPlan.codigo} con ${materiasPlan.length} materias correctamente.`);
      
      cerrarModalImportar();
      await cargarPlanes();

    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      alert("Hubo un error al guardar los datos en la base de datos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cerrarModalImportar = () => {
    setModalImportarPlanes(false);
    setMateriasPlan([]);
    setDatosPlan({ codigo: '', nombre: '', nivel: 'Licenciatura' });
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

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Planes de Estudio</h1>
        <button 
          onClick={() => setModalImportarPlanes(true)}
          className="bg-[#050C1C] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1A2233] transition-colors"
        >
          Importar Plan (PDF)
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
            {cargandoDatos ? (
               <tr>
                 <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Cargando datos...</td>
               </tr>
            ) : planesFiltrados.length > 0 ? (
              planesFiltrados.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{plan.codigo}</td>
                  <td className="px-6 py-4">{plan.nombre}</td>
                  <td className="px-6 py-4">{plan.nivel}</td>
                  <td className="px-6 py-4">
                    {plan.tabla_equivalencia ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        Disponible
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
              ))
            ) : (
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
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Importar Plan de Estudios</h2>
            <p className="text-sm text-gray-600 mb-6">
              Ingresa los datos del plan y selecciona el mapa curricular en PDF para extraer las materias.
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
            
            <input 
              id="input-pdf-plan"
              type="file" 
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={procesandoPDF}
              className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-[#050C1C] hover:file:bg-gray-100 mb-4 border border-gray-200 rounded-md p-2 ${procesandoPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            
            {procesandoPDF && (
              <p className="text-sm font-semibold text-[#050C1C] mb-4">Procesando documento, por favor espera...</p>
            )}

            {materiasPlan.length > 0 && (
              <div className="p-3 mb-6 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-semibold text-green-800">
                  ✓ {materiasPlan.length} materias extraídas listas para guardar.
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
                disabled={materiasPlan.length === 0 || !datosPlan.codigo.trim() || !datosPlan.nombre.trim() || isSubmitting}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  materiasPlan.length > 0 && datosPlan.codigo.trim() && datosPlan.nombre.trim() && !isSubmitting
                    ? 'bg-[#050C1C] text-white hover:bg-[#1A2233]' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Plan'}
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