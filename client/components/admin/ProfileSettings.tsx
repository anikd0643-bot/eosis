import { useState } from "react";
import { useAuth, type User } from "@/store/auth";
import { useNavigate } from "react-router-dom";
import { Camera, Mail, Phone, MapPin, Shield, Bell, LogOut, Trash2, Save, X } from "lucide-react";

export default function ProfileSettings() {
  const { user, updateUser, signOut } = useAuth();
  const nav = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    avatar: user?.avatar || "",
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`notifications_${user?.id}`) || "{}");
    } catch {
      return {};
    }
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    // Simulate saving
    await new Promise((resolve) => setTimeout(resolve, 800));

    updateUser({
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      avatar: formData.avatar,
    });

    setIsSaving(false);
    setIsEditing(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatar: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationChange = (key: string) => {
    const updated = {
      ...notifications,
      [key]: !notifications[key],
    };
    setNotifications(updated);
    localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(updated));
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you absolutely sure? This action cannot be undone.")) {
      const allUsers = JSON.parse(localStorage.getItem("all_users") || "[]");
      const filtered = allUsers.filter((u: User) => u.id !== user?.id);
      localStorage.setItem("all_users", JSON.stringify(filtered));
      signOut();
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-8 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex gap-6 items-start w-full">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white flex items-center justify-center overflow-hidden">
                {formData.avatar ? (
                  <img src={formData.avatar} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold">{formData.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 cursor-pointer hover:bg-gray-100 transition-colors">
                  <Camera size={20} className="text-primary" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold font-['Playfair Display']">{formData.name}</h1>
              <p className="text-white/80 mt-1">👤 Member since {new Date(user?.createdAt || "").toLocaleDateString()}</p>
              <div className="flex gap-4 mt-4">
                <div>
                  <p className="text-white/70 text-sm">📧 Email</p>
                  <p className="font-semibold">{formData.email}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">📱 Mobile</p>
                  <p className="font-semibold">{formData.mobile || "Not set"}</p>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors"
              >
                ✏️ Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="your@email.com"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
                className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="+88 017XXXXXXXX"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 h-12 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-8 py-6 border-b border-blue-200">
          <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <Bell size={24} />
            Notification Preferences
          </h2>
        </div>

        <div className="p-8 space-y-4">
          {[
            { key: "orders", label: "Order Updates", desc: "Get notified about order status changes" },
            { key: "promotions", label: "Promotions & Deals", desc: "Receive exclusive offers and discounts" },
            { key: "newsletter", label: "Newsletter", desc: "Weekly product recommendations" },
            { key: "reviews", label: "Review Requests", desc: "Requests to review purchased items" },
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary/30 transition-all">
              <div>
                <p className="font-semibold text-gray-900">{pref.label}</p>
                <p className="text-sm text-gray-600">{pref.desc}</p>
              </div>
              <button
                onClick={() => handleNotificationChange(pref.key)}
                className={`relative inline-flex w-14 h-8 rounded-full transition-colors ${
                  notifications[pref.key] ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block w-6 h-6 transform rounded-full bg-white transition-transform ${
                    notifications[pref.key] ? "translate-x-7" : "translate-x-1"
                  } mt-1`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-8 py-6 border-b border-purple-200">
          <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
            <Shield size={24} />
            Security & Privacy
          </h2>
        </div>

        <div className="p-8 space-y-3">
          <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center justify-between group">
            <span className="font-semibold text-gray-900">🔐 Change Password</span>
            <span className="text-gray-400 group-hover:text-gray-600">→</span>
          </button>
          <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center justify-between group">
            <span className="font-semibold text-gray-900">🔑 Two-Factor Authentication</span>
            <span className="text-gray-400 group-hover:text-gray-600">→</span>
          </button>
          <button className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center justify-between group">
            <span className="font-semibold text-gray-900">📋 Privacy Policy</span>
            <span className="text-gray-400 group-hover:text-gray-600">→</span>
          </button>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 space-y-3">
          <button
            onClick={() => {
              signOut();
              nav("/", { replace: true });
            }}
            className="w-full p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left flex items-center justify-between group"
          >
            <span className="font-semibold text-orange-700 flex items-center gap-2">
              <LogOut size={20} />
              Logout
            </span>
            <span className="text-orange-400 group-hover:text-orange-600">→</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left flex items-center justify-between group"
          >
            <span className="font-semibold text-red-700 flex items-center gap-2">
              <Trash2 size={20} />
              Delete Account
            </span>
            <span className="text-red-400 group-hover:text-red-600">→</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 border-b border-red-200">
              <h2 className="text-2xl font-bold text-red-900">⚠️ Delete Account</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                This action is permanent and cannot be undone. All your data including orders, addresses, and preferences will be deleted.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-semibold">
                  Are you sure you want to delete your account?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 h-12 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteAccount();
                    nav("/", { replace: true });
                  }}
                  className="flex-1 h-12 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
