import { useState } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { CommentTreeDTO, PaginatedCommentsDTO } from '../../types/api';
import { formatDate } from '../../utils/dateFormat';
import './CommentItem.css';

interface CommentItemProps {
  comment: CommentTreeDTO;
  depth: number;
  isEditing: boolean;
  onReply: (id: string) => void;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

export function CommentItem({
  comment, depth, isEditing, onReply, onEdit, onCancelEdit, onDeleted, onUpdated
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuth();
  
  const [replies, setReplies] = useState<CommentTreeDTO[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

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

  const handleToggleReplies = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      if (replies.length === 0) loadReplies(null);
      setIsExpanded(true);
    }
  };

const handleReplyClick = () => {
    onReply(comment.id); // Сообщаем родительскому компоненту ID
    setIsExpanded(true); // Сразу раскрываем ветку
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
              <button onClick={() => onEdit(comment.id)} className="icon-btn edit-btn">✎</button>
              <button onClick={onDeleted} className="icon-btn delete-btn">✖</button>
            </>
          )}
        </div>

        <div className="comment-main-body">
          <div className="comment-header">
            <span className="comment-username">{comment.userName}</span>
            <span className="comment-date">{formatDate(comment.createdAt)}</span>
          </div>
          <div className="comment-content" dangerouslySetInnerHTML={{ __html: comment.content }} />
          <div className="comment-footer">
            {totalReplies > 0 && (
              <button onClick={handleToggleReplies} className="action-btn">
                {isExpanded ? '▼ Скрыть' : `▶ Ответы (${totalReplies})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ФОРМА ОТВЕТА (Строго здесь: под родителем, над списком детей) */}
      {isEditing && (
        <div className="reply-form-mount" style={{ marginLeft: `${(depth + 1) * 20}px` }}>
          {/* Здесь родительский компонент вставит CommentForm через условие */}
          <div className="active-form-indicator">Напишите ваш ответ...</div>
        </div>
      )}

      {/* СПИСОК СУЩЕСТВУЮЩИХ ОТВЕТОВ */}
      {isExpanded && (
        <div className="comment-replies-wrapper">
          <div className="replies-list">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                isEditing={false}
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
    </div>
  );
}