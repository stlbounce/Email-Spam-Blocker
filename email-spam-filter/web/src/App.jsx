import { Outlet } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";

function TopNav() {
  const { pathname } = useLocation();
  const isLive = pathname.startsWith("/live");
  return (
    <div className="fixed top-3 right-3 z-50 flex gap-2">
      <Link
        to="/"
        className={`px-3 py-1 rounded ${!isLive ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
      >
        Classifier
      </Link>
      <Link
        to="/live"
        className={`px-3 py-1 rounded ${isLive ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
      >
        Live
      </Link>
    </div>
  );
}


export default function App() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
