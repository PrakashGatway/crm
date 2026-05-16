import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtomIcon, FileSpreadsheet, GroupIcon, ListIcon, SettingsIcon } from 'lucide-react';
import WhatsAppTemplateEditor from '../Setting/whatsappTemplate';
import WhatsAppTemplateList from './Templates';
import WhatsAppBroadcast from './whatsappBroadcast';
import AutomationList from '../Automation/Pipeline';

type TabType = 'statuses' | 'leads' | 'emailEditor' | 'settings';

export default function WhatsappPage() {
    const [activeTab, setActiveTab] = useState<TabType>('broadcast');

    const getTabLabel = (tab: TabType) => {
        const labels: Record<TabType, string> = {
            statuses: 'Statuses',
            leads: 'Leads',
            teams: 'Teams',
            broadcast: 'Broadcast',
            settings: 'Settings',
            emailEditor: 'Email Templates',
            whatsapp: 'Create Template',
            templates: 'Templates',
            automations: 'Automation'
        };
        return labels[tab];
    };

    const getTabIcon = (tab: TabType) => {
        const icons = {
            teams: <GroupIcon fontSize="small" />,
            templates: <ListIcon fontSize="small" />,
            settings: <SettingsIcon fontSize="small" />,
            emailEditor: <SettingsIcon fontSize="small" />,
            whatsapp: <SettingsIcon fontSize="small" />,
            broadcast: <FileSpreadsheet fontSize="small" />,
            automations: <AtomIcon fontSize="small" />
        };
        return icons[tab];
    };

    return (
        <div className="p-4 mx-auto">
            {/* ─── Animated Tabs with Framer Motion ─── */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-2 mb-6">
                <div className="relative flex gap-1">
                    {(["broadcast", "whatsapp", "templates","automations"] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${activeTab === tab
                                ? 'text-white'
                                : 'text-white/50 hover:text-white'
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white/30 rounded-xl"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}

                            <span className="relative z-10 flex items-center gap-1">
                                {getTabIcon(tab)}
                                {getTabLabel(tab)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Tab Content with AnimatePresence ─── */}
            <AnimatePresence mode="wait">
                {activeTab === 'broadcast' && (
                    <WhatsAppBroadcast />
                )}
                {activeTab === 'whatsapp' && (
                    <WhatsAppTemplateEditor />
                )}
                {activeTab === 'templates' && (
                    <WhatsAppTemplateList />
                )}

                {activeTab == "automations" && <AutomationList />}

            </AnimatePresence>
        </div>
    );
}