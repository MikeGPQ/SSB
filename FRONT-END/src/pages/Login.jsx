import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registrarLog } from '../utils/registroLogs';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      
      const userCredential = await login(email, password);
      
      await registrarLog({
        usuario: userCredential.user.email,
        accion: 'LOGIN',
        coleccion: 'sistema',
        detalles: 'Inicio de sesión exitoso'
      });

      navigate('/');
    } catch (err) {
      setError('Fallo al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <div className="bg-white p-8 rounded-md shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-[#050C1C] mb-6 text-center">Iniciar Sesión</h2>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#050C1C]"
            />
          </div>
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-[#050C1C] text-white py-2 rounded-md font-medium hover:bg-[#1A2233] transition-colors disabled:opacity-50"
          >
            {loading ? 'Iniciando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}