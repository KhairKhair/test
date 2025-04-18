// app/page.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar/navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // check authentication
    fetch("http://localhost:8000/me", {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          // authenticated → dashboard
          router.replace("/dashboard");
        } else {
          // not authenticated → login
          router.replace("/login");
        }
      })
      .catch(() => {
        // on network/CORS error, send to login
        router.replace("/login");
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar pageTitle="CliniKit"/>

      <main className="flex grow items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Checking Authentication…</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            Please wait while we verify your session.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
