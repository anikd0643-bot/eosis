import { useEffect, useMemo, useState } from "react";
import {
  loadPosts,
  savePosts,
  upsertPost,
  deletePost,
  publishPost,
  unpublishPost,
  type Post,
  type PostStatus,
  slugify,
} from "@/lib/cms";

export default function PostManager() {
  const [posts, setPosts] = useState<Post[]>(loadPosts());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PostStatus | "all">("all");
  const [editing, setEditing] = useState<Post | null>(null);

  useEffect(() => {
    // sync external changes (if any)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cms_posts") setPosts(loadPosts());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return posts.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.excerpt || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, query, status]);

  const onNew = () => {
    setEditing({
      id: "",
      slug: "",
      title: "",
      excerpt: "",
      content: "",
      coverImage: "",
      tags: [],
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const onSave = () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      alert("Title is required");
      return;
    }
    const expectedSlug = slugify(editing.slug || editing.title);
    const next = upsertPost({
      ...editing,
      slug: editing.slug ? expectedSlug : undefined,
    });
    setPosts(next);
    const saved = editing.id
      ? next.find((p) => p.id === editing.id)
      : next.find((p) => p.slug === expectedSlug);
    setEditing(saved || null);
  };

  const onDelete = (id: string) => {
    if (!confirm("Delete this post?")) return;
    const next = deletePost(id);
    setPosts(next);
    if (editing?.id === id) setEditing(null);
  };

  const onPublishToggle = (p: Post) => {
    const next =
      p.status === "published" ? unpublishPost(p.id) : publishPost(p.id);
    setPosts(next);
    if (editing) setEditing(next.find((x) => x.id === p.id) || null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header & Filters */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            📝 Blog Posts Manager
          </h2>
          <p className="text-sm text-muted-foreground">
            Create, edit, and publish blog posts to engage your audience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Search posts..."
            className="col-span-1 sm:col-span-2 h-12 rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
          />
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="flex-1 h-12 rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
            >
              <option value="all">📊 All Posts</option>
              <option value="draft">📝 Drafts</option>
              <option value="published">✓ Published</option>
            </select>
            <button
              className="h-12 rounded-xl border border-primary/20 px-4 text-sm font-medium transition-all hover:bg-primary/10 hover:border-primary/40 whitespace-nowrap"
              onClick={onNew}
            >
              ➕ New Post
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setEditing(p)}
              className={`group relative rounded-xl border text-left transition-all duration-300 p-5 overflow-hidden ${
                editing?.id === p.id
                  ? "border-primary bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg"
                  : "border-primary/10 bg-gradient-to-br from-white to-primary/5 hover:border-primary/30 hover:shadow-md"
              }`}
            >
              {/* Cover Image */}
              {p.coverImage && (
                <div className="mb-4 h-32 w-full rounded-lg bg-primary/10 overflow-hidden">
                  <img
                    src={p.coverImage}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Content */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <h3 className="font-bold text-foreground line-clamp-2 flex-1">
                    {p.title}
                  </h3>
                  <span
                    className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${
                      p.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.status === "published" ? "✓ Live" : "📝 Draft"}
                  </span>
                </div>

                {p.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {p.excerpt}
                  </p>
                )}

                {/* Tags */}
                {(p.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {p.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        #{tag}
                      </span>
                    ))}
                    {p.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground pt-1">
                        +{p.tags.length - 2} more
                      </span>
                    )}
                  </div>
                )}

                {/* Meta */}
                <div className="pt-3 border-t border-primary/10 text-xs text-muted-foreground">
                  {new Date(p.updatedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                {/* Action Hint */}
                <div className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  👆 Click to edit
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 p-12 text-center">
          <p className="text-muted-foreground text-sm">
            📭 No posts found. Try adjusting your filters or create a new post.
          </p>
        </div>
      )}

      {/* Edit Panel */}
      {editing && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-white to-primary/5 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {editing.id ? "Edit Post" : "New Post"}
            </h2>
            <button
              className="text-2xl text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(null)}
            >
              ✕
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="📝 Title">
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </Field>

            <Field label="🔗 Slug">
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={editing.slug}
                onChange={(e) =>
                  setEditing({ ...editing, slug: e.target.value })
                }
                placeholder="auto-generated from title"
              />
            </Field>

            <Field label="🖼️ Cover Image URL" colSpan>
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={editing.coverImage || ""}
                onChange={(e) =>
                  setEditing({ ...editing, coverImage: e.target.value })
                }
              />
            </Field>

            <Field label="📄 Excerpt" colSpan>
              <textarea
                className="min-h-[80px] w-full rounded-xl border border-primary/20 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent resize-none"
                value={editing.excerpt || ""}
                onChange={(e) =>
                  setEditing({ ...editing, excerpt: e.target.value })
                }
              />
            </Field>

            <Field label="📋 Content" colSpan>
              <textarea
                className="min-h-[200px] w-full rounded-xl border border-primary/20 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent resize-none font-mono"
                value={editing.content}
                onChange={(e) =>
                  setEditing({ ...editing, content: e.target.value })
                }
              />
            </Field>

            <Field label="🏷️ Tags (comma separated)" colSpan>
              <input
                className="h-11 w-full rounded-xl border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                value={(editing.tags || []).join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 border-t border-primary/10 pt-6">
            <button
              className="h-11 rounded-lg border border-primary/20 px-6 font-medium text-primary transition-all hover:bg-primary/10 hover:border-primary/40"
              onClick={onSave}
            >
              💾 Save
            </button>

            <button
              className={`h-11 rounded-lg border font-medium transition-all px-6 ${
                editing.status === "published"
                  ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400"
                  : "border-green-200 text-green-600 hover:bg-green-50 hover:border-green-400"
              }`}
              onClick={() => onPublishToggle(editing)}
            >
              {editing.status === "published" ? "🔒 Unpublish" : "✓ Publish"}
            </button>

            {editing.id && (
              <button
                className="h-11 rounded-lg border border-red-200 px-6 font-medium text-red-600 transition-all hover:bg-red-50 hover:border-red-400"
                onClick={() => onDelete(editing.id)}
              >
                🗑️ Delete
              </button>
            )}

            <button
              className="ml-auto h-11 rounded-lg border border-primary/20 px-6 font-medium text-foreground transition-all hover:bg-primary/5 hover:border-primary/40"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  colSpan,
  children,
}: {
  label: string;
  colSpan?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`grid gap-2 ${colSpan ? "md:col-span-2" : ""}`}
    >
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}
