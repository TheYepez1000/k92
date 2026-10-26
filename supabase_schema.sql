-- =============================================================================
-- UNIDAD CANINA K9 - ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- =============================================================================
-- Instrucciones:
-- 1. Inicia sesión o crea tu proyecto gratuito en https://supabase.com
-- 2. En el panel izquierdo de tu proyecto, haz clic en "SQL Editor" -> "New query".
-- 3. Copia y pega todo este código y haz clic en "RUN".
-- 4. Copia tu "Project URL" y "anon public key" (en Project Settings -> API).
-- 5. Pégalas en el botón ☁️ "EN LÍNEA / CLOUD" del menú superior de la web K9.
-- =============================================================================

-- 1. Tabla de Estado Central y Sincronización en Tiempo Real
CREATE TABLE IF NOT EXISTS public.k9_app_state (
    id TEXT PRIMARY KEY DEFAULT 'k9_global_state',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT DEFAULT 'system'
);

-- 2. Habilitar Seguridad a Nivel de Fila (Row Level Security)
ALTER TABLE public.k9_app_state ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas de Acceso (Lectura y Escritura mediante Anon Key)
DROP POLICY IF EXISTS "Permitir lectura publica K9" ON public.k9_app_state;
CREATE POLICY "Permitir lectura publica K9"
ON public.k9_app_state
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Permitir insercion y actualizacion publica K9" ON public.k9_app_state;
CREATE POLICY "Permitir insercion y actualizacion publica K9"
ON public.k9_app_state
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 4. Habilitar Tiempo Real (Supabase Realtime) en la tabla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'k9_app_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.k9_app_state;
  END IF;
END $$;

-- 5. Inicializar fila única de estado si no existe
INSERT INTO public.k9_app_state (id, payload, updated_at, updated_by)
VALUES ('k9_global_state', '{}'::jsonb, NOW(), 'initial_seed')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.k9_app_state IS 'Tabla de sincronización en tiempo real para la plataforma táctica de la Unidad K9';
