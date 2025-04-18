"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "./logo.svg";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, LogOut, User, Settings } from "lucide-react";

interface NavbarProps {
  pageTitle: string;
}

export default function Navbar({ pageTitle }: NavbarProps) {
  const router = useRouter();
  // user === undefined => loading, null => not logged, string => username
  const [user, setUser] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    fetch("http://localhost:8000/me", {
      credentials: "include",
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data.username);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      router.replace("/login");
    }
  };

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-white shadow-md">
      {/* Logo and Title */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard" className="cursor-pointer flex items-center space-x-2">
          <Image src={Logo} alt="Logo" height={32} width={32} />
        </Link>
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
      </div>

      {/* User Area */}
      {user === undefined ? (
        // loading state
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>
                  {user.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{user}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // not logged in
        <Button
          variant="ghost"
          disabled
          className="flex items-center space-x-2 opacity-50"
        >
          <Skeleton className="h-6 w-6 rounded-full" />
          <span>Not Logged In</span>
        </Button>
      )}
    </nav>
  );
}