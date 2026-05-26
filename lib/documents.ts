"use server";
import { createClient } from "./supabase/server";
import { Document } from "./types";
import { PostgrestError } from "@supabase/supabase-js";

export const getAllDocuments = async (): Promise<
  Document[] | PostgrestError | Error
> => {
  const supabase = await createClient();

  const { data, error } = await supabase.from("documents").select("*");

  if (error) return error;

  return data as Document[];
};
