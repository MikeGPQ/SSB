import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs';

export const procesarSituacionAcademica = async (file) => {
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
    
    textoCompleto += pageText + '\n';
  }

  let textoNormalizado = textoCompleto.replace(/\s+/g, ' ').trim();
  const codigosProcesados = new Map();
  const regexMaterias = /(\d{6})\s+([A-Za-z]{4})\s+([A-Za-z0-9]{4,5})\s+(.*?)\s+(\d+\.\d+)\.?\s+(\d+\.\d+)\.?\s+(\d{1,2}(?:\.\d+)?)/g;

  let match;
  while ((match = regexMaterias.exec(textoNormalizado)) !== null) {
    const prefijo = match[2].toUpperCase();
    
    const sufijo = match[3].toUpperCase().replace(/O/g, '0');
    
    const calificacion = parseFloat(match[7]);
    
    const clave = `${prefijo}-${sufijo}`;
    const aprobada = calificacion >= 6;

    if (codigosProcesados.has(clave)) {
      const existente = codigosProcesados.get(clave);
      codigosProcesados.set(clave, {
        clave: clave,
        aprobada: existente.aprobada || aprobada
      });
    } else {
      codigosProcesados.set(clave, {
        clave: clave,
        aprobada: aprobada
      });
    }
  }

  return Array.from(codigosProcesados.values());
};