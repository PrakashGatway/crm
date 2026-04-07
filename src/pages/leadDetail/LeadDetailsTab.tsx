import { Calendar, Edit2 } from "lucide-react";

import { useState } from "react";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import { Separator } from "@radix-ui/react-select";

interface LeadDetailsTabProps {
  lead: Record<string, any>;
}

const fieldGroups = [
  { label: "Full Name", key: "fullName" },
  { label: "Email", key: "email" },
  { label: "Phone", key: "phone" },
  { label: "Company", key: "company" },
  { label: "Designation", key: "designation" },
  { label: "Location", key: "location" },
  { label: "Source", key: "source" },
  { label: "Industry", key: "industry" },
  { label: "Website", key: "website" },
  { label: "Inquiry Type", key: "inquiryType" },
];

const formatDate = (ts: string) => {
  if (!ts) return "N/A";
  return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const LeadDetailsTab = ({ lead }: LeadDetailsTabProps) => {
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">Lead Information</h3>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(!editing)}>
            <Edit2 className="h-3.5 w-3.5" /> {editing ? "Done" : "Edit"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {fieldGroups.map(({ label, key }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
              {editing ? (
                <Input defaultValue={lead[key] || ""} className="h-9 text-sm" />
              ) : (
                <p className="text-sm text-foreground">{lead[key] || "—"}</p>
              )}
            </div>
          ))}
        </div>

        <Separator className="my-5" />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created Date</label>
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {formatDate(lead.createdAt)}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Modified</label>
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {formatDate(lead.modifiedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailsTab;
