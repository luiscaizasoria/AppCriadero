-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0012 - Verificacion de cuenta por codigo
--
-- Spec: documents/specs/auth-verificacion-google.md (seccion 3).
-- users.email_verified_at ya existe (0001): no hace falta ALTER.
--
-- Contenido:
--   1. Las cuentas existentes quedan verificadas.
--   2. email_verification_codes: un codigo activo por cuenta.
--   3. rate_limits: contadores de ventana fija por clave.
--
-- Formato de fechas: las columnas TEXT de fecha usan
-- CURRENT_TIMESTAMP ('YYYY-MM-DD HH:MM:SS', UTC); email_verified_at
-- sigue ese mismo formato. Las columnas INTEGER (expires_at, sent_at,
-- window_start) son epoch en milisegundos.
-- ============================================================

-- 1. Cuentas existentes (incluida la del usuario): verificadas.
--    Idempotente: no toca las que ya tienen fecha.
UPDATE users
   SET email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
 WHERE email_verified_at IS NULL;

-- 2. Codigos de verificacion (efimeros; sin deleted_at ni version).
CREATE TABLE email_verification_codes (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL UNIQUE,
    code_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    sent_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE RESTRICT
);

-- Limpieza de codigos vencidos.
CREATE INDEX ix_email_verification_codes_expires_at
    ON email_verification_codes(expires_at);

-- 3. Limites de uso (ventana fija). key = hash de correo o IP, o 'global'.
CREATE TABLE rate_limits (
    bucket TEXT NOT NULL,
    key TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    count INTEGER NOT NULL,

    PRIMARY KEY (bucket, key)
) WITHOUT ROWID;

-- Limpieza de ventanas vencidas.
CREATE INDEX ix_rate_limits_window_start
    ON rate_limits(window_start);

-- Limpieza de cuentas sin verificar (created_at < ahora - 24 h).
CREATE INDEX ix_users_sin_verificar
    ON users(created_at)
    WHERE email_verified_at IS NULL;
