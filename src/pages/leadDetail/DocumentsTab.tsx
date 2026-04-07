import { useState } from "react";
import { FileText, Upload, Download, Trash2, File, Image, FileSpreadsheet, Eye } from "lucide-react";
import Button from "../../components/ui/button/Button";


interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

const dummyDocuments: DocumentItem[] = [
  { id: "1", name: "Proposal_v2.pdf", type: "pdf", size: "2.4 MB", uploadedBy: "Gurjan Bajaj", uploadedAt: "2026-03-17T10:00:00Z" },
  { id: "2", name: "Requirements.docx", type: "doc", size: "845 KB", uploadedBy: "Gurjan Bajaj", uploadedAt: "2026-03-16T14:30:00Z" },
  { id: "3", name: "Budget_Sheet.xlsx", type: "xlsx", size: "1.2 MB", uploadedBy: "System", uploadedAt: "2026-03-15T09:15:00Z" },
  { id: "4", name: "Logo_Design.png", type: "image", size: "3.1 MB", uploadedBy: "Gurjan Bajaj", uploadedAt: "2026-03-14T16:45:00Z" },
];

const fileIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: File,
  xlsx: FileSpreadsheet,
  image: Image,
};

const fileColors: Record<string, string> = {
  pdf: "bg-destructive/10 text-destructive",
  doc: "bg-info/10 text-info",
  xlsx: "bg-success/10 text-success",
  image: "bg-warning/10 text-warning",
};

const DocumentsTab = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>(dummyDocuments);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const newDocs = files.map((file, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: file.name,
      type: file.name.split(".").pop() || "file",
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadedBy: "You",
      uploadedAt: new Date().toISOString(),
    }));
    setDocuments([...newDocs, ...documents]);
  };

  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      const newDocs = files.map((file, i) => ({
        id: `new-${Date.now()}-${i}`,
        name: file.name,
        type: file.name.split(".").pop() || "file",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedBy: "You",
        uploadedAt: new Date().toISOString(),
      }));
      setDocuments([...newDocs, ...documents]);
    };
    input.click();
  };

  const formatDate = (ts: string) => {
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Upload Area */}
      <div
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Drop files here or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, Images up to 10MB</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleFileSelect} className="mt-2">
            Browse Files
          </Button>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">{documents.length} Documents</h3>
        </div>

        {documents.map((doc) => {
          const Icon = fileIcons[doc.type] || File;
          const color = fileColors[doc.type] || "bg-muted text-muted-foreground";

          return (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors group"
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.size} • {doc.uploadedBy} • {formatDate(doc.uploadedAt)}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentsTab;
