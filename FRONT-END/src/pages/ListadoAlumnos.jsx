import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon } from '@heroicons/react/24/outline';
import Papa from 'papaparse';
import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

const ESTATUS_COLORS = {
  'BA': 'bg-red-100 text-red-800 border-red-200',
  'BC': 'bg-orange-100 text-orange-800 border-orange-200',
  'BD': 'bg-amber-100 text-amber-800 border-amber-200',
  'BE': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'BF': 'bg-lime-100 text-lime-800 border-lime-200',
  'BI': 'bg-green-100 text-green-800 border-green-200',
  'BM': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'BN': 'bg-teal-100 text-teal-800 border-teal-200',
  'BP': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'BR': 'bg-sky-100 text-sky-800 border-sky-200',
  'BS': 'bg-blue-100 text-blue-800 border-blue-200',
  'BU': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'BV': 'bg-violet-100 text-violet-800 border-violet-200',
  'FI': 'bg-purple-100 text-purple-800 border-purple-200',
  'FP': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'GC': 'bg-pink-100 text-pink-800 border-pink-200'
};

export default function ListadoAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [catalogoEstatus, setCatalogoEstatus] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [cargandoDatos, setCargandoDatos] = useState(true);
  
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [datosTemporales, setDatosTemporales] = useState([]);
  const [erroresImportacion, setErroresImportacion] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

const cargarAlumnos = async () => {
    setCargandoDatos(true);
    try {
      const alumnosSnapshot = await getDocs(collection(db, 'alumnos'));
      const alumnosData = [];
      alumnosSnapshot.forEach((documento) => {
        alumnosData.push({ matricula: documento.id, ...documento.data() });
      });
      setAlumnos(alumnosData);
    } catch (error) {
      console.error("Error al obtener alumnos:", error);
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    const inicializarVista = async () => {
      try {
        const catalogoRef = doc(db, 'catalogos', 'estatus_baja');
        const catalogoSnap = await getDoc(catalogoRef);

        if (catalogoSnap.exists()) {
          setCatalogoEstatus(catalogoSnap.data());
        } else {
          setCatalogoEstatus({});
        }

        await cargarAlumnos(); 
      } catch (error) {
        console.error(error);
        setCargandoDatos(false); 
      }
    };

    inicializarVista();
  }, []);

const manejarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (Object.keys(catalogoEstatus).length === 0) {
      alert("El catálogo de estatus no se ha cargado. Refresca la página.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const procesadosValidos = [];
        const procesadosInvalidos = [];

        results.data.forEach((row, index) => {
          const filaCSV = index + 2; 
          
          const id = (row.Id || row.id || '').toString().trim();
          const apPaterno = (row['Apellido paterno'] || row['Apellido Paterno'] || '').trim();
          const apMaterno = (row['Apellido materno'] || row['Apellido Materno'] || '').trim();
          const nombre = (row.Nombre || row.nombre || '').trim();
          const estatus = (row.Estatus || row.estatus || '').trim();
          const programa = (row.Programa || row.programa || '').trim();
          const tipo = (row.Tipo || row.tipo || '').trim();

          const nombreEnsamblado = `${apPaterno} ${apMaterno} ${nombre}`.trim().replace(/\s+/g, ' ');

          if (!estatus || !catalogoEstatus[estatus]) {
            return; 
          }

          let esValido = true;
          let motivoError = '';

          if (!id || !apPaterno || !nombre) { 
            esValido = false;
            motivoError = 'Dato requerido faltante (Id, Apellido paterno o Nombre)';
          } else if (!/^\d+$/.test(id)) {
            esValido = false;
            motivoError = 'Dato mal formateado (ID no numérico)';
          }

          if (esValido) {
            procesadosValidos.push({
              matricula: id, 
              nombre: nombre,
              apellido_paterno: apPaterno,
              apellido_materno: apMaterno,
              nombre_completo: nombreEnsamblado, 
              programa: programa,
              estatus: estatus,
              tipo_ingreso: tipo,
              
              curp: null,
              genero: null,
              campus: null,
              ciclo_primer_ingreso: null,
              ciclo_ultimo_cursado: null,
              motivo_baja: null,
              documentacion_retirada: null,
              tiene_adeudo: null,
              detalle_adeudo: null,
              contacto_correo: null,
              contacto_telefono: null,
              marcador_seguimiento: null,
              bitacora_llamadas: null,
              plan_estudio_registrado: null,
              plan_actual: null,
              materias_aprobadas: null,
              materias_reprobadas: null,
              materias_faltantes: null
            });
          } else {
            procesadosInvalidos.push({ fila: filaCSV, id: id || 'Desconocido', motivo: motivoError });
          }
        });

        setDatosTemporales(procesadosValidos);
        setErroresImportacion(procesadosInvalidos);
      }
    });
  };

  const guardarImportacion = async () => {
    if (datosTemporales.length === 0) {
      alert("No hay datos válidos para guardar.");
      return;
    }

    setIsSubmitting(true); 

    try {
      const chunks = [];
      for (let i = 0; i < datosTemporales.length; i += 500) {
        chunks.push(datosTemporales.slice(i, i + 500));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        
        chunk.forEach((alumno) => {
          const docRef = doc(db, 'alumnos', String(alumno.matricula));
          batch.set(docRef, alumno);
        });

        await batch.commit();
      }

      alert(`Se han guardado ${datosTemporales.length} alumnos correctamente.`);
      
      cerrarModal();
      await cargarAlumnos();

    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      alert("Hubo un error al guardar los datos en la base de datos.");
    } finally {
      setIsSubmitting(false); 
    }
  };

  const cerrarModal = () => {
    setDatosTemporales([]);
    setErroresImportacion([]);
    setModalImportarAbierto(false);
    
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const alumnosFiltrados = alumnos.filter(alumno => {
      const nombreSeguro = alumno.nombre_completo || '';
      
      const cumpleBusqueda =
        nombreSeguro.toLowerCase().includes(busqueda.toLowerCase()) ||
        alumno.matricula.toString().includes(busqueda);
      
      const cumpleEstatus = filtroEstatus === '' || alumno.estatus === filtroEstatus;
      return cumpleBusqueda && cumpleEstatus;
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
          {Object.entries(catalogoEstatus).map(([clave, etiqueta]) => (
            <option key={clave} value={clave}>
              {clave} - {etiqueta}
            </option>
          ))}
        </select>
      </div>

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
            {cargandoDatos ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Cargando datos...
                </td>
              </tr>
            ) : alumnosFiltrados.length > 0 ? (
              alumnosFiltrados.map((alumno, index) => {
                const estatusEstilo = ESTATUS_COLORS[alumno.estatus] || 'bg-gray-100 text-gray-800 border-gray-200';
                const estatusEtiqueta = catalogoEstatus[alumno.estatus] || alumno.estatus;

                return (
                  <tr key={`${alumno.matricula}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">{alumno.matricula}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{alumno.nombre_completo}</td>
                    <td className="px-6 py-4">{alumno.programa}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold tracking-wide border ${estatusEstilo}`} title={estatusEtiqueta}>
                        {alumno.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/alumno/${alumno.matricula}`} className="inline-flex items-center justify-center gap-2 bg-[#050C1C] text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#1A2233] transition-colors">
                        <EyeIcon className="w-4 h-4" />
                        Detalles
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : alumnos.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  La base de datos está vacía. Importa un archivo para visualizar registros.
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No se encontraron alumnos con los criterios de búsqueda actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalImportarAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Importar Excel/CSV</h2>
            <p className="text-sm text-gray-600 mb-6">
              Selecciona el archivo proporcionado. Se omitirán automáticamente los registros con errores de formato o que no correspondan a un estatus de baja.
            </p>
            
            <input 
              type="file" 
              accept=".csv"
              onChange={manejarArchivo}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-[#050C1C] hover:file:bg-gray-100 mb-2 border border-gray-200 rounded-md p-2"
            />
            
            <div className="flex flex-col gap-2 mb-4">
              {datosTemporales.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-semibold text-green-800">
                    ✓ {datosTemporales.length} registros válidos listos para importar.
                  </p>
                </div>
              )}

              {erroresImportacion.length > 0 && (
                <div className="border border-red-200 rounded-md overflow-hidden bg-red-50 flex flex-col max-h-48">
                  <div className="bg-red-100 px-4 py-2 text-sm font-bold text-red-800 border-b border-red-200">
                    ⚠ {erroresImportacion.length} registros omitidos:
                  </div>
                  <div className="overflow-y-auto p-4">
                    <ul className="text-xs space-y-2 text-red-700">
                      {erroresImportacion.map((err, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="font-bold whitespace-nowrap">Fila {err.fila} (ID: {err.id})</span>
                          <span>-</span>
                          <span>{err.motivo}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button 
                onClick={cerrarModal} 
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={guardarImportacion}
                disabled={datosTemporales.length === 0 || isSubmitting}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  datosTemporales.length > 0 && !isSubmitting
                    ? 'bg-[#050C1C] text-white hover:bg-[#1A2233]' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Válidos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}