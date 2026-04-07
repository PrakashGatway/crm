import React, { useState, useRef, useEffect } from 'react';
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  IconButton,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Preview as PreviewIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../axiosInstance';

export interface EmailTemplate {
  _id?: string;
  name: string;
  subject: string;
  content: any; // Unlayer design JSON
  html?: string;
  isActive: boolean;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmailTemplateEditorProps {
  open: boolean;
  onClose: () => void;
  template?: EmailTemplate | null;
  onSave: () => void;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  open,
  onClose,
  template,
  onSave,
}) => {
  const emailEditorRef = useRef<EditorRef>(null);
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setSubject(template.subject);
      setCategory(template.category || '');
      setIsActive(template.isActive);
      
      // Load template design when editor is ready
      if (emailEditorRef.current && template.content) {
        emailEditorRef.current.editor?.loadDesign(template.content);
      }
    } else {
      setTemplateName('');
      setSubject('');
      setCategory('');
      setIsActive(true);
      // Load empty template or default design
      if (emailEditorRef.current) {
        emailEditorRef.current.editor?.loadDesign({
          body: {
            rows: [],
          },
        });
      }
    }
  }, [template, open]);

  const onDesignLoad = () => {
    if (template?.content && emailEditorRef.current) {
      emailEditorRef.current.editor?.loadDesign(template.content);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!templateName.trim()) {
      newErrors.name = 'Template name is required';
    }
    if (!subject.trim()) {
      newErrors.subject = 'Email subject is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveDesign = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
// Export design
const design = await new Promise<any>((resolve) => {
  emailEditorRef.current?.editor?.saveDesign((design: any) => {
    resolve(design);
  });
});

// Export HTML
const html = await new Promise<string>((resolve) => {
  emailEditorRef.current?.editor?.exportHtml((data: any) => {
    resolve(data.html);
  });
});

      const templateData = {
        name: templateName,
        subject,
        content: design,
        html,
        category: category || 'uncategorized',
        isActive,
      };

      if (template?._id) {
        await api.put(`/email-templates/${template._id}`, templateData);
        toast.success('Template updated successfully');
      } else {
        await api.post('/email-templates', templateData);
        toast.success('Template created successfully');
      }
      
      onSave();
      onClose();
    } catch (error: any) {
        console.log(error);
      toast.error(error?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const previewHtml = async () => {
    try {
      const html = await new Promise<string>((resolve) => {
        emailEditorRef.current?.editor?.exportHtml((data) => {
          resolve(data.html);
        });
      });
      setHtmlContent(html);
      setShowHtmlPreview(true);
    } catch (error) {
      toast.error('Failed to generate preview');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {template ? 'Edit Email Template' : 'Create New Email Template'}
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
              Design beautiful email templates with our drag-and-drop editor
            </div>
          </div>
          <IconButton onClick={onClose} sx={{ color: '#6b7280' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', height: '100%' }}>
            {/* Sidebar for template settings */}
            <div
              style={{
                width: '320px',
                padding: '20px',
                borderRight: '1px solid #e5e7eb',
                overflowY: 'auto',
                backgroundColor: '#f9fafb',
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  variant="outlined"
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Email Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  error={!!errors.subject}
                  helperText={errors.subject}
                  required
                  variant="outlined"
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Welcome, Newsletter, Promotional"
                  variant="outlined"
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Active"
                  sx={{ mt: 1 }}
                />
              </div>
              
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                  Template Tips:
                </div>
                <ul style={{ fontSize: '12px', color: '#6b7280', margin: 0, paddingLeft: '20px' }}>
                  <li>Use merge tags like {`{{firstName}}`}, {`{{email}}`} for personalization</li>
                  <li>Keep your design responsive for mobile devices</li>
                  <li>Test your template with different email clients</li>
                  <li>Keep images compressed for faster loading</li>
                </ul>
              </div>
            </div>
            
            {/* Email Editor */}
            <div style={{ flex: 1, position: 'relative' }}>
              <EmailEditor
                ref={emailEditorRef}
                onLoad={onDesignLoad}
                options={{
                  appearance: {
                    theme: 'light',
                  },
                  features: {
                    preview: true,
                    undoRedo: true,
                    imageEditor: true,
                  },
                  tools: {
                    text: true,
                    image: true,
                    button: true,
                    divider: true,
                    social: true,
                    html: true,
                    menu: true,
                    columns: true,
                  },
                }}
                minHeight="100%"
              />
            </div>
          </div>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={previewHtml}
            startIcon={<PreviewIcon />}
            variant="outlined"
            disabled={loading}
          >
            Preview
          </Button>
          <Button
            onClick={saveDesign}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#6366f1',
              '&:hover': { backgroundColor: '#4f46e5' },
            }}
          >
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* HTML Preview Dialog */}
      <Dialog
        open={showHtmlPreview}
        onClose={() => setShowHtmlPreview(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>HTML Preview</span>
          <IconButton onClick={() => setShowHtmlPreview(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <iframe
            srcDoc={htmlContent}
            title="Email Preview"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#ffffff',
            }}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHtmlPreview(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<CodeIcon />}
            onClick={() => {
              navigator.clipboard.writeText(htmlContent);
              toast.success('HTML copied to clipboard');
            }}
          >
            Copy HTML
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmailTemplateEditor;