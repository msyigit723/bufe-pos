use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand_core::OsRng;

pub struct SecurityManager;

impl SecurityManager {
    pub fn hash_password(password: &str) -> Result<String, String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        argon2
            .hash_password(password.as_bytes(), &salt)
            .map(|hash| hash.to_string())
            .map_err(|e| format!("Argon2 hashing error: {}", e))
    }

    pub fn verify_password(password: &str, password_hash: &str) -> Result<bool, String> {
        let parsed_hash = PasswordHash::new(password_hash)
            .map_err(|e| format!("Invalid hash format: {}", e))?;

        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_argon2id_hash_and_verify_success() {
        let password = "KasiyerSifresi123!";
        let hash = SecurityManager::hash_password(password).expect("Hashing should succeed");
        
        assert!(hash.starts_with("$argon2id$"), "Hash should use argon2id algorithm");
        
        let is_valid = SecurityManager::verify_password(password, &hash).expect("Verification should succeed");
        assert!(is_valid, "Valid password should verify successfully");
    }

    #[test]
    fn test_argon2id_verify_failure_on_wrong_password() {
        let password = "DogruSifre123";
        let wrong_password = "YanlisSifre456";
        let hash = SecurityManager::hash_password(password).expect("Hashing should succeed");
        
        let is_valid = SecurityManager::verify_password(wrong_password, &hash).expect("Verification call should execute");
        assert!(!is_valid, "Wrong password must fail verification");
    }
}

