import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { testApiConnection } from '../../utils/testConnection';
import './Auth.css';

export function Register() {
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    homePage: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionTest, setConnectionTest] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Тест подключения при загрузке компонента
  useEffect(() => {
    testApiConnection().then((result) => {
      if (!result.success) {
        setConnectionTest(`⚠️ ${result.message}`);
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        userName: formData.userName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        homePage: formData.homePage || null,
      });
      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Обработка сетевых ошибок
      if (!err.response) {
        setError('Не удалось подключиться к серверу. Проверьте, что бэкенд запущен и доступен.');
        return;
      }

      const errorData = err.response?.data;
      const status = err.response?.status;

      // Обработка ошибок валидации (400)
      if (status === 400 && errorData?.errors) {
        const errorMessages = errorData.errors
          .map((e: any) => `${e.propertyName || ''}: ${e.errorMessage || e}`)
          .join('\n');
        setError(errorMessages || 'Ошибка валидации данных');
      } 
      // Обработка других ошибок
      else if (errorData?.message) {
        setError(errorData.message);
      } 
      // Обработка по статусу
      else if (status === 400) {
        setError('Ошибка валидации. Проверьте введенные данные.');
      } else if (status === 409) {
        setError('Пользователь с таким email или именем уже существует.');
      } else if (status >= 500) {
        setError('Ошибка сервера. Попробуйте позже.');
      } else {
        setError(`Ошибка регистрации (${status || 'неизвестная'})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Регистрация</h2>
        {connectionTest && (
          <div className="warning-message">{connectionTest}</div>
        )}
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userName">Имя пользователя</label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="homePage">Домашняя страница (опционально)</label>
            <input
              type="url"
              id="homePage"
              name="homePage"
              value={formData.homePage}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="https://example.com"
            />
          </div>
          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}

