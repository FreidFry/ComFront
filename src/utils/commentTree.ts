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

  // Сортируем комментарии по дате создания
  const sortByDate = (a: CommentTreeDTO, b: CommentTreeDTO) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  };

  const sortTree = (nodes: CommentTreeDTO[]) => {
    nodes.sort(sortByDate);
    nodes.forEach((node) => {
      if (node.replies.length > 0) {
        sortTree(node.replies);
      }
    });
  };

  sortTree(rootComments);

  return rootComments;
}

