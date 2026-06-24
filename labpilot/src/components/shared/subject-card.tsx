"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Subject } from "@/types";

export function SubjectCard({ subject, href }: { subject: Subject; href: string }) {
  return (
    <Link href={href}>
      <Card className="p-6 hover:shadow-md transition-all hover:border-neutral-300 cursor-pointer group">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: subject.color + "15" }}
            >
              {subject.icon}
            </div>
            <div>
              <h3 className="font-bold text-base group-hover:underline">{subject.name}</h3>
              <p className="text-xs text-neutral-400 font-medium">{subject.code}</p>
            </div>
          </div>
          <span className="text-neutral-300 group-hover:text-neutral-600 transition-colors text-lg">→</span>
        </div>
        <p className="text-sm text-neutral-500 mt-3 line-clamp-2">{subject.description}</p>
        <div className="flex items-center gap-2 mt-4">
          <Badge variant="secondary" className="text-[11px]">{subject.experimentCount} experiments</Badge>
          <Badge variant="outline" className="text-[11px]">{subject.studentCount} students</Badge>
        </div>
      </Card>
    </Link>
  );
}
