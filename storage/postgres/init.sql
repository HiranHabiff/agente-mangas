-- ============================================
-- MANGA MANAGEMENT DATABASE SCHEMA
-- PostgreSQL 15+
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search
CREATE EXTENSION IF NOT EXISTS "vector";   -- For embeddings (pgvector)

-- ============================================
-- CORE TABLES
-- ============================================

-- Main mangas table
CREATE TABLE mangas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_title VARCHAR(750) NOT NULL,
    url TEXT,
    image_filename VARCHAR(500),
    image_url TEXT,
    last_chapter_read INTEGER DEFAULT 0,
    total_chapters INTEGER,
    rating NUMERIC(3,2) CHECK (rating >= 0 AND rating <= 10),
    status VARCHAR(50) DEFAULT 'reading' CHECK (status IN ('reading', 'completed', 'paused', 'dropped', 'plan_to_read')),
    synopsis TEXT,
    user_notes TEXT,
    embedding vector(768),

    -- Legacy migration fields
    legacy_id INTEGER UNIQUE,
    legacy_parent_id INTEGER,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Alternative names/titles for same manga
CREATE TABLE manga_names (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manga_id UUID NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    name VARCHAR(750) NOT NULL,
    language VARCHAR(10) DEFAULT 'pt-BR',
    is_official BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_manga_name UNIQUE(manga_id, name)
);

-- Tags/Categories
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many relationship: mangas <-> tags
CREATE TABLE manga_tags (
    manga_id UUID REFERENCES mangas(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (manga_id, tag_id)
);

-- Reminders for manga updates
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manga_id UUID NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) DEFAULT 'update' CHECK (reminder_type IN ('update', 'scheduled', 'custom')),
    message TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_days INTEGER,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reading history/sessions
CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manga_id UUID NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Authors/Artists
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('author', 'artist', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_creator UNIQUE(name, role)
);

CREATE TABLE manga_creators (
    manga_id UUID REFERENCES mangas(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (manga_id, creator_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Full-text search indexes
CREATE INDEX idx_mangas_primary_title_trgm ON mangas USING gin(primary_title gin_trgm_ops);
CREATE INDEX idx_manga_names_name_trgm ON manga_names USING gin(name gin_trgm_ops);
CREATE INDEX idx_mangas_synopsis_trgm ON mangas USING gin(synopsis gin_trgm_ops);

-- Vector similarity search (for AI recommendations)
CREATE INDEX idx_mangas_embedding ON mangas USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Common query indexes
CREATE INDEX idx_mangas_status ON mangas(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_mangas_rating ON mangas(rating DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_mangas_updated_at ON mangas(updated_at DESC);
CREATE INDEX idx_mangas_last_read_at ON mangas(last_read_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_scheduled_for ON reminders(scheduled_for) WHERE is_active = true;
CREATE INDEX idx_tags_category ON tags(category);
CREATE INDEX idx_mangas_legacy_id ON mangas(legacy_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mangas_updated_at BEFORE UPDATE ON mangas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Complete manga view with all names
CREATE VIEW v_manga_complete AS
SELECT
    m.id,
    m.primary_title,
    m.url,
    m.image_filename,
    m.last_chapter_read,
    m.total_chapters,
    m.rating,
    m.status,
    m.synopsis,
    m.user_notes,
    m.created_at,
    m.updated_at,
    m.last_read_at,
    ARRAY_AGG(DISTINCT mn.name) FILTER (WHERE mn.name IS NOT NULL) as alternative_names,
    ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags,
    COUNT(DISTINCT rs.id) as reading_session_count
FROM mangas m
LEFT JOIN manga_names mn ON m.id = mn.manga_id
LEFT JOIN manga_tags mt ON m.id = mt.manga_id
LEFT JOIN tags t ON mt.tag_id = t.id
LEFT JOIN reading_sessions rs ON m.id = rs.manga_id
WHERE m.deleted_at IS NULL
GROUP BY m.id;

-- Active reminders view
CREATE VIEW v_active_reminders AS
SELECT
    r.id,
    r.manga_id,
    m.primary_title as manga_title,
    r.reminder_type,
    r.message,
    r.scheduled_for,
    r.is_recurring,
    r.recurrence_days
FROM reminders r
JOIN mangas m ON r.manga_id = m.id
WHERE r.is_active = true
    AND m.deleted_at IS NULL
ORDER BY r.scheduled_for ASC;

-- ============================================
-- SEED DATA - Common Tags
-- ============================================

INSERT INTO tags (name, category, color) VALUES
    ('Ação', 'genre', '#FF6B6B'),
    ('Aventura', 'genre', '#4ECDC4'),
    ('Comédia', 'genre', '#FFE66D'),
    ('Drama', 'genre', '#A8DADC'),
    ('Fantasia', 'genre', '#B19CD9'),
    ('Harém', 'genre', '#FF8B94'),
    ('Isekai', 'genre', '#95E1D3'),
    ('Magia', 'genre', '#9D84B7'),
    ('Martial Arts', 'genre', '#F38181'),
    ('Mistério', 'genre', '#AA96DA'),
    ('Psicológico', 'genre', '#C5A3FF'),
    ('Romance', 'genre', '#FFAAA5'),
    ('Seinen', 'demographic', '#546E7A'),
    ('Shounen', 'demographic', '#FF7043'),
    ('Shoujo', 'demographic', '#EC407A'),
    ('Josei', 'demographic', '#AB47BC'),
    ('Reencarnação', 'theme', '#66BB6A'),
    ('Revenge', 'theme', '#EF5350'),
    ('Sistema', 'theme', '#42A5F5'),
    ('Poder Oculto', 'theme', '#7E57C2'),
    ('Vilão', 'theme', '#5C6BC0'),
    ('Cultivação', 'theme', '#26A69A'),
    ('Tower', 'theme', '#8D6E63'),
    ('Dungeon', 'theme', '#78909C'),
    ('Game', 'theme', '#FFA726')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE mangas IS 'Main table storing manga information';
COMMENT ON TABLE manga_names IS 'Alternative names/titles for mangas (supports multiple names)';
COMMENT ON TABLE tags IS 'Tags and categories for classification';
COMMENT ON TABLE manga_tags IS 'Many-to-many relationship between mangas and tags';
COMMENT ON TABLE reminders IS 'Reminder system for manga updates';
COMMENT ON TABLE reading_sessions IS 'History of reading sessions';
COMMENT ON TABLE creators IS 'Authors and artists';
COMMENT ON COLUMN mangas.embedding IS 'Gemini embedding vector (768 dimensions) for semantic search';
COMMENT ON COLUMN mangas.legacy_id IS 'Original ID from MySQL database migration';
COMMENT ON COLUMN mangas.deleted_at IS 'Soft delete timestamp - NULL means active';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Manga database schema created successfully!';
    RAISE NOTICE 'Tables: mangas, manga_names, tags, manga_tags, reminders, reading_sessions, creators, manga_creators';
    RAISE NOTICE 'Extensions: uuid-ossp, pg_trgm, vector';
    RAISE NOTICE 'Views: v_manga_complete, v_active_reminders';
    RAISE NOTICE 'Seed data: 25 common tags inserted';
END $$;
