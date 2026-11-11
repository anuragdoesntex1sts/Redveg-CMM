-- Seed data for Orders Database
-- Creates initial admin user

-- Clear existing data (for development)
DELETE FROM users;

-- Insert admin user
-- Password: admin123 (hashed)
INSERT INTO users (id, username, email, phone, password_hash, role, created_at) VALUES
('USR-0001', 'admin', 'admin@redveg.com', '+1234567890', '$2a$10$iZivjs31IVHstAmiZpbiXuAdqwLyLz0jMnFz8SB.fx0QXPI58jAFe', 'admin', CURRENT_TIMESTAMP);