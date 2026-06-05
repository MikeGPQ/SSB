import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const registrarLog = async ({ usuario, accion, coleccion, documentoId = null, campo = null, detalles = null }) => {
  try {
    await addDoc(collection(db, 'logs_actividad'), {
      usuario: usuario || 'Sistema',
      fecha: new Date().toISOString(),
      accion: accion,
      coleccion: coleccion,
      documento_id: documentoId,
      campo_afectado: campo,
      detalles: detalles
    });
  } catch (error) {
    console.error('Error al guardar log de actividad:', error);
  }
};