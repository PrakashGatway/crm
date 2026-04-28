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
    Divider
} from '@mui/material';
import {
    Send as SendIcon,
    WhatsApp as WhatsAppIcon,
    Email as EmailIcon,
    Close as CloseIcon,
    SmartToy as SmartToyIcon
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
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [useTemplate, setUseTemplate] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [batchSize, setBatchSize] = useState(50);
    const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        try {
            const response = await api.get('/ws/templates');
            setTemplates(response.data.data || []);
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    };

    const handleTemplateSelect = (templateId) => {
        const template = templates.find(t => t._id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            if (activeTab === 0) { // Email tab
                setEmailSubject(template.subject || '');
                setEmailBody(template.body || '');
            } else { // WhatsApp tab
                setWhatsappMessage(template.body || '');
            }
        }
    };

    const handlePreview = async () => {
        try {
            setPreviewMode(true);
            const sampleLead = selectedLeads[0];
            
            const response = await api.post('/messages/preview', {
                type: activeTab === 0 ? 'email' : 'whatsapp',
                content: activeTab === 0 ? { subject: emailSubject, body: emailBody } : { message: whatsappMessage },
                lead: sampleLead
            });
            
            setPreviewData(response.data);
        } catch (error) {
            toast.error('Failed to generate preview');
        }
    };

    const handleSend = async () => {
        if (selectedLeads.length === 0) {
            toast.error('No leads selected');
            return;
        }

        if (activeTab === 0 && (!emailSubject.trim() || !emailBody.trim())) {
            toast.error('Please enter email subject and body');
            return;
        }

        if (activeTab === 1 && !whatsappMessage.trim()) {
            toast.error('Please enter WhatsApp message');
            return;
        }

        const confirmMessage = `Send ${activeTab === 0 ? 'emails' : 'WhatsApp messages'} to ${selectedLeads.length} lead(s)?`;
        if (!window.confirm(confirmMessage)) return;

        setLoading(true);
        setSendProgress({ current: 0, total: selectedLeads.length });

        try {
            const response = await api.post('/messages/send-bulk', {
                type: activeTab === 0 ? 'email' : 'whatsapp',
                leadIds: selectedLeads,
                content: activeTab === 0 
                    ? { subject: emailSubject, body: emailBody }
                    : { message: whatsappMessage },
                batchSize: batchSize,
                templateId: selectedTemplate || undefined
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
        setSelectedTemplate('');
        setUseTemplate(false);
        setPreviewMode(false);
        setActiveTab(0);
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
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <CloseIcon />
                    </button>
                </div>
            </DialogTitle>

            <DialogContent dividers>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} className="mb-4">
                    <Tab icon={<EmailIcon />} label="Email" />
                    <Tab icon={<WhatsAppIcon />} label="WhatsApp" />
                </Tabs>

                <TabPanel value={activeTab} index={0}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <FormControlLabel
                                control={
                                    <RadioGroup
                                        row
                                        value={useTemplate ? 'template' : 'custom'}
                                        onChange={(e) => setUseTemplate(e.target.value === 'template')}
                                    >
                                        <FormControlLabel value="custom" control={<Radio />} label="Custom Message" />
                                        <FormControlLabel value="template" control={<Radio />} label="Use Template" />
                                    </RadioGroup>
                                }
                                label=""
                            />
                        </div>

                        {useTemplate && (
                            <FormControl fullWidth>
                                <InputLabel>Select Template</InputLabel>
                                <Select
                                    value={selectedTemplate}
                                    onChange={(e) => handleTemplateSelect(e.target.value)}
                                    label="Select Template"
                                >
                                    {templates.map(template => (
                                        <MenuItem key={template._id} value={template._id}>
                                            {template.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <TextField
                            fullWidth
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

                        <div className="bg-gray-50 p-3 rounded-lg">
                            <Typography variant="caption" color="textSecondary">
                                💡 Tips:
                                <ul className="mt-1 ml-4 text-xs">
                                    <li>Use {'{{fullName}}'} to personalize with lead's name</li>
                                    <li>Use {'{{coursePreference}}'} to mention their preferred course</li>
                                    <li>Use {'{{assignedCounselor}}'} to include counselor name</li>
                                </ul>
                            </Typography>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <div className="space-y-4">
                        <FormControlLabel
                            control={
                                <RadioGroup
                                    row
                                    value={useTemplate ? 'template' : 'custom'}
                                    onChange={(e) => setUseTemplate(e.target.value === 'template')}
                                >
                                    <FormControlLabel value="custom" control={<Radio />} label="Custom Message" />
                                    <FormControlLabel value="template" control={<Radio />} label="Use Template" />
                                </RadioGroup>
                            }
                            label=""
                        />

                        {useTemplate && (
                            <FormControl fullWidth>
                                <InputLabel>Select Template</InputLabel>
                                <Select
                                    value={selectedTemplate}
                                    onChange={(e) => handleTemplateSelect(e.target.value)}
                                    label="Select Template"
                                >
                                    {templates.map(template => (
                                        <MenuItem key={template._id} value={template._id}>
                                            {template.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <TextField
                            fullWidth
                            multiline
                            rows={6}
                            label="WhatsApp Message"
                            value={whatsappMessage}
                            onChange={(e) => setWhatsappMessage(e.target.value)}
                            placeholder="Enter your WhatsApp message here..."
                            required
                            helperText={`${whatsappMessage.length} characters`}
                        />

                        <div className="bg-green-50 p-3 rounded-lg">
                            <Typography variant="caption" color="textSecondary">
                                📱 WhatsApp Tips:
                                <ul className="mt-1 ml-4 text-xs">
                                    <li>Keep messages concise (under 1600 characters)</li>
                                    <li>Avoid URLs to prevent spam filtering</li>
                                    <li>Use {'{{fullName}}'} for personalization</li>
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
                                <button
                                    onClick={() => setPreviewMode(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <CloseIcon fontSize="small" />
                                </button>
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
                <Button onClick={handlePreview} disabled={loading} variant="outlined">
                    Preview
                </Button>
                <Button
                    onClick={handleSend}
                    disabled={loading}
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