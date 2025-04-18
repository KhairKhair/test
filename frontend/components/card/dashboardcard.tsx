import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface DashboardCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function DashboardCard({ href, title, description, icon }: DashboardCardProps) {
  return (
    <Link href={href} className="group block h-full transform transition hover:-translate-y-1 hover:shadow-lg">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex items-center space-x-3">
          {icon}
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow opacity-80 group-hover:opacity-100">
          <p>{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}