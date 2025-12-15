import { supabase } from './supabaseClient';
import { JournalEntry, User } from '../types';

// Helper to map Supabase User to our App User
const mapUser = (sbUser: any): User => {
  return {
    id: sbUser.id,
    email: sbUser.email,
    name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User'
  };
};

// --- Auth Services ---

export const getSessionUser = async (): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error fetching session:", error);
      return null;
    }

    if (!data || !data.session || !data.session.user) {
      return null;
    }

    return mapUser(data.session.user);
  } catch (err) {
    console.error("Unexpected error in getSessionUser:", err);
    return null;
  }
};

export const loginUser = async (email: string, password?: string): Promise<User> => {
  if (!password) throw new Error("Password is required");
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  if (!data.user) throw new Error("Login failed");
  
  return mapUser(data.user);
};

export const signupUser = async (email: string, name: string, password?: string): Promise<User> => {
  if (!password) throw new Error("Password is required");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name
      }
    }
  });

  if (error) throw error;
  
  // If user is returned but session is null, it usually means email confirmation is required (default Supabase setting)
  if (data.user && !data.session) {
    throw new Error("Account created! Please check your email to confirm your account before logging in.");
  }

  if (!data.user) throw new Error("Signup failed");
  
  return mapUser(data.user);
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
};

// --- Journal Data Services ---

export const getEntries = async (): Promise<JournalEntry[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching entries:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    userId: item.user_id,
    title: item.title,
    content: item.content,
    date: item.date,
    updatedAt: item.updated_at,
    analysis: item.analysis
  }));
};

export const saveEntry = async (entry: Partial<JournalEntry>, userId: string): Promise<JournalEntry> => {
  const now = new Date().toISOString();
  
  const payload = {
    user_id: userId,
    title: entry.title,
    content: entry.content,
    date: entry.date || now,
    updated_at: now,
    analysis: entry.analysis
  };

  let data, error;

  if (entry.id) {
    // Update
    const response = await supabase
      .from('entries')
      .update(payload)
      .eq('id', entry.id)
      .select()
      .single();
    data = response.data;
    error = response.error;
  } else {
    // Insert
    const response = await supabase
      .from('entries')
      .insert([payload])
      .select()
      .single();
    data = response.data;
    error = response.error;
  }

  if (error) throw error;
  
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    content: data.content,
    date: data.date,
    updatedAt: data.updated_at,
    analysis: data.analysis
  };
};

export const deleteEntry = async (entryId: string): Promise<void> => {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', entryId);
  
  if (error) throw error;
};