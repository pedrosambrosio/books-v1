import { useState } from "react";
import { CreateTask } from "@/components/CreateTask";
import { TaskCard, Task } from "@/components/TaskCard";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Star, ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Book as BookType } from "@/types/Book";
import { GENESIS_CONTENT } from "@/data/bibleContent";
import { cn } from "@/lib/utils";
import { QuizDialog } from "@/components/quiz/QuizDialog";
import { CHAPTER_QUIZZES } from "@/data/quizQuestions";
import { QuizResult } from "@/types/Quiz";
import { TextSelectionTooltip } from "@/components/TextSelectionTooltip";

// Create Bible book structure with Genesis and Exodus
const BIBLE_BOOK: BookType = {
  id: "bible",
  title: "Bíblia",
  type: "bible",
  chapters: [
    {
      id: "genesis",
      number: 1,
      title: "Genesis",
      pages: Array.from({ length: 3 }, (_, i) => ({
        id: `genesis-${i+1}`,
        number: i + 1,
        title: `Página ${i + 1}`,
        completed: false
      })),
      completedPages: 0,
    },
    {
      id: "exodus",
      number: 2,
      title: "Exodus",
      pages: Array.from({ length: 2 }, (_, i) => ({
        id: `exodus-${i+1}`,
        number: i + 1,
        title: `Página ${i + 1}`,
        completed: false
      })),
      completedPages: 0,
    }
  ],
  completedChapters: 0,
};

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3;
  const [isBookCompleted, setIsBookCompleted] = useState(false);
  const [currentBibleBook, setCurrentBibleBook] = useState(BIBLE_BOOK);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagCounts, setTagCounts] = useState<{ [key: string]: number }>({});
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [chapterLevels, setChapterLevels] = useState<{ [chapterId: string]: QuizResult }>({});
  const [selectedText, setSelectedText] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "chat">("personal");

  const handleCreateTask = (newTask: Omit<Task, "id" | "completed" | "inProgress" | "isPaused">) => {
    const task: Task = {
      ...newTask,
      id: crypto.randomUUID(),
      completed: false,
      inProgress: false,
      isPaused: false,
      pageNumber: currentPage,
    };

    setTasks((prev) => [task, ...prev]);
    
    // Update tag counts when creating a task
    if (newTask.tags) {
      const newTagCounts = { ...tagCounts };
      newTask.tags.forEach(tag => {
        newTagCounts[tag] = (newTagCounts[tag] || 0) + 1;
      });
      setTagCounts(newTagCounts);
    }

    toast({
      title: "Anotação criada",
      description: "Sua nova anotação foi criada com sucesso.",
    });
  };

  const handleTagCreate = (tag: string) => {
    if (!allTags.includes(tag)) {
      setAllTags(prev => [...prev, tag]);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    
    if (taskToDelete?.tags) {
      const newTagCounts = { ...tagCounts };
      const remainingTasks = tasks.filter(task => task.id !== taskId);
      
      // Recalculate tag counts for all remaining tasks
      Object.keys(newTagCounts).forEach(tag => {
        const count = remainingTasks.filter(task => task.tags?.includes(tag)).length;
        if (count === 0) {
          delete newTagCounts[tag]; // Remove tag if no tasks use it
        } else {
          newTagCounts[tag] = count;
        }
      });
      
      setTagCounts(newTagCounts);
    }
    
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    toast({
      title: "Anotação excluída",
      description: "A anotação foi excluída com sucesso.",
    });
  };

  const getNoteCounts = () => {
    const bookNotes = tasks.length;
    const chapterNotes = tasks.filter(task => 
      task.pageNumber && task.pageNumber >= 1 && task.pageNumber <= 3
    ).length;
    const pageNotes = tasks.filter(task => task.pageNumber === currentPage).length;

    return {
      bookNotes,
      chapterNotes,
      pageNotes
    };
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const oldTags = tasks.find(task => task.id === updatedTask.id)?.tags || [];
    const newTags = updatedTask.tags || [];
    
    // Find removed tags
    const removedTags = oldTags.filter(tag => !newTags.includes(tag));
    
    // Update tag counts for removed tags
    removedTags.forEach(tag => {
      const currentCount = tagCounts[tag] || 0;
      if (currentCount > 0) {
        setTagCounts(prev => ({
          ...prev,
          [tag]: prev[tag] - 1
        }));
      }
    });
    
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );

    // Update tag counts after task update
    const newTagCounts: { [key: string]: number } = {};
    tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => {
          newTagCounts[tag] = (newTagCounts[tag] || 0) + 1;
        });
      }
    });
    setTagCounts(newTagCounts);
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed, inProgress: false, isPaused: false }
          : task
      )
    );
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      
      // Update the book data structure to reflect the current page's completion status
      const updatedBook = { ...currentBibleBook };
      const currentChapter = updatedBook.chapters[0];
      if (currentChapter && currentChapter.pages[nextPage - 1]) {
        setIsBookCompleted(currentChapter.pages[nextPage - 1].completed);
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      
      // Update the book data structure to reflect the current page's completion status
      const updatedBook = { ...currentBibleBook };
      const currentChapter = updatedBook.chapters[0];
      if (currentChapter && currentChapter.pages[prevPage - 1]) {
        setIsBookCompleted(currentChapter.pages[prevPage - 1].completed);
      }
    }
  };

  const handlePageSelect = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    const currentChapter = currentBibleBook.chapters[0];
    if (currentChapter && currentChapter.pages[pageNumber - 1]) {
      setIsBookCompleted(currentChapter.pages[pageNumber - 1].completed);
    }
  };

  const getCurrentPageContent = () => {
    const content = GENESIS_CONTENT[currentPage - 1];
    if (!content) {
      return "Conteúdo não disponível";
    }
    return content;
  };

  const handleMarkAsCompleted = () => {
    const updatedBook = { ...currentBibleBook };
    const currentChapter = updatedBook.chapters[0];
    
    if (currentChapter && currentChapter.pages[currentPage - 1]) {
      const wasCompletedBefore = currentChapter.pages[currentPage - 1].completed;
      currentChapter.pages[currentPage - 1].completed = !currentChapter.pages[currentPage - 1].completed;
      currentChapter.completedPages = currentChapter.pages.filter(page => page.completed).length;
      
      // If this is the last page and it wasn't completed before, open the quiz
      if (currentPage === totalPages && !wasCompletedBefore && currentChapter.pages[currentPage - 1].completed) {
        setIsQuizOpen(true);
      }
    }
    
    updatedBook.completedChapters = updatedBook.chapters.filter(
      chapter => chapter.completedPages === chapter.pages.length
    ).length;
    
    setCurrentBibleBook(updatedBook);
    setIsBookCompleted(currentChapter.pages[currentPage - 1].completed);
    
    toast({
      title: currentChapter.pages[currentPage - 1].completed ? "Página marcada como concluída" : "Página marcada como pendente",
      description: `A página foi marcada como ${currentChapter.pages[currentPage - 1].completed ? "concluída" : "pendente"}.`,
    });
  };

  const handleQuizComplete = (result: QuizResult) => {
    setChapterLevels(prev => ({
      ...prev,
      [result.chapterId]: result
    }));
    setIsQuizOpen(false);
    
    toast({
      title: "Quiz completado!",
      description: `Você acertou ${result.score} de ${result.totalQuestions} questões.`,
    });
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText("");
      setTooltipPosition(null);
      return;
    }

    const text = selection.toString().trim();
    if (text) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(text);
      setTooltipPosition({
        x: rect.left + (rect.width / 2),
        y: rect.top - 20,
      });
    }
  };

  const handleAskAI = (text: string) => {
    setActiveTab("chat");
    // Here you would implement the logic to send the text to the AI chat
    console.log("Asking AI about:", text);
    setTooltipPosition(null);
  };

  const handleCreateNote = (text: string) => {
    // Open the create task dialog with the reference field pre-filled
    // You would need to implement this functionality in your CreateTask component
    console.log("Creating note with reference:", text);
    setTooltipPosition(null);
  };

  // Transform tagCounts into the format expected by AppSidebar
  const sidebarTags = Object.entries(tagCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => ({
      name,
      count
    }));

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gradient-to-b from-background to-muted/20">
        <AppSidebar 
          currentBook={currentBibleBook} 
          onPageSelect={handlePageSelect}
          noteCounts={getNoteCounts()}
          tags={sidebarTags}
          chapterLevels={chapterLevels}
        />
        <ResizablePanelGroup 
          direction={isMobile ? "vertical" : "horizontal"} 
          className="h-screen flex-1"
        >
          <ResizablePanel defaultSize={50} minSize={30} className="h-full">
            <ScrollArea className="h-full">
              <div className="p-4 md:p-6 flex justify-center">
                <div className="w-full max-w-2xl">
                  <div 
                    className="glass-card h-full rounded-lg p-6"
                    onMouseUp={handleTextSelection}
                  >
                    <div className="prose prose-sm max-w-none whitespace-pre-line">
                      {getCurrentPageContent()}
                    </div>
                    <TextSelectionTooltip
                      selectedText={selectedText}
                      onAskAI={handleAskAI}
                      onCreateNote={handleCreateNote}
                      position={tooltipPosition}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={50} minSize={30} className="h-full">
            <ScrollArea className="h-full">
              <div className="p-4 md:p-6 flex justify-center">
                <div className="w-full max-w-2xl">
                  <div className="glass-card h-full rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-semibold">Gênesis</h2>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleMarkAsCompleted}
                          className={cn(
                            "transition-colors",
                            isBookCompleted 
                              ? "text-[#09090B]" 
                              : "text-[#F4F4F5]"
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none whitespace-pre-line">
                      {getCurrentPageContent()}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
        <QuizDialog
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          questions={CHAPTER_QUIZZES[0].questions}
          chapterId="genesis"
          onComplete={handleQuizComplete}
        />
      </div>
    </SidebarProvider>
  );
};

export default Index;
