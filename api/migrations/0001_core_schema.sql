-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0001 - Core schema
-- ============================================================

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------

CREATE TABLE users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    password_hash TEXT,
    google_sub TEXT UNIQUE,
    email_verified_at TEXT,
    active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

-- ------------------------------------------------------------
-- criaderos
-- ------------------------------------------------------------

CREATE TABLE criaderos (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
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
-- catalogos
-- ------------------------------------------------------------

CREATE TABLE catalogos (
    id TEXT PRIMARY KEY NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

-- ------------------------------------------------------------
-- catalogo_items
-- ------------------------------------------------------------

CREATE TABLE catalogo_items (
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

-- ------------------------------------------------------------
-- Unicidad funcional de CatalogoItems
--
-- El codigo debe ser unico solamente entre registros activos
-- del mismo criadero y catalogo.
--
-- Un codigo perteneciente exclusivamente a registros con
-- deleted_at informado puede reutilizarse.
-- ------------------------------------------------------------

CREATE UNIQUE INDEX ux_catalogo_items_codigo_activo
    ON catalogo_items(criadero_id, catalogo_id, codigo)
    WHERE deleted_at IS NULL;

-- ------------------------------------------------------------
-- Indices de relaciones
-- ------------------------------------------------------------

CREATE INDEX ix_catalogo_items_criadero_id
    ON catalogo_items(criadero_id);

CREATE INDEX ix_catalogo_items_catalogo_id
    ON catalogo_items(catalogo_id);
