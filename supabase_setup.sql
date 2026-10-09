 -- 1. Crear tabla de bitácora (si no existe)
CREATE TABLE IF NOT EXISTS bitacora_descargas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_completo VARCHAR(120) NOT NULL,
  correo VARCHAR(150) NOT NULL,
  solicita_descarga BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validación de formato de correo electrónico
  CONSTRAINT correo_valido
    CHECK (correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  
  -- Solo se permite registrar si el check de descarga fue marcado como verdadero
  CONSTRAINT debe_solicitar_descarga
    CHECK (solicita_descarga = TRUE)
);

-- 2. Índices de búsqueda y orden (usamos IF NOT EXISTS para evitar error 42P07)
CREATE INDEX IF NOT EXISTS idx_bitacora_correo ON bitacora_descargas (correo);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora_descargas (fecha_registro DESC);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE bitacora_descargas ENABLE ROW LEVEL SECURITY;

-- 4. Política de seguridad: la página web (rol 'anon') puede insertar datos
-- Primero eliminamos la política si ya existía para evitar duplicados:
DROP POLICY IF EXISTS "insertar desde formulario" ON bitacora_descargas;

CREATE POLICY "insertar desde formulario"
  ON bitacora_descargas
  FOR INSERT
  TO anon
  WITH CHECK (solicita_descarga = TRUE);

-- Nota: Como no se crea ninguna política SELECT para el rol 'anon', 
-- los visitantes no pueden leer ni espiar los correos de otros usuarios,
-- cumpliendo con la regla: "la página puede insertar, pero no leer".
