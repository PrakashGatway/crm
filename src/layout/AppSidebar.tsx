import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/UserContext";
import {
  LayoutDashboard,
  FileText,
  Users,
  Rocket,
  User,
  ChevronDown,
  Shield,
  Settings,
  MailIcon,
  MessageCircleMore
} from "lucide-react";

const getIcon = (name: string, size = 22) => {
  const props = { size:24, color:"#5e2525", strokeWidth: 1.5 };
  switch (name) {
    case "Dashboard": return <LayoutDashboard {...props} />;
    case "Daily Reports":
    case "Call Reports": return <FileText {...props} />;
    case "Users": return <Users {...props} />;
    case "Leads": return <Rocket {...props} />;
    case "Teams": return <Users {...props} />;
    case "Emails Broadcast": return <MailIcon {...props} />;
    case "Assign Rules": return <Shield {...props} />;
    case "My Profile":
    case "Profile": return <User {...props} />;
    case "Whatsapp": return <MessageCircleMore {...props} />;
    case "Setting": return <Settings {...props} />;
    default: return <LayoutDashboard {...props} />;
  }
};

type NavItem = {
  name: string;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/" },
  { name: "Daily Reports", path: "/lead-report" },
  { name: "Users", path: "/users" },
  { name: "Leads", path: "/leads" },
  { name: "Emails", path: "/broadcast" },
  { name: "Assign Rules", path: "/rules" },
  { name: "Whatsapp", path: "/whatsapp" },
  { name: "Setting", path: "/setting" }
];

const navItemsUser: NavItem[] = [{ name: "Dashboard", path: "/" }];

const navItemsCoun: NavItem[] = [{ name: "Dashboard", path: "/" },
{ name: "Leads", path: "/leads" },];
const navItemsMan: NavItem[] = [
  { name: "Dashboard", path: "/" },
  { name: "Call Reports", path: "/lead-report" },
  { name: "Leads", path: "/leads" },
];
const navItemsTeacher: NavItem[] = [{ name: "Dashboard", path: "/" }];

const othersItems: NavItem[] = [{ name: "My Profile", path: "/profile" }];
const teacherOthersItems: NavItem[] = [{ name: "Profile", path: "/profile" }];

const AppSidebar: React.FC = () => {
  const { isMobileOpen } = useSidebar();
  const location = useLocation();
  const { user } = useAuth() as any;

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main"
        ? (user?.role === "admin" ? navItems : user?.role === "teacher" ? navItemsTeacher : user?.role === "counselor" ? navItemsCoun : user?.role === "manager" || user?.role === "leader" ? navItemsMan : navItemsUser)
        : (user?.role === "teacher" || user?.role === "counselor" || user?.role === "manager" || user?.role === "leader" ? teacherOthersItems : othersItems);

      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType as "main" | "others", index });
              submenuMatched = true;
            }
          });
        }
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive, user?.role]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const el = subMenuRefs.current[key];
      if (el) {
        setSubMenuHeight(prev => ({ ...prev, [key]: el.scrollHeight }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu(prev =>
      prev?.type === menuType && prev.index === index ? null : { type: menuType, index }
    );
  };

  const getMenuItems = (menuType: "main" | "others") => {
    if (menuType === "main") {
      if (user?.role === "admin") return navItems;
      if (user?.role === "counselor") return navItemsCoun;
      if (user?.role === "manager" || user?.role === "leader") return navItemsMan;
      if (user?.role === "teacher") return navItemsTeacher;
      return navItemsUser;
    } else {
      if (user?.role === "teacher" || user?.role === "counselor" || user?.role === "manager" || user?.role === "leader") return teacherOthersItems;
      return othersItems;
    }
  }


  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-0.5">
      {items.map((nav, index) => {
        const isSubmenuOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
        const hasActiveSubItem = nav.subItems?.some(subItem => isActive(subItem.path));
        const isActiveItem = nav.path ? isActive(nav.path) : false;
        const isActiveState = isActiveItem || isSubmenuOpen || hasActiveSubItem;

        return (
          <li key={nav.name} className="relative">
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`w-full flex flex-col items-center justify-center gap-0 py-1 px-2 rounded-xl transition-all duration-300
                  ${isActiveState
                    ? "bg-yellow-50 dark:bg-yellow-900/10 text-black dark:text-yellow-300"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
              >
                <div className={`${isActiveState ? "text-gray-900" : ""}`}>
                  {getIcon(nav.name)}
                </div>
                <span className={`text-[12px] font-medium text-center leading-tight ${isActiveState ? "font-bold text-gray-900 dark:text-white" : ""}`}>
                  {nav.name}
                </span>
                {isActiveState && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-red-500" />
                )}
              </button>
            ) : nav.path ? (
              <Link
                to={nav.path}
                className={`w-full flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-2xl transition-all duration-300
                  ${isActiveState
                    ? "bg-yellow-50 dark:bg-yellow-900/10 text-black dark:text-yellow-300"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
              >
                <div className={`${isActiveState ? "text-red-500" : ""}`}>
                  {getIcon(nav.name)}
                </div>
                <span className={`text-[11px] font-medium flex text-center font-bold ${isActiveState ? " text-gray-900 dark:text-white" : ""}`}>
                  {nav.name}
                </span>
                {isActiveState && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-red-500" />
                )}
              </Link>
            ) : null}

            {nav.subItems && (
              <div
                ref={(el) => { subMenuRefs.current[`${menuType}-${index}`] = el; }}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  height: isSubmenuOpen ? `${subMenuHeight[`${menuType}-${index}`] || 0}px` : "0px",
                  opacity: isSubmenuOpen ? 1 : 0,
                }}
              >
                <ul className="py-2 space-y-1">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`block px-3 py-2 rounded-lg text-xs transition-colors
                          ${isActive(subItem.path)
                            ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 font-medium"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          }`}
                      >
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed lg:mt-0 top-0 left-0 bg-gray-200 min-w-[90px] max-w-[92px] dark:bg-gray-900 h-screen transition-all duration-300 z-50 border-r border-gray-200 dark:border-gray-800
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 `}
    >
      {/* Logo */}
      <div className="py-4 flex justify-center items-center border-b border-gray-100 dark:border-gray-800">
        <Link to="/" className="flex flex-col items-center">
          <img
            src="https://www.gatewayabroadeducations.com/favicon.ico"
            alt="Logo"
            width={50}
            height={30}
            className="object-contain scale-120 shadow-lg rounded-full border-4 border-gray-200 dark:border-gray-700"
          />
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-col flex-1 overflow-y-auto max-h-[calc(100vh-8rem)] no-scrollbar py-4 px-2">
        <nav className="flex-1">
          {/* Menu Section */}
          <div className="mb-0">
            {renderMenuItems(getMenuItems("main"), "main")}
          </div>

          {/* Others Section */}
          <div>

            {renderMenuItems(getMenuItems("others"), "others")}
          </div>
        </nav>

        {/* User Profile */}
        {/* {user && (
          <div className="mt-auto absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex flex-col items-center p-2 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200/50 dark:border-yellow-800/30">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-sm mb-1"
                style={{ backgroundColor: primaryColor }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-900 dark:text-white truncate max-w-[70px]">
                  {user.name || "User"}
                </p>
                <p className="text-[8px] text-gray-500 dark:text-gray-400 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </aside>
  );
};

export default AppSidebar;