// components/LeadManagement/SendMessageModal.jsx
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    CircularProgress,
    Tab,
    Tabs,
    Typography,
    RadioGroup,
    Radio,
    FormControlLabel,
    Divider,
    Chip,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    Paper,
    Link as LinkIcon
} from '@mui/material';
import {
    Send as SendIcon,
    WhatsApp as WhatsAppIcon,
    Email as EmailIcon,
    Close as CloseIcon,
    Image as ImageIconMui,
    Preview as PreviewIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../axiosInstance';

const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} className="p-3">
        {value === index && children}
    </div>
);

export default function SendMessageModal({ isOpen, onClose, selectedLeads, onComplete }) {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [whatsAppTemplates, setWhatsAppTemplates] = useState([]);
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [selectedEmailTemplate, setSelectedEmailTemplate] = useState('');
    const [selectedWhatsAppTemplate, setSelectedWhatsAppTemplate] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [useEmailTemplate, setUseEmailTemplate] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [batchSize, setBatchSize] = useState(50);
    const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
    const [templateParameters, setTemplateParameters] = useState({});
    const [selectedTemplateDetails, setSelectedTemplateDetails] = useState(null);
    const [showParameterInput, setShowParameterInput] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadEmailTemplates();
            loadWhatsAppTemplates();
        }
    }, [isOpen]);

    const loadEmailTemplates = async () => {
        try {
            const response = await api.get('/email-templates');
            setEmailTemplates(response.data.data || []);
        } catch (err) {
            console.error('Failed to load email templates');
        }
    };

    const loadWhatsAppTemplates = async () => {
        try {
            const response = await api.get('/ws/templates?isDirect=true');
            setWhatsAppTemplates(response.data.template || []);
        } catch (error) {
            console.error('Failed to load WhatsApp templates:', error);
        }
    };

    const handleEmailTemplateSelect = (templateId) => {
        const template = emailTemplates.find(t => t._id === templateId);
        if (template) {
            setSelectedEmailTemplate(templateId);
            setEmailSubject(template.subject);
            setEmailBody(template.body);
        }
    };

    const handleWhatsAppTemplateSelect = (templateId) => {
        const template = whatsAppTemplates.find(t => t.name == templateId);
        if (template) {
            setSelectedWhatsAppTemplate(templateId);
            setSelectedTemplateDetails(template);
            
            // Extract parameters from template
            const bodyComponent = template.components.find(c => c.type === 'BODY');
            if (bodyComponent && bodyComponent.text) {
                const placeholders = bodyComponent.text.match(/{{(\d+)}}/g) || [];
                const params = {};
                placeholders.forEach(placeholder => {
                    const paramNum = placeholder.match(/\d+/)[0];
                    params[paramNum] = '';
                });
                setTemplateParameters(params);
                setShowParameterInput(true);
            } else {
                setShowParameterInput(false);
            }
        }
    };

    const handleParameterChange = (paramNum, value) => {
        setTemplateParameters(prev => ({
            ...prev,
            [paramNum]: value
        }));
    };

    const renderParameterInputs = () => {
        if (!showParameterInput || !selectedTemplateDetails) return null;
        
        const bodyComponent = selectedTemplateDetails.components.find(c => c.type === 'BODY');
        if (!bodyComponent) return null;
        
        const placeholders = bodyComponent.text.match(/{{(\d+)}}/g) || [];
        
        return (
            <div className="space-y-3 mt-4">
                <Typography variant="subtitle2" className="font-semibold">
                    Template Parameters:
                </Typography>
                {placeholders.map(placeholder => {
                    const paramNum = placeholder.match(/\d+/)[0];
                    return (
                        <TextField
                            key={paramNum}
                            fullWidth
                            size="small"
                            label={`Parameter ${paramNum}`}
                            placeholder={`Enter value for ${placeholder}`}
                            value={templateParameters[paramNum] || ''}
                            onChange={(e) => handleParameterChange(paramNum, e.target.value)}
                            helperText={getParameterHint(paramNum)}
                        />
                    );
                })}
            </div>
        );
    };

    const getParameterHint = (paramNum) => {
        const hints = {
            1: "e.g., Lead's full name",
            2: "e.g., Course preference",
            3: "e.g., Phone number",
            4: "e.g., City",
            5: "e.g., Country"
        };
        return hints[paramNum] || "Enter value";
    };

    const handleSend = async () => {
        if (selectedLeads.length === 0) {
            toast.error('No leads selected');
            return;
        }
        
        if (activeTab === 0) {
            if (useEmailTemplate && !selectedEmailTemplate) {
                toast.error('Please select an email template');
                return;
            }
            if (!useEmailTemplate && (!emailSubject.trim() || !emailBody.trim())) {
                toast.error('Please enter email subject and body');
                return;
            }
        } else {
            if (!selectedWhatsAppTemplate) {
                toast.error('Please select a WhatsApp template');
                return;
            }
            
            // Validate template parameters
            if (showParameterInput) {
                const missingParams = Object.values(templateParameters).some(v => !v.trim());
                if (missingParams) {
                    toast.error('Please fill all template parameters');
                    return;
                }
            }
        }
        
        const confirmMessage = `Send ${activeTab === 0 ? 'emails' : 'WhatsApp messages'} to ${selectedLeads.length} lead(s)?`;
        if (!window.confirm(confirmMessage)) return;
        
        setLoading(true);
        setSendProgress({ current: 0, total: selectedLeads.length });
        
        try {
            let content;
            let templateId;
            
            if (activeTab === 0) {
                if (useEmailTemplate) {
                    templateId = selectedEmailTemplate;
                    content = null;
                } else {
                    content = { subject: emailSubject, body: emailBody };
                }
            } else {
                templateId = selectedWhatsAppTemplate;
                // Pass parameters along with template
                content = { parameters: templateParameters };
            }
            
            const response = await api.post('/msg/send-bulk', {
                type: activeTab === 0 ? 'email' : 'whatsapp',
                leadIds: selectedLeads,
                content: content,
                batchSize: batchSize,
                templateId: templateId
            });
            
            const { results, summary } = response.data;
            
            toast.success(
                `Messages sent! Success: ${summary.success}, Failed: ${summary.failed}`
            );
            
            if (onComplete) onComplete(results);
            onClose();
            resetForm();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send messages');
        } finally {
            setLoading(false);
            setSendProgress({ current: 0, total: 0 });
        }
    };

    const resetForm = () => {
        setEmailSubject('');
        setEmailBody('');
        setWhatsappMessage('');
        setSelectedEmailTemplate('');
        setSelectedWhatsAppTemplate('');
        setUseEmailTemplate(false);
        setPreviewMode(false);
        setActiveTab(0);
        setTemplateParameters({});
        setSelectedTemplateDetails(null);
        setShowParameterInput(false);
    };

    const renderProgress = () => {
        if (sendProgress.total === 0) return null;
        
        const percentage = (sendProgress.current / sendProgress.total) * 100;
        return (
            <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                    <span>Sending progress</span>
                    <span>{sendProgress.current} / {sendProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ className: '!rounded-2xl' }}
        >
            <DialogTitle className="!pb-2">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-semibold">Send Messages</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {selectedLeads.length} lead(s) selected
                        </p>
                    </div>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </div>
            </DialogTitle>

            <DialogContent dividers>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} className="mb-4">
                    <Tab icon={<EmailIcon />} label="Email" />
                    <Tab icon={<WhatsAppIcon />} label="WhatsApp" />
                </Tabs>

                {/* Email Tab */}
                <TabPanel value={activeTab} index={0}>
                    <div className="space-y-4">
                        <FormControlLabel
                            control={
                                <RadioGroup
                                    row
                                    value={useEmailTemplate ? 'template' : 'custom'}
                                    onChange={(e) => setUseEmailTemplate(e.target.value === 'template')}
                                >
                                    <FormControlLabel value="custom" control={<Radio />} label="Custom Message" />
                                    <FormControlLabel value="template" control={<Radio />} label="Use Template" />
                                </RadioGroup>
                            }
                            label=""
                        />

                        {useEmailTemplate ? (
                            <FormControl fullWidth>
                                <InputLabel>Select Email Template</InputLabel>
                                <Select
                                    value={selectedEmailTemplate}
                                    onChange={(e) => handleEmailTemplateSelect(e.target.value)}
                                    label="Select Email Template"
                                >
                                    {emailTemplates.map(template => (
                                        <MenuItem key={template._id} value={template._id}>
                                            {template.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : (
                            <>
                                <TextField
                                    fullWidth
                                    sx={{marginBottom:1}}
                                    label="Email Subject"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="Enter email subject"
                                    required
                                />
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={8}
                                    label="Email Body"
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    placeholder="Enter your email message here..."
                                    required
                                />
                            </>
                        )}

                        <div className="bg-gray-50 p-3 rounded-lg">
                            <Typography variant="caption" color="textSecondary">
                                💡 Available Placeholders:
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <Chip label="{{fullName}}" size="small" />
                                    <Chip label="{{coursePreference}}" size="small" />
                                    <Chip label="{{city}}" size="small" />
                                    <Chip label="{{country}}" size="small" />
                                    <Chip label="{{status}}" size="small" />
                                </div>
                            </Typography>
                        </div>
                    </div>
                </TabPanel>

                {/* WhatsApp Tab */}
                <TabPanel value={activeTab} index={1}>
                    <div className="space-y-4">
                        <FormControl fullWidth>
                            <InputLabel>Select WhatsApp Template</InputLabel>
                            <Select
                                value={selectedWhatsAppTemplate}
                                onChange={(e) => handleWhatsAppTemplateSelect(e.target.value)}
                                label="Select WhatsApp Template"
                            >
                                {whatsAppTemplates.map(template => (
                                    <MenuItem key={template._id} value={template.name}>
                                        <div className="flex justify-between w-full">
                                            <span>{template.name}</span>
                                            <Chip 
                                                label={template.category} 
                                                size="small" 
                                                color={template.category === 'MARKETING' ? 'primary' : 'default'}
                                            />
                                        </div>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {renderParameterInputs()}

                        <div className="bg-green-50 p-3 rounded-lg">
                            <Typography variant="caption" color="textSecondary">
                                📱 WhatsApp Guidelines:
                                <ul className="mt-1 ml-4 text-xs">
                                    <li>Only approved templates can be used</li>
                                    <li>Parameters support text values only</li>
                                    <li>Images and videos are automatically included from template</li>
                                    <li>Preview shows how message will look</li>
                                </ul>
                            </Typography>
                        </div>
                    </div>
                </TabPanel>

                <Divider className="my-4" />

                <div className="space-y-4">
                    <FormControl fullWidth>
                        <InputLabel>Batch Size</InputLabel>
                        <Select
                            value={batchSize}
                            onChange={(e) => setBatchSize(e.target.value)}
                            label="Batch Size"
                        >
                            <MenuItem value={20}>20 messages per batch</MenuItem>
                            <MenuItem value={50}>50 messages per batch</MenuItem>
                            <MenuItem value={100}>100 messages per batch</MenuItem>
                            <MenuItem value={200}>200 messages per batch</MenuItem>
                        </Select>
                    </FormControl>

                    {previewMode && previewData && (
                        <Alert severity="info" className="mt-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <strong>Preview for {previewData.leadName}:</strong>
                                    <p className="mt-2 text-sm whitespace-pre-wrap">
                                        {previewData.preview}
                                    </p>
                                </div>
                                <IconButton
                                    size="small"
                                    onClick={() => setPreviewMode(false)}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </div>
                        </Alert>
                    )}

                    {renderProgress()}
                </div>
            </DialogContent>

            <DialogActions className="!p-4">
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSend}
                    disabled={loading || (activeTab === 1 && !selectedWhatsAppTemplate)}
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                    className="!bg-indigo-600"
                >
                    {loading ? 'Sending...' : `Send to ${selectedLeads.length} Lead(s)`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}