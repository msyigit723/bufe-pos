import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../stores/useAppStore';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const login = useAppStore(s => s.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get users to check role
      const users: any[] = await invoke('list_users');
      const user = users.find(u => u.username === username);
      
      if (!user) {
        setError('Kullanıcı adı hatalı.');
        setLoading(false);
        return;
      }
      
      if (!user.is_active) {
        setError('Kullanıcı pasif durumda.');
        setLoading(false);
        return;
      }

      // Get hash
      const hash: string = await invoke('get_user_hash', { username });
      
      // Verify
      const isValid: boolean = await invoke('verify_password', { password, hash });
      
      if (isValid) {
        login(user.full_name, user.role, user.username, user.id);
      } else {
        setError('Hatalı parola.');
      }
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-slate-800 p-10 rounded-2xl shadow-xl border border-slate-700">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-white">ZERYAM BÜFE POS</h2>
          <p className="mt-2 text-center text-sm text-slate-400">Giriş Yapmak İçin Bilgilerinizi Girin</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px flex flex-col gap-4">
            <div>
              <label className="sr-only">Kullanıcı Adı</label>
              <input
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-700 bg-slate-900 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Kullanıcı Adı"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="sr-only">Şifre</label>
              <input
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-700 bg-slate-900 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Şifre"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Giriş Yapılıyor...' : 'GİRİŞ YAP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
