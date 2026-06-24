"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ICONS = ["⚗", "△", "◎", "⌬", "∞", "℃", "⊕", "⊗"];
const COLORS = ["#000000", "#333333", "#555555", "#777777", "#999999", "#444444", "#222222", "#666666"];

export default function CreateSubjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("⚗");
  const [color, setColor] = useState("#000000");
  const [saving, setSaving] = useState(false);

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/teacher/subjects" className="text-sm text-neutral-400 hover:text-neutral-600 font-medium">
        ← Back to Subjects
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-2">Create New Subject</h1>
      <p className="text-sm text-neutral-500 mb-8">Add a new laboratory subject to your program</p>

      <div className="space-y-6">
        <div>
          <Label>Subject Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., General Chemistry" className="mt-1.5" />
        </div>

        <div>
          <Label>Subject Code</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., CHEM 101" className="mt-1.5" />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the subject..." className="mt-1.5" rows={3} />
        </div>

        <div>
          <Label>Icon</Label>
          <div className="flex gap-2 mt-1.5">
            {ICONS.map((i) => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                className={`w-10 h-10 rounded-lg border text-xl flex items-center justify-center transition-all ${
                  icon === i ? "border-black bg-neutral-100 scale-110" : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Color</Label>
          <div className="flex gap-2 mt-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c ? "border-black scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {name && (
          <Card className="p-6">
            <p className="text-xs font-semibold text-neutral-400 uppercase mb-4">Preview</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: color + "15" }}>
                {icon}
              </div>
              <div>
                <h3 className="font-bold">{name}</h3>
                <p className="text-xs text-neutral-400">{code || "CODE"}</p>
              </div>
            </div>
            {description && <p className="text-sm text-neutral-500 mt-3">{description}</p>}
          </Card>
        )}

        <div className="flex gap-3 pt-4">
          <Button className="flex-1" disabled={saving || !name} onClick={async () => {
            setSaving(true);
            try {
              const resp = await fetch("/api/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, code, icon, color }),
              });
              if (!resp.ok) throw new Error("Failed");
              router.push("/teacher/subjects");
            } catch {
              alert("Failed to create subject.");
              setSaving(false);
            }
          }}>
            {saving ? "Creating..." : "Create Subject"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/teacher/subjects")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
