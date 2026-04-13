import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <span
        className="text-xl font-bold text-indigo-600 cursor-pointer"
        onClick={() => navigate("/projects")}
      >
        TaskFlow
      </span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">👤 {user?.name}</span>
        <button
          onClick={handleLogout}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}