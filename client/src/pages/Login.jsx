import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, saveToken } from '../api.js';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { token } = await api('/login', { method: 'POST', body: { password } });
      saveToken(token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-bold">Owner Login</h1>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" type="password" className="input" required autoFocus
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn w-full">Log in</button>
    </form>
  );
}
