import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './ProfileEdit.css';

export function ProfileEdit() {
  const { user, refreshUser } = useAuth();
  const [avatarId, setAvatarId] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await apiService.updateAvatar({ avatarId });
      await refreshUser();
      navigate('/profile');
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        const errorMessages = errorData.errors.map((e: any) => e.errorMessage).join(', ');
        setError(errorMessages);
      } else {
        setError(errorData?.message || 'Ошибка обновления аватара');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-edit">
      <h1>Редактировать профиль</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="profile-edit-form">
        <div className="form-group">
          <label htmlFor="avatarId">ID аватара (0-255)</label>
          <input
            type="number"
            id="avatarId"
            min="0"
            max="255"
            value={avatarId}
            onChange={(e) => setAvatarId(parseInt(e.target.value) || 0)}
            required
            disabled={isLoading}
          />
          <small>Выберите ID аватара от 0 до 255</small>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
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

