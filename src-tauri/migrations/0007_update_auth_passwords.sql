-- Migration 0007: Update Auth Passwords
UPDATE users SET password_hash = '$argon2id$v=19$m=19456,t=2,p=1$79XyIP32woy6y9Z1YP295Q$1qtIQ1D/Y08y2a7cWWHyEgXegVdL/YfKjtXdW2/gqpo' WHERE username = 'admin';
UPDATE users SET password_hash = '$argon2id$v=19$m=19456,t=2,p=1$U7E9KMaDXBQ83LhAN6jFbg$pZTfGAvU+UkvufFmNMpIIQUO3JhKc94ajQoRqOU3ZpU' WHERE username = 'personel';
