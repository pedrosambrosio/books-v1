import { Book, Chapter, Page } from "@/types/Book";
import { Task } from "@/components/TaskCard";
import { toast } from "@/components/ui/use-toast";

// Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "https://api.example.com",
  headers: {
    "Content-Type": "application/json",
  },
};

// Types
export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// Error Handler
const handleApiError = (error: unknown): ApiError => {
  console.error("API Error:", error);
  
  if (error instanceof Response) {
    return {
      message: `Request failed with status ${error.status}`,
      status: error.status,
    };
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      details: error,
    };
  }
  
  return {
    message: "An unexpected error occurred",
    details: error,
  };
};

// Base request function
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    const headers = {
      ...API_CONFIG.headers,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw response;
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    const apiError = handleApiError(error);
    toast({
      title: "Error",
      description: apiError.message,
      variant: "destructive",
    });
    return { error: apiError };
  }
}

// Books API
export const BooksApi = {
  getAll: () => request<Book[]>("/books"),
  
  getById: (bookId: string) => request<Book>(`/books/${bookId}`),
  
  create: (book: Omit<Book, "id">) =>
    request<Book>("/books", {
      method: "POST",
      body: JSON.stringify(book),
    }),
  
  update: (bookId: string, book: Partial<Book>) =>
    request<Book>(`/books/${bookId}`, {
      method: "PUT",
      body: JSON.stringify(book),
    }),
  
  delete: (bookId: string) =>
    request(`/books/${bookId}`, {
      method: "DELETE",
    }),
};

// Chapters API
export const ChaptersApi = {
  getAll: (bookId: string) => 
    request<Chapter[]>(`/books/${bookId}/chapters`),
  
  getById: (bookId: string, chapterId: string) =>
    request<Chapter>(`/books/${bookId}/chapters/${chapterId}`),
  
  create: (bookId: string, chapter: Omit<Chapter, "id">) =>
    request<Chapter>(`/books/${bookId}/chapters`, {
      method: "POST",
      body: JSON.stringify(chapter),
    }),
  
  update: (bookId: string, chapterId: string, chapter: Partial<Chapter>) =>
    request<Chapter>(`/books/${bookId}/chapters/${chapterId}`, {
      method: "PUT",
      body: JSON.stringify(chapter),
    }),
  
  delete: (bookId: string, chapterId: string) =>
    request(`/books/${bookId}/chapters/${chapterId}`, {
      method: "DELETE",
    }),
};

// Pages API
export const PagesApi = {
  getAll: (bookId: string, chapterId: string) =>
    request<Page[]>(`/books/${bookId}/chapters/${chapterId}/pages`),
  
  getById: (bookId: string, chapterId: string, pageId: string) =>
    request<Page>(`/books/${bookId}/chapters/${chapterId}/pages/${pageId}`),
  
  create: (bookId: string, chapterId: string, page: Omit<Page, "id">) =>
    request<Page>(`/books/${bookId}/chapters/${chapterId}/pages`, {
      method: "POST",
      body: JSON.stringify(page),
    }),
  
  update: (bookId: string, chapterId: string, pageId: string, page: Partial<Page>) =>
    request<Page>(`/books/${bookId}/chapters/${chapterId}/pages/${pageId}`, {
      method: "PUT",
      body: JSON.stringify(page),
    }),
  
  delete: (bookId: string, chapterId: string, pageId: string) =>
    request(`/books/${bookId}/chapters/${chapterId}/pages/${pageId}`, {
      method: "DELETE",
    }),
};

// Tasks API
export const TasksApi = {
  getAll: () => request<Task[]>("/tasks"),
  
  getById: (taskId: string) => request<Task>(`/tasks/${taskId}`),
  
  create: (task: Omit<Task, "id">) =>
    request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    }),
  
  update: (taskId: string, task: Partial<Task>) =>
    request<Task>(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(task),
    }),
  
  delete: (taskId: string) =>
    request(`/tasks/${taskId}`, {
      method: "DELETE",
    }),
};

// Export all APIs
export const api = {
  books: BooksApi,
  chapters: ChaptersApi,
  pages: PagesApi,
  tasks: TasksApi,
};

export default api;