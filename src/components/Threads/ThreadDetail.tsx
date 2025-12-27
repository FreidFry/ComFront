import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { ThreadWithCommentsDTO, PaginatedCommentsDTO } from '../../types/api';
import { formatDate } from '../../utils/dateFormat';
import { CommentTree } from '../Comments/CommentTree';
import { useAuth } from '../../contexts/AuthContext';
import './ThreadDetail.css';

export function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [thread, setThread] = useState<ThreadWithCommentsDTO | null>(null);
  const [comments, setComments] = useState<PaginatedCommentsDTO>();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Стейт для управления режимом удаления
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const [threadData, commentsArray] = await Promise.all([
        apiService.getThread(id),
        apiService.getThreadComments(id, 'createat', false)
      ]);

      setThread(threadData);
      setComments(commentsArray);
    } catch (err: any) {
      console.error("Ошибка загрузки:", err);
      setError('Не удалось загрузить содержимое темы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      await apiService.deleteThread(id);
      navigate('/'); 
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      alert('Ошибка при удалении темы. Попробуйте позже.');
      setIsConfirmingDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="loading-state">Загрузка...</div>;
  if (error || !thread) return <div className="error-state">{error || 'Тема не найдена'}</div>;

  const canEdit = isAuthenticated && user && user.userName === thread.ownerUserName;

  return (
    <div className="thread-detail-container">
      <nav className="detail-nav">
        <Link to="/" className="back-link">← К списку обсуждений</Link>
      </nav>
      
      <article className="thread-main">
        <header className="thread-header">
          <h1>{thread.title}</h1>
          
          {canEdit && (
            <div className="thread-actions-wrapper">
              {!isConfirmingDelete ? (
                <>
                  <button onClick={() => navigate(`/threads/${thread.id}/edit`)} className="edit-link">
                    ✍️ Редактировать
                  </button>
                  <button 
                    onClick={() => setIsConfirmingDelete(true)} 
                    className="delete-btn-trigger"
                  >
                    🗑️ Удалить
                  </button>
                </>
              ) : (
                <div className="delete-confirmation-bar">
                  <span className="confirm-msg">Вы точно хотите удалить тему?</span>
                  <button 
                    onClick={handleDelete} 
                    className="confirm-btn-yes" 
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Удаляем...' : 'Да, удалить'}
                  </button>
                  <button 
                    onClick={() => setIsConfirmingDelete(false)} 
                    className="confirm-btn-no"
                    disabled={isDeleting}
                  >
                    Отмена
                  </button>
                </div>
              )}
            </div>
          )}
        </header>
        
        <div className="thread-info">
          <span className="author-tag">Автор: <Link 
      to={`/profile/${thread.ownerId}`}
      className="user-link"
    >
      <strong>{thread.ownerUserName}</strong>
    </Link></span>
          <span className="date-tag">{formatDate(thread.createdAt)}</span>
        </div>

        <hr className="divider" />

        <div className="thread-body">
          <div dangerouslySetInnerHTML={{ __html: thread.context }} />
        </div>
      </article>

      <section className="comments-section">
        <div className="comments-header">
          <h2>Обсуждение</h2>
          <span className="comments-count">Комментариев: {comments?.items?.length || 0}</span>
        </div>

        {comments && (
          <CommentTree
            threadId={thread.id}
            initialData={comments} 
            onCommentAdded={loadData}
          />
        )}
      </section>
    </div>
  );
}