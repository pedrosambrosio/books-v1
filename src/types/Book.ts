export interface Page {
  id: string;
  number: number;
  title: string;
  completed: boolean;
}

export interface Chapter {
  id: string;
  number: number;
  title?: string;
  pages: Page[];
  completedPages: number;
  notes?: number;
  quizScore?: number;
}

export interface Book {
  id: string;
  title: string;
  type?: string;
  chapters: Chapter[];
  completedChapters: number;
  tags?: string[];
  coverImage?: string;
}