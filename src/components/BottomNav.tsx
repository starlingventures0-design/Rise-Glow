import { NavLink } from "react-router-dom";

const items = [
  { to: "/home", label: "الرئيسية", icon: "🏠" },
  { to: "/community", label: "المجتمع", icon: "💬" },
  { to: "/messages", label: "الرسائل", icon: "💌" },
  { to: "/leaderboard", label: "الترتيب", icon: "🏆" },
  { to: "/profile", label: "حسابي", icon: "👤" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-rose-100 flex justify-around py-2 z-30">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
              isActive ? "text-violet-600 font-semibold" : "text-gray-400"
            }`
          }
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
