import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { CommentResponseDTO, CommentTreeDTO } from '../../types/api';
import { buildCommentTree } from '../../utils/commentTree';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import './CommentTree.css';

interface CommentTreeProps {
  threadId: string;
  comments: CommentResponseDTO[];
  onCommentAdded?: () => void;
}

export function CommentTree({ threadId, comments: initialComments, onCommentAdded }: CommentTreeProps) {
  const [comments, setComments] = useState<CommentResponseDTO[]>(initialComments);
  const [commentTree, setCommentTree] = useState<CommentTreeDTO[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    const tree = buildCommentTree(comments);
    setCommentTree(tree);
  }, [comments]);

  const handleCommentAdded = async () => {
    try {
      const updatedComments = await apiService.getThreadComments(threadId);
      setComments(updatedComments);
      setReplyingTo(null);
      onCommentAdded?.();
    } catch (error) {
      console.error('Error refreshing comments:', error);
    }
  };

  const handleCommentDeleted = async () => {
    try {
      const updatedComments = await apiService.getThreadComments(threadId);
      setComments(updatedComments);
      onCommentAdded?.();
    } catch (error) {
      console.error('Error refreshing comments:', error);
    }
  };

  const handleCommentUpdated = async () => {
    try {
      const updatedComments = await apiService.getThreadComments(threadId);
      setComments(updatedComments);
      setEditingComment(null);
      onCommentAdded?.();
    } catch (error) {
      console.error('Error refreshing comments:', error);
    }
  };

  const renderComment = (comment: CommentTreeDTO, depth: number = 0) => {
    return (
      <div key={comment.id} className="comment-wrapper">
        <CommentItem
          comment={comment}
          depth={depth}
          isEditing={editingComment === comment.id}
          onReply={() => setReplyingTo(comment.id)}
          onEdit={() => setEditingComment(comment.id)}
          onCancelEdit={() => setEditingComment(null)}
          onDeleted={handleCommentDeleted}
          onUpdated={handleCommentUpdated}
        />
        {replyingTo === comment.id && (
          <div className="reply-form-container">
            <CommentForm
              threadId={threadId}
              parentCommentId={comment.id}
              onCommentAdded={handleCommentAdded}
              onCancel={() => setReplyingTo(null)}
            />
          </div>
        )}
        {comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="comment-tree">
      <CommentForm
        threadId={threadId}
        onCommentAdded={handleCommentAdded}
      />
      <div className="comments-list">
        {commentTree.length === 0 ? (
          <div className="no-comments">Пока нет комментариев. Будьте первым!</div>
        ) : (
          commentTree.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}

