import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const MOCK_STUDENT_DATA = {
  111111: {
    matricula: 111111,
    nombre_completo: 'Apellidop Apellidom Nombre',
    programa: 'MAE-MERP-22',
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
    ]
  }
};

export default function PerfilAlumno() {
  const { matricula } = useParams();
  const navigate = useNavigate();
  
  const alumno = MOCK_STUDENT_DATA[matricula] || null;
  const [comentario, setComentario] = useState('');

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
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sección C1: Información Administrativa */}
        <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Información Administrativa</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">CURP</p>
              <p className="font-medium">{alumno.curp}</p>
            </div>
            <div>
              <p className="text-gray-500">Género</p>
              <p className="font-medium">{alumno.genero}</p>
            </div>
            <div>
              <p className="text-gray-500">Campus</p>
              <p className="font-medium">{alumno.campus}</p>
            </div>
            <div>
              <p className="text-gray-500">Tipo Ingreso</p>
              <p className="font-medium">{alumno.tipo_ingreso}</p>
            </div>
            <div>
              <p className="text-gray-500">Primer Ingreso</p>
              <p className="font-medium">{alumno.ciclo_primer_ingreso}</p>
            </div>
            <div>
              <p className="text-gray-500">Último Ciclo</p>
              <p className="font-medium">{alumno.ciclo_ultimo_cursado}</p>
            </div>
          </div>
        </div>

        {/* Sección C2 y C3: Estatus de Salida y Finanzas */}
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

        {/* Sección D: Contacto y Seguimiento */}
        <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 border-r border-gray-100 pr-4">
            <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Datos de Contacto</h2>
            <div className="text-sm space-y-4">
              <div>
                <p className="text-gray-500">Correo Electrónico</p>
                <p className="font-medium">{alumno.contacto_correo}</p>
              </div>
              <div>
                <p className="text-gray-500">Teléfono</p>
                <p className="font-medium">{alumno.contacto_telefono}</p>
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
          
          {/* Bitácora de llamadas */}
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
              <button className="bg-[#050C1C] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1A2233] transition-colors">
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}