import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs';

export const procesarPDF = async (file, nivel) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textoCompleto = '';

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
      
      pageText += item.str;
      lastY = currentY;
    }
    
    let lineas = pageText.split('\n');
    let mergedText = '';
    let verticalBuffer = '';

    for (let j = 0; j < lineas.length; j++) {
      const linea = lineas[j].trim();
      
      if (linea.length === 1) {
        verticalBuffer += linea;
      } else {
        if (verticalBuffer.length > 0) {
          mergedText += ' ' + verticalBuffer + ' ';
          verticalBuffer = '';
        }
        mergedText += ' ' + linea + ' ';
      }
    }
    
    if (verticalBuffer.length > 0) {
      mergedText += ' ' + verticalBuffer + ' ';
    }
    
    textoCompleto += mergedText + '\n'; 
  }

  const marcadoresFin = [
    /"?Los programas acad[eé]micos/i,
    /ASIGNATURAS ELECTIVAS/i
  ];

  let indiceCorte = textoCompleto.length;
  let corteEncontrado = false;

  marcadoresFin.forEach(regex => {
    const match = textoCompleto.match(regex);
    if (match && match.index < indiceCorte) {
      indiceCorte = match.index;
      corteEncontrado = true;
    }
  });

  if (corteEncontrado) {
    textoCompleto = textoCompleto.substring(0, indiceCorte);
  }
  
  textoCompleto = textoCompleto
    .replace(/UNIVERSIDAD INTERAMERICANA PARA EL DESARROLLO/gi, ' ')
    .replace(/MAPA DE EJECUCI[OÓ]N PARA EL PLAN \d{4}/gi, ' ')
    .replace(/Exclusivo para la generaci[oó]n.*?posteriores/gi, ' ')
    .replace(/LICENCIATURA EN [A-ZÁÉÍÓÚÑ\s]+/gi, ' ')
    .replace(/MAESTR[IÍ]A EN [A-ZÁÉÍÓÚÑ\s]+/gi, ' ')
    .replace(/ESPECIALIDAD EN [A-ZÁÉÍÓÚÑ\s]+/gi, ' ')
    .replace(/Programa de Aprendizaje Combinado/gi, ' ')
    .replace(/\(PAC\)/gi, ' ')
    .replace(/\bPAC\)?\b/gi, ' ')
    .replace(/[uú]lt[ií]ma actualizaci.n.*?20\d{2}/gi, ' ')
    .replace(/CPA:.*?20\d{2}/gi, ' ')
    .replace(/Cursos extracurriculares, obligatorios\s*\.?/gi, ' ') 
    .replace(/extracurriculares, obligatorios\s*\.?/gi, ' ')
    .replace(/DESCRIPCI[OÓ]N/gi, ' ')
    .replace(/\(?MIXTO\)?\s*-\s*FEDERAL/gi, ' ')
    .replace(/\(R(?:-\d+)?\)/gi, ' ')
    .replace(/\u03A0|Π/g, ' ')
    .replace(/C U A T R I M E S T R E S?/gi, ' ')
    .replace(/CUATRIMESTRES?/gi, ' ')
    .replace(/FORMANDO CON VALORES/gi, ' ')
    .replace(/UNID/g, ' ')
    .replace(/\b[1-9][oO]\b/g, ' ') 
    .replace(/\b\d{1,2}0\b/g, ' ')
    .trim();

  textoCompleto = textoCompleto.replace(/\s+/g, ' ');

  textoCompleto = textoCompleto.replace(/([A-ZÁÉÍÓÚÑa-záéíóúñ])([A-Z]{4}\s*[-–—]\s*[A-Z0-9]{4,5}\b)/g, '$1 $2');

  const partes = textoCompleto.split(/\b([A-Z]{4}\s*[-–—]\s*[A-Z0-9]{4,5})\b/);
  const materiasExtraidas = [];

  for (let i = 1; i < partes.length; i += 2) {
    let nombreCrudo = partes[i - 1].trim();
    const clave = partes[i].trim().replace(/\s+/g, '');

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

  if (nivel === 'Licenciatura') {
    const existeEstadia = materiasExtraidas.some(materia => materia.clave === 'LMAD-EES02');
    if (!existeEstadia) {
      materiasExtraidas.push({
        nombre: 'ESTADÍA EMPRESARIAL',
        clave: 'LMAD-EES02'
      });
    }
  }
  
  return materiasExtraidas;
};