import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { registrarLog } from '../utils/registroLogs';
import { useAuth } from '../context/AuthContext';

export default function RegistroUsuario() {
  const { currentUser } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailValido = email === '' || (email.includes('@') && email.includes('.com'));
  const passwordsCoinciden = confirmPassword === '' || password === confirmPassword;
  
  const isFormValid = 
    email !== '' && 
    password !== '' && 
    confirmPassword !== '' && 
    email.includes('@') && 
    email.includes('.com') && 
    password === confirmPassword;

  const handleGuardarClick = (e) => {
    e.preventDefault();
    setError('');
    setShowAuthModal(true);
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      await createUserWithEmailAndPassword(auth, email, password);
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

      await registrarLog({
        usuario: currentUser?.email || adminEmail,
        accion: 'CREATE',
        coleccion: 'sistema',
        campo: 'usuarios',
        detalles: `Registro de nuevo usuario administrador: ${email}`
      });

      alert('Usuario creado exitosamente.');
      
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAdminEmail('');
      setAdminPassword('');
      setShowAuthModal(false);

    } catch (err) {
      console.error(err);
      setError('Error en la autenticación o creación. Verifica tus credenciales de administrador o si el correo nuevo ya existe.');
    } finally {
      setLoading(false);
    }
  };

  const preventSpaces = (e, setter) => {
    const value = e.target.value.replace(/\s/g, '');
    setter(value);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto mt-10">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2">Registro de Nuevo Usuario</h1>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm font-medium">{error}</div>}

      <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
        <form onSubmit={handleGuardarClick} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Correo del nuevo usuario</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => preventSpaces(e, setEmail)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-colors ${!emailValido ? 'border-red-500 bg-red-50 focus:border-red-600' : 'border-gray-300 focus:border-[#050C1C]'}`}
              placeholder="ejemplo@empresa.com"
            />
            {!emailValido && (
              <p className="text-xs text-red-600 mt-1.5 font-bold">❌ El correo debe contener "@" y ".com"</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña (Máx 15 caracteres)</label>
            <input 
              type="password" 
              maxLength={15}
              value={password}
              onChange={(e) => preventSpaces(e, setPassword)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Contraseña</label>
            <input 
              type="password" 
              maxLength={15}
              value={confirmPassword}
              onChange={(e) => preventSpaces(e, setConfirmPassword)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none transition-colors ${!passwordsCoinciden ? 'border-red-500 bg-red-50 focus:border-red-600' : 'border-gray-300 focus:border-[#050C1C]'}`}
            />
            {!passwordsCoinciden && (
              <p className="text-xs text-red-600 mt-1.5 font-bold">❌ Las contraseñas no coinciden</p>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={!isFormValid}
            className="w-full mt-4 bg-[#050C1C] text-white py-2 rounded-md font-medium hover:bg-[#1A2233] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar Usuario
          </button>
        </form>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Autenticación Requerida</h2>
            <p className="text-sm text-gray-600 mb-4">
              Para registrar un nuevo usuario, por favor verifica tu identidad ingresando <strong>tus credenciales actuales</strong> de administrador.
            </p>
            
            <form onSubmit={handleCrearUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tu Correo</label>
                <input 
                  type="email" 
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tu Contraseña</label>
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setAdminPassword('');
                  }} 
                  disabled={loading}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading || !adminEmail || !adminPassword}
                  className="px-4 py-2 bg-[#050C1C] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verificando...' : 'Confirmar y Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}