-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0003 - Onboarding schema
-- ============================================================
--
-- Cambios:
-- 1. Eliminar UNIQUE de criaderos.user_id para permitir 1:N
-- 2. Agregar campos de onboarding a criaderos
-- 3. Crear tabla criadero_configuracion para evitar dependencia circular
-- 4. Agregar soft delete a criaderos
-- ============================================================

-- ------------------------------------------------------------
-- Paso 1: Reconstruir catalogo_items para eliminar FK hacia criaderos
-- ------------------------------------------------------------
-- SQLite no soporta DROP CONSTRAINT directamente.
-- catalogo_items tiene FK hacia criaderos, por lo que debemos
-- reconstruirlo primero para poder luego reconstruir criaderos.

CREATE TABLE catalogo_items_new (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    catalogo_id TEXT NOT NULL,
    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    orden INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

    FOREIGN KEY (catalogo_id)
        REFERENCES catalogos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

INSERT INTO catalogo_items_new (
    id,
    criadero_id,
    catalogo_id,
    codigo,
    nombre,
    descripcion,
    activo,
    orden,
    created_at,
    updated_at,
    deleted_at,
    version
)
SELECT
    id,
    criadero_id,
    catalogo_id,
    codigo,
    nombre,
    descripcion,
    activo,
    orden,
    created_at,
    updated_at,
    deleted_at,
    version
FROM catalogo_items;

DROP TABLE catalogo_items;
ALTER TABLE catalogo_items_new RENAME TO catalogo_items;

-- ------------------------------------------------------------
-- Paso 2: Recrear índices de catalogo_items
-- ------------------------------------------------------------
CREATE UNIQUE INDEX ux_catalogo_items_codigo_activo
    ON catalogo_items(criadero_id, catalogo_id, codigo)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_catalogo_items_criadero_id
    ON catalogo_items(criadero_id);

CREATE INDEX ix_catalogo_items_catalogo_id
    ON catalogo_items(catalogo_id);

-- ------------------------------------------------------------
-- Paso 3: Crear tabla nueva criaderos con esquema modificado
-- ------------------------------------------------------------
-- SQLite no soporta DROP CONSTRAINT, por lo que reconstruimos la tabla

CREATE TABLE criaderos_new (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    pais TEXT,
    provincia TEXT,
    ciudad TEXT,
    direccion TEXT,
    telefono TEXT,
    correo_contacto TEXT,
    logo_uri TEXT,
    onboarding_completado INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_completado IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

-- ------------------------------------------------------------
-- Paso 4: Migrar datos existentes
-- ------------------------------------------------------------
-- Migramos todos los datos existentes, los nuevos campos serán NULL
INSERT INTO criaderos_new (
    id,
    user_id,
    nombre,
    descripcion,
    pais,
    provincia,
    ciudad,
    direccion,
    telefono,
    correo_contacto,
    logo_uri,
    onboarding_completado,
    created_at,
    updated_at,
    deleted_at,
    version
)
SELECT
    id,
    user_id,
    nombre,
    NULL as descripcion,
    NULL as pais,
    NULL as provincia,
    NULL as ciudad,
    NULL as direccion,
    NULL as telefono,
    NULL as correo_contacto,
    NULL as logo_uri,
    0 as onboarding_completado,
    created_at,
    updated_at,
    deleted_at,
    version
FROM criaderos;

-- ------------------------------------------------------------
-- Paso 5: Eliminar tabla vieja y renombrar la nueva
-- ------------------------------------------------------------
DROP TABLE criaderos;
ALTER TABLE criaderos_new RENAME TO criaderos;

-- ------------------------------------------------------------
-- Paso 6: Recrear índices de criaderos
-- ------------------------------------------------------------
-- Índice para consultas frecuentes por user_id y soft delete
CREATE INDEX ix_criaderos_user_id_deleted_at
    ON criaderos(user_id, deleted_at);

-- ------------------------------------------------------------
-- Paso 7: Restaurar FK en catalogo_items hacia criaderos
-- ------------------------------------------------------------
-- Ahora que criaderos tiene el nuevo esquema, recreamos catalogo_items
-- con la FK restaurada

CREATE TABLE catalogo_items_new (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    catalogo_id TEXT NOT NULL,
    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    orden INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (catalogo_id)
        REFERENCES catalogos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

INSERT INTO catalogo_items_new (
    id,
    criadero_id,
    catalogo_id,
    codigo,
    nombre,
    descripcion,
    activo,
    orden,
    created_at,
    updated_at,
    deleted_at,
    version
)
SELECT
    id,
    criadero_id,
    catalogo_id,
    codigo,
    nombre,
    descripcion,
    activo,
    orden,
    created_at,
    updated_at,
    deleted_at,
    version
FROM catalogo_items;

DROP TABLE catalogo_items;
ALTER TABLE catalogo_items_new RENAME TO catalogo_items;

-- ------------------------------------------------------------
-- Paso 8: Recrear índices de catalogo_items
-- ------------------------------------------------------------
CREATE UNIQUE INDEX ux_catalogo_items_codigo_activo
    ON catalogo_items(criadero_id, catalogo_id, codigo)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_catalogo_items_criadero_id
    ON catalogo_items(criadero_id);

CREATE INDEX ix_catalogo_items_catalogo_id
    ON catalogo_items(catalogo_id);

-- ------------------------------------------------------------
-- Paso 9: Crear tabla criadero_configuracion
-- ------------------------------------------------------------
-- Esta tabla evita la dependencia circular entre criaderos y catalogo_items
-- Al estar separada, se puede crear después de que existan ambos criaderos y catalogo_items

CREATE TABLE criadero_configuracion (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL UNIQUE,
    especie_principal_item_id TEXT,
    raza_principal_item_id TEXT,
    tipo_criadero_item_id TEXT,
    finalidad_item_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    FOREIGN KEY (especie_principal_item_id)
        REFERENCES catalogo_items(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT,

    FOREIGN KEY (raza_principal_item_id)
        REFERENCES catalogo_items(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT,

    FOREIGN KEY (tipo_criadero_item_id)
        REFERENCES catalogo_items(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT,

    FOREIGN KEY (finalidad_item_id)
        REFERENCES catalogo_items(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT
);

-- ------------------------------------------------------------
-- Paso 10: Índices de relaciones
-- ------------------------------------------------------------
-- NOTA: ix_criadero_configuracion_criadero_id es redundante porque
-- criadero_id ya es UNIQUE, por lo que se omite este índice

CREATE INDEX ix_criadero_configuracion_especie_principal_item_id
    ON criadero_configuracion(especie_principal_item_id);

CREATE INDEX ix_criadero_configuracion_raza_principal_item_id
    ON criadero_configuracion(raza_principal_item_id);

CREATE INDEX ix_criadero_configuracion_tipo_criadero_item_id
    ON criadero_configuracion(tipo_criadero_item_id);

CREATE INDEX ix_criadero_configuracion_finalidad_item_id
    ON criadero_configuracion(finalidad_item_id);
