import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs';

export const procesarPDF = async (file) => {
  console.log("1. Iniciando lectura del PDF...");
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textoCompleto = '';

  console.log("2. Extrayendo texto de las páginas...");
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    let pageText = '';
    let lastY = null;

    for (const item of textContent.items) {
      if (!item.str) continue;
      
      const currentY = item.transform[5]; 
      
      if (lastY !== null && Math.abs(lastY - currentY) > 5) {
        pageText += '\n';
      }
      
      pageText += item.str + ' ';
      lastY = currentY;
    }
    
    textoCompleto += pageText + '\n'; 
  }

  console.log("3. Sanitizando texto...");
  
  textoCompleto = textoCompleto
    .replace(/.*Los programas acad[eé]micos.*/gi, ' ')
    .replace(/.*MAPA DE EJECUCI[OÓ]N.*/gi, ' ')
    .replace(/.*UNIVERSIDAD INTERAMERICANA.*/gi, ' ')
    .replace(/.*LICENCIATURA EN.*/gi, ' ')
    .replace(/.*MAESTR[IÍ]A EN.*/gi, ' ')
    .replace(/.*ESPECIALIDAD EN.*/gi, ' ');

  textoCompleto = textoCompleto.replace(/\s+/g, ' ');

  textoCompleto = textoCompleto
    .replace(/[uú]ltima actualizaci.n.*?\d{4}/gi, ' ')
    .replace(/CPA:.*?\d{4}/gi, ' ')
    .replace(/Cursos extracurriculares, obligatorios\s*\.?/gi, ' ') 
    .replace(/extracurriculares, obligatorios\s*\.?/gi, ' ')
    .replace(/Unidades Electivas de Aprendizaje Multidisciplinar/gi, ' ')
    .replace(/Unidad Electiva de Aprendizaje Situado/gi, ' ')
    .replace(/Aprendizaje Situado/gi, ' ')
    // Reglas existentes
    .replace(/\(R\)/g, ' ')
    .replace(/\u03A0|Π/g, ' ')
    .replace(/C U A T R I M E S T R E S?/gi, ' ')
    .replace(/CUATRIMESTRES?/gi, ' ')
    .replace(/DESCRIPCI[OÓ]N/gi, ' ')
    .replace(/Nombre Oficial/gi, ' ')
    .replace(/SUBJ de la Materia/gi, ' ')
    .replace(/CRSE \/ Clave SEP de la Materia/gi, ' ')
    .replace(/CRSE\/Clave SEP de la Materia/gi, ' ')
    .replace(/Materia Nacional/gi, ' ')
    .replace(/Materia con EGEL/gi, ' ')
    .replace(/en l[ií]nea/gi, ' ')
    .replace(/ASIGNATURAS ELECTIVAS/gi, ' ')
    .replace(/Asignaturas Electivas/gi, ' ')
    .replace(/FORMANDO CON VALORES/gi, ' ')
    .replace(/UNID/g, ' ')
    .replace(/\b[1-9][oO]\b/g, ' ') 
    .replace(/\b[1-9]0\b/g, ' ')
    .trim();

  console.log("4. Procesando separación de claves...");
  const partes = textoCompleto.split(/\b([A-Z]{4}-[A-Z0-9]{4,5})\b/);
  
  const materiasExtraidas = [];

  for (let i = 1; i < partes.length; i += 2) {
    let nombreCrudo = partes[i - 1].trim();
    const clave = partes[i].trim();

    if (nombreCrudo.length > 80) {
      const porcionFinal = nombreCrudo.substring(nombreCrudo.length - 80);
      const primerEspacio = porcionFinal.indexOf(' ');
      nombreCrudo = primerEspacio !== -1 ? porcionFinal.substring(primerEspacio) : porcionFinal;
    }

    let nombreLimpio = nombreCrudo.replace(/^[^a-zA-ZÁÉÍÓÚÑáéíóúñ]+/, '').trim();

    if (nombreLimpio.length > 3) {
      materiasExtraidas.push({
        nombre: nombreLimpio,
        clave: clave
      });
    }
  }
  
  console.log(`5. Proceso terminado. ${materiasExtraidas.length} materias detectadas.`);
  return materiasExtraidas;
};