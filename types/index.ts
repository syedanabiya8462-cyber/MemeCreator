export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  image_url: string;
  category: string;
  tags: string[];
  usage_count: number;
  is_custom: boolean;
  uploaded_by: string | null;
  created_at: string;
}

export interface Meme {
  id: string;
  user_id: string;
  image_url: string;
  template_id: string | null;
  caption_top: string | null;
  caption_bottom: string | null;
  caption_custom: any;
  is_public: boolean;
  is_ai_generated: boolean;
  generation_prompt: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  user?: User;
  template?: Template;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export interface Comment {
  id: string;
  user_id: string;
  meme_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface CaptionSuggestion {
  top?: string;
  bottom?: string;
  custom?: string[];
}

export type ToneType = 'sarcastic' | 'wholesome' | 'dark' | 'professional' | 'gen-z';