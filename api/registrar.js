// ====================================================================
// FUNCIÓN SERVERLESS PARA VERCEL (/api/registrar)
// ====================================================================
// Esta función se ejecuta de forma 100% privada en los servidores de Vercel.
// Las credenciales de Supabase se leen desde las variables de entorno de Vercel
// y JAMÁS se exponen al navegador de los visitantes.
// ====================================================================

export default async function handler(req, res) {
  // Solo permitir peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utiliza POST.' });
  }

  const { nombreCompleto, correo, solicitaDescarga } = req.body || {};

  // Validaciones del servidor
  if (!nombreCompleto || typeof nombreCompleto !== 'string' || nombreCompleto.trim().length < 3) {
    return res.status(400).json({ error: 'El nombre completo es requerido (mínimo 3 caracteres).' });
  }

  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!correo || !emailRegex.test(correo.trim())) {
    return res.status(400).json({ error: 'El correo electrónico no es válido.' });
  }

  if (!solicitaDescarga) {
    return res.status(400).json({ error: 'Debes marcar la casilla para confirmar la descarga.' });
  }

  // Obtener variables de entorno configuradas en Vercel o en .env (mayúsculas o minúsculas)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.supabase_url;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.supabase_anon_key;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Faltan configurar las variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY en Vercel.');
    return res.status(500).json({ 
      error: 'Error de configuración en el servidor. Verifica las variables de entorno en Vercel.' 
    });
  }

  try {
    // Inserción directa en la API REST de Supabase mediante fetch nativo de Node.js
    const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/bitacora_descargas`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal' // No requiere SELECT, respeta política de solo inserción
      },
      body: JSON.stringify([
        {
          nombre_completo: nombreCompleto.trim(),
          correo: correo.trim().toLowerCase(),
          solicita_descarga: true
        }
      ])
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error desde la API de Supabase:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'No se pudo registrar la descarga en la base de datos.',
        detalles: errorText
      });
    }

    // Éxito: Registro completado
    return res.status(200).json({ ok: true, mensaje: 'Descarga registrada exitosamente en la bitácora.' });

  } catch (err) {
    console.error('Error interno en la función serverless:', err);
    return res.status(500).json({ error: 'Ocurrió un error inesperado al conectar con la base de datos.' });
  }
}
