INSERT INTO users
  (username, email, password, admin)
VALUES
  ('admin', 'admin@example.org', '$2b$11$qCPJlkTuBWJ.N59hjpi6renxlcKIwzpiGb.2zLizza0hKvAEc0xEm', true);

INSERT INTO users
  ( username, email, password)
VALUES
  ('normaluser', 'normalguy@goulash.com', '$2b$11$FiigxhcAGDeKAInFTdW5wuoFJbmofK/oFDvirk6sO9S8bxixEeCze');
