import { useState, useMemo } from "react";
import { useAuth } from "@/store/auth";
import { getOrders, saveOrders, type Order } from "@/lib/orders";
import { Link, Navigate } from "react-router-dom";
import { formatCurrency } from "@/lib/money";
import { Heart, MapPin, Trash2, Eye, X, Download, RotateCw, Package, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
}

interface WishlistItem {
  productId: string;
  productName: string;
  price: number;
  addedAt: string;
}

interface ProductReview {
  orderId: string;
  productName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function UserDashboard() {
  const { role, user } = useAuth();
  if (role === "guest") return <Navigate to="/login" replace />;

  const orders = getOrders();
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "wishlist" | "addresses" | "reviews" | "profile">("overview");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`wishlist_${user?.id}`) || "[]");
    } catch {
      return [];
    }
  });
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`addresses_${user?.id}`) || "[]");
    } catch {
      return [];
    }
  });
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`reviews_${user?.id}`) || "[]");
    } catch {
      return [];
    }
  });

  // Stats
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + o.totals.total, 0);
    const pendingOrders = orders.filter((o) => ["placed", "processing"].includes(o.status)).length;
    const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
    return { totalOrders, totalSpent, pendingOrders, deliveredOrders };
  }, [orders]);

  const cancel = (id: string) => {
    const list = getOrders();
    const idx = list.findIndex((o) => o.id === id);
    if (idx >= 0 && ["placed", "processing"].includes(list[idx].status)) {
      list[idx].status = "cancelled";
      saveOrders(list);
      setSelectedOrder(null);
      location.reload();
    } else {
      alert("Order can no longer be cancelled.");
    }
  };

  const saveWishlist = (items: WishlistItem[]) => {
    setWishlist(items);
    localStorage.setItem(`wishlist_${user?.id}`, JSON.stringify(items));
  };

  const saveAddresses = (items: SavedAddress[]) => {
    setAddresses(items);
    localStorage.setItem(`addresses_${user?.id}`, JSON.stringify(items));
  };

  const saveReviews = (items: ProductReview[]) => {
    setReviews(items);
    localStorage.setItem(`reviews_${user?.id}`, JSON.stringify(items));
  };

  const removeWishlistItem = (productId: string) => {
    saveWishlist(wishlist.filter((w) => w.productId !== productId));
  };

  const removeAddress = (id: string) => {
    saveAddresses(addresses.filter((a) => a.id !== id));
  };

  const removeReview = (createdAt: string) => {
    saveReviews(reviews.filter((r) => r.createdAt !== createdAt));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      placed: "bg-blue-100 text-blue-800",
      processing: "bg-amber-100 text-amber-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      placed: "📦",
      processing: "⚙️",
      shipped: "🚚",
      delivered: "✓",
      cancelled: "✕",
    };
    return icons[status] || "•";
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-['Playfair Display'] text-4xl font-extrabold">
            Welcome, {user?.name || "Customer"}! 👋
          </h1>
          <p className="text-primary/90 mt-2">Manage your orders, addresses, and more</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Stats Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Orders */}
            <div className="rounded-2xl bg-white shadow-sm border border-primary/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-primary mt-2">{stats.totalOrders}</p>
                </div>
                <Package className="w-12 h-12 text-primary/20" />
              </div>
            </div>

            {/* Total Spent */}
            <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">{formatCurrency(stats.totalSpent)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-amber-100" />
              </div>
            </div>

            {/* Pending Orders */}
            <div className="rounded-2xl bg-white shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.pendingOrders}</p>
                </div>
                <Clock className="w-12 h-12 text-blue-100" />
              </div>
            </div>

            {/* Delivered Orders */}
            <div className="rounded-2xl bg-white shadow-sm border border-green-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivered Orders</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.deliveredOrders}</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-100" />
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1 flex gap-2 overflow-x-auto">
          {(["overview", "orders", "wishlist", "addresses", "reviews", "profile"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab === "overview" && "📊 Overview"}
              {tab === "orders" && "📦 Orders"}
              {tab === "wishlist" && `❤️ Wishlist (${wishlist.length})`}
              {tab === "addresses" && "📍 Addresses"}
              {tab === "reviews" && "⭐ Reviews"}
              {tab === "profile" && "👤 Profile"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Your Orders</h2>
              {orders.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No orders yet.</p>
                  <Link
                    to="/shop"
                    className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">Order #{o.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(o.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(o.status)}`}>
                          {getStatusIcon(o.status)} {o.status}
                        </div>
                        <div className="font-bold text-primary">{formatCurrency(o.totals.total)}</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                            title="View details"
                          >
                            <Eye size={18} />
                          </button>
                          {["placed", "processing"].includes(o.status) && (
                            <button
                              onClick={() => cancel(o.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                              title="Cancel order"
                            >
                              <X size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === "wishlist" && (
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Your Wishlist</h2>
              {wishlist.length === 0 ? (
                <div className="py-12 text-center">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No items in your wishlist.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {wishlist.map((item) => (
                    <div
                      key={item.productId}
                      className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600 mt-1">{formatCurrency(item.price)}</p>
                        <p className="text-xs text-gray-500 mt-2">Added: {new Date(item.addedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/product/${item.productId}`}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => removeWishlistItem(item.productId)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Saved Addresses</h2>
                <button
                  onClick={() => {
                    const address = prompt("Enter address:");
                    if (address) {
                      const city = prompt("Enter city:");
                      const zipCode = prompt("Enter zip code:");
                      const phone = prompt("Enter phone number:");
                      const label = prompt("Label (e.g., Home, Office):");
                      if (city && zipCode && phone && label) {
                        saveAddresses([
                          ...addresses,
                          {
                            id: Date.now().toString(),
                            address,
                            city,
                            zipCode,
                            phone,
                            label,
                            isDefault: addresses.length === 0,
                          },
                        ]);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  + Add Address
                </button>
              </div>
              {addresses.length === 0 ? (
                <div className="py-12 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No saved addresses.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`border rounded-xl p-4 ${addr.isDefault ? "border-primary bg-primary/5" : "border-gray-200"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{addr.label}</p>
                            {addr.isDefault && (
                              <span className="text-xs bg-primary text-white px-2 py-1 rounded">Default</span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mt-2">{addr.address}</p>
                          <p className="text-gray-600 text-sm">{addr.city}, {addr.zipCode}</p>
                          <p className="text-gray-600 text-sm">📞 {addr.phone}</p>
                        </div>
                        <button
                          onClick={() => removeAddress(addr.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">My Reviews</h2>
                <button
                  onClick={() => {
                    const productName = prompt("Product name:");
                    const ratingStr = prompt("Rating (1-5):");
                    const comment = prompt("Your comment:");
                    const rating = parseInt(ratingStr || "5");
                    if (productName && comment && rating >= 1 && rating <= 5) {
                      saveReviews([
                        ...reviews,
                        {
                          productName,
                          rating,
                          comment,
                          orderId: "",
                          createdAt: new Date().toISOString(),
                        },
                      ]);
                    }
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  + Add Review
                </button>
              </div>
              {reviews.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-4xl mb-4">⭐</div>
                  <p className="text-gray-600">No reviews yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div
                      key={review.createdAt}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{review.productName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < review.rating ? "text-amber-400" : "text-gray-300"}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">({review.rating}/5)</span>
                          </div>
                          <p className="text-gray-700 mt-2">{review.comment}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeReview(review.createdAt)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 border border-gray-200 rounded-xl">
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{user?.name || "N/A"}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{user?.email || "N/A"}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl">
                  <p className="text-sm text-gray-600">Account Type</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">Customer</p>
                </div>
                <button className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium">
                  Edit Profile
                </button>
                <button className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Change Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-600 mt-1">Order ID: {selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-2 hover:bg-primary/10 transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status & Verification */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-600 uppercase">Status</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-2xl">{getStatusIcon(selectedOrder.status)}</span>
                    <span className="text-lg font-bold text-blue-900 capitalize">{selectedOrder.status}</span>
                  </div>
                </div>
                <div className={`rounded-xl p-4 ${selectedOrder.paymentVerified ? "bg-green-50" : "bg-amber-50"}`}>
                  <p className="text-xs font-semibold uppercase" style={{ color: selectedOrder.paymentVerified ? "#0b5345" : "#92400e" }}>
                    {selectedOrder.paymentVerified ? "✓ Verified" : "⏳ Pending"}
                  </p>
                  <p className="text-lg font-bold mt-2" style={{ color: selectedOrder.paymentVerified ? "#0b5345" : "#92400e" }}>
                    Payment {selectedOrder.paymentVerified ? "Verified" : "Verification"}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between rounded-lg border border-primary/10 bg-gray-50 p-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.product.title}</p>
                        {item.size && <p className="text-sm text-gray-600 mt-1">Size: <span className="font-medium">{item.size}</span></p>}
                        <p className="text-sm text-gray-600">Quantity: <span className="font-medium">{item.qty}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatCurrency((selectedOrder.totals.subtotal / selectedOrder.items.length) * item.qty)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="rounded-xl border border-primary/10 bg-gray-50 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(selectedOrder.totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Shipping:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(selectedOrder.totals.shipping)}</span>
                </div>
                <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(selectedOrder.totals.total)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Details</h3>
                <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Method:</span>
                    <span className="font-semibold text-gray-900 capitalize">{selectedOrder.payment.method}</span>
                  </div>
                  {selectedOrder.payment.mobile && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Mobile:</span>
                      <span className="font-semibold text-gray-900">{selectedOrder.payment.mobile}</span>
                    </div>
                  )}
                  {selectedOrder.payment.transactionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Transaction ID:</span>
                      <span className="font-semibold text-gray-900">{selectedOrder.payment.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Date */}
              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-xs font-semibold text-primary uppercase">Order Date</p>
                <p className="mt-2 text-lg font-bold text-gray-900">
                  {new Date(selectedOrder.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>

              {/* Close Button */}
              <div className="pt-4 flex gap-2">
                {["placed", "processing"].includes(selectedOrder.status) && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to cancel this order?")) {
                        cancel(selectedOrder.id);
                      }
                    }}
                    className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-all hover:bg-red-700 hover:shadow-lg"
                  >
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className={`${["placed", "processing"].includes(selectedOrder.status) ? "flex-1" : "w-full"} rounded-lg bg-gradient-to-r from-primary to-primary/80 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
