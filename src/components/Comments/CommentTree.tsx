import { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../services/api';
import type { CommentResponseDTO, CommentTreeDTO, CommentTreeProps } from '../../types/api';
import { buildCommentTree } from '../../utils/commentTree';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import './CommentTree.css';

type SortField = 'userName' | 'email' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface CommentBranchProps {
  comment: CommentTreeDTO;
  depth: number;
  editingComment: string | null;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  setEditingComment: (id: string | null) => void;
  refresh: () => void;
  threadId: string;
}

function CommentBranch({ 
  comment, depth, editingComment, replyingTo, 
  setReplyingTo, setEditingComment, refresh, threadId 
}: CommentBranchProps) {
  // Количество отображаемых ответов (начинаем с 0 или 10)
  const [visibleCount, setVisibleCount] = useState(0);
  
  // Сортируем ответы этого уровня по дате создания (от старых к новым)
  const sortedReplies = useMemo(() => {
    return [...comment.replies].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [comment.replies]);

  const hasReplies = sortedReplies.length > 0;
  const currentReplies = sortedReplies.slice(0, visibleCount);
  const remainingCount = sortedReplies.length - visibleCount;

  return (
    <div className={`comment-node ${depth === 0 ? 'is-root' : 'is-reply'}`} style={{ width: '100%' }}>
      <CommentItem
        comment={comment}
        // depth={depth}
        isEditing={editingComment === comment.id}
        onReply={() => setReplyingTo(comment.id)}
        onEdit={() => setEditingComment(comment.id)}
        onCancelEdit={() => setEditingComment(null)}
        onDeleted={refresh}
        onUpdated={refresh}
      />
      
      {replyingTo === comment.id && (
        <div className="reply-form-container">
          <CommentForm
            threadId={threadId}
            parentCommentId={comment.id}
            onCommentAdded={refresh}
            onCancel={() => setReplyingTo(null)}
          />
        </div>
      )}

      {hasReplies && (
        <div className="replies-control">
          {visibleCount === 0 ? (
            <button className="toggle-replies-btn" onClick={() => setVisibleCount(10)}>
              ▼ Показать ответы ({sortedReplies.length})
            </button>
          ) : (
            <>
              <div className="comment-replies" style={{ marginLeft: depth > 5 ? '0px' : '20px' }}>
                {currentReplies.map((reply) => (
                  <CommentBranch
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    editingComment={editingComment}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    setEditingComment={setEditingComment}
                    refresh={refresh}
                    threadId={threadId}
                  />
                ))}
              </div>
              
              <div className="pagination-controls">
                {remainingCount > 0 && (
                  <button className="load-more-btn" onClick={() => setVisibleCount(prev => prev + 10)}>
                    Показать еще 10 (осталось {remainingCount})
                  </button>
                )}
                <button className="hide-replies-btn" onClick={() => setVisibleCount(0)}>
                  ▲ Скрыть всё
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function CommentTree({ threadId, comments: initialComments, onCommentAdded }: CommentTreeProps) {
  const [comments, setComments] = useState<CommentResponseDTO[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => { setComments(initialComments); }, [initialComments]);

  // Сортировка ГЛАВНЫХ комментариев в таблице
  const sortedCommentTree = useMemo(() => {
    const tree = buildCommentTree(comments);
    return [...tree].sort((a, b) => {
      let comp = 0;
      if (sortField === 'createdAt') {
        comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        comp = (a[sortField] || '').toLowerCase().localeCompare((b[sortField] || '').toLowerCase());
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [comments, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const refresh = async () => {
    const updated = await apiService.getThreadComments(threadId);
    setComments(updated);
    setReplyingTo(null);
    setEditingComment(null);
    onCommentAdded?.();
  };

  return (
    <div className="comment-system">
      <CommentForm threadId={threadId} onCommentAdded={refresh} />

      <div className="sort-panel">
        <span className="sort-label">Сортировать заглавные по:</span>
        <button onClick={() => toggleSort('userName')} className={sortField === 'userName' ? 'active' : ''}>
          Имени {sortField === 'userName' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => toggleSort('email')} className={sortField === 'email' ? 'active' : ''}>
          E-mail {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => toggleSort('createdAt')} className={sortField === 'createdAt' ? 'active' : ''}>
          Дате {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      <table className="comments-table-compact">
        <tbody>
          {sortedCommentTree.map(comment => (
            <tr key={comment.id}>
              <td className="content-cell">
                <CommentBranch
                  comment={comment}
                  depth={0}
                  editingComment={editingComment}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  setEditingComment={setEditingComment}
                  refresh={refresh}
                  threadId={threadId}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}