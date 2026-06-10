import { createClient } from "@/lib/supabase/client";
import { AuthError } from "@supabase/supabase-js";

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<AuthError | null> => {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log("Error signing in:", error.message);
    return error;
  }

  return null;
};

export const signUpWithEmail = async (
  email: string,
  password: string,
): Promise<AuthError | null> => {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.log("Error signing up:", error.message);
    return error;
  }

  return null;
};

export const signOut = async (): Promise<AuthError | null> => {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.log("Error signing out:", error.message);
    return error;
  }

  return null;
};

export const continueWithGoogle = async (): Promise<AuthError | null> => {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback/`,
    },
  });

  if (error) {
    console.log("Error signing in with Google:", error.message);
    return error;
  }

  return null;
};
