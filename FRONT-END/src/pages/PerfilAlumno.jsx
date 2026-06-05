import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ArrowsRightLeftIcon,
  PencilIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

import { useAuth } from '../context/AuthContext';
import { registrarLog } from '../utils/registroLogs';

export default function PerfilAlumno() {
  const { currentUser } = useAuth();
  const [editingFields, setEditingFields] = useState({});
  const [editValues, setEditValues] = useState({});
  const [modoEquivalencia, setModoEquivalencia] = useState(false);
  const [planesConEquivalencias, setPlanesConEquivalencias] = useState([]);
  const [planEquivalenciaSeleccionado, setPlanEquivalenciaSeleccionado] = useState('');
  const [mapaEquivalencias, setMapaEquivalencias] = useState({});
  const [cargandoEquivalencias, setCargandoEquivalencias] = useState(false);

  const [listaPlanes, setListaPlanes] = useState([]);
  const [actualizandoPlan, setActualizandoPlan] = useState(false);

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

  const calcularLetrasCURP = (nombre, paterno, materno) => {
  const limpia = (str) => String(str || '').trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const nom = limpia(nombre); const pat = limpia(paterno); const mat = limpia(materno);
  if (!nom || !pat) return null;

  const ignorar = ['DE', 'LA', 'LAS', 'LOS', 'MAC', 'MC', 'VAN', 'VON', 'Y'];

  const getPalabraFiltro = (texto) => {
    const palabras = texto.split(' ').filter(p => !ignorar.includes(p));
    return palabras[0] || 'X';
  };

  const getNombreFiltro = (texto) => {
    const palabras = texto.split(' ').filter(p => !ignorar.includes(p));
    if (palabras.length > 1 && (palabras[0] === 'JOSE' || palabras[0] === 'MARIA')) {
      return palabras[1];
    }
    return palabras[0] || 'X';
  };

  const apellidoPat = getPalabraFiltro(pat);
  const apellidoMat = getPalabraFiltro(mat) !== 'X' ? getPalabraFiltro(mat) : '';
  const primerNom = getNombreFiltro(nom);

  const letra1 = apellidoPat.charAt(0) || 'X';
  let letra2 = 'X';
  for (let i = 1; i < apellidoPat.length; i++) {
    if (['A', 'E', 'I', 'O', 'U'].includes(apellidoPat.charAt(i))) {
      letra2 = apellidoPat.charAt(i); break;
    }
  }
  const letra3 = apellidoMat ? apellidoMat.charAt(0) : 'X';
  const letra4 = primerNom.charAt(0) || 'X';
  let prefijo = `${letra1}${letra2}${letra3}${letra4}`;

  const malas = ['BACA','BAKA','BUEI','BUEY','CACA','CACO','CAGA','CAGO','CAKA','CAKO','COGE','COGI','COJA','COJE','COJI','COJO','COLA','CULO','FALO','FETO','GETA','GUEI','GUEY','JETA','JOTO','KACA','KACO','KAGA','KAGO','KAKA','KAKO','KOGE','KOGI','KOJA','KOJE','KOJI','KOJO','KOLA','KULO','LILO','LOCA','LOCO','LOKA','LOKO','MAME','MAMO','MEAR','MEAS','MEON','MIAR','MION','MOCO','MOKO','MUTE','NACA','NACO','PEDA','PEDO','PENE','PIPI','PITO','POPO','PUTA','PUTO','QULO','RATA','ROBA','ROBE','ROBO','RUIN','SENO','TETA','VACA','VAGA','VAGO','VAKA','VUEI','VUEY','WUEI','WUEY'];
  if (malas.includes(prefijo)) prefijo = prefijo.charAt(0) + 'X' + prefijo.substring(2);

  const getPrimeraConsonanteInterna = (palabra) => {
    for (let i = 1; i < palabra.length; i++) {
      const char = palabra.charAt(i);
      if (/[B-DF-HJ-NP-TV-Z]/.test(char)) return char;
      if (char === 'Ñ') return 'X';
    }
    return 'X';
  };

  const cons1 = getPrimeraConsonanteInterna(apellidoPat);
  const cons2 = apellidoMat ? getPrimeraConsonanteInterna(apellidoMat) : 'X';
  const cons3 = getPrimeraConsonanteInterna(primerNom);
  const consonantes = `${cons1}${cons2}${cons3}`;

  return { prefijo, consonantes };
  };

  useEffect(() => {
  if (!modoEquivalencia) {
    setPlanEquivalenciaSeleccionado('');
    setMapaEquivalencias({});
    return;
  }

  const cargarPlanesValidos = async () => {
    setCargandoEquivalencias(true);
    try {
      const planesSnap = await getDocs(collection(db, 'planes'));
      const planesValidos = [];

      for (const documento of planesSnap.docs) {
        const equivalenciasRef = collection(db, 'planes', documento.id, 'equivalencias');
        const q = query(equivalenciasRef, limit(1));
        const equivalenciasSnap = await getDocs(q);
        
        if (!equivalenciasSnap.empty) {
          planesValidos.push({ id: documento.id, codigo: documento.data().codigo });
        }
      }
      setPlanesConEquivalencias(planesValidos);
    } catch (error) {
      console.error("Error al cargar planes para equivalencias:", error);
    } finally {
      setCargandoEquivalencias(false);
    }
  };

  cargarPlanesValidos();
}, [modoEquivalencia]);

  useEffect(() => {
    if (!planEquivalenciaSeleccionado) return;

    const cargarMapa = async () => {
      setCargandoEquivalencias(true);
      try {
        const planObj = planesConEquivalencias.find(p => p.codigo === planEquivalenciaSeleccionado);
        if (!planObj) return;

        const equivalenciasRef = collection(db, 'planes', planObj.id, 'equivalencias');
        const equivalenciasSnap = await getDocs(equivalenciasRef);
        
        const mapa = {};
        equivalenciasSnap.forEach(doc => {
          const data = doc.data();
          if (data.codigo_equivalente && data.codigo_equivalente !== "null") {
            mapa[data.codigo_original] = data.codigo_equivalente;
          }
        });
        
        setMapaEquivalencias(mapa);
      } catch (error) {
        console.error("Error al obtener el mapa de equivalencias:", error);
      } finally {
        setCargandoEquivalencias(false);
      }
    };

    cargarMapa();
  }, [planEquivalenciaSeleccionado, planesConEquivalencias]);

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
      try {
        const planesTotalesSnap = await getDocs(collection(db, 'planes'));
        const planesData = planesTotalesSnap.docs.map(d => d.data().codigo);
        setListaPlanes(planesData);

        if (alumno && alumno.programa) {
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
        } else if (alumno) {
          setPlanExiste(false);
          setMateriasPlan([]);
          setDiccionarioMaterias({});
        }
      } catch (error) {
        console.error("Error al cargar el plan de estudios:", error);
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

  const handleCambiarPlan = async (nuevoPlan) => {
    if (!nuevoPlan || nuevoPlan === alumno.programa) return;
    
    setActualizandoPlan(true);
    try {
      const alumnoRef = doc(db, 'alumnos', matricula);
      await updateDoc(alumnoRef, { programa: nuevoPlan });
      
      await registrarLog({
        usuario: currentUser?.email,
        accion: 'UPDATE',
        coleccion: 'alumnos',
        documentoId: matricula,
        campo: 'programa',
        detalles: `Plan cambiado a ${nuevoPlan}`
      });

      setAlumno(prev => ({ ...prev, programa: nuevoPlan }));
      alert(`Plan de estudios actualizado a ${nuevoPlan}`);
    } catch (error) {
      console.error("Error al actualizar el plan:", error);
      alert("Error al guardar el nuevo plan de estudios.");
    } finally {
      setActualizandoPlan(false);
    }
  };

  if (!alumno) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800">Alumno no encontrado</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-[#050C1C] hover:underline font-medium">Volver al listado</button>
      </div>
    );
  }

  const handleMarcadorChange = async (e) => {
    const nuevoMarcador = e.target.value;
    try {
      const alumnoRef = doc(db, 'alumnos', matricula);
      await updateDoc(alumnoRef, { marcador_seguimiento: nuevoMarcador });
      
      await registrarLog({
        usuario: currentUser?.email,
        accion: 'UPDATE',
        coleccion: 'alumnos',
        documentoId: matricula,
        campo: 'marcador_seguimiento',
        detalles: `Marcador cambiado a: ${nuevoMarcador}`
      });

      setAlumno(prev => ({ ...prev, marcador_seguimiento: nuevoMarcador }));
    } catch (error) {
      console.error("Error al actualizar marcador:", error);
      alert("Error al guardar el marcador.");
    }
  };

const handleAgregarComentario = async () => {
    if (!comentario.trim()) {
      alert("El comentario no puede estar vacío.");
      return;
    }

    const fechaActual = new Date().toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    const nuevoRegistro = {
      id: Date.now().toString(),
      fecha: fechaActual,
      agente: currentUser?.email || 'Usuario', 
      comentario: comentario.trim()
    };

    const nuevaBitacora = [...(alumno.bitacora_llamadas || []), nuevoRegistro];

    try {
      const alumnoRef = doc(db, 'alumnos', matricula);
      await updateDoc(alumnoRef, { bitacora_llamadas: nuevaBitacora });
      
      await registrarLog({
        usuario: currentUser?.email,
        accion: 'UPDATE',
        coleccion: 'alumnos',
        documentoId: matricula,
        campo: 'bitacora_llamadas',
        detalles: 'Se agregó un nuevo comentario de seguimiento'
      });
      
      setAlumno(prev => ({ ...prev, bitacora_llamadas: nuevaBitacora }));
      setComentario('');
    } catch (error) {
      console.error("Error al agregar comentario:", error);
      alert("Error al guardar en la bitácora.");
    }
  };

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

      await registrarLog({
        usuario: currentUser?.email,
        accion: 'UPDATE',
        coleccion: 'alumnos',
        documentoId: matricula,
        campo: 'materias',
        detalles: `Materia ${clave} movida a ${destino}`
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

const handleToggleEdit = async (field, currentValue) => {
    if (editingFields[field]) {
      let valueToSave = editValues[field];

      if (typeof valueToSave === 'string') {
        valueToSave = valueToSave.trim();
        
        if (valueToSave === '') {
          alert("El campo no puede estar vacío ni contener solo espacios.");
          return; 
        }

        if (field === 'curp') {
          if (valueToSave.length !== 18) {
            alert("La CURP debe tener exactamente 18 caracteres.");
            return;
          }

          const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i;
          if (!curpRegex.test(valueToSave)) {
            alert("El formato de la CURP es incorrecto.");
            return;
          }

          const { nombre, apellido_paterno, apellido_materno } = alumno;
          if (nombre && apellido_paterno) {
            const letrasEsperadas = calcularLetrasCURP(nombre, apellido_paterno, apellido_materno || '');
            if (letrasEsperadas) {
              const prefijoIngresado = valueToSave.substring(0, 4);
              const consonantesIngresadas = valueToSave.substring(13, 16);
              
              if (prefijoIngresado !== letrasEsperadas.prefijo) {
                alert(`El inicio de la CURP no coincide con el nombre. Debería ser ${letrasEsperadas.prefijo}.`);
                return;
              }
              if (consonantesIngresadas !== letrasEsperadas.consonantes) {
                alert(`Las consonantes internas no coinciden. Deberían ser ${letrasEsperadas.consonantes}.`);
                return;
              }
            }
          }
        }

        if (field === 'contacto_telefono') {
          if (!/^\d{10}$/.test(valueToSave)) {
            alert("El teléfono debe contener exactamente 10 números.");
            return;
          }
        }

        if (field === 'contacto_correo') {
          if (/\s/.test(valueToSave) || !valueToSave.includes('@') || !valueToSave.includes('.com')) {
            alert("El correo debe contener '@' y '.com', y no puede tener espacios.");
            return;
          }
        }
      
      }

      if (valueToSave === undefined) {
        valueToSave = currentValue;
      }

      try {
        const alumnoRef = doc(db, 'alumnos', matricula);
        await updateDoc(alumnoRef, { [field]: valueToSave });
        
        await registrarLog({
          usuario: currentUser?.email,
          accion: 'UPDATE',
          coleccion: 'alumnos',
          documentoId: matricula,
          campo: field,
          detalles: 'Edición de información administrativa/contacto'
        });
        
        setAlumno(prev => ({ ...prev, [field]: valueToSave }));
        setEditingFields(prev => ({ ...prev, [field]: false }));
      } catch (error) {
        console.error("Error al actualizar:", error);
        alert("Error al guardar los cambios.");
      }
    } else {
      setEditingFields(prev => ({ ...prev, [field]: true }));
      setEditValues(prev => ({
        ...prev,
        [field]: (currentValue === null || currentValue === undefined || currentValue === 'N/A') ? '' : currentValue
      }));
    }
  };

const renderEditableField = (label, field, type = 'text', options = []) => {
    const isEditing = editingFields[field];
    const currentValue = alumno[field];
    const draftValue = editValues[field] !== undefined ? editValues[field] : currentValue;

    let displayValue = currentValue;
    if (currentValue === null || currentValue === undefined || currentValue === '') {
      displayValue = 'N/A';
    } else if (type === 'boolean') {
      displayValue = currentValue ? 'Sí' : 'No';
    }

    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-gray-500">{label}</p>
          {!isEditing ? (
            <button
              onClick={() => handleToggleEdit(field, currentValue)}
              className="text-gray-400 hover:text-[#050C1C] transition-colors"
              title="Editar"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleEdit(field, currentValue)}
                className="text-green-600 hover:text-green-800 transition-colors"
                title="Guardar"
              >
                <CheckIcon className="w-4 h-4 stroke-2" />
              </button>
              <button
                onClick={() => setEditingFields(prev => ({ ...prev, [field]: false }))}
                className="text-red-500 hover:text-red-700 transition-colors"
                title="Cancelar"
              >
                <XMarkIcon className="w-4 h-4 stroke-2" />
              </button>
            </div>
          )}
        </div>
        
        {isEditing ? (
          <div>
            {type === 'select' ? (
              <select
                value={draftValue || ''}
                onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-[#050C1C]"
              >
                <option value="">N/A</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : type === 'boolean' ? (
              <select
                value={draftValue === null ? '' : (draftValue ? 'true' : 'false')}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditValues({ ...editValues, [field]: val === '' ? null : val === 'true' });
                }}
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-[#050C1C]"
              >
                <option value="">N/A</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            ) : (
              <input
                type="text"
                value={draftValue || ''}
                onChange={(e) => {
                  let val = e.target.value;
                  if (field === 'curp') {
                    val = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    if (val.length > 18) return; 
                  } else if (field === 'contacto_telefono') {
                    val = val.replace(/\D/g, ''); 
                    if (val.length > 10) return; 
                  } else if (field === 'contacto_correo') {
                    val = val.replace(/\s/g, ''); 
                  }
                  setEditValues({ ...editValues, [field]: val });
                }}
                className={`w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-[#050C1C] ${field === 'curp' ? 'uppercase font-mono tracking-wider' : ''} border-gray-300`}
              />
            )}
          </div>
        ) : (
          <p className={`font-medium ${type === 'boolean' && field === 'tiene_adeudo' ? (currentValue === null ? 'text-gray-800' : (currentValue ? 'text-red-600' : 'text-green-600')) : ''}`}>
            {displayValue}
          </p>
        )}
      </div>
    );
  };

  const renderMateriaCard = (clave, listaOrigen) => {
  const isEquivalenciaMode = modoEquivalencia && planEquivalenciaSeleccionado;
  const tieneEquivalencia = isEquivalenciaMode && !!mapaEquivalencias[clave];
  const claveEquivalente = tieneEquivalencia ? mapaEquivalencias[clave] : null;

  let baseClasses = "p-2 border rounded shadow-sm text-center cursor-move transition-all ";

  if (isEquivalenciaMode) {
    if (tieneEquivalencia) {
      baseClasses += "bg-indigo-50 border-indigo-400 opacity-100";
    } else {
      baseClasses += "bg-gray-100 border-gray-200 opacity-50 grayscale";
    }
  } else {
    if (listaOrigen === 'aprobadas') baseClasses += "bg-white border-l-4 border-l-green-500 border-gray-200 hover:shadow-md";
    if (listaOrigen === 'reprobadas') baseClasses += "bg-white border-l-4 border-l-red-500 border-gray-200 hover:shadow-md";
    if (listaOrigen === 'faltantes') baseClasses += "bg-white border-l-4 border-l-blue-500 border-gray-200 hover:shadow-md";
  }

  return (
    <li 
      key={clave} 
      draggable 
      onDragStart={(e) => handleDragStart(e, clave)}
      className={baseClasses}
    >
      <div className={`font-bold text-sm ${isEquivalenciaMode && !tieneEquivalencia ? 'text-gray-500' : 'text-gray-800'}`}>
        {diccionarioMaterias[clave] || 'Materia desconocida'}
      </div>
      <div className="text-gray-500 text-xs mt-0.5 font-mono">{clave}</div>
      
      {tieneEquivalencia && (
        <div className="mt-2 text-xs font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 py-1 px-2 rounded-md flex items-center justify-center gap-1">
          <ArrowsRightLeftIcon className="w-3 h-3 stroke-2" />
          Equivale a: {claveEquivalente}
        </div>
      )}
    </li>
  );
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
        <div className="flex items-center gap-3">
          {editingFields['estatus'] ? (
            <div className="flex items-center gap-2">
              <select
                value={editValues['estatus'] || ''}
                onChange={(e) => setEditValues(prev => ({ ...prev, estatus: e.target.value }))}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm font-bold focus:outline-none focus:border-[#050C1C]"
              >
                <option value="">N/A</option>
                {['BA','BC','BD','BE','BF','BI','BM','BN','BP','BR','BS','BU','BV','FI','FP','GC'].map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <button onClick={() => handleToggleEdit('estatus', alumno.estatus)} className="p-1 hover:bg-gray-100 rounded text-green-600" title="Guardar">
                <CheckIcon className="w-5 h-5 stroke-2" />
              </button>
              <button onClick={() => setEditingFields(prev => ({ ...prev, estatus: false }))} className="p-1 hover:bg-gray-100 rounded text-red-500" title="Cancelar">
                <XMarkIcon className="w-5 h-5 stroke-2" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded text-sm font-bold tracking-wide border ${
                alumno.estatus === 'BF' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-orange-100 text-orange-800 border-orange-200'
              }`}>
                Estatus: {alumno.estatus || 'N/A'}
              </span>
              <button onClick={() => handleToggleEdit('estatus', alumno.estatus)} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Editar">
                <PencilIcon className="w-5 h-5" />
              </button>
            </div>
          )}
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
                  <div className="w-2/3">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Plan de Estudios Registrado</p>
                    <select 
                      className={`w-full bg-white border border-gray-300 text-gray-800 font-bold text-base rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#050C1C] focus:border-[#050C1C] transition-colors ${actualizandoPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
                      value={alumno.programa || ''}
                      onChange={(e) => handleCambiarPlan(e.target.value)}
                      disabled={actualizandoPlan}
                    >
                      <option value="" disabled>Seleccione un plan</option>
                      
                      {/* NUEVO: Mostrar el plan actual si no está en la lista de planes registrados */}
                      {alumno.programa && !listaPlanes.includes(alumno.programa) && (
                        <option value={alumno.programa}>
                          {alumno.programa} (No registrado en DB)
                        </option>
                      )}

                      {/* Mapeo normal de los planes registrados */}
                      {listaPlanes.map((codigoPlan, index) => (
                         <option key={index} value={codigoPlan}>{codigoPlan}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    {!planExiste ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded border border-yellow-200">Plan no encontrado en DB</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">Plan localizado</span>
                    )}
                  </div>
                </div>
                {renderEditableField('CURP', 'curp')}
                <div><p className="text-gray-500">Género</p><p className="font-medium">{alumno.genero || 'N/A'}</p></div>
                {renderEditableField('Campus', 'campus')}
                <div><p className="text-gray-500">Tipo Ingreso</p><p className="font-medium">{alumno.tipo_ingreso || 'N/A'}</p></div>
                {renderEditableField('Primer Ingreso', 'ciclo_primer_ingreso')}
                {renderEditableField('Último Ciclo', 'ciclo_ultimo_cursado')}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Estatus de Salida</h2>
                <div className="text-sm space-y-4">
                  {renderEditableField('Motivo', 'motivo_baja')}
                  {renderEditableField('Documentación Retirada', 'documentacion_retirada', 'boolean')}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#050C1C] mb-4 border-b pb-2">Situación Financiera</h2>
                <div className="text-sm space-y-4">
                  {renderEditableField('Adeudo', 'tiene_adeudo', 'boolean')}
                  {renderEditableField('Detalle', 'detalle_adeudo')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA ACADÉMICA --- */}
        {activeTab === 'academica' && (
          <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
            
            {/* Encabezado y Controles */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-100 gap-4">
              <h2 className="text-lg font-bold text-[#050C1C]">Resumen Académico</h2>
              
              <div className="flex flex-wrap items-center gap-4">
                {/* Control de Equivalencias */}
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-md border border-gray-200">
                  <label className="flex items-center cursor-pointer gap-2">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={modoEquivalencia}
                        onChange={() => setModoEquivalencia(!modoEquivalencia)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${modoEquivalencia ? 'bg-[#050C1C]' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${modoEquivalencia ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Revisar Equivalencias</span>
                  </label>

                  {modoEquivalencia && (
                    <select
                      className="border border-gray-300 rounded text-sm px-2 py-1 focus:outline-none focus:border-[#050C1C]"
                      value={planEquivalenciaSeleccionado}
                      onChange={(e) => setPlanEquivalenciaSeleccionado(e.target.value)}
                      disabled={cargandoEquivalencias}
                    >
                      <option value="">Seleccione plan destino...</option>
                      {planesConEquivalencias.map(p => (
                        <option key={p.id} value={p.codigo}>{p.codigo}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Botón Original Cargar Situación */}
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
            </div>

            {/* Listas (Reemplazar mapeos internos con renderMateriaCard) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* APROBADAS */}
              <div 
                onDragOver={handleDragOver} 
                onDrop={(e) => handleDrop(e, 'aprobadas')}
                className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 transition-colors"
              >
                {/* ... Encabezado de columna ... */}
                <ul className="flex flex-col gap-2 text-sm min-h-[150px]">
                  {listaAprobadas.map(clave => renderMateriaCard(clave, 'aprobadas'))}
                  {listaAprobadas.length === 0 && <li className="text-gray-400 text-xs text-center py-6 flex items-center justify-center h-full">Arrastra materias aquí</li>}
                </ul>
              </div>

              {/* REPROBADAS */}
              <div 
                onDragOver={handleDragOver} 
                onDrop={(e) => handleDrop(e, 'reprobadas')}
                className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 transition-colors"
              >
                {/* ... Encabezado de columna ... */}
                <ul className="flex flex-col gap-2 text-sm min-h-[150px]">
                  {listaReprobadas.map(clave => renderMateriaCard(clave, 'reprobadas'))}
                  {listaReprobadas.length === 0 && <li className="text-gray-400 text-xs text-center py-6 flex items-center justify-center h-full">Arrastra materias aquí</li>}
                </ul>
              </div>

              {/* FALTANTES */}
              <div 
                onDragOver={handleDragOver} 
                onDrop={(e) => handleDrop(e, 'faltantes')}
                className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 transition-colors"
              >
                {/* ... Encabezado de columna ... */}
                {planExiste ? (
                  <ul className="flex flex-col gap-2 text-sm min-h-[150px]">
                    {faltantesCalculadas.map(clave => renderMateriaCard(clave, 'faltantes'))}
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
                
                {/* Editable Correo */}
                <div>
                  {renderEditableField('Correo Electrónico', 'contacto_correo')}
                  {!editingFields['contacto_correo'] && alumno.contacto_correo && (
                    <a href={`mailto:${alumno.contacto_correo}`} className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors">
                      <EnvelopeIcon className="w-4 h-4" /> Enviar correo
                    </a>
                  )}
                </div>

                {/* Editable Teléfono */}
                <div>
                  {renderEditableField('Teléfono', 'contacto_telefono')}
                  {!editingFields['contacto_telefono'] && alumno.contacto_telefono && (
                    <a href={`https://wa.me/52${alumno.contacto_telefono}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 hover:text-green-800 transition-colors">
                      <ChatBubbleLeftRightIcon className="w-4 h-4" /> Enviar WhatsApp
                    </a>
                  )}
                </div>

                {/* Marcador*/}
                <div>
                  <p className="text-gray-500">Marcador Actual</p>
                  <select 
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#050C1C]"
                    value={alumno.marcador_seguimiento || 'No contactado'}
                    onChange={handleMarcadorChange}
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
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 h-64 overflow-y-auto mb-4 space-y-3">
                {alumno.bitacora_llamadas && alumno.bitacora_llamadas.length > 0 ? (
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
                  onKeyDown={(e) => e.key === 'Enter' && handleAgregarComentario()}
                />
                <button 
                  onClick={handleAgregarComentario}
                  className="bg-[#050C1C] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1A2233]"
                >
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