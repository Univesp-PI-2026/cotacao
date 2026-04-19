INSERT INTO roles (name, active)
VALUES
  ('admin', 1),
  ('atendente', 1),
  ('cliente', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  active = VALUES(active);
