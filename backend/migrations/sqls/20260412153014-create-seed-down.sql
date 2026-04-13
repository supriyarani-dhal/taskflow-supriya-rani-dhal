-- migrate Down
DELETE FROM tasks WHERE project_id = '173b23d1-8c14-40d7-8380-b2d4f1bdff4a';
DELETE FROM projects WHERE id = '173b23d1-8c14-40d7-8380-b2d4f1bdff4a';
DELETE FROM users WHERE id IN ('a190c7bc-d3d3-4bbe-a6ab-313cc1b0f3a5','d94eeb7e-88d1-47ab-ab41-09fadec876d2','1762b7d8-f9af-4af7-b5aa-cf08d39c3a50');