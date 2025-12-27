import { useState } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { CommentTreeDTO, CommentUpdateDTO, PaginatedCommentsDTO } from '../../types/api';
import { formatDate } from '../../utils/dateFormat';
import { Link } from 'react-router-dom';
import './CommentItem.css';
import { CommentForm } from './CommentForm';

interface CommentItemProps {
  comment: CommentTreeDTO;
  depth: number;
  isEditing: boolean;
  activeReplyId: string | null;
  onReply: (id: string) => void;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDeleted: (id: string) => void;
  onUpdated: () => void;
}

export function CommentItem({
  comment, depth, activeReplyId, onReply, onEdit, onCancelEdit, onDeleted, onUpdated
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuth();
  
  const [isEditingSelf, setIsEditingSelf] = useState(false);
  const [replies, setReplies] = useState<CommentTreeDTO[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState(comment.content);

  const canEdit = isAuthenticated && user && user.userName === comment.userName;
  const totalReplies = Number(comment.commentCount || (comment as any).commentCount || 0);
  const remainingCount = totalReplies - replies.length;

  const loadReplies = async (cursor: string | null = null) => {
    setIsLoading(true);
    try {
      const data: PaginatedCommentsDTO = await apiService.getCommentRepliesRaw(comment.id, cursor);
      const newItems = data.items
        .filter(item => item.id !== comment.id)
        .map(item => ({ ...item, replies: [] }));
      
      setReplies(prev => (cursor ? [...prev, ...newItems] : newItems));
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Удалить этот комментарий?")) return;

    try {
      setIsLoading(true);
      await apiService.deleteComment(comment.id);
      
      onDeleted(comment.id); 
    } catch (err) {
      console.error("Delete error:", err);
      alert("Ошибка при удалении");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleReplies = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      if (replies.length === 0) loadReplies(null);
      setIsExpanded(true);
    }
  };

  const handleUpdate = async (newContent: string) => {
  try {
    setIsLoading(true);
    const updateData: CommentUpdateDTO = {
      commentId: comment.id,
      content: newContent,
      imageUrl: comment.imageUrl
    };

    const updatedCommentFromServer = await apiService.updateComment(comment.id, updateData);
    
    setCurrentContent(newContent); // Обновляем текст на экране
    setIsEditingSelf(false);
    setCurrentContent(updatedCommentFromServer.content);
    onUpdated();
  } catch (err) {
    console.error("Update failed:", err);
    onUpdated();
  } finally {
    setIsLoading(false);
  }
};

const handleReplyClick = () => {
    onReply(comment.id);
  };
  return (
    <div className="comment-node">
      {/* КАРТОЧКА КОММЕНТАРИЯ */}
      <div className="comment-item" style={{ marginLeft: `${depth * 20}px` }}>
        <div className="comment-hover-actions">
          {isAuthenticated && (
            <button onClick={handleReplyClick} className="icon-btn reply-btn-top">↶</button>
          )}
          {canEdit && (
            <>
              <button onClick={() => setIsEditingSelf(true)} className="icon-btn edit-btn">✎</button>
              <button onClick={handleDelete} className="icon-btn delete-btn">✖</button>
            </>
          )}
        </div>

        <div className="comment-main-body">
          <div className="comment-header">
            <div className="comment-meta-left">
              <Link 
      to={`/profile/${comment.userId || comment.userName}`} 
      className="comment-author-link"
    >
      <div className="comment-avatar-container">
        {comment.avatarTumbnailUrl ? (
          <img 
            src={comment.avatarTumbnailUrl} 
            alt={comment.userName} 
            className="comment-avatar" 
          />
        ) : (
          <div className="comment-avatar-placeholder">
            {comment.userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span className="comment-username">{comment.userName}</span>
    </Link>            <span className="comment-email-inline">{comment.email}</span>
            </div>
            <span className="comment-date">{formatDate(comment.createdAt)}</span>
          </div>
        {comment.fileUrl && (
          <div className="comment-file-box">
            <button className="file-open-btn" onClick={() => window.open(comment.fileUrl ?? undefined, '_blank')}>
              📎 Файл
            </button>
          </div>
        )}
{isEditingSelf ? (
          <div className="edit-form-mount" style={{ marginTop: '10px' }}>
            <CommentForm
              initialContent={comment.content}
              parentCommentId={comment.id}
              threadId={(comment as any).threadId}
              onCommentAdded={(newText?: string) => {
                handleUpdate(newText!);
                setIsEditingSelf(false);
              }}
              onCancel={() => setIsEditingSelf(false)}
            />
          </div>
        ) : (
          <>
            <div className="comment-content" dangerouslySetInnerHTML={{ __html: currentContent }} />
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
          </>
        )}

          <div className="comment-footer">
            {totalReplies > 0 && (
              <button onClick={handleToggleReplies} className="action-btn">
                {isExpanded ? '▼ Скрыть' : `▶ Ответы (${totalReplies})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ФОРМА ОТВЕТА (Строго здесь: под родителем, над списком детей)
      {isEditing && (
  <div className="reply-form-mount" style={{ marginLeft: `${(depth + 1) * 20}px`, marginTop: '10px' }}>
    <CommentForm 
      threadId={(comment as any).threadId || ""} // threadId должен быть в объекте комментария
      parentCommentId={comment.id} 
      onCommentAdded={() => {
        onReply("");      // Скрыть форму после успеха
        onUpdated();    // Обновить список (у вас это вызывает глобальный рефетч)
      }}
      onCancel={() => onReply("")} // Кнопка отмены скроет форму
    />
  </div>
)} */}

      {/* СПИСОК СУЩЕСТВУЮЩИХ ОТВЕТОВ */}
      {isExpanded && (
        <div className="comment-replies-wrapper">
          <div className="replies-list">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                isEditing={activeReplyId === reply.id} 
                activeReplyId={activeReplyId}
                onReply={onReply}
                onEdit={onEdit}
                onCancelEdit={onCancelEdit}
                onDeleted={onDeleted}
                onUpdated={onUpdated}
              />
            ))}
          </div>

          {/* КНОПКА ПОКАЗАТЬ ЕЩЕ (в самом низу текущей пачки) */}
          {hasMore && (
            <div className="load-more-container" style={{ marginLeft: `${(depth + 1) * 20}px` }}>
              <button onClick={() => loadReplies(nextCursor)} className="action-btn load-more-btn">
                {isLoading ? 'Загрузка...' : `Показать еще (${remainingCount})`}
              </button>
            </div>
          )}
        </div>
      )}
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