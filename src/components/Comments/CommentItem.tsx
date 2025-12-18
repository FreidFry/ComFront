import { useState } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { CommentTreeDTO } from '../../types/api';
import { formatDate } from '../../utils/dateFormat';
import './CommentItem.css';

interface CommentItemProps {
  comment: CommentTreeDTO;
  depth: number;
  isEditing: boolean;
  onReply: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

export function CommentItem({
  comment,
  depth,
  isEditing,
  onReply,
  onEdit,
  onCancelEdit,
  onDeleted,
  onUpdated,
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = isAuthenticated && user && user.userName === comment.userName;

  const handleUpdate = async () => {
    if (content.trim() === '') {
      setError('Комментарий не может быть пустым');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      await apiService.updateComment(comment.id, {
        commentId: comment.id,
        content: content.trim(),
      });
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка обновления комментария');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiService.deleteComment(comment.id);
      onDeleted();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления комментария');
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
          rows={4}
        />
        {error && <div className="error-message">{error}</div>}
        <div className="comment-edit-actions">
          <button
            onClick={handleUpdate}
            disabled={isUpdating || content.trim() === ''}
            className="save-button"
          >
            {isUpdating ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button onClick={onCancelEdit} disabled={isUpdating} className="cancel-button">
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-item" style={{ marginLeft: `${depth * 1}rem` }}>
      <div className="comment-header">
        <div className="comment-author">
          {comment.avatarTumbnailUrl && (
            <img
              src={comment.avatarTumbnailUrl}
              alt={comment.userName}
              className="comment-avatar"
            />
          )}
          <span className="comment-username">{comment.userName}</span>
        </div>
        <span className="comment-date">{formatDate(comment.createdAt)}</span>
      </div>
      <div className="comment-content">
        <p dangerouslySetInnerHTML={{ __html: comment.content }} />
        {comment.imageUrl != null && (
          <img src={comment.imageUrl} alt="Comment image" />
        )}
        {comment.fileUrl && (
          <div className="comment-file">
            <a 
              href={comment.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              download
              className="download-file-link"
            >
              <span className="file-icon">📄</span> Скачать прикрепленный файл
            </a>
          </div>
        )}
        {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
          <span className="comment-updated">(отредактировано)</span>
        )}
      </div>
      {isAuthenticated && (
        <div className="comment-actions">
          <button onClick={onReply} className="reply-button">
            Ответить
          </button>
          {canEdit && (
            <>
              <button onClick={onEdit} className="edit-button">
                Редактировать
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="delete-button"
              >
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </button>
            </>
          )}
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

