INSERT INTO users (
  role_id,
  name,
  email,
  password,
  active
)
SELECT
  r.id,
  'Administrador',
  'admin',
  '$argon2id$v=19$m=19456,t=2,p=1$9y6oqOubUVm6+uPflLV5Xg$Pf7ooW0esSPCf4CMvGPw9cqi6YREok85dwpbhJaJKz8',
  1
FROM roles r
WHERE r.name = 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.email = 'admin'
  );
