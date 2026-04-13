-- migrate Up
-- Password: password123
INSERT INTO users (id, name, email, password) VALUES
('a190c7bc-d3d3-4bbe-a6ab-313cc1b0f3a5', 'Test User', 'test@example.com',
'$2b$12$V1RooW/bpS8ivgZ7V.eXSeYviBUftc5.tNnHnyp7uWidC2oXyOn72'),
('d94eeb7e-88d1-47ab-ab41-09fadec876d2','Jane Doe','jane@example.com',
'$2b$12$Upt3PwX6DG1hq2Q4k0uaKuFFpmfyULT2xca96FPe/79aBtkhBeVx.'),
('1762b7d8-f9af-4af7-b5aa-cf08d39c3a50','Jany Mealy','jany@example.com',
'$2b$12$5o9r1KLnNwLwOsqYg8347ukgVyTwx316VXeAnPDg24NIa9m6JJpjC');

INSERT INTO projects (id, name, description, owner_id) VALUES
('173b23d1-8c14-40d7-8380-b2d4f1bdff4a', 'Demo Project', 'Sample project for testing',
'a190c7bc-d3d3-4bbe-a6ab-313cc1b0f3a5');

INSERT INTO tasks (title, status, priority, project_id, assignee_id) VALUES
('Set up repository', 'done', 'high', '173b23d1-8c14-40d7-8380-b2d4f1bdff4a', 'd94eeb7e-88d1-47ab-ab41-09fadec876d2'),
('Build authentication', 'in_progress', 'high', '173b23d1-8c14-40d7-8380-b2d4f1bdff4a', '1762b7d8-f9af-4af7-b5aa-cf08d39c3a50'),
('Write documentation', 'todo', 'low', '173b23d1-8c14-40d7-8380-b2d4f1bdff4a', NULL);