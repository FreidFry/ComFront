// Request DTOs
export interface UserRegisterDto {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  homePage?: string | null;
}

export interface UserLoginDto {
  email: string;
  password: string;
}

export interface ThreadCreateDTO {
  title: string;
  context: string;
}

export interface ThreadUpdateDTO {
  threadId: string;
  title: string;
  context: string;
}

export interface CommentCreateDTO {
  content: string;
  threadId: string;
  parentCommentId?: string | null;
  formFile?: File | null;
}

export interface CommentUpdateDTO {
  commentId: string;
  content: string;
}

export interface UserUpdateAvatarDTO {
  avatarId: number;
}

// Response DTOs
export interface ThreadsThreeDTOResponce {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  commentCount: number;
}

export interface ThreadResponseDTO {
  id: string;
  title: string;
  context: string;
  ownerId: string;
  ownerUserName: string;
  createdAt: string;
  lastUpdatedAt?: string | null;
  commentCount: number;
}

export interface ThreadWithCommentsDTO extends ThreadResponseDTO {
  comments: CommentResponseDTO[];
}

export interface CommentResponseDTO {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  threadId: string;
  parentCommentId?: string | null;
  userId: string;
  userName: string;
  avatarTumbnailUrl?: string | null;
}

export interface CommentTreeDTO extends CommentResponseDTO {
  replies: CommentTreeDTO[];
}

export interface CommonUserDataDTO {
  id: string;
  userName: string;
  avatarTumbnailUrl: string;
  createdAt: string;
  homePage: string;
  lastActive?: string | null;
  threads: ThreadResponseDTO[];
}

export interface AuthInitDTO {
  id: string | null;
  userName: string | null;
  roles: string[] | null;
}

export interface ApiError {
  message?: string;
  errors?: Array<{
    propertyName: string;
    errorMessage: string;
  }>;
}

