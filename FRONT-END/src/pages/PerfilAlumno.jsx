import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const MOCK_STUDENT_DATA = {
  111111: {
    matricula: 111111,
    nombre_completo: 'Apellidop Apellidom Nombre',
    programa: 'MAE-MERP',
    plan_estudio_registrado: 'Plan 2019',
    plan_actual: false,
    estatus: 'BF',
    tipo_ingreso: 'RI',
    curp: 'XAXX010101XXXXXX00',
    genero: 'M',
    campus: 'Campus Principal',
    ciclo_primer_ingreso: '2022-1',
    ciclo_ultimo_cursado: '2023-2',
    motivo_baja: 'Falta de pago de reinscripción',
    documentacion_retirada: false,
    tiene_adeudo: true,
    detalle_adeudo: 'Mensualidad de Diciembre',
    contacto_correo: 'alumno@correo.com',
    contacto_telefono: '9991234567',
    marcador_seguimiento: 'No contactado',
    bitacora_llamadas: [
      { id: 1, fecha: '2026-03-01', agente: 'Admin', comentario: 'Se envió correo inicial' }
    ],
    materias_aprobadas: [
      { id: 'ADM101', nombre: 'Administración Básica', equivalente: true, nueva_clave: 'ADM-1000' },
      { id: 'MAT101', nombre: 'Matemáticas Financieras', equivalente: true, nueva_clave: 'MAT-1000' },
      { id: 'OPT001', nombre: 'Optativa: Tópicos Antiguos', equivalente: false, nueva_clave: null }
    ],
    materias_reprobadas: [
      { id: 'ECO101', nombre: 'Microeconomía' }
    ],
    materias_faltantes: [
      { id: 'MER101', nombre: 'Mercadotecnia Estratégica' },
      { id: 'FIN201', nombre: 'Finanzas Corporativas' }
    ]
  }
};

export default function PerfilAlumno() {
  const { matricula } = useParams();
  const navigate = useNavigate();
  
  const alumno = MOCK_STUDENT_DATA[matricula] || null;
  const [comentario, setComentario] = useState('');
  
  const [activeTab, setActiveTab] = useState('administrativa');

  if (!alumno) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800">Alumno no encontrado</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">Volver al listado</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera Global */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-[#050C1C] mb-2 block">
            ← Volver al listado
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{alumno.nombre_completo}</h1>
          <p className="text-sm text-gray-500">Matrícula: {alumno.matricula} | Programa: {alumno.programa}</p>
        </div>
        <div>
          <span className={`px-4 py-2 rounded text-sm font-bold tracking-wide ${
            alumno.estatus === 'BF' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
          }`}>
            Estatus: {alumno.estatus}
          </span>
        </div>
      </div>

      {/* Navegación de Pestañas */}
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

      {/* Contenido Dinámico de las Pestañas */}
      <div className="pt-2">
        
        {/* Pestaña 1: Administrativa */}
        {activeTab === 'administrativa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Información Administrativa</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2 flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-100 mb-2">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Plan de Estudios Registrado</p>
                    <p className="font-bold text-gray-800 text-base">{alumno.plan_estudio_registrado}</p>
                  </div>
                  <div>
                    {alumno.plan_actual ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">Vigente</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">Desactualizado</span>
                    )}
                  </div>
                </div>
                <div><p className="text-gray-500">CURP</p><p className="font-medium">{alumno.curp}</p></div>
                <div><p className="text-gray-500">Género</p><p className="font-medium">{alumno.genero}</p></div>
                <div><p className="text-gray-500">Campus</p><p className="font-medium">{alumno.campus}</p></div>
                <div><p className="text-gray-500">Tipo Ingreso</p><p className="font-medium">{alumno.tipo_ingreso}</p></div>
                <div><p className="text-gray-500">Primer Ingreso</p><p className="font-medium">{alumno.ciclo_primer_ingreso}</p></div>
                <div><p className="text-gray-500">Último Ciclo</p><p className="font-medium">{alumno.ciclo_ultimo_cursado}</p></div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Estatus de Salida</h2>
                <div className="text-sm space-y-2">
                  <p><span className="text-gray-500">Motivo:</span> <span className="font-medium">{alumno.motivo_baja}</span></p>
                  <p><span className="text-gray-500">Documentación Retirada:</span> <span className="font-medium">{alumno.documentacion_retirada ? 'Sí' : 'No'}</span></p>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Situación Financiera</h2>
                <div className="text-sm space-y-2">
                  <p><span className="text-gray-500">Adeudo:</span> <span className="font-medium text-red-600">{alumno.tiene_adeudo ? 'Sí' : 'No'}</span></p>
                  <p><span className="text-gray-500">Detalle:</span> <span className="font-medium">{alumno.detalle_adeudo}</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña 2: Académica */}
        {activeTab === 'academica' && (
          <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
            {!alumno.plan_actual && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex gap-3 items-start text-yellow-800 text-sm">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="font-bold text-yellow-900">Plan de estudios desactualizado</p>
                  <p>El alumno cursó el {alumno.plan_estudio_registrado}. A continuación se muestra la equivalencia de sus materias aprobadas respecto al plan vigente.</p>
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
                  {alumno.materias_aprobadas.map((materia) => (
                    <li key={materia.id} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <p className="font-medium text-gray-800">{materia.nombre}</p>
                      <p className="text-xs text-gray-500 mb-1">Clave: {materia.id}</p>
                      {!alumno.plan_actual && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          {materia.equivalente ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                              <CheckCircleIcon className="w-3 h-3" /> Rescatable (Equivale a: {materia.nueva_clave})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded">
                              <XCircleIcon className="w-3 h-3" /> No rescatable en plan actual
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><XCircleIcon className="w-5 h-5 text-red-600" /> Reprobadas</span>
                  <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs font-bold">{alumno.materias_reprobadas.length}</span>
                </h3>
                <ul className="space-y-2 text-sm">
                  {alumno.materias_reprobadas.map((materia) => (
                    <li key={materia.id} className="p-3 bg-red-50 border border-red-100 rounded-md">
                      <p className="font-medium text-red-900">{materia.nombre}</p>
                      <p className="text-xs text-red-700">Clave: {materia.id}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><ClockIcon className="w-5 h-5 text-blue-600" /> Faltantes</span>
                  <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs font-bold">{alumno.materias_faltantes.length}</span>
                </h3>
                <ul className="space-y-2 text-sm">
                  {alumno.materias_faltantes.map((materia) => (
                    <li key={materia.id} className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                      <p className="font-medium text-blue-900">{materia.nombre}</p>
                      <p className="text-xs text-blue-700">Clave: {materia.id}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña 3: Contacto */}
        {activeTab === 'contacto' && (
          <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 border-r border-gray-100 pr-4">
              <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Datos de Contacto</h2>
              <div className="text-sm space-y-4">
                <div>
                  <p className="text-gray-500">Correo Electrónico</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium">{alumno.contacto_correo}</p>
                    <a href={`mailto:${alumno.contacto_correo}`} className="p-1.5 bg-[#050C1C] text-white rounded-md hover:bg-[#1A2233]" title="Enviar correo">
                      <EnvelopeIcon className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Teléfono</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium">{alumno.contacto_telefono}</p>
                    <a href={`https://wa.me/52${alumno.contacto_telefono}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#25D366] text-white rounded-md hover:bg-[#1DA851]" title="Enviar WhatsApp">
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Marcador Actual</p>
                  <select className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#050C1C]">
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
                {alumno.bitacora_llamadas.map((entry) => (
                  <div key={entry.id} className="text-sm bg-white p-3 border border-gray-100 rounded shadow-sm">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{entry.fecha}</span>
                      <span>Agente: {entry.agente}</span>
                    </div>
                    <p className="text-gray-800">{entry.comentario}</p>
                  </div>
                ))}
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