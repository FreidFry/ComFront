import { useState } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { CommentTreeDTO } from '../../types/api';
import { formatDate } from '../../utils/dateFormat';
import './CommentItem.css';

interface CommentItemProps {
  comment: CommentTreeDTO;
  isEditing: boolean;
  onReply: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

export function CommentItem({
  comment, isEditing, onReply, onEdit, onCancelEdit, onDeleted, onUpdated
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const canEdit = isAuthenticated && user && user.userName === comment.userName;

  const handleUpdate = async () => {
    if (!content.trim()) return;
    setIsUpdating(true);
    setError(null);
    try {
      await apiService.updateComment(comment.id, { commentId: comment.id, content: content.trim() });
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось сохранить изменения');
    } finally { setIsUpdating(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить этот комментарий?')) return;
    setIsDeleting(true);
    setError(null);
    try {
      await apiService.deleteComment(comment.id);
      onDeleted();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось удалить комментарий');
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="comment-item editing">
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          className="comment-edit-textarea" 
          rows={3} 
        />
        {error && <div className="comment-error-text">❌ {error}</div>}
        <div className="comment-edit-actions">
          <button onClick={handleUpdate} disabled={isUpdating} className="save-button">
            {isUpdating ? '...' : 'Сохранить'}
          </button>
          <button onClick={() => { setError(null); onCancelEdit(); }} className="cancel-button">
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-item">
      {/* Кнопки управления в углу (появляются при наведении) */}
      {isAuthenticated && (
        <div className="comment-hover-actions">
          <button onClick={onReply} className="icon-btn reply-btn" title="Ответить">↩</button>
          {canEdit && (
            <>
              <button onClick={onEdit} className="icon-btn edit-btn" title="Редактировать">✎</button>
              <button onClick={handleDelete} disabled={isDeleting} className="icon-btn delete-btn" title="Удалить">
                {isDeleting ? '...' : '×'}
              </button>
            </>
          )}
        </div>
      )}

      <div className="comment-header">
        <div className="comment-author">
          {comment.avatarTumbnailUrl && (
            <img src={comment.avatarTumbnailUrl} alt="" className="comment-avatar" />
          )}
          <span className="comment-username">{comment.userName}</span>
          {comment.email && <span className="comment-email-inline">({comment.email})</span>}
        </div>
        <span className="comment-date">{formatDate(comment.createdAt)}</span>
      </div>

      <div className="comment-content">
        <div className="text-body" dangerouslySetInnerHTML={{ __html: comment.content }} />
        
        {comment.imageTumbnailUrl && (
          <div className="comment-image-wrapper">
            <img 
              src={comment.imageTumbnailUrl} 
              className="comment-image-preview" 
              onClick={() => setIsImageOpen(true)} 
              alt="attached"
            />
          </div>
        )}

        {comment.fileUrl && (
          <div className="comment-file-box">
            <button className="file-open-btn" onClick={() => window.open(comment.fileUrl ?? undefined, '_blank')}>
              📎 Файл
            </button>
          </div>
        )}

        {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
          <span className="comment-updated-tag">(ред.)</span>
        )}
      </div>

      {/* Вывод ошибки в обычном режиме */}
      {error && (
        <div className="comment-error-bubble">
          <span>⚠️ {error}</span>
          <button className="error-close-btn" onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {/* Попап изображения */}
      {isImageOpen && (
        <div className="image-popup-overlay" onClick={() => setIsImageOpen(false)}>
          <div className="image-popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-popup-close" onClick={() => setIsImageOpen(false)}>&times;</button>
            <img src={comment.imageUrl || comment.imageTumbnailUrl || ''} className="image-fullsize" alt="" />
          </div>
        </div>
      )}
    </div>
  );
}