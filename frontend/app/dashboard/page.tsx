"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar/navbar";
import { DashboardCard } from "@/components/card/dashboardcard";
import * as Icons from "lucide-react";

interface CardData {
  id: string;
  title: string;
  description: string;
  icon: string;
  href?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [cards, setCards] = useState<CardData[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    fetch("http://localhost:8000/me", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          router.replace("/login");
          throw new Error("Not authenticated");
        }
        return fetch("http://localhost:8000/dashboard", {
          credentials: "include",
        });
      })
      .then((res) => res.json())
      .then((data: { cards: CardData[] }) => {
        setCards(data.cards);
      })
      .catch(() => {
        // ignore, already redirected
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (!cards) {
    return null; // or redirect logic
  }

  // Map card IDs to routes fallback if href missing
  const hrefMap: Record<string, string> = {
    patient_mgmt: "/patients",
    appointments: "/appointments",
    reports: "/reports",
  };

  // Predefined set of icon color classes to cycle through
  const iconColors = [
    "text-blue-500",
    "text-green-500",
    "text-purple-500",
    "text-red-500",
    "text-yellow-500"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar pageTitle="Dashboard" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {cards.map((card, idx) => {
          const IconComponent = (Icons as any)[card.icon];
          const href = card.href ?? hrefMap[card.id] ?? "/";
          const colorClass = iconColors[idx % iconColors.length];

          return (
            <DashboardCard
              key={card.id}
              href={href}
              title={card.title}
              description={card.description}
              icon={
                IconComponent ? (
                  <IconComponent className={`h-6 w-6 ${colorClass}`} />
                ) : null
              }
            />
          );
        })}
      </div>
    </div>
  );
}
