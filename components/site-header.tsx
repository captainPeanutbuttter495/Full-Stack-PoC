"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import Wordmark from "@/components/wordmark";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import { User2 } from "lucide-react";

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const isDocs = pathname.startsWith("/documents");

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <header className="flex items-center justify-between gap-3 border-b min-w-0 w-full p-4 sticky top-0 z-10 bg-background">
      <Wordmark />
      <nav className="flex gap-4" aria-label="Primary">
        <Button variant={isHome ? "default" : "ghost"} asChild>
          <Link href="/" aria-current={isHome ? "page" : undefined}>
            Home
          </Link>
        </Button>
        <Button variant={isDocs ? "default" : "ghost"} asChild>
          <Link href="/documents" aria-current={isDocs ? "page" : undefined}>
            Documents
          </Link>
        </Button>
      <div className="flex items-center">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarFallback>
                  {user.email?.[0].toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="truncate max-w-48">
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" asChild>
            <Link href="/auth/login" ><User2 /> Sign in</Link>
          </Button>
        )}
      </div>
      </nav>
    </header>
  );
}
