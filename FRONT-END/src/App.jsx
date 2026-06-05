import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './utils/ProtectedRoute'; 

import Layout from './components/Layout';
import Login from './pages/Login'; 
import ListadoAlumnos from './pages/ListadoAlumnos';
import PlanesEstudio from './pages/PlanesEstudio';
import PerfilAlumno from './pages/PerfilAlumno';
import LogsActividad from './pages/LogsActividad';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<ListadoAlumnos />} />
            <Route path="planes-estudio" element={<PlanesEstudio />} />
            <Route path="alumno/:matricula" element={<PerfilAlumno />} />
            <Route path="logs" element={<LogsActividad />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}