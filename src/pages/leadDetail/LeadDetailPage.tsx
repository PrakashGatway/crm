import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Activity, User, CheckSquare, FileText, Users, ChevronLeft, ArrowLeft
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import LeadSidebar from "./LeadSidebar";
import ActivityTimeline from "./ActivityTimeline";
// import ActivityDrawer from "./ActivityDrawer";
import DocumentsTab from "./DocumentsTab";
import TasksTab from "./TasksTab";
import LeadDetailsTab from "./LeadDetailsTab";
import type { ActivityItem } from "./ActivityTimeline";
import Button from "../../components/ui/button/Button";

// Dummy Data
const dummyLeadData = {
  _id: "123456",
  fullName: "Satyam Aggarwal",
  email: "satyam.aggarwal@example.com",
  phone: "+91-8000777013",
  company: "IgoAbroad",
  designation: "Business Development",
  location: "Rajpura, Punjab, India",
  city: "Rajpura",
  countryOfResidence: "India",
  inquiryType: "Study Abroad",
  leadScore: 445,
  status: "Disengaged",
  source: "Website",
  industry: "Education",
  website: "www.igoabroad.in",
  createdAt: "2026-03-15T10:30:00Z",
  modifiedAt: "2026-03-17T11:03:00Z",
  assignedCounselor: { name: "Gurjan Bajaj", email: "gurjan@example.com" },
  extraDetails: { preferredContact: "Email", budget: "$10,000", timeline: "Q2 2026" },
};

const dummyActivities: ActivityItem[] = [
  { _id: "act1", type: "form_submission", title: "Dynamic Form Submitted", description: "View Details", timestamp: "2026-03-17T11:03:00Z", addedBy: { name: "Gurjan Bajaj" }, score: "+10", status: "completed" },
  { _id: "act2", type: "inbound", title: "New Inbound SMB Enrich: satyam aggarwal", timestamp: "2026-03-17T11:03:00Z", duration: "703m", addedBy: { name: "Gurjan Bajaj" }, status: "completed" },
  { _id: "act3", type: "outreach", title: "SMB Outreach", description: "2 users", timestamp: "2026-03-17T11:02:00Z", addedBy: { name: "Gurjan Bajaj" } },
  { _id: "act4", type: "call", title: "Inbound Call: Had a phone call with Gurjan Bajaj", duration: "59 seconds", timestamp: "2026-03-17T10:42:00Z", addedBy: { name: "Gurjan Bajaj" }, score: "+5" },
  { _id: "act5", type: "whatsapp", title: "WhatsApp Message", description: "Which slots available", timestamp: "2026-03-17T09:00:00Z", addedBy: { name: "System" }, score: "+20" },
  { _id: "act6", type: "email", title: "Welcome email sent", description: "Automated onboarding sequence", timestamp: "2026-03-16T15:00:00Z", addedBy: { name: "System" } },
  { _id: "act7", type: "note", title: "Internal note added", description: "Lead seems interested in MBA programs", timestamp: "2026-03-16T12:00:00Z", addedBy: { name: "Gurjan Bajaj" } },
];

const dummyTasks = [
  { _id: "task1", title: "Follow up call", dueDate: "2026-03-18T14:00:00Z", priority: "High", status: "pending", assignedTo: "Gurjan Bajaj" },
  { _id: "task2", title: "Send proposal document", dueDate: "2026-03-19T10:00:00Z", priority: "Medium", status: "completed", assignedTo: "Gurjan Bajaj" },
  { _id: "task3", title: "Schedule campus tour", dueDate: "2026-03-20T09:00:00Z", priority: "Low", status: "pending", assignedTo: "Gurjan Bajaj" },
];

const tabs = [
  { id: "activity", label: "Activity", icon: Activity },
  { id: "details", label: "Details", icon: User },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "related", label: "Related", icon: Users },
];

const LeadDetailPageM = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState(dummyActivities);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleAddActivity = (newAct: { type: string; description: string; priority: string }) => {
    const activity: ActivityItem = {
      _id: `act-${Date.now()}`,
      type: newAct.type,
      title: `${newAct.type.charAt(0).toUpperCase() + newAct.type.slice(1)}: ${newAct.description}`,
      description: newAct.description,
      timestamp: new Date().toISOString(),
      addedBy: { name: "You" },
      status: "completed",
    };
    setActivities([activity, ...activities]);
  };

  const handleSelectActivity = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setDrawerOpen(true);
  };

  const handleSaveActivity = (updated: ActivityItem) => {
    setActivities(activities.map(a => a._id === updated._id ? updated : a));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{dummyLeadData.fullName}</h1>
            <p className="text-xs text-muted-foreground">{dummyLeadData.email}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex gap-6">
          <LeadSidebar lead={dummyLeadData} />

          {/* Main */}
          <div className="flex-1 min-w-0">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="w-full justify-start bg-card border border-border rounded-xl p-1 h-auto flex-wrap">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 text-sm"
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <div className="mt-5">
                <TabsContent value="activity">
                  <ActivityTimeline
                    activities={activities}
                    onAddActivity={handleAddActivity}
                    onSelectActivity={handleSelectActivity}
                  />
                </TabsContent>

                <TabsContent value="details">
                  <LeadDetailsTab lead={dummyLeadData} />
                </TabsContent>

                <TabsContent value="tasks">
                  <TasksTab tasks={dummyTasks} />
                </TabsContent>

                <TabsContent value="documents">
                  <DocumentsTab />
                </TabsContent>

                <TabsContent value="related">
                  <div className="rounded-xl bg-card border border-border p-12 text-center animate-fade-in">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-foreground">No Related Leads</p>
                    <p className="text-xs text-muted-foreground mt-1">Related leads will appear here when linked.</p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Activity Drawer */}
      {/* <ActivityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        activity={selectedActivity}
        onSave={handleSaveActivity}
      /> */}
    </div>
  );
};

export default LeadDetailPageM;
