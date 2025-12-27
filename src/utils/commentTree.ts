import type { CommentResponseDTO, CommentTreeDTO } from '../types/api';

/**
 * Преобразует плоский список комментариев в древовидную структуру
 */
export function buildCommentTree(comments: CommentResponseDTO[] | undefined | null): CommentTreeDTO[] {
  // Проверяем, что comments существует и является массивом
  if (!comments || !Array.isArray(comments)) {
    return [];
  }

  const commentMap = new Map<string, CommentTreeDTO>();
  const rootComments: CommentTreeDTO[] = [];

  // Создаем карту всех комментариев
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Строим дерево
  comments.forEach((comment) => {
    const commentNode = commentMap.get(comment.id);
    if (!commentNode) return;

    if (comment.parentCommentId) {
      const parent = commentMap.get(comment.parentCommentId);
      if (parent) {
        parent.replies.push(commentNode);
      }
    } else {
      rootComments.push(commentNode);
    }
  });  
  return rootComments;
}

