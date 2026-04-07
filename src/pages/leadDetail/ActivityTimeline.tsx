import { useState } from "react";
import {
  Activity, Phone, Mail, MessageSquare, Video, FileUp, CheckSquare, FileText, Send, Clock, Plus
} from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Input from "../../components/form/input/InputField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";

export interface ActivityItem {
  _id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  addedBy?: { name: string; avatar?: string };
  score?: string;
  duration?: string;
  status?: string;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  onAddActivity: (activity: { type: string; description: string; priority: string }) => void;
  onSelectActivity: (activity: ActivityItem) => void;
}

const activityIcons: Record<string, React.ElementType> = {
  form_submission: FileUp,
  inbound: MessageSquare,
  outreach: Send,
  call: Phone,
  whatsapp: MessageSquare,
  email: Mail,
  meeting: Video,
  task: CheckSquare,
  note: FileText,
};

const activityColors: Record<string, string> = {
  form_submission: "bg-info/10 text-info",
  inbound: "bg-success/10 text-success",
  outreach: "bg-primary/10 text-primary",
  call: "bg-primary/10 text-primary",
  whatsapp: "bg-success/10 text-success",
  email: "bg-destructive/10 text-destructive",
  meeting: "bg-warning/10 text-warning",
  note: "bg-muted text-muted-foreground",
};

const formatTime = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " • " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const ActivityTimeline = ({ activities, onAddActivity, onSelectActivity }: ActivityTimelineProps) => {
  const [newActivity, setNewActivity] = useState({ type: "note", description: "", priority: "medium" });

  const handleSubmit = () => {
    if (!newActivity.description.trim()) return;
    onAddActivity(newActivity);
    setNewActivity({ type: "note", description: "", priority: "medium" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Add Activity */}
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <Input
              placeholder="Add a note or activity..."
              value={newActivity.description}
              onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Select value={newActivity.type} onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newActivity.priority} onValueChange={(v) => setNewActivity({ ...newActivity, priority: v })}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={handleSubmit} className="gap-1.5">
                <Send className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-1">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.type] || Activity;
            const colorClass = activityColors[activity.type] || "bg-muted text-muted-foreground";

            return (
              <div
                key={activity._id}
                className="relative flex gap-4 p-3 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                onClick={() => onSelectActivity(activity)}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Icon */}
                <div className={`relative z-10 h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground leading-snug">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{formatTime(activity.timestamp)}</span>
                        {activity.addedBy && (
                          <>
                            <span>•</span>
                            <span>{activity.addedBy.name}</span>
                          </>
                        )}
                        {activity.duration && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {activity.duration}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {activity.score && (
                      <Badge variant="secondary" className="bg-success/10 text-success border-0 shrink-0 text-xs">
                        {activity.score}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActivityTimeline;
