import { Phone, Mail, MapPin, Building, Calendar, User } from "lucide-react";
import Badge from "../../components/ui/badge/Badge";
import { Separator } from "@radix-ui/react-select";
import Button from "../../components/ui/button/Button";

interface LeadData {
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  countryOfResidence?: string;
  inquiryType?: string;
  status: string;
  leadScore: number;
  createdAt: string;
  assignedCounselor?: { name: string; email: string };
  extraDetails?: Record<string, string>;
}

interface LeadSidebarProps {
  lead: LeadData;
}

const statusColors: Record<string, string> = {
  Disengaged: "bg-destructive/10 text-destructive border-destructive/20",
  Active: "bg-success/10 text-success border-success/20",
  Engaged: "bg-info/10 text-info border-info/20",
  New: "bg-warning/10 text-warning border-warning/20",
};

const LeadSidebar = ({ lead }: LeadSidebarProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 400) return "text-success";
    if (score >= 200) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="w-80 shrink-0 space-y-4">
      {/* Profile Card */}
      <div className="rounded-xl bg-card border border-border p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead Detail</span>
          <Badge className={statusColors[lead.status] || "bg-muted text-muted-foreground"}>
            {lead.status}
          </Badge>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{lead.fullName || "Unknown"}</h2>
            <p className="text-sm text-muted-foreground">{lead.email}</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 mb-4">
          <span className="text-sm text-muted-foreground">Lead Score</span>
          <span className={`text-xl font-bold ${getScoreColor(lead.leadScore)}`}>{lead.leadScore}</span>
        </div>

        <Separator className="my-4" />

        {/* Contact Info */}
        <div className="space-y-3">
          <ContactRow icon={<Phone className="h-4 w-4" />} value={lead.phone} />
          <ContactRow icon={<Mail className="h-4 w-4" />} value={lead.email} />
          <ContactRow icon={<MapPin className="h-4 w-4" />} value={`${lead.city || ""} ${lead.countryOfResidence || ""}`} />
          <ContactRow icon={<Building className="h-4 w-4" />} value={lead.inquiryType || "N/A"} />
        </div>

        {lead.assignedCounselor && (
          <>
            <Separator className="my-4" />
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead Owner</span>
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-foreground">{lead.assignedCounselor.name}</p>
                <p className="text-xs text-muted-foreground">{lead.assignedCounselor.email}</p>
              </div>
            </div>
          </>
        )}

        {lead.extraDetails && Object.keys(lead.extraDetails).length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Extra Details</span>
              <div className="mt-2 space-y-2">
                {Object.entries(lead.extraDetails).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{key}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Phone className="h-3.5 w-3.5" /> Call
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Mail className="h-3.5 w-3.5" /> Email
          </Button>
        </div>
      </div>
    </div>
  );
};

const ContactRow = ({ icon, value }: { icon: React.ReactNode; value: string }) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-foreground truncate">{value}</span>
  </div>
);

export default LeadSidebar;
