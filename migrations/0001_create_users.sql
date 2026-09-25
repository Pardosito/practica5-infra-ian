-- Users table used by the worker. IF NOT EXISTS keeps this safe on databases
-- where the table was already created by hand.
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE
);
