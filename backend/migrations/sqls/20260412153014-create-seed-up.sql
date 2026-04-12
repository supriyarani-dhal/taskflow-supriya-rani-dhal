-- migrate Up
-- Password: password123
INSERT INTO users (id, name, email, password) VALUES
('00000000-0000-0000-0000-000000000001', 'Test User', 'test@example.com',
'$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i');

INSERT INTO projects (id, name, description, owner_id) VALUES
('00000000-0000-0000-0000-000000000010', 'Demo Project', 'Sample project for testing',
'00000000-0000-0000-0000-000000000001');

INSERT INTO tasks (title, status, priority, project_id, assignee_id) VALUES
('Set up repository', 'done', 'high', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001'),
('Build authentication', 'in_progress', 'high', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001'),
('Write documentation', 'todo', 'low', '00000000-0000-0000-0000-000000000010', NULL);