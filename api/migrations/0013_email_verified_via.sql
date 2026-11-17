-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0013 - Marcador de como se verifico el correo
--
-- users.email_verified_via distingue una verificacion real de una
-- marca sin prueba (register con EMAIL_VERIFICATION_REQUIRED apagada):
--   'CODE'   = el titular introdujo el codigo enviado al correo.
--   'GOOGLE' = Google confirmo el correo (alta o vinculacion).
--   NULL     = sin prueba (incluye todas las filas existentes, que 0012
--              marco verificadas sin probar el correo).
-- Sin DEFAULT, sin CHECK y sin indice (no se consulta por esta columna).
-- ============================================================

ALTER TABLE users ADD COLUMN email_verified_via TEXT;
