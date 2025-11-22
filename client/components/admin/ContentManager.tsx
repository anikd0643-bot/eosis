import { useEffect, useState } from "react";
import {
  loadContent,
  saveContent,
  getContent,
  type ContentMap,
} from "@/lib/cms";

const FIELDS = [
  {
    key: "hero_title",
    label: "Hero Title",
    placeholder: "Luxury Abayas Crafted for Royal Elegance",
  },
  {
    key: "hero_subtitle",
    label: "Hero Subtitle",
    placeholder: "Discover exquisite abayas...",
  },
  { key: "hero_image", label: "Hero Image URL", placeholder: "https://..." },
  {
    key: "banner_title",
    label: "Banner Title",
    placeholder: "Crafted by Artisans",
  },
  {
    key: "banner_text",
    label: "Banner Text",
    placeholder: "Every piece is meticulously designed...",
  },
  {
    key: "banner_image",
    label: "Banner Image URL",
    placeholder: "https://...",
  },
  { key: "cat1_title", label: "Category 1 Title", placeholder: "Abayas" },
  {
    key: "cat1_image",
    label: "Category 1 Image URL",
    placeholder: "https://...",
  },
  { key: "cat2_title", label: "Category 2 Title", placeholder: "Kaftans" },
  {
    key: "cat2_image",
    label: "Category 2 Image URL",
    placeholder: "https://...",
  },
  {
    key: "cat3_title",
    label: "Category 3 Title",
    placeholder: "Modest Dresses",
  },
  {
    key: "cat3_image",
    label: "Category 3 Image URL",
    placeholder: "https://...",
  },
  { key: "cat4_title", label: "Category 4 Title", placeholder: "Prayer Sets" },
  {
    key: "cat4_image",
    label: "Category 4 Image URL",
    placeholder: "https://...",
  },
];

export default function ContentManager() {
  const [content, setContent] = useState<ContentMap>({});

  useEffect(() => {
    setContent(loadContent());
  }, []);

  const onSave = () => {
    saveContent(content);
    alert("✅ Content saved successfully!");
  };

  const onReset = () => {
    if (!confirm("Are you sure you want to reset all content?")) return;
    const next: ContentMap = {};
    setContent(next);
    saveContent(next);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          🌐 Site Content Manager
        </h2>
        <p className="text-sm text-muted-foreground">
          Update hero section, banners, and category titles across your store.
        </p>
      </div>

      {/* Content Fields Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map((f) => (
          <div
            key={f.key}
            className="rounded-xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 p-4 transition-all hover:border-primary/20 hover:shadow-sm"
          >
            <label className="grid gap-3">
              <span className="text-sm font-bold text-foreground">
                {f.label}
              </span>
              <input
                className="h-11 rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                placeholder={f.placeholder}
                value={content[f.key] ?? ""}
                onChange={(e) =>
                  setContent({ ...content, [f.key]: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground line-clamp-1">
                Key: <code className="text-primary font-mono text-xs">{f.key}</code>
              </p>
            </label>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-primary/10">
        <button
          className="h-12 rounded-lg border border-primary/20 px-6 font-medium text-primary transition-all hover:bg-primary/10 hover:border-primary/40"
          onClick={onSave}
        >
          💾 Save All Content
        </button>
        <button
          className="h-12 rounded-lg border border-red-200 px-6 font-medium text-red-600 transition-all hover:bg-red-50 hover:border-red-400"
          onClick={onReset}
        >
          🔄 Reset to Defaults
        </button>
        <div className="ml-auto flex items-center text-xs text-muted-foreground">
          ℹ️ Missing fields will use built-in defaults
        </div>
      </div>
    </div>
  );
}
