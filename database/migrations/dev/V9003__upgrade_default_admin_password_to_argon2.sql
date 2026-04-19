UPDATE users
SET password = '$argon2id$v=19$m=19456,t=2,p=1$9y6oqOubUVm6+uPflLV5Xg$Pf7ooW0esSPCf4CMvGPw9cqi6YREok85dwpbhJaJKz8'
WHERE email = 'admin'
  AND password = '$2b$12$GxLr7kdN/QqwMq39AVMs0..8TWprNAqrfokSflI0Wucm1H7NpHt2C';
