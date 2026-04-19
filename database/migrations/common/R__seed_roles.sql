INSERT INTO roles (name)
VALUES
  ('admin'),
  ('atendente'),
  ('cliente')
ON DUPLICATE KEY UPDATE
  name = VALUES(name);
