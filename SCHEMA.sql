
-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    weight_history JSONB DEFAULT '[]',
    active_plan_id TEXT
);

-- Create Workouts Table (Definitions)
CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    week INTEGER NOT NULL,
    order_num INTEGER NOT NULL,
    description TEXT NOT NULL,
    distance_km NUMERIC NOT NULL
);

-- Create User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    workout_id TEXT REFERENCES workouts(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    skipped BOOLEAN DEFAULT FALSE,
    actual_distance_km NUMERIC,
    duration TEXT,
    feelings TEXT,
    has_injury BOOLEAN DEFAULT FALSE,
    injury_note TEXT,
    PRIMARY KEY (user_id, workout_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_workouts_plan ON workouts(plan_id);
