import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ListadoAlumnos from './pages/ListadoAlumnos';
import PerfilAlumno from './pages/PerfilAlumno';
import PlanesEstudio from './pages/PlanesEstudio';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ListadoAlumnos />} />
          <Route path="alumno/:matricula" element={<PerfilAlumno />} />
          <Route path="planes-estudio" element={<PlanesEstudio />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}