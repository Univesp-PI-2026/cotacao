INSERT INTO users (
  role_id,
  name,
  email,
  password,
  active
)
SELECT
  r.id,
  'Administrador DEV',
  'admin.dev@cotacao.local',
  '$2y$10$devonlyplaceholderhashforbootstrapuser1234567890',
  1
FROM roles r
WHERE r.name = 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.email = 'admin.dev@cotacao.local'
  );
