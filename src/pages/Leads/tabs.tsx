import { motion, LayoutGroup } from "framer-motion";
import { File, LucideIcon } from "lucide-react";
import { LeadStatus } from "./LeadManagement";

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: any) {
  return (
    <nav className={className}>
      <LayoutGroup>
        <div className="flex flex-wrap gap-1 my-2 bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-3 p-1.5">
          {tabs.map((tab) => {
            const isActive =
              tab.status === "all"
                ? activeTab === ""
                : activeTab === tab.status;

            return (
              <motion.button
                key={tab.status}
                layout
                onClick={() => onChange(tab.status == "all" ? "" : tab.status)}
                className={`relative py-1.5 px-3 font-medium text-[15px] flex capitalize items-center rounded-lg transition-all duration-200
                  ${isActive
                    ? "bg-green-600 shadow-md dark:bg-gray-900 text-white dark:text-white-400"
                    : "text-gray-800 bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tabBackground"
                    className="absolute inset-0 bg-green-600 dark:bg-gray-900 rounded-lg shadow-sm -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* {Icon && <File className="h-4 w-4 mr-2" />} */}
                {LeadStatus[tab.status] ? LeadStatus[tab.status] : tab.status} ({tab.count})
              </motion.button>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}
