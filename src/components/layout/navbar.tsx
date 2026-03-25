"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Bot, Menu, X, Layers } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">B&apos;H SaaS</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Agentes
            </Link>
            <Link href="/rag" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              RAG
            </Link>
            <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tareas
            </Link>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {session.user?.name || session.user?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Salir
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => signIn()}>
                Entrar
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-3">
              <Link href="/dashboard" className="text-sm py-2" onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
              <Link href="/agents" className="text-sm py-2" onClick={() => setMobileOpen(false)}>
                Agentes
              </Link>
              <Link href="/rag" className="text-sm py-2" onClick={() => setMobileOpen(false)}>
                RAG
              </Link>
              <Link href="/tasks" className="text-sm py-2" onClick={() => setMobileOpen(false)}>
                Tareas
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
