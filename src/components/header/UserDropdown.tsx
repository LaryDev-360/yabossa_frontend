import { useState } from "react";
import { useNavigate } from "react-router";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useAuth } from "../../auth/AuthContext";

function roleLabel(role: string): string {
  if (role === "MERCHANT") return "Merchant";
  if (role === "CASHIER") return "Cashier";
  if (role === "ADMIN") return "Admin";
  return role;
}

export default function UserDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function handleSignOut() {
    closeDropdown();
    await logout();
    navigate("/signin", { replace: true });
  }

  const displayName = user?.full_name ?? "User";
  const displayEmail = user?.email ?? "";
  const subtitle = user ? roleLabel(user.role) : "";

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <span className="flex items-center justify-center mr-3 overflow-hidden rounded-full h-11 w-11 bg-brand-500 text-white font-medium">
          {displayName.charAt(0).toUpperCase()}
        </span>

        <span className="block mr-1 font-medium text-theme-sm">{displayName.split(" ")[0]}</span>
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {displayName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {displayEmail}
          </span>
          {subtitle && (
            <span className="mt-0.5 block text-theme-xs text-brand-500 dark:text-brand-400">
              {subtitle}
            </span>
          )}
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Edit profile
            </DropdownItem>
          </li>
        </ul>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 w-full text-left"
        >
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}
