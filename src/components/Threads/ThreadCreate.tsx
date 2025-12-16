import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './ThreadCreate.css';

export function ThreadCreate() {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const thread = await apiService.createThread({ title, context });
      navigate(`/threads/${thread.id}`);
    } catch (err: any) {
      const errorData = err.response?.data;
      // Если ошибка 401, обновляем состояние аутентификации
      if (err.response?.status === 401) {
        await refreshUser();
        setError('Требуется авторизация. Пожалуйста, войдите в систему.');
      } else if (errorData?.errors) {
        const errorMessages = errorData.errors.map((e: any) => e.errorMessage).join(', ');
        setError(errorMessages);
      } else {
        setError(errorData?.message || 'Ошибка создания темы');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="thread-create">
      <h1>Создать новую тему</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="thread-form">
        <div className="form-group">
          <label htmlFor="title">Заголовок</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Введите заголовок темы"
          />
        </div>
        <div className="form-group">
          <label htmlFor="context">Описание</label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            required
            disabled={isLoading}
            rows={10}
            placeholder="Опишите тему для обсуждения"
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? 'Создание...' : 'Создать тему'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="cancel-button"
            disabled={isLoading}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

