import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Star,
  Trash2,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  FolderOpen,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useReaderStore } from '../../stores/readerStore';
import { StoredBook } from '../../types/reader';
import { toast } from '../../stores/noticeStore';

interface ReadEraLibraryViewProps {
  onOpenBook?: (book: StoredBook) => void;
}

export const ReadEraLibraryView: React.FC<ReadEraLibraryViewProps> = ({ onOpenBook }) => {
  const { books, isLoadingBooks, loadBooks, openBook, importBookFile, toggleFavorite, deleteBook } = useReaderStore();
  const [activeTab, setActiveTab] = useState<'reading_now' | 'all' | 'favorites' | 'have_read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Window-level drag event listener so drag-overlay activates anywhere on the screen
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
        dragCounter++;
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
      }
    };

    const handleWindowDrop = () => {
      dragCounter = 0;
      setIsDragging(false);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let firstImported: StoredBook | null = null;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const imported = await importBookFile(file);
        if (!firstImported) firstImported = imported;
      } catch {
        toast.error(`Could not open "${file.name}".`);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';

    if (firstImported) {
      toast.success(`Opening "${firstImported.title}"...`, 'Opening Book');
      handleOpenBook(firstImported);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    let firstImported: StoredBook | null = null;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const imported = await importBookFile(file);
        if (!firstImported) firstImported = imported;
      } catch {
        toast.error(`Failed to open "${file.name}".`);
      }
    }

    if (firstImported) {
      toast.success(`Opening "${firstImported.title}"...`, 'Opening Book');
      handleOpenBook(firstImported);
    }
  };

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.format.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'reading_now') return b.progressPercent < 100;
    if (activeTab === 'favorites') return b.isFavorite;
    if (activeTab === 'have_read') return b.progressPercent >= 100;
    return true; // 'all'
  });

  const handleOpenBook = (book: StoredBook) => {
    openBook(book);
    onOpenBook?.(book);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-24 px-2 sm:px-4">
      {/* Drag & Drop Dynamic Full-Screen Overlay (only shown when dragging a file) */}
      {isDragging && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-150"
        >
          <div className="rounded-3xl border-2 border-dashed border-emerald-400 bg-vibe-card p-8 sm:p-12 text-center max-w-md w-full space-y-4 shadow-2xl scale-100 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-semibold text-vibe-ink">
                Drop your file to read
              </h3>
              <p className="text-xs text-vibe-ink-muted">
                Accepts <span className="font-semibold text-vibe-accent">PDF, EPUB, TXT, MOBI, or FB2</span>.
              </p>
              <p className="text-[11px] text-vibe-ink-muted/80 pt-1">
                Opens directly in the reader and saves to your local offline library.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-sans text-[10.5px] font-medium tracking-wider uppercase text-vibe-ink-muted/80">
              Personal E-Reader & Documents
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-vibe-ink leading-tight">
            E-Reader Library
          </h1>
        </div>

        {/* Action Button: Sleek Open Book Trigger */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.epub,.txt,.mobi,.fb2"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-vibe-accent hover:bg-vibe-accent-hover text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer group"
            title="Open or import a PDF, EPUB, or TXT book"
          >
            <UploadCloud className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span>Open Book</span>
            <span className="hidden sm:inline-block text-[10px] font-mono opacity-85 px-2 py-0.5 rounded-full bg-black/15">
              PDF · EPUB · TXT
            </span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-vibe-border pb-3">
        {/* ReadEra Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-vibe-card text-vibe-accent border border-vibe-border shadow-xs'
                : 'text-vibe-ink-muted hover:text-vibe-ink'
            }`}
          >
            All Books ({books.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reading_now')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'reading_now'
                ? 'bg-vibe-card text-vibe-accent border border-vibe-border shadow-xs'
                : 'text-vibe-ink-muted hover:text-vibe-ink'
            }`}
          >
            Reading Now ({books.filter((b) => b.readingStatus === 'reading_now' || b.progressPercent < 100).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-vibe-card text-vibe-accent border border-vibe-border shadow-xs'
                : 'text-vibe-ink-muted hover:text-vibe-ink'
            }`}
          >
            Favorites ({books.filter((b) => b.isFavorite).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('have_read')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'have_read'
                ? 'bg-vibe-card text-vibe-accent border border-vibe-border shadow-xs'
                : 'text-vibe-ink-muted hover:text-vibe-ink'
            }`}
          >
            Have Read ({books.filter((b) => b.progressPercent >= 100).length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-vibe-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search local documents..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-vibe-border bg-vibe-card text-vibe-ink placeholder:text-vibe-ink-muted focus:border-vibe-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Book Grid or Empty States */}
      {isLoadingBooks ? (
        <div className="py-16 text-center text-xs text-vibe-ink-muted">Loading your local documents...</div>
      ) : books.length === 0 ? (
        /* Entire Library Empty State */
        <div className="rounded-3xl border border-vibe-border bg-vibe-card p-10 sm:p-14 text-center space-y-4 shadow-soft max-w-md mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center mx-auto shadow-xs">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading text-base sm:text-lg font-semibold text-vibe-ink">Your library is empty</h3>
            <p className="text-xs text-vibe-ink-muted leading-relaxed max-w-xs mx-auto">
              Open any PDF, EPUB, or TXT book to start your distraction-free offline reading session.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-vibe-accent hover:bg-vibe-accent-hover text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Open Book File</span>
          </button>
        </div>
      ) : filteredBooks.length === 0 ? (
        /* Filter / Search Match Empty State */
        <div className="rounded-3xl border border-vibe-border bg-vibe-card p-10 text-center space-y-3 shadow-soft max-w-md mx-auto my-8">
          <FolderOpen className="w-10 h-10 text-vibe-ink-muted mx-auto" />
          <h3 className="font-heading text-sm font-semibold text-vibe-ink">No books found in this section</h3>
          <p className="text-xs text-vibe-ink-muted">
            No documents matched your current tab or search query.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-vibe-border bg-vibe-card-subtle text-xs text-vibe-ink font-medium hover:bg-vibe-card transition-colors cursor-pointer mt-1"
          >
            Show All Books
          </button>
        </div>
      ) : (
        /* Books Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => handleOpenBook(book)}
              className="group bg-vibe-card border border-vibe-border rounded-2xl p-3.5 sm:p-4 shadow-soft hover:shadow-float transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Top header row: format pill & favorite button */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-vibe-accent-subtle text-vibe-accent border border-vibe-accent/20">
                    {book.format}
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(book.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        book.isFavorite ? 'text-amber-500' : 'text-vibe-ink-muted hover:text-amber-500'
                      }`}
                      title={book.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-3.5 h-3.5 ${book.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBook(book.id)}
                      className="p-1.5 text-vibe-ink-muted hover:text-rose-500 transition-colors cursor-pointer"
                      title="Remove from library"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Cover & Title */}
                <div className="flex gap-3.5 items-start mb-3">
                  <div className="w-16 h-22 sm:w-18 sm:h-26 rounded-xl overflow-hidden border border-vibe-border shadow-md flex-shrink-0 bg-vibe-card-subtle relative group-hover:scale-105 transition-transform duration-200">
                    {book.coverUrl ? (
                      <img 
                        src={book.coverUrl} 
                        alt={book.title} 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-950/20 text-vibe-accent flex flex-col items-center justify-center p-2 text-center animate-pulse">
                        <FileText className="w-6 h-6 mb-1 opacity-70" />
                        <span className="text-[8px] font-mono font-bold uppercase tracking-tight">{book.format}</span>
                        <span className="text-[7px] text-vibe-ink-muted mt-0.5">Generating...</span>
                      </div>
                    )}
                    {/* Subtle book spine edge highlight */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-vibe-ink line-clamp-2 leading-snug group-hover:text-vibe-accent transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-vibe-ink-muted mt-1 truncate">{book.author}</p>
                    <span className="text-[10px] text-vibe-ink-muted font-mono block mt-1">
                      {Math.round(book.fileSize / 1024)} KB
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress & Read Action Footer */}
              <div className="pt-3 border-t border-vibe-border flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-vibe-ink-muted">
                    <span className="text-[11px] truncate">
                      {book.progressPercent > 0 ? `Page ${book.currentPage}` : 'Not started'}
                    </span>
                    <span className="font-mono text-[11px] font-medium text-vibe-ink ml-1">
                      {book.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-vibe-card-subtle overflow-hidden">
                    <div
                      className="h-full bg-vibe-accent rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(book.progressPercent, 2)}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenBook(book);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-vibe-accent/10 hover:bg-vibe-accent text-vibe-accent hover:text-white text-xs font-medium transition-all shrink-0 cursor-pointer shadow-2xs"
                  title="Open this book in the reader"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{book.progressPercent > 0 ? 'Continue' : 'Read'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
