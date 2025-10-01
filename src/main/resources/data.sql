CREATE TABLE IF NOT EXISTS users(
                                    id SERIAL PRIMARY KEY,
                                    username VARCHAR(50) NOT NULL,
                                    email VARCHAR(100) NOT NULL UNIQUE,
                                    password VARCHAR(100) NOT NULL,
                                    enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS authorities (
                                           user_email VARCHAR(100) NOT NULL,
                                           authority VARCHAR(50) NOT NULL,
                                           CONSTRAINT fk_authorities_users FOREIGN KEY(user_email) REFERENCES users(email) ON DELETE CASCADE,
                                           CONSTRAINT uk_authorities UNIQUE (user_email, authority)
);

CREATE TABLE IF NOT EXISTS exercises (
                                         id SERIAL PRIMARY KEY,
                                         uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
                                         exercise_data JSONB NOT NULL,
                                         type VARCHAR(50) NOT NULL,
                                         created_text TEXT,
                                         questions_count INTEGER DEFAULT 0,
                                         user_id INTEGER NOT NULL,
                                         is_public BOOLEAN DEFAULT FALSE,
                                         is_completed BOOLEAN DEFAULT FALSE,
                                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                         metadata JSONB DEFAULT '{}'::jsonb,
                                         CONSTRAINT fk_exercises_users FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(type);
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_created_at ON exercises(created_at);
CREATE INDEX IF NOT EXISTS idx_exercises_is_public ON exercises(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_exercises_uuid ON exercises(uuid);
CREATE INDEX IF NOT EXISTS idx_exercises_metadata ON exercises USING GIN(metadata);

-- Индекс для полнотекстового поиска по created_text (опционально)
CREATE INDEX IF NOT EXISTS idx_exercises_created_text ON exercises USING gin(to_tsvector('english', created_text));

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


