"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useEffect, useState } from "react";
import { Document } from "@/lib/types";
import DocumentItem from "@/components/documents/DocumentItem";
import DocumentItemSkeleton from "@/components/documents/DocumentItemSkeleton";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Search } from "lucide-react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<"all" | "owned">("all");
  const [search, setSearch] = useState("");

  const fetchUser = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      await fetchUser();

      try {
        const res = await fetch("/api/documents");
        if (!res.ok)
          throw new Error(`Failed to fetch documents: ${res.status}`);
        const data: Document[] = await res.json();
        setDocuments(data);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const q = search.toLowerCase();
  const displayedDocuments = documents
    .filter((doc) => filter === "all" || doc.isOwned)
    .filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        (doc.category ?? "").toLowerCase().includes(q)
    );

  return (
    <div className="w-full flex flex-col items-center gap-4 py-6 px-4 max-w-7xl mx-auto min-h-svh">
      <div className="w-full flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground">
          Each with a suggested price. Pay what feels fair.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Tabs
            defaultValue="all"
            onValueChange={(v) => setFilter(v as "all" | "owned")}
          >
            <TabsList>
              <TabsTrigger value="all" className="cursor-pointer">
                All
              </TabsTrigger>
              <TabsTrigger value="owned" className="cursor-pointer">
                Owned
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <InputGroup className="w-full sm:max-w-sm">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search documents"
              placeholder="Search by title, category, or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {isLoading ? "…" : `${displayedDocuments.length} results`}
          </span>
        </div>
      </div>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <DocumentItemSkeleton key={i} />
          ))
        ) : displayedDocuments.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Search className="h-8 w-8 opacity-40" />
            <p className="text-sm">No documents found</p>
          </div>
        ) : (
          displayedDocuments.map((doc) => (
            <DocumentItem key={doc.id} doc={doc} user={user} />
          ))
        )}
      </section>
    </div>
  );
}
