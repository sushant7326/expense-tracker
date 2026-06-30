CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO categories (name) 
VALUES ('food'), ('transport'), ('education');

CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    expense BOOLEAN NOT NULL,
    transaction_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) REFERENCES categories(name) ON DELETE SET NULL ON UPDATE CASCADE,
    payment_method VARCHAR(30),
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
