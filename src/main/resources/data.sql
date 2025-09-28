CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS authorities (
    user_email VARCHAR(100) NOT NULL,
    authority VARCHAR(50) NOT NULL,
    CONSTRAINT fk_authorities_users FOREIGN KEY(user_email) REFERENCES users(email),
    CONSTRAINT uk_authorities UNIQUE (user_email, authority)
);


CREATE TABLE IF NOT EXISTS exercises (
                                         id SERIAL PRIMARY KEY,
                                         uuid UUID UNIQUE NOT NULL,
                                         exercise_data JSONB NOT NULL,
                                         type VARCHAR(50) NOT NULL,
                                         created_text TEXT,
                                         questions_count INTEGER,
                                         user_id INTEGER NOT NULL,
                                         is_public BOOLEAN DEFAULT FALSE,
                                         is_completed BOOLEAN DEFAULT FALSE,
                                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                         metadata JSONB
);

CREATE INDEX idx_exercises_type ON exercises(type);
CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_exercises_created_at ON exercises(created_at);
CREATE INDEX idx_exercises_metadata ON exercises USING GIN(metadata);




