import React, { useState, useEffect } from 'react';
import { User, JournalEntry, ViewState } from './types';
import { getSessionUser, loginUser, signupUser, logoutUser, getEntries, saveEntry, deleteEntry } from './services/storageService';
import { Auth } from './components/Auth';
import { JournalList } from './components/JournalList';
import { JournalEditor } from './components/JournalEditor';
import { Button } from './components/Button';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('AUTH');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize Auth
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // Create a fallback timeout to ensure we don't get stuck loading forever
      // if Supabase connectivity is slow or blocked
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000));
      
      try {
        // Race condition: either we get the user, or we timeout after 3s
        // This ensures the user eventually sees the app interface
        const userPromise = getSessionUser();
        
        // We just await the user check, but we set a flag in a finally block or parallel timeout
        // Actually, simpler approach:
        
        const currentUser = await Promise.race([
          userPromise,
          timeoutPromise.then(() => null) // Return null on timeout
        ]) as User | null;

        if (mounted) {
          if (currentUser) {
            setUser(currentUser);
            // We can fetch entries in background
            fetchEntries(); 
            setView('LIST');
          }
        }
      } catch (error) {
        console.error("Auth initialization failed", error);
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
         // Don't trigger full reload if we already have the user
         // This prevents loop if onAuthStateChange fires on init
         setUser((prev) => {
             if (prev?.id === session.user.id) return prev;
             // If new user, fetch details
             getSessionUser().then(u => {
                 if (mounted && u) {
                     setUser(u);
                     setView('LIST');
                     fetchEntries();
                 }
             });
             return prev; 
         });
         
         // If we were in AUTH view, definitely switch
         if (view === 'AUTH') {
             const u = await getSessionUser();
             if (mounted && u) {
                 setUser(u);
                 setView('LIST');
                 fetchEntries();
             }
         }

      } else if (event === 'SIGNED_OUT') {
         setUser(null);
         setEntries([]);
         setView('AUTH');
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const data = await getEntries();
      setEntries(data);
    } catch (err) {
      console.error("Failed to load entries", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const loggedUser = await loginUser(email, password);
      setUser(loggedUser);
      setView('LIST');
      // Fetch entries after setting view to ensure UI feedback
      await fetchEntries();
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (email: string, name: string, password?: string) => {
    setIsLoading(true);
    try {
      const newUser = await signupUser(email, name, password);
      setUser(newUser);
      setView('LIST');
      await fetchEntries();
    } catch (err: any) {
       alert(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    // State clearing handled by onAuthStateChange
  };

  const handleCreateEntry = () => {
    setCurrentEntry(null);
    setView('CREATE');
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setView('EDIT');
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      if (user) {
        try {
          await deleteEntry(id);
          await fetchEntries();
        } catch (err) {
          console.error("Failed to delete", err);
        }
      }
    }
  };

  const handleSaveEntry = async (entryData: Partial<JournalEntry>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await saveEntry(entryData, user.id);
      await fetchEntries();
      setView('LIST');
    } catch (err) {
      console.error("Failed to save", err);
      alert("Failed to save entry. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="text-4xl mb-4 animate-bounce">🧘</div>
          <p className="text-slate-500 font-medium">Loading Journal...</p>
        </div>
      </div>
    );
  }

  if (view === 'AUTH') {
    return <Auth onLogin={handleLogin} onSignup={handleSignup} isLoading={isLoading} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setView('LIST')}>
              <span className="text-2xl mr-2">🧘</span>
              <span className="font-bold text-lg text-slate-800 tracking-tight hidden sm:block">Mindful Journal</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:block">Welcome, {user?.name}</span>
              <Button variant="secondary" onClick={handleLogout} className="text-sm py-1">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        {view === 'LIST' && (
          <div className="relative">
             {isLoading && entries.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 h-64 rounded-xl">
                   <div className="flex items-center gap-2 text-slate-500">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading entries...
                   </div>
                </div>
             )}
            <JournalList 
              entries={entries} 
              onCreate={handleCreateEntry} 
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
            />
          </div>
        )}

        {(view === 'CREATE' || view === 'EDIT') && (
          <JournalEditor 
            initialEntry={currentEntry}
            onSave={handleSaveEntry}
            onCancel={() => setView('LIST')}
          />
        )}
      </main>
    </div>
  );
};

export default App;