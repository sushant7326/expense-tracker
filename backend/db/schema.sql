CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT unique_user_category UNIQUE (user_id, name)
);
INSERT INTO categories (name) 
VALUES ('food'), ('transport'), ('education');

CREATE TABLE paymentMethods (
    method_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL,
    CONSTRAINT unique_user_payment_method UNIQUE (user_id, name)
);
INSERT INTO paymentMethods (name)
VALUES ('UPI'), ('Credit Card'), ('Debit Card');

CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    expense BOOLEAN NOT NULL,
    transaction_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    
    category_id UUID REFERENCES categories(category_id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES paymentMethods(method_id) ON DELETE SET NULL,
    
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
