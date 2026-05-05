// frontend/src/components/TemplatePicker.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Chip,
  IconButton,
  Typography,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  InputAdornment
} from '@mui/material';
import { Search, X, Send, AlertCircle, Image, Video, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../axiosInstance';
import { toast } from 'react-toastify';

const TemplatePicker = ({ open, onClose, onSelectTemplate, lead }) => {
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [parameters, setParameters] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);
  
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Fetch templates from your backend
      const response = await api.get('/ws/templates?isDirect=true');
      if (response.data.success) {
        setTemplates(response.data.template);
      }
    } catch (error) {
      console.error("Fetch templates error:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };
  
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    // Extract parameter count from template
    const bodyComponent = template.components.find(c => c.type === 'BODY');
    const parameterCount = bodyComponent?.text?.match(/{{(\d+)}}/g)?.length || 0;
    setParameters(Array(parameterCount).fill(''));
    setActiveStep(1);
  };
  
  const handleParameterChange = (index, value) => {
    const newParams = [...parameters];
    newParams[index] = value;
    setParameters(newParams);
  };
  
  const renderTemplatePreview = () => {
    if (!selectedTemplate) return null;
    
    const headerComponent = selectedTemplate.components.find(c => c.type === 'HEADER');
    const bodyComponent = selectedTemplate.components.find(c => c.type === 'BODY');
    const footerComponent = selectedTemplate.components.find(c => c.type === 'FOOTER');
    const buttons = selectedTemplate.components.filter(c => c.type === 'BUTTONS');
    
    let previewText = bodyComponent?.text || '';
    parameters.forEach((param, index) => {
      if (param) {
        previewText = previewText.replace(new RegExp(`{{${index + 1}}}`, 'g'), param);
      }
    });
    
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Typography variant="subtitle2" className="mb-2 text-gray-600">
          Preview:
        </Typography>
        
        {headerComponent && (
          <div className="mb-3">
            {headerComponent.format === 'IMAGE' && (
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 text-center">
                <Image className="h-12 w-12 mx-auto text-gray-400" />
                <Typography variant="caption">Image Header</Typography>
              </div>
            )}
            {headerComponent.format === 'VIDEO' && (
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 text-center">
                <Video className="h-12 w-12 mx-auto text-gray-400" />
                <Typography variant="caption">Video Header</Typography>
              </div>
            )}
            {headerComponent.format === 'TEXT' && (
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg">
                <Typography variant="body2" className="font-semibold">
                  {headerComponent.text}
                </Typography>
              </div>
            )}
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 mb-3">
          <Typography variant="body2" className="whitespace-pre-wrap">
            {previewText}
          </Typography>
        </div>
        
        {footerComponent && (
          <Typography variant="caption" className="text-gray-500 block mb-3">
            {footerComponent.text}
          </Typography>
        )}
        
        {buttons.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {buttons[0].buttons.map((button, idx) => (
              <Chip
                key={idx}
                label={button.text}
                variant="outlined"
                icon={button.type === 'URL' ? <LinkIcon className="h-3 w-3" /> : null}
                size="small"
              />
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const handleSend = async () => {
    const missingParams = parameters.some(p => !p.trim());
    if (missingParams) {
      toast.error("Please fill all parameters");
      return;
    }
    
    setSending(true);
    try {
      await onSelectTemplate(selectedTemplate, parameters);
      onClose();
      setSelectedTemplate(null);
      setParameters([]);
      setActiveStep(0);
    } catch (error) {
      console.error("Send template error:", error);
    } finally {
      setSending(false);
    }
  };
  
  const handleClose = () => {
    setSelectedTemplate(null);
    setParameters([]);
    setActiveStep(0);
    setSearchTerm('');
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: "rounded-xl"
      }}
    >
      <DialogTitle className="flex justify-between items-center border-b">
        <Typography variant="h6">WhatsApp Templates</Typography>
        <IconButton onClick={handleClose} size="small">
          <X className="h-5 w-5" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent className="p-0">
        {activeStep === 0 ? (
          <>
            {/* Search Bar */}
            <div className="p-4 border-b">
              <TextField
                fullWidth
                size="small"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search className="h-4 w-4" />
                    </InputAdornment>
                  )
                }}
              />
              
              {/* Category Filters */}
              <div className="flex gap-2 mt-3 overflow-x-auto">
                <Chip label="All" size="small" color="primary" />
                <Chip label="MARKETING" size="small" />
                <Chip label="UTILITY" size="small" />
                <Chip label="AUTHENTICATION" size="small" />
              </div>
            </div>
            
            {/* Templates List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <CircularProgress />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <Typography>No templates found</Typography>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => selectTemplate(template)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Typography variant="subtitle2" className="font-semibold">
                            {template.name}
                          </Typography>
                          <Typography variant="caption" className="text-gray-500 block">
                            {template.category}
                          </Typography>
                          <Typography variant="body2" className="text-sm mt-1 line-clamp-2">
                            {template.components.find(c => c.type === 'BODY')?.text.substring(0, 100)}...
                          </Typography>
                        </div>
                        <Chip 
                          label={template.status}
                          size="small"
                          color={template.status === 'APPROVED' ? 'success' : 'warning'}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Stepper activeStep={activeStep} className="px-6 pt-4">
              <Step>
                <StepLabel>Select Template</StepLabel>
              </Step>
              <Step>
                <StepLabel>Fill Parameters</StepLabel>
              </Step>
            </Stepper>
            
            <div className="p-4">
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <Typography variant="subtitle1" className="font-semibold">
                    {selectedTemplate?.name}
                  </Typography>
                  <Button size="small" onClick={() => setActiveStep(0)}>
                    Change Template
                  </Button>
                </div>
                
                {selectedTemplate?.components.map((comp, idx) => {
                  if (comp.type === 'BODY') {
                    const text = comp.text;
                    const parts = text.split(/({{[0-9]+}})/);
                    
                    return (
                      <div key={idx} className="mt-4">
                        <Typography variant="body2" className="mb-3 text-gray-600">
                          Fill in the placeholders:
                        </Typography>
                        
                        {parts.map((part, pIdx) => {
                          const match = part.match(/{{([0-9]+)}}/);
                          if (match) {
                            const paramIndex = parseInt(match[1]) - 1;
                            return (
                              <TextField
                                key={pIdx}
                                fullWidth
                                size="small"
                                placeholder={`Parameter ${match[1]}`}
                                value={parameters[paramIndex] || ''}
                                onChange={(e) => handleParameterChange(paramIndex, e.target.value)}
                                className="mb-3"
                                variant="outlined"
                              />
                            );
                          }
                          return part;
                        })}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
              
              {renderTemplatePreview()}
              
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(0)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSend}
                  disabled={sending || parameters.some(p => !p.trim())}
                  className="flex-1 bg-indigo-600"
                  startIcon={sending ? <CircularProgress size={16} /> : <Send className="h-4 w-4" />}
                >
                  {sending ? 'Sending...' : 'Send Template'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePicker;