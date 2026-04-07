import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Clock, User, FileText, Save } from "lucide-react";
import { useState, useEffect } from "react";
import type { ActivityItem } from "./ActivityTimeline";

interface ActivityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ActivityItem | null;
  onSave: (updated: ActivityItem) => void;
}

const formatTime = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const ActivityDrawer = ({ open, onOpenChange, activity, onSave }: ActivityDrawerProps) => {
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("completed");

  useEffect(() => {
    if (activity) {
      setEditTitle(activity.title);
      setEditDescription(activity.description || "");
      setEditStatus(activity.status || "completed");
    }
  }, [activity]);

  if (!activity) return null;

  const handleSave = () => {
    onSave({ ...activity, title: editTitle, description: editDescription, status: editStatus });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">Activity Details</SheetTitle>
          <SheetDescription>View and update this activity</SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          {/* Type badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">{activity.type.replace("_", " ")}</Badge>
            {activity.score && (
              <Badge className="bg-success/10 text-success border-0">{activity.score}</Badge>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</label>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add details..."
              rows={4}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Meta info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTime(activity.timestamp)}</span>
            </div>
            {activity.addedBy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Added by {activity.addedBy.name}</span>
              </div>
            )}
            {activity.duration && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Duration: {activity.duration}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ActivityDrawer;
