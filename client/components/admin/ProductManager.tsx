import { useEffect, useMemo, useState, useCallback } from "react";
import {
  getProducts,
  upsertProduct,
  deleteProduct,
  listCategories,
  setHidden,
  slugifyId,
  type ManagedProduct,
  exportOverrides,
  importOverrides,
  clearOverrides,
} from "@/lib/catalog";
import type { CatalogProduct } from "@/data/products";
import {
  getStock,
  setStock,
  exportInventory,
  importInventory,
  resetInventory,
} from "@/lib/inventory";
import { formatCurrency } from "@/lib/money";
import { Search, Plus, Copy, Trash2, Eye, EyeOff, Download, Upload, RefreshCw, X } from "lucide-react";

type Editable = ManagedProduct;

const EMPTY: Editable = {
  id: "",
  title: "",
  price: 0,
  image: "",
  images: [],
  description: "",
  category: "Abayas",
  isNew: false,
  isBestSeller: false,
  onSale: false,
  badge: "",
  colors: [],
  sizes: [],
  tags: [],
  hidden: false,
};

export default function ProductManager() {
  // State with pagination
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "price" | "newest">("name");
  const [editing, setEditing] = useState<Editable | null>(null);
  const [version, setVersion] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  // Get all products and categories
  const all = useMemo(() => getProducts({ includeHidden: true }), [version]);
  const categories = useMemo(() => ["all", ...listCategories()], [version]);

  // Storage listener for real-time updates
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "catalog_overrides") setVersion((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Memoized filtered & sorted products
  const filtered = useMemo(() => {
    let result = all.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q)
      );
    });

    if (sortBy === "price") result.sort((a, b) => a.price - b.price);
    if (sortBy === "newest") result.reverse();

    return result;
  }, [all, query, category, sortBy]);

  // Memoized paginated products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Memoized callbacks
  const startNew = useCallback(() => setEditing({ ...EMPTY }), []);
  
  const duplicate = useCallback((p: CatalogProduct) => {
    setEditing({ ...(p as Editable), id: "", title: `${p.title} Copy` });
  }, []);

  const persist = useCallback(() => {
    if (!editing) return;
    const id = editing.id?.trim() || slugifyId(editing.title);
    if (!editing.title.trim()) return alert("Title is required");
    if (!editing.image.trim()) return alert("Main image URL is required");
    if (!editing.price || editing.price < 0) return alert("Price must be >= 0");
    
    const toSave: Editable = {
      ...editing,
      id,
      images: normalizeList(editing.images),
      colors: normalizeList(editing.colors),
      tags: normalizeList(editing.tags),
      sizes: normalizeList(editing.sizes) as any,
    };
    upsertProduct(toSave);
    setVersion((v) => v + 1);
    setEditing(null);
  }, [editing]);

  const remove = useCallback((id: string) => {
    if (confirm("Really delete?")) {
      deleteProduct(id);
      setVersion((v) => v + 1);
    }
  }, []);

  const toggleVisibility = useCallback((id: string, hidden: boolean) => {
    setHidden(id, !hidden);
    setVersion((v) => v + 1);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === paginatedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  }, [paginatedProducts, selectedIds.size]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">📦 Products</h2>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 hover:shadow-lg active:scale-95 whitespace-nowrap"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Controls Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            placeholder="Search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="h-10 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="h-10 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white cursor-pointer"
        >
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
          <option value="newest">Sort by Newest</option>
        </select>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              exportOverrides();
              exportInventory();
            }}
            className="flex-1 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 text-sm font-medium"
            title="Export"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json";
              input.onchange = async (e: any) => {
                const file = e.target.files[0];
                const text = await file.text();
                importOverrides(text);
                setVersion((v) => v + 1);
              };
              input.click();
            }}
            className="flex-1 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 text-sm font-medium"
            title="Import"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Import</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
        <div>
          <p className="text-xs font-semibold text-primary/80">Total</p>
          <p className="text-lg font-bold text-primary">{filtered.length}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-primary/80">Selected</p>
          <p className="text-lg font-bold text-primary">{selectedIds.size}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-primary/80">Page</p>
          <p className="text-lg font-bold text-primary">
            {currentPage}/{totalPages}
          </p>
        </div>
      </div>

      {/* Products Grid - Fully Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max">
        {paginatedProducts.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
          >
            {/* Checkbox & Image */}
            <div className="relative w-full h-40 bg-gray-100">
              {/* Checkbox */}
              <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.id)}
                  onChange={() => toggleSelect(p.id)}
                  className="w-5 h-5 rounded cursor-pointer accent-primary"
                />
              </div>

              {/* Image with lazy loading */}
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />

              {/* Badges */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {p.onSale && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                    SALE
                  </span>
                )}
                {p.isNew && (
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                    NEW
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
              <h3 className="font-semibold text-gray-900 truncate text-sm line-clamp-2">
                {p.title}
              </h3>
              <p className="text-primary font-bold">{formatCurrency(p.price)}</p>
              <p className="text-xs text-gray-600">
                Stock: <span className="font-semibold">{getStock(p.id)}</span>
              </p>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                <button
                  onClick={() => setEditing(p as Editable)}
                  className="h-8 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded transition-all duration-200 active:scale-95 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => duplicate(p)}
                  className="h-8 text-xs border border-gray-300 hover:bg-gray-50 rounded transition-all duration-200 active:scale-95 flex items-center justify-center"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="h-8 text-xs border border-red-300 text-red-600 hover:bg-red-50 rounded transition-all duration-200 active:scale-95 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200 font-medium text-sm"
          >
            Previous
          </button>

          <div className="flex gap-1 flex-wrap justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg transition-all duration-200 font-medium ${
                  currentPage === page
                    ? "bg-primary text-white shadow-lg"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200 font-medium text-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editing.id ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    placeholder="Product title"
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    value={editing.price}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Category
                  </label>
                  <select
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white"
                  >
                    {listCategories().map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={getStock(editing.id)}
                    onChange={(e) => setStock(editing.id, Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Image URL *
                </label>
                <input
                  type="text"
                  value={editing.image}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Description
                </label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  placeholder="Product description..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.isNew}
                    onChange={(e) => setEditing({ ...editing, isNew: e.target.checked })}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm font-medium">New</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.isBestSeller}
                    onChange={(e) => setEditing({ ...editing, isBestSeller: e.target.checked })}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm font-medium">Best Seller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.onSale}
                    onChange={(e) => setEditing({ ...editing, onSale: e.target.checked })}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm font-medium">On Sale</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                <button
                  onClick={persist}
                  className="flex-1 h-12 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all duration-200 active:scale-95 hover:shadow-lg"
                >
                  Save Product
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 h-12 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function normalizeList(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input))
    return input.map((s) => String(s).trim()).filter(Boolean);
  if (typeof input === "string")
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}
