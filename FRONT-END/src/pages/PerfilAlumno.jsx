import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { procesarSituacionAcademica } from '../utils/procesarSituacionAcademica';

export default function PerfilAlumno() {
  const [diccionarioMaterias, setDiccionarioMaterias] = useState({});
  const { matricula } = useParams();
  const navigate = useNavigate();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [datosModal, setDatosModal] = useState({ titulo: '', lista: [], color: '' });
  
  const [alumno, setAlumno] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [comentario, setComentario] = useState('');
  const [activeTab, setActiveTab] = useState('administrativa');
  
  const [procesandoPDF, setProcesandoPDF] = useState(false);
  
  const [materiasPlan, setMateriasPlan] = useState([]);
  const [planExiste, setPlanExiste] = useState(true);

  const abrirModalDetalle = (titulo, lista, color) => {
    setDatosModal({ titulo, lista, color });
    setModalAbierto(true);
  };

  useEffect(() => {
    const obtenerAlumno = async () => {
      try {
        const docRef = doc(db, 'alumnos', matricula);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const nombreEnsamblado = `${data.apellido_paterno || ''} ${data.apellido_materno || ''} ${data.nombre || ''}`.trim();

          setAlumno({
            matricula: docSnap.id,
            nombre_completo: nombreEnsamblado,
            ...data,
            bitacora_llamadas: data.bitacora_llamadas || [],
            materias_aprobadas: data.materias_aprobadas || [],
            materias_reprobadas: data.materias_reprobadas || []
          });
        } else {
          setAlumno(null);
        }
      } catch (error) {
        console.error("Error al obtener los detalles del alumno:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerAlumno();
  }, [matricula]);

  useEffect(() => {
    const obtenerPlanEstudio = async () => {
      if (alumno && alumno.programa) {
        try {
          const planesQuery = query(collection(db, 'planes'), where('codigo', '==', alumno.programa));
          const planesSnap = await getDocs(planesQuery);
          
          if (planesSnap.empty) {
            setPlanExiste(false);
            setMateriasPlan([]);
            setDiccionarioMaterias({});
          } else {
            setPlanExiste(true);
            const planDoc = planesSnap.docs[0];
            const materiasSnap = await getDocs(collection(db, 'planes', planDoc.id, 'materias'));
            
            const claves = [];
            const diccionario = {};
            
            materiasSnap.docs.forEach(d => {
              const data = d.data();
              const clave = (data.clave || d.id).toUpperCase();
              claves.push(clave);
              diccionario[clave] = data.nombre || 'Nombre no disponible';
            });

            setMateriasPlan(claves);
            setDiccionarioMaterias(diccionario);
          }
        } catch (error) {
          console.error("Error al cargar el plan de estudios:", error);
        }
      } else if (alumno) {
        setPlanExiste(false);
        setMateriasPlan([]);
        setDiccionarioMaterias({});
      }
    };

    obtenerPlanEstudio();
  }, [alumno?.programa]);

  if (cargando) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-medium text-gray-500">Cargando información del alumno...</h2>
      </div>
    );
  }

  if (!alumno) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800">Alumno no encontrado</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-[#050C1C] hover:underline font-medium">Volver al listado</button>
      </div>
    );
  }

  const handleCargarSituacion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcesandoPDF(true);
    try {
      const resultados = await procesarSituacionAcademica(file);

      if (resultados.length === 0) {
        alert("No se detectaron materias. Verifica el formato del PDF.");
        setProcesandoPDF(false);
        return;
      }

      const aprobadas = [];
      const reprobadas = [];

      resultados.forEach(res => {
        const claveStr = res.clave.toUpperCase();
        if (res.aprobada) {
          aprobadas.push(claveStr);
        } else {
          reprobadas.push(claveStr);
        }
      });

      const alumnoRef = doc(db, 'alumnos', matricula);
      await updateDoc(alumnoRef, {
        materias_aprobadas: aprobadas,
        materias_reprobadas: reprobadas
      });

      setAlumno(prev => ({
        ...prev,
        materias_aprobadas: aprobadas,
        materias_reprobadas: reprobadas
      }));

    } catch (error) {
      console.error("Error procesando Situación Académica:", error);
      alert("Error al leer y procesar el documento PDF.");
    } finally {
      setProcesandoPDF(false);
      e.target.value = ''; 
    }
  };

  const extraerClave = (materia) => {
    if (typeof materia === 'object') return (materia.id || materia.clave || '').toUpperCase();
    return materia.toUpperCase();
  };

  const listaAprobadas = (alumno.materias_aprobadas || []).map(extraerClave);
  const listaReprobadas = (alumno.materias_reprobadas || []).map(extraerClave);
  
  const faltantesCalculadas = materiasPlan.filter(
    clavePlan => !listaAprobadas.includes(clavePlan) && !listaReprobadas.includes(clavePlan)
  );

  const moverMateria = async (clave, destino) => {
    const nuevasAprobadas = listaAprobadas.filter(c => c !== clave);
    const nuevasReprobadas = listaReprobadas.filter(c => c !== clave);

    if (destino === 'aprobadas') nuevasAprobadas.push(clave);
    if (destino === 'reprobadas') nuevasReprobadas.push(clave);

    setAlumno(prev => ({
      ...prev,
      materias_aprobadas: nuevasAprobadas,
      materias_reprobadas: nuevasReprobadas
    }));

    try {
      const alumnoRef = doc(db, 'alumnos', matricula);
      await updateDoc(alumnoRef, {
        materias_aprobadas: nuevasAprobadas,
        materias_reprobadas: nuevasReprobadas
      });
    } catch (error) {
      console.error("Error al mover la materia:", error);
      alert("Error al sincronizar con la base de datos.");
    }
  };

  const handleDragStart = (e, clave) => {
    e.dataTransfer.setData('clave', clave);
  };

  const handleDrop = (e, destino) => {
    e.preventDefault();
    const clave = e.dataTransfer.getData('clave');
    if (clave) moverMateria(clave, destino);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-[#050C1C] mb-2 block transition-colors">
            ← Volver al listado
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{alumno.nombre_completo}</h1>
          <p className="text-sm text-gray-500">Matrícula: {alumno.matricula} | Programa: {alumno.programa}</p>
        </div>
        <div>
          <span className={`px-4 py-2 rounded text-sm font-bold tracking-wide border ${
            alumno.estatus === 'BF' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-orange-100 text-orange-800 border-orange-200'
          }`}>
            Estatus: {alumno.estatus}
          </span>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => setActiveTab('administrativa')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'administrativa'
                ? 'border-[#050C1C] text-[#050C1C]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            1. Información Administrativa y Estatus
          </button>
          <button
            onClick={() => setActiveTab('academica')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'academica'
                ? 'border-[#050C1C] text-[#050C1C]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            2. Situación Académica
          </button>
          <button
            onClick={() => setActiveTab('contacto')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'contacto'
                ? 'border-[#050C1C] text-[#050C1C]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            3. Datos de Contacto y Bitácora
          </button>
        </nav>
      </div>

      <div className="pt-2">
        {/* --- PESTAÑA ADMINISTRATIVA --- */}
        {activeTab === 'administrativa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Información Administrativa</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2 flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-100 mb-2">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Plan de Estudios Registrado</p>
                    <p className="font-bold text-gray-800 text-base">{alumno.programa || 'No registrado'}</p>
                  </div>
                  <div>
                    {!planExiste ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded border border-yellow-200">Plan no encontrado en DB</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">Plan localizado</span>
                    )}
                  </div>
                </div>
                <div><p className="text-gray-500">CURP</p><p className="font-medium">{alumno.curp || 'N/A'}</p></div>
                <div><p className="text-gray-500">Género</p><p className="font-medium">{alumno.genero || 'N/A'}</p></div>
                <div><p className="text-gray-500">Campus</p><p className="font-medium">{alumno.campus || 'N/A'}</p></div>
                <div><p className="text-gray-500">Tipo Ingreso</p><p className="font-medium">{alumno.tipo_ingreso || 'N/A'}</p></div>
                <div><p className="text-gray-500">Primer Ingreso</p><p className="font-medium">{alumno.ciclo_primer_ingreso || 'N/A'}</p></div>
                <div><p className="text-gray-500">Último Ciclo</p><p className="font-medium">{alumno.ciclo_ultimo_cursado || 'N/A'}</p></div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Estatus de Salida</h2>
                <div className="text-sm space-y-2">
                  <p><span className="text-gray-500">Motivo:</span> <span className="font-medium">{alumno.motivo_baja || 'N/A'}</span></p>
                  <p><span className="text-gray-500">Documentación Retirada:</span> <span className="font-medium">{alumno.documentacion_retirada === null ? 'N/A' : (alumno.documentacion_retirada ? 'Sí' : 'No')}</span></p>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Situación Financiera</h2>
                <div className="text-sm space-y-2">
                  <p>
                    <span className="text-gray-500">Adeudo:</span>{' '}
                    <span className={`font-medium ${alumno.tiene_adeudo === null ? 'text-gray-800' : (alumno.tiene_adeudo ? 'text-red-600' : 'text-green-600')}`}>
                      {alumno.tiene_adeudo === null ? 'N/A' : (alumno.tiene_adeudo ? 'Sí' : 'No')}
                    </span>
                  </p>
                  <p><span className="text-gray-500">Detalle:</span> <span className="font-medium">{alumno.detalle_adeudo || 'N/A'}</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA ACADÉMICA --- */}
        {activeTab === 'academica' && (
          <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
            <div className="flex flex-wrap justify-between items-center mb-6 pb-4 border-b border-gray-100 gap-4">
              <h2 className="text-lg font-bold text-[#050C1C]">Resumen Académico (Claves)</h2>
              <div>
                <input 
                  type="file" 
                  accept=".pdf"
                  id="upload-situacion"
                  className="hidden"
                  onChange={handleCargarSituacion}
                  disabled={procesandoPDF}
                />
                <label 
                  htmlFor="upload-situacion"
                  className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    procesandoPDF 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#050C1C] text-white hover:bg-[#1A2233]'
                  }`}
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  {procesandoPDF ? 'Analizando documento...' : 'Cargar Situación Académica'}
                </label>
              </div>
            </div>

            {!planExiste && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex gap-3 items-start text-yellow-800 text-sm">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="font-bold text-yellow-900">Plan de estudios desactualizado o no registrado</p>
                  <p>Falta actualizar o crear el plan de estudios <strong>{alumno.programa || 'correspondiente'}</strong> en el sistema para poder comparar y calcular las materias faltantes.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* APROBADAS */}
              <div 
                onDragOver={handleDragOver} 
                onDrop={(e) => handleDrop(e, 'aprobadas')}
                className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 transition-colors"
              >
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-600" /> Aprobadas</span>
                  <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs font-bold">{listaAprobadas.length}</span>
                </h3>
                <ul className="flex flex-col gap-2 text-sm min-h-[150px]">
                  {listaAprobadas.map((clave, idx) => (
                    <li 
                      key={idx} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, clave)}
                      className="p-2 bg-white border-l-4 border-l-green-500 border border-gray-200 rounded shadow-sm text-center cursor-move hover:shadow-md transition-all"
                    >
                      <div className="font-bold text-gray-800 text-sm">{diccionarioMaterias[clave] || 'Materia desconocida'}</div>
                      <div className="text-gray-500 text-xs mt-0.5 font-mono">{clave}</div>
                    </li>
                  ))}
                  {listaAprobadas.length === 0 && <li className="text-gray-400 text-xs text-center py-6 flex items-center justify-center h-full">Arrastra materias aquí</li>}
                </ul>
              </div>

              {/* REPROBADAS */}
              <div 
                onDragOver={handleDragOver} 
                onDrop={(e) => handleDrop(e, 'reprobadas')}
                className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 transition-colors"
              >
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><XCircleIcon className="w-5 h-5 text-red-600" /> Reprobadas</span>
                  <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs font-bold">{listaReprobadas.length}</span>
                </h3>
                <ul className="flex flex-col gap-2 text-sm min-h-[150px]">
                  {listaReprobadas.map((clave, idx) => (
                    <li 
                      key={idx} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, clave)}
                      className="p-2 bg-white border-l-4 border-l-red-500 border border-gray-200 rounded shadow-sm text-center cursor-move hover:shadow-md transition-all"
                    >
                      <div className="font-bold text-gray-800 text-sm">{diccionarioMaterias[clave] || 'Materia desconocida'}</div>
                      <div className="text-gray-500 text-xs mt-0.5 font-mono">{clave}</div>
                    </li>
                  ))}
                  {listaReprobadas.length === 0 && <li className="text-gray-400 text-xs text-center py-6 flex items-center justify-center h-full">Arrastra materias aquí</li>}
                </ul>
              </div>

              {/* FALTANTES */}
              <div 
                onDragOver={handleDragOver} 
                onDrop={(e) => handleDrop(e, 'faltantes')}
                className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 transition-colors"
              >
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><ClockIcon className="w-5 h-5 text-blue-600" /> Faltantes</span>
                  <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs font-bold">
                    {planExiste ? faltantesCalculadas.length : '?'}
                  </span>
                </h3>
                
                {planExiste ? (
                  <ul className="flex flex-col gap-2 text-sm min-h-[150px]">
                    {faltantesCalculadas.map((clave, idx) => (
                      <li 
                        key={idx} 
                        draggable 
                        onDragStart={(e) => handleDragStart(e, clave)}
                        className="p-2 bg-white border-l-4 border-l-blue-500 border border-gray-200 rounded shadow-sm text-center cursor-move hover:shadow-md transition-all"
                      >
                        <div className="font-bold text-gray-800 text-sm">{diccionarioMaterias[clave] || 'Materia desconocida'}</div>
                        <div className="text-gray-500 text-xs mt-0.5 font-mono">{clave}</div>
                      </li>
                    ))}
                    {faltantesCalculadas.length === 0 && <li className="text-gray-400 text-xs text-center py-6 flex items-center justify-center h-full">Arrastra materias aquí</li>}
                  </ul>
                ) : (
                  <div className="p-3 border border-dashed border-gray-300 rounded text-center text-gray-500 text-sm">
                    Registra el plan de estudios para ver este cálculo.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA CONTACTO --- */}
        {activeTab === 'contacto' && (
          <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 border-r border-gray-100 pr-4">
              <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Datos de Contacto</h2>
              <div className="text-sm space-y-4">
                <div>
                  <p className="text-gray-500">Correo Electrónico</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium">{alumno.contacto_correo || 'No registrado'}</p>
                    {alumno.contacto_correo && (
                      <a href={`mailto:${alumno.contacto_correo}`} className="p-1.5 bg-[#050C1C] text-white rounded-md hover:bg-[#1A2233]" title="Enviar correo">
                        <EnvelopeIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Teléfono</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium">{alumno.contacto_telefono || 'No registrado'}</p>
                    {alumno.contacto_telefono && (
                      <a href={`https://wa.me/52${alumno.contacto_telefono}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#25D366] text-white rounded-md hover:bg-[#1DA851]" title="Enviar WhatsApp">
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Marcador Actual</p>
                  <select 
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#050C1C]"
                    defaultValue={alumno.marcador_seguimiento}
                  >
                    <option value="No contactado">No contactado</option>
                    <option value="Esperando respuesta">Esperando respuesta</option>
                    <option value="Positivo">Positivo (Regresa)</option>
                    <option value="Negativo">Negativo (No regresa)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Bitácora de Seguimiento</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 h-40 overflow-y-auto mb-4 space-y-3">
                {alumno.bitacora_llamadas.length > 0 ? (
                  alumno.bitacora_llamadas.map((entry, idx) => (
                    <div key={entry.id || idx} className="text-sm bg-white p-3 border border-gray-100 rounded shadow-sm">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{entry.fecha}</span>
                        <span>Agente: {entry.agente}</span>
                      </div>
                      <p className="text-gray-800">{entry.comentario}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center mt-10">No hay registros en la bitácora.</p>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Añadir nuevo comentario..." 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#050C1C]"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
                <button className="bg-[#050C1C] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1A2233]">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}