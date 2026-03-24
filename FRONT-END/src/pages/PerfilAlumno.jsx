import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function PerfilAlumno() {
  const { matricula } = useParams();
  const navigate = useNavigate();
  
  const [alumno, setAlumno] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [comentario, setComentario] = useState('');
  const [activeTab, setActiveTab] = useState('administrativa');

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
            // Valores por defecto para evitar errores al mapear arreglos vacíos
            bitacora_llamadas: data.bitacora_llamadas || [],
            materias_aprobadas: data.materias_aprobadas || [],
            materias_reprobadas: data.materias_reprobadas || [],
            materias_faltantes: data.materias_faltantes || []
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
        {activeTab === 'administrativa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Información Administrativa</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2 flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-100 mb-2">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Plan de Estudios Registrado</p>
                    <p className="font-bold text-gray-800 text-base">{alumno.plan_estudio_registrado || 'No registrado'}</p>
                  </div>
                  <div>
                    {alumno.plan_actual === null || alumno.plan_actual === undefined ? (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded border border-gray-200">N/A</span>
                    ) : alumno.plan_actual ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">Vigente</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded border border-yellow-200">Desactualizado</span>
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

        {activeTab === 'academica' && (
          <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
            {!alumno.plan_actual && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex gap-3 items-start text-yellow-800 text-sm">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="font-bold text-yellow-900">Plan de estudios desactualizado</p>
                  <p>El alumno cursó el {alumno.plan_estudio_registrado}. Verifica equivalencias de materias aprobadas respecto al plan vigente.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-600" /> Aprobadas</span>
                  <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs font-bold">{alumno.materias_aprobadas.length}</span>
                </h3>
                <ul className="space-y-2 text-sm">
                  {alumno.materias_aprobadas.map((materia, idx) => (
                    <li key={materia.id || idx} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <p className="font-medium text-gray-800">{materia.nombre}</p>
                      <p className="text-xs text-gray-500 mb-1">Clave: {materia.id}</p>
                    </li>
                  ))}
                  {alumno.materias_aprobadas.length === 0 && <li className="text-gray-500 text-xs">Sin registros</li>}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><XCircleIcon className="w-5 h-5 text-red-600" /> Reprobadas</span>
                  <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs font-bold">{alumno.materias_reprobadas.length}</span>
                </h3>
                <ul className="space-y-2 text-sm">
                  {alumno.materias_reprobadas.map((materia, idx) => (
                    <li key={materia.id || idx} className="p-3 bg-red-50 border border-red-100 rounded-md">
                      <p className="font-medium text-red-900">{materia.nombre}</p>
                      <p className="text-xs text-red-700">Clave: {materia.id}</p>
                    </li>
                  ))}
                  {alumno.materias_reprobadas.length === 0 && <li className="text-gray-500 text-xs">Sin registros</li>}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><ClockIcon className="w-5 h-5 text-blue-600" /> Faltantes</span>
                  <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs font-bold">{alumno.materias_faltantes.length}</span>
                </h3>
                <ul className="space-y-2 text-sm">
                  {alumno.materias_faltantes.map((materia, idx) => (
                    <li key={materia.id || idx} className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                      <p className="font-medium text-blue-900">{materia.nombre}</p>
                      <p className="text-xs text-blue-700">Clave: {materia.id}</p>
                    </li>
                  ))}
                  {alumno.materias_faltantes.length === 0 && <li className="text-gray-500 text-xs">Sin registros</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

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