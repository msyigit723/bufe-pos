-- Migration 0006: Fix Authentication Hashes

-- Delete placeholder accounts to re-seed them correctly
DELETE FROM users WHERE username IN ('admin', 'personel') AND (password_hash = '$argon2id$placeholder' OR password_hash = '$argon2id$v=19$m=19456,t=2,p=1$c8uID5xleK8OTMl+aqhVKA$PEEGlth8JlmO7e7mlf7iyCk8T2G6syUCRfqTjB9WIrA');

-- Seed Admin
INSERT OR IGNORE INTO users (id, username, password_hash, full_name, is_active) VALUES
(1, 'admin', '$argon2id$v=19$m=19456,t=2,p=1$1PSHdP1RIUI3XMJBaIDHeg$jbmYLtxamDdNRiki/T/DNbKu2L5G7hnTrN/SGWBTvio', 'Sistem Yöneticisi', 1);

-- Seed Personel
INSERT OR IGNORE INTO users (id, username, password_hash, full_name, is_active) VALUES
(2, 'personel', '$argon2id$v=19$m=19456,t=2,p=1$1zfluzqgVNCuuZ1CWY+9mw$h2Yuvkqufmcqu3jtYKgNWP6/3bVkO+IQbaeTWJzOL68', 'Kasa Görevlisi', 1);

-- Assign Roles
INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1), (2, 2);
