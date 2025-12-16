import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      // Логин успешен! Навигация происходит независимо от загрузки профиля
      // Профиль загрузится автоматически в фоне
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      // Проверяем статус ошибки
      const status = err.response?.status;
      const errorMessage = err.response?.data?.message || err.message;
      
      if (status === 401 || status === 400) {
        // Неверные учетные данные
        setError(errorMessage || 'Ошибка входа. Проверьте email и пароль.');
      } else if (status === 500 || status === 502 || status === 503) {
        // Ошибка сервера
        setError('Ошибка сервера. Попробуйте позже.');
      } else if (!status) {
        // Сетевая ошибка
        setError('Ошибка подключения к серверу. Проверьте подключение к интернету.');
      } else {
        // Другие ошибки
        setError(errorMessage || 'Ошибка входа. Попробуйте еще раз.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Вход</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="auth-link">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

