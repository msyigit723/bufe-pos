-- Migration 0006: Fix Authentication Hashes

-- Force update Admin to use ZeryamAdmin2026 hash
UPDATE users SET password_hash = '$argon2id$v=19$m=19456,t=2,p=1$79XyIP32woy6y9Z1YP295Q$1qtIQ1D/Y08y2a7cWWHyEgXegVdL/YfKjtXdW2/gqpo' 
WHERE username = 'admin';

-- Force update Personel to use ZeryamStaff2026 hash
UPDATE users SET password_hash = '$argon2id$v=19$m=19456,t=2,p=1$U7E9KMaDXBQ83LhAN6jFbg$pZTfGAvU+UkvufFmNMpIIQUO3JhKc94ajQoRqOU3ZpU' 
WHERE username = 'personel';

-- Ensure users exist if not already seeded
INSERT OR IGNORE INTO users (id, username, password_hash, full_name, is_active) VALUES
(1, 'admin', '$argon2id$v=19$m=19456,t=2,p=1$79XyIP32woy6y9Z1YP295Q$1qtIQ1D/Y08y2a7cWWHyEgXegVdL/YfKjtXdW2/gqpo', 'Sistem Yöneticisi', 1);

INSERT OR IGNORE INTO users (id, username, password_hash, full_name, is_active) VALUES
(2, 'personel', '$argon2id$v=19$m=19456,t=2,p=1$U7E9KMaDXBQ83LhAN6jFbg$pZTfGAvU+UkvufFmNMpIIQUO3JhKc94ajQoRqOU3ZpU', 'Kasa Görevlisi', 1);

-- Assign Roles
INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1), (2, 2);
