// WhatsAppTemplateEditor.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Typography,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Link as LinkIcon,
  Message as MessageIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Send as SendIcon,
  ContentCopy as ContentCopyIcon,
  Smartphone as SmartphoneIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AttachFile as FileIcon,
  LocationOn as LocationIcon,
  ViewCarousel as CarouselIcon,
  ShoppingCart as OrderIcon,
  Close as CloseIcon,
  Upload as UploadIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  ArrowLeft,
  Reply,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../axiosInstance';
import { ArrowRight, ChevronRight, ExternalLink } from 'lucide-react';

// Types
interface WhatsAppTemplate {
  id?: string;
  name: string;
  label: string;
  category: 'MARKETING' | 'TRANSACTIONAL' | 'OTP' | 'UTILITY';
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'LOCATION' | 'CAROUSEL' | 'ORDER_DETAILS';
  language: string;
  text: string;
  sample_text: string;
  header_text?: string;
  footer_text?: string;
  header_type?: 'TEXT' | 'IMAGE' | 'VIDEO';
  header_media?: string;
  header_media_url?: string;
  media_file?: File | null;
  carousel_cards?: Array<{
    title: string;
    description: string;
    media_url?: string;
    buttons?: Array<{
      type: string;
      button_value: string;
      button_title: string;
    }>;
  }>;
  order_details?: {
    order_id: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      image_url?: string;
    }>;
    total_amount: number;
    currency: string;
  };
  message_action_type?: 'CTA' | 'QuickReplies' | 'All' | 'None';
  call_to_action?: Array<{
    type: 'Phone Number' | 'URL';
    button_value: string;
    button_title: string;
  }>;
  quick_replies?: string[];
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  total_parameters?: number;
}

interface Parameter {
  id: string;
  name: string;
  placeholder: string;
  example: string;
}

interface CarouselCard {
  id: string;
  title: string;
  description: string;
  media_url: string;
  media_file?: File | null;
  buttons: Array<{
    type: 'Phone Number' | 'URL';
    button_value: string;
    button_title: string;
  }>;
}

// Language options
const LANGUAGES = [
  'English', 'English (UK)', 'English (US)', 'Hindi', 'Arabic', 'Spanish', 'French',
  'German', 'Italian', 'Portuguese (BR)', 'Portuguese (POR)', 'Russian', 'Chinese (CHN)',
  'Japanese', 'Korean', 'Turkish', 'Vietnamese', 'Thai', 'Indonesian', 'Malay',
];

// Categories
const CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing', color: 'bg-purple-100 text-purple-700', icon: '📢' },
  { value: 'AUTHENTICATION', label: 'Authentication', color: 'bg-blue-100 text-blue-700', icon: '🔐' },
  { value: 'UTILITY', label: 'Utility', color: 'bg-orange-100 text-orange-700', icon: '⚙️' },
];

// Template types with configurations
const TEMPLATE_TYPES = [
  { value: 'TEXT', label: 'Text Message', icon: <MessageIcon />, description: 'Simple text message with optional parameters' },
  { value: 'IMAGE', label: 'Image Message', icon: <ImageIcon />, description: 'Message with an image attachment' },
  { value: 'VIDEO', label: 'Video Message', icon: <VideoIcon />, description: 'Message with a video attachment' },
  { value: 'FILE', label: 'File Message', icon: <FileIcon />, description: 'Message with a document/file attachment' },
  { value: 'LOCATION', label: 'Location Message', icon: <LocationIcon />, description: 'Share a location with map preview' },
  { value: 'CAROUSEL', label: 'Carousel Message', icon: <CarouselIcon />, description: 'Multiple cards in a carousel' },
  { value: 'ORDER_DETAILS', label: 'Order Details', icon: <OrderIcon />, description: 'Order summary with items list' },
];

export default function WhatsAppTemplateEditor() {
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [parametersValues, setParametersValues] = useState<Record<string, string>>({});
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [carouselCards, setCarouselCards] = useState<CarouselCard[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const [formData, setFormData] = useState<WhatsAppTemplate>({
    name: '',
    label: '',
    category: 'MARKETING',
    type: 'TEXT',
    language: 'English',
    text: '',
    sample_text: '',
    header_text: '',
    footer_text: '',
    header_type: 'TEXT',
    message_action_type: 'None',
    call_to_action: [],
    quick_replies: [],
    carousel_cards: [],
    order_details: {
      order_id: '',
      items: [],
      total_amount: 0,
      currency: 'USD',
    },
  });

  // Extract parameters from text
  useEffect(() => {
    const paramRegex = /{{(\d+)}}/g;
    const matches = [...formData.text.matchAll(paramRegex)];
    const uniqueParams = [...new Set(matches.map(m => m[1]))];

    const newParams: Parameter[] = uniqueParams.map((param, index) => ({
      id: `param_${param}`,
      name: `Parameter ${param}`,
      placeholder: `{{${param}}}`,
      example: `Sample ${param}`,
    }));

    setParameters(newParams);

    const newPreviewValues: Record<string, string> = {};
    newParams.forEach(param => {
      if (!previewValues[param.id]) {
        newPreviewValues[param.id] = param.example;
      }
    });
    setPreviewValues(prev => ({ ...prev, ...newPreviewValues }));
  }, [formData.text]);

  // Generate sample text
  useEffect(() => {
    let sample = formData.text;
    parameters.forEach((param, index) => {
      sample = sample.replace(`{{${index + 1}}}`, `[${previewValues[param.id] || param.example}]`);
    });
    setFormData(prev => ({ ...prev, sample_text: sample }));
  }, [formData.text, parameters, previewValues]);

  const handleMediaUpload = (file: File) => {
    setSelectedMedia(file);
    const localUrl = URL.createObjectURL(file);
    setMediaPreview(localUrl);
  };

  const handleCarouselCardMedia = (cardId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCarouselCards(prev => prev.map(card =>
        card.id === cardId
          ? { ...card, media_url: e.target?.result as string, media_file: file }
          : card
      ));
    };
    reader.readAsDataURL(file);
  };

  const addCarouselCard = () => {
    const newCard: CarouselCard = {
      id: `card_${Date.now()}`,
      title: '',
      description: '',
      media_url: '',
      buttons: [],
    };
    setCarouselCards([...carouselCards, newCard]);
    setFormData(prev => ({
      ...prev,
      carousel_cards: [...(prev.carousel_cards || []), newCard]
    }));
  };

  const updateCarouselCard = (cardId: string, field: string, value: any) => {
    setCarouselCards(prev => prev.map(card =>
      card.id === cardId ? { ...card, [field]: value } : card
    ));
    setFormData(prev => ({
      ...prev,
      carousel_cards: carouselCards.map(card =>
        card.id === cardId ? { ...card, [field]: value } : card
      )
    }));
  };

  const removeCarouselCard = (cardId: string) => {
    setCarouselCards(prev => prev.filter(card => card.id !== cardId));
    setFormData(prev => ({
      ...prev,
      carousel_cards: prev.carousel_cards?.filter(card => card.id !== cardId)
    }));
  };

  const addCarouselCardButton = (cardId: string) => {
    const newButton = { type: 'URL' as const, button_value: '', button_title: '' };
    setCarouselCards(prev => prev.map(card =>
      card.id === cardId
        ? { ...card, buttons: [...card.buttons, newButton] }
        : card
    ));
  };

  const updateCarouselCardButton = (cardId: string, buttonIndex: number, field: string, value: string) => {
    setCarouselCards(prev => prev.map(card =>
      card.id === cardId
        ? {
          ...card,
          buttons: card.buttons.map((btn, idx) =>
            idx === buttonIndex ? { ...btn, [field]: value } : btn
          )
        }
        : card
    ));
  };

  const removeCarouselCardButton = (cardId: string, buttonIndex: number) => {
    setCarouselCards(prev => prev.map(card =>
      card.id === cardId
        ? { ...card, buttons: card.buttons.filter((_, idx) => idx !== buttonIndex) }
        : card
    ));
  };

  // Order details handlers
  const addOrderItem = () => {
    setFormData(prev => ({
      ...prev,
      order_details: {
        ...prev.order_details!,
        items: [
          ...(prev.order_details?.items || []),
          { name: '', quantity: 1, price: 0, image_url: '' }
        ]
      }
    }));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      order_details: {
        ...prev.order_details!,
        items: prev.order_details!.items.map((item, idx) =>
          idx === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const removeOrderItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      order_details: {
        ...prev.order_details!,
        items: prev.order_details!.items.filter((_, idx) => idx !== index)
      }
    }));
  };

  // Handle CTA buttons
  const addCTAButton = () => {
    setFormData(prev => ({
      ...prev,
      call_to_action: [...(prev.call_to_action || []), { type: 'URL', button_value: '', button_title: '' }]
    }));
  };

  const updateCTAButton = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      call_to_action: prev.call_to_action?.map((btn, i) =>
        i === index ? { ...btn, [field]: value } : btn
      )
    }));
  };

  const removeCTAButton = (index: number) => {
    setFormData(prev => ({
      ...prev,
      call_to_action: prev.call_to_action?.filter((_, i) => i !== index)
    }));
  };

  // Handle quick replies
  const addQuickReply = () => {
    setFormData(prev => ({
      ...prev,
      quick_replies: [...(prev.quick_replies || []), '']
    }));
  };

  const updateQuickReply = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      quick_replies: prev.quick_replies?.map((reply, i) => i === index ? value : reply)
    }));
  };

  const removeQuickReply = (index: number) => {
    setFormData(prev => ({
      ...prev,
      quick_replies: prev.quick_replies?.filter((_, i) => i !== index)
    }));
  };

  const loadAssets = async () => {
    try {

      const response = await api.get("/assets");

      setAssets(response.data.data || []);

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);
  // Submit template
  const handleSubmit = async () => {
    if (!formData.name || !formData.label || !formData.text) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.message_action_type === 'CTA' && (!formData.call_to_action || formData.call_to_action.length === 0)) {
      toast.error('Please add at least one CTA button');
      return;
    }

    if (formData.type === 'CAROUSEL' && carouselCards.length === 0) {
      toast.error('Please add at least one carousel card');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const payload: any = {
        label: formData.label,
        category: formData.category,
        type: formData.type,
        language: formData.language,
        name: formData.name.toLowerCase().replace(/\s+/g, '_'),
        text: formData.text,
        sample_text: formData.sample_text,
        parameters: parametersValues,
        footer_text: formData.footer_text,
        message_action_type: formData.message_action_type === 'None' ? undefined : formData.message_action_type,
        call_to_action: formData.message_action_type === 'CTA' ? formData.call_to_action : undefined,
        quick_replies: formData.message_action_type === 'QuickReplies' ? formData.quick_replies : undefined,
      };

      // Add header based on type
      if (formData.type !== 'TEXT' && formData.header_text) {
        payload.header_text = formData.header_text;
      }

      if (formData.type === 'IMAGE' && mediaPreview) {
        payload.header_type = 'IMAGE';
        payload.header_media = mediaPreview;
      }

      if (formData.type === 'VIDEO' && mediaPreview) {
        payload.header_type = 'VIDEO';
        payload.header_media = mediaPreview;
      }

      if (formData.type === 'CAROUSEL') {
        payload.carousel_cards = carouselCards.map(card => ({
          title: card.title,
          description: card.description,
          media_url: card.media_url,
          buttons: card.buttons,
        }));
      }

      if (formData.type === 'ORDER_DETAILS') {
        payload.order_details = formData.order_details;
      }

      const response = await api.post('/ws/templates', payload);

      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        toast.success('Template submitted successfully! Waiting for approval.');
        resetForm();
        // loadTemplates();
        setActiveStep(0);
        setUploadProgress(0);
      }, 500);
    } catch (error: any) {
      console.error('Error submitting template:', error);
      toast.error(error?.error?.message || error.message || 'Failed to submit template');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      category: 'MARKETING',
      type: 'TEXT',
      language: 'English',
      text: '',
      sample_text: '',
      header_text: '',
      footer_text: '',
      header_type: 'TEXT',
      message_action_type: 'None',
      call_to_action: [],
      quick_replies: [],
    });
    setSelectedMedia(null);
    setMediaPreview('');
    setCarouselCards([]);
    setParameters([]);
    setPreviewValues({});
  };

  // Render preview based on template type
  const renderWhatsAppPreview = () => {
    const renderMediaPreview = () => {
      if (formData.type === 'IMAGE' && mediaPreview) {
        return (
          <div className="rounded-xl  -mx-1 -mt-1 p-3 ">
            <img
              src={mediaPreview}
              alt="Preview"
              className="w-full max-h-[280px] object-cover rounded-xl"
            />
          </div>
        );
      }

      if (formData.type === 'VIDEO' && mediaPreview) {
        return (
          <div className="rounded-xl overflow-hidden -mx-1 -mt-1 p-3 relative">
            <video
              ref={videoRef}
              src={mediaPreview}
              className="w-full max-h-[280px] object-cover rounded-xl"
              onClick={() => {
                if (videoRef.current) {
                  isPlaying ? videoRef.current.pause() : videoRef.current.play();
                  setIsPlaying(!isPlaying);
                }
              }}
            />
            <button
              className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/70 transition-colors rounded-full p-2.5"
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current) {
                  isPlaying ? videoRef.current.pause() : videoRef.current.play();
                  setIsPlaying(!isPlaying);
                }
              }}
            >
              {isPlaying ? (
                <PauseIcon className="text-white w-5 h-5" />
              ) : (
                <PlayIcon className="text-white w-5 h-5" />
              )}
            </button>
          </div>
        );
      }

      if (formData.type === 'FILE' && selectedMedia) {
        return (
          <div className="bg-[#f0f0f0] rounded-xl p-3 flex items-center gap-3 m-3">
            <FileIcon className="text-gray-600 w-8 h-8 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{selectedMedia.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedMedia.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        );
      }

      if (formData.type === 'LOCATION') {
        return (
          <div className="bg-[#f0f0f0] rounded-xl p-3 flex items-center gap-3 m-2 ">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center  justify-center flex-shrink-0">
              <LocationIcon className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-sm">📍 Shared Location</p>
              <p className="text-xs text-gray-600">123 Business St, City, Country</p>
            </div>
          </div>
        );
      }

      return null;
    };

    return (
      <div className=" max-w-md mx-auto  overflow-hidden">


        {/* Chat Background */}
        <div className=" h-full p-4 flex items-start justify-center relative">
          {/* Chat Bubble */}
          <div className="max-w-[360px] w-full bg-white rounded-r-xl rounded-bl-xl rounded-tl-0 overflow-hidden shadow-lg">

            <div className='absolute w-30 h-30 left-2 top-[11px] -z-1'>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="4.9 2.9 2.2 2.2">
                <path d="M 7 3 V 3 H 7 V 3 V 3 V 3 V 3 H 5 Q 6 4 7 5 V 3" fill="#fff" />
              </svg>
            </div>

            {/* Image */}
            {renderMediaPreview()}

            {/* Message Content */}
            <div className="bg-white px-3 py-2">

              {/* Header */}
              {formData.header_text && (
                <div className="text-black font-semibold text-[15px] mb-1">
                  {formData.header_text}
                </div>
              )}

              {/* Body */}
              <div className="text-gray-800 text-[15px] leading-5 break-all">
                {formData.sample_text || formData.text}
              </div>

              {/* Footer */}
              {formData.footer_text && (
                <div className="text-gray-800 text-[12px] mt-2">
                  {formData.footer_text}
                </div>
              )}

              {/* Time */}
              <div className="flex justify-end mt-1">
                <span className="text-gray-800 text-[11px]">
                  1:28 PM
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            {formData.message_action_type === "CTA" &&
              formData.call_to_action?.length > 0 && (
                <div className="">
                  {formData.call_to_action.map((btn, idx) => (
                    <button
                      key={idx}
                      className="w-full py-3 px-4 text-[#00a884] bg-white text-sm font-medium   flex items-center justify-center gap-1"
                    >
                      <ExternalLink />

                      <span>{btn.button_title}</span>

                    </button>
                  ))}
                </div>
              )}
            {/* Quick Replies */}
            {formData.message_action_type === "QuickReplies" &&
              formData.quick_replies?.length > 0 && (
                <div className="p-2 flex flex-col gap-2 bg-white">
                  {formData.quick_replies.map((reply, idx) => (
                    <button
                      key={idx}
                      className="text-[#00a884] rounded-full px-4 py-1 text-sm"
                    >
                      <Reply className="w-4 h-4 mt-[1px]" />

                      {reply}
                    </button>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };

  const steps = ['Template Details', 'Message Content', 'Media & Interactive', 'Preview & Submit'];

  return (
    <div className="min-h-[70vh] bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>

          </div>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              onClick={() => setShowPreview(!showPreview)}
              startIcon={<SmartphoneIcon />}
              className="!capitalize"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button
              variant="contained"
              className="!bg-green-600 hover:!bg-green-700 !capitalize"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <WhatsAppIcon />}
            >
              {submitting ? 'Submitting...' : 'Submit Template'}
            </Button>
          </div>
        </div>
        {submitting && (
          <div className="mt-3">
            <LinearProgress variant="determinate" value={uploadProgress} />
            <p className="text-xs text-gray-500 mt-1">Uploading media... {uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Editor Section */}
        <div className={`flex-1 overflow-y-auto  ${showPreview ? 'w-1/2' : 'w-full'}`}>
          <Paper className="p-6 rounded-xl">
            <Stepper activeStep={activeStep} className="mb-8">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step 1: Template Details */}
            {activeStep === 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4 flex flex-col gap-4"
              >
                <TextField
                  fullWidth
                  variant='standard'
                  label="Template Name *"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  helperText="Unique identifier for this template (lowercase, no spaces)"
                  placeholder="welcome_message"
                />

                <TextField
                  fullWidth
                  variant='standard'

                  label="Template Label *"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  helperText="Display name for this template"
                  placeholder="Welcome Message"
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormControl fullWidth>
                    <InputLabel>Category *</InputLabel>
                    <Select
                      variant='standard'

                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                      label="Category *"
                    >
                      {CATEGORIES.map(cat => (
                        <MenuItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2 py-1">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </div>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Template Type *</InputLabel>
                    <Select
                      variant='standard'

                      value={formData.type}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, type: e.target.value as any }));
                        if (e.target.value === 'CAROUSEL' && carouselCards.length === 0) {
                          addCarouselCard();
                        }
                      }}
                      label="Template Type *"
                    >
                      {TEMPLATE_TYPES.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2 py-1">
                            {type.icon}
                            <div>
                              <div>{type.label}</div>
                              {/* <div className="text-xs text-gray-500">{type.description}</div> */}
                            </div>
                          </div>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <FormControl fullWidth>
                  <InputLabel>Language *</InputLabel>
                  <Select
                    variant='standard'
                    className='pb-2'
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    label="Language *"
                  >
                    {LANGUAGES.map(lang => (
                      <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </motion.div>
            )}

            {/* Step 2: Message Content */}
            {activeStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-4"
              >
                <TextField
                  fullWidth
                  variant='standard'
                  multiline
                  rows={4}
                  label="Message Body *"
                  value={formData.text}
                  onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                  helperText="Use {{1}}, {{2}}, etc. for dynamic parameters"
                  placeholder="Hello {{1}}, your order #{{2}} has been confirmed!"
                />

                {parameters.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <Typography variant="subtitle2" className="mb-2 flex items-center gap-1">
                      <MessageIcon fontSize="small" />
                      Dynamic Parameters
                    </Typography>
                    <div className="space-y-2">
                      {parameters.map((param, idx) => (
                        <TextField
                          key={param.id}
                          variant='standard'
                          size="small"
                          label={`Example for {{${idx + 1}}}`}
                          value={previewValues[param.id] || ''}
                          onChange={(e) => setPreviewValues(prev => ({ ...prev, [param.id]: e.target.value }))}
                          placeholder={`Enter example value for parameter ${idx + 1}`}
                          fullWidth
                        />
                      ))}
                    </div>
                  </div>
                )}

                {parameters.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <Typography variant="subtitle2" className="mb-2 flex items-center gap-1">
                      <MessageIcon fontSize="small" />
                      Parameters value
                    </Typography>
                    <div className="space-y-2">
                      {parameters.map((param, idx) => (
                        <TextField
                          key={param.id}
                          variant='standard'
                          size="small"
                          label={`Example for {{${idx + 1}}}`}
                          value={parametersValues[param.id] || ''}
                          onChange={(e) => setParametersValues(prev => ({ ...prev, [param.id]: e.target.value }))}
                          placeholder={`Enter example value for parameter ${idx + 1}`}
                          fullWidth
                        />
                      ))}
                    </div>
                  </div>
                )}

                <TextField
                  fullWidth
                  variant='standard'
                  label="Header Text (Optional)"
                  value={formData.header_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, header_text: e.target.value }))}
                  placeholder="Appears above the message body"
                />

                <TextField
                  fullWidth
                  variant='standard'
                  label="Footer Text (Optional)"
                  value={formData.footer_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, footer_text: e.target.value }))}
                  placeholder="Appears below the message body"
                />
              </motion.div>
            )}

            {activeStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-4"
              >
                {/* Media Upload for non-text types */}
                {formData.type !== 'TEXT' && formData.type !== 'CAROUSEL' && formData.type !== 'ORDER_DETAILS' && (
                  <div className="space-y-3">
                    <Typography variant="subtitle1">
                      {formData.type === 'IMAGE' && 'Select Image'}
                      {formData.type === 'VIDEO' && 'Select Video'}
                      {formData.type === 'FILE' && 'Select File'}
                      {formData.type === 'LOCATION' && 'Location Details'}
                    </Typography>

                    {formData.type === 'LOCATION' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <TextField variant='standard' label="Latitude" type="number" placeholder="40.7128" fullWidth />
                        <TextField variant='standard' label="Longitude" type="number" placeholder="-74.0060" fullWidth />
                        <TextField variant='standard' label="Location Name" placeholder="Empire State Building" fullWidth className="col-span-2" />
                        <TextField variant='standard' label="Address" placeholder="20 W 34th St, New York, NY 10001" fullWidth className="col-span-2" />
                      </div>
                    ) : (
                      <div>
                        <FormControl fullWidth>
                          <InputLabel>Select Media</InputLabel>

                          <Select
                            variant="standard"
                            value={selectedAsset?._id || ""}
                            onChange={(e) => {

                              const asset = assets.find(
                                (a) => a._id === e.target.value
                              );
                              setSelectedAsset(asset);
                              setMediaPreview(`https://server.gatewayabroadeducations.com`+ asset.fileUrl || "");
                            }}
                          >

                            {assets
                              .filter((asset) => {

                                if (formData.type === "IMAGE") {
                                  return asset.type === "image";
                                }

                                if (formData.type === "VIDEO") {
                                  return asset.type === "video";
                                }

                                if (formData.type === "FILE") {
                                  return [
                                    "document",
                                    "pdf",
                                    "archive"
                                  ].includes(asset.type);
                                }

                                return true;
                              })
                              .map((asset) => (

                                <MenuItem
                                  key={asset._id}
                                  value={asset._id}
                                >

                                  <div className="flex items-center gap-3">

                                    {/* Preview */}

                                    {asset.type === "image" && (
                                      <img
                                        src={`https://server.gatewayabroadeducations.com`+ asset.fileUrl}
                                        className="w-10 h-10 rounded object-cover"
                                      />
                                    )}

                                    {asset.type === "video" && (
                                      <VideoIcon />
                                    )}

                                    {asset.type !== "image" &&
                                      asset.type !== "video" && (
                                        <FileIcon />
                                      )}

                                    <div>
                                      <p className="text-sm">
                                        {asset.originalName}
                                      </p>

                                      <p className="text-xs text-gray-500">
                                        {asset.folder}
                                      </p>
                                    </div>

                                  </div>

                                </MenuItem>
                              ))}

                          </Select>
                        </FormControl>
                        {mediaPreview && (
                          <div>
                            {formData.type === 'IMAGE' && (
                              <img src={mediaPreview} alt="Preview" className="max-h-40 mt-2 rounded-lg" />
                            )}
                            {formData.type === 'VIDEO' && (
                              <video src={mediaPreview} className="max-h-40 mt-2 rounded-lg" controls />
                            )}
                            {formData.type === 'FILE' && (
                              <div className="flex items-center justify-center gap-2">
                                <FileIcon className="text-4xl text-gray-400" />
                                <div>
                                  <p className="font-medium">{selectedMedia?.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {(selectedMedia?.size || 0) / 1024} KB
                                  </p>
                                </div>
                              </div>
                            )}
                            
                          </div>
                        ) }
                      </div>
                    )}
                  </div>
                )}

                {/* Carousel Builder */}
                {formData.type === 'CAROUSEL' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Typography variant="subtitle1">Carousel Cards</Typography>
                      <Button startIcon={<AddIcon />} onClick={addCarouselCard} size="small">
                        Add Card
                      </Button>
                    </div>
                    {carouselCards.map((card, idx) => (
                      <Card key={card.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <Typography variant="subtitle2">Card {idx + 1}</Typography>
                          <IconButton size="small" onClick={() => removeCarouselCard(card.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </div>
                        <div className="space-y-3">
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer"
                            onClick={() => document.getElementById(`carousel-media-${card.id}`)?.click()}
                          >
                            <input
                              id={`carousel-media-${card.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleCarouselCardMedia(card.id, e.target.files[0]);
                                }
                              }}
                            />
                            {card.media_url ? (
                              <img src={card.media_url} alt="Preview" className="max-h-32 mx-auto rounded" />
                            ) : (
                              <div>
                                <ImageIcon className="text-2xl text-gray-400" />
                                <p className="text-sm text-gray-500">Upload image</p>
                              </div>
                            )}
                          </div>
                          <TextField
                            variant='standard'
                            size="small"
                            label="Card Title"
                            value={card.title}
                            onChange={(e) => updateCarouselCard(card.id, 'title', e.target.value)}
                            fullWidth
                          />
                          <TextField
                            variant='standard'
                            size="small"
                            label="Card Description"
                            value={card.description}
                            onChange={(e) => updateCarouselCard(card.id, 'description', e.target.value)}
                            multiline
                            rows={2}
                            fullWidth
                          />
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <Typography variant="caption">Buttons</Typography>
                              <Button size="small" onClick={() => addCarouselCardButton(card.id)} startIcon={<AddIcon />}>
                                Add Button
                              </Button>
                            </div>
                            {card.buttons.map((btn, btnIdx) => (
                              <div key={btnIdx} className="flex gap-2 mb-2">
                                <Select
                                  size="small"
                                  value={btn.type}
                                  onChange={(e) => updateCarouselCardButton(card.id, btnIdx, 'type', e.target.value)}
                                  className="w-32"
                                >
                                  <MenuItem value="URL">URL</MenuItem>
                                  <MenuItem value="Phone Number">Phone</MenuItem>
                                </Select>
                                <TextField
                                  variant='standard'
                                  size="small"
                                  placeholder="Button Title"
                                  value={btn.button_title}
                                  onChange={(e) => updateCarouselCardButton(card.id, btnIdx, 'button_title', e.target.value)}
                                  className="flex-1"
                                />
                                <TextField
                                  variant='standard'
                                  size="small"
                                  placeholder={btn.type === 'URL' ? 'https://...' : '+1234567890'}
                                  value={btn.button_value}
                                  onChange={(e) => updateCarouselCardButton(card.id, btnIdx, 'button_value', e.target.value)}
                                  className="flex-1"
                                />
                                <IconButton size="small" onClick={() => removeCarouselCardButton(card.id, btnIdx)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Order Details Builder */}
                {formData.type === 'ORDER_DETAILS' && (
                  <div className="space-y-4">
                    <TextField
                      label="Order ID"
                      value={formData.order_details?.order_id}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        order_details: { ...prev.order_details!, order_id: e.target.value }
                      }))}
                      fullWidth
                    />

                    <div className="flex justify-between items-center">
                      <Typography variant="subtitle1">Order Items</Typography>
                      <Button startIcon={<AddIcon />} onClick={addOrderItem} size="small">
                        Add Item
                      </Button>
                    </div>

                    {formData.order_details?.items.map((item, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-2">
                            <TextField
                              variant='standard'
                              size="small"
                              label="Item Name"
                              value={item.name}
                              onChange={(e) => updateOrderItem(idx, 'name', e.target.value)}
                              fullWidth
                            />
                            <div className="flex gap-2">
                              <TextField
                                variant='standard'
                                size="small"
                                label="Quantity"
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateOrderItem(idx, 'quantity', parseInt(e.target.value))}
                                className="w-24"
                              />
                              <TextField
                                variant='standard'
                                size="small"
                                label="Price"
                                type="number"
                                value={item.price}
                                onChange={(e) => updateOrderItem(idx, 'price', parseFloat(e.target.value))}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <IconButton size="small" onClick={() => removeOrderItem(idx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </Card>
                    ))}

                    <div className="flex gap-2">
                      <TextField
                        variant='standard'
                        label="Currency"
                        value={formData.order_details?.currency}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          order_details: { ...prev.order_details!, currency: e.target.value }
                        }))}
                        className="w-24"
                      />
                    </div>
                  </div>
                )}

                {/* Interactive Elements */}
                <FormControl fullWidth>
                  <InputLabel>Interactive Action Type</InputLabel>
                  <Select
                    variant='standard'
                    value={formData.message_action_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, message_action_type: e.target.value as any }))}
                    label="Interactive Action Type"
                  >
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="CTA">Call to Action (Buttons)</MenuItem>
                    <MenuItem value="QuickReplies">Quick Replies</MenuItem>
                  </Select>
                </FormControl>

                {(formData.message_action_type === 'CTA' || formData.message_action_type === 'All') && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Typography variant="subtitle1">Call to Action Buttons</Typography>
                      <Button size="small" startIcon={<AddIcon />} onClick={addCTAButton}>
                        Add Button
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {formData.call_to_action?.map((btn, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="flex gap-2">
                            <FormControl size="small" className="flex-1">
                              <InputLabel>Type</InputLabel>
                              <Select
                                variant='standard'
                                value={btn.type}
                                onChange={(e) => updateCTAButton(idx, 'type', e.target.value)}
                                label="Type"
                              >
                                <MenuItem value="URL">URL</MenuItem>
                                <MenuItem value="Phone Number">Phone Number</MenuItem>
                              </Select>
                            </FormControl>
                            <TextField
                              variant='standard'
                              size="small"
                              label="Button Title"
                              value={btn.button_title}
                              onChange={(e) => updateCTAButton(idx, 'button_title', e.target.value)}
                              className="flex-1"
                            />
                            <TextField
                              variant='standard'
                              size="small"
                              label={btn.type === 'URL' ? 'URL' : 'Phone Number'}
                              value={btn.button_value}
                              onChange={(e) => updateCTAButton(idx, 'button_value', e.target.value)}
                              className="flex-1"
                              placeholder={btn.type === 'URL' ? 'https://example.com' : '+1234567890'}
                            />
                            <IconButton color="error" onClick={() => removeCTAButton(idx)}>
                              <DeleteIcon />
                            </IconButton>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {(formData.message_action_type === 'QuickReplies' || formData.message_action_type === 'All') && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Typography variant="subtitle1">Quick Replies</Typography>
                      <Button size="small" startIcon={<AddIcon />} onClick={addQuickReply}>
                        Add Reply
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.quick_replies?.map((reply, idx) => (
                        <div key={idx} className="flex gap-2">
                          <TextField
                            fullWidth
                            size="small"
                            label={`Quick Reply ${idx + 1}`}
                            value={reply}
                            onChange={(e) => updateQuickReply(idx, e.target.value)}
                            placeholder="e.g., Yes, No, Maybe"
                            variant='standard'
                          />
                          <IconButton color="error" onClick={() => removeQuickReply(idx)}>
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Preview & Submit */}
            {activeStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Alert severity="info" className="mb-4">
                  Your template will be submitted for review. Approval typically takes 24-48 hours.
                </Alert>

                <div className="bg-gray-50 rounded-lg p-4">
                  <Typography variant="subtitle2" className="mb-2">Template Summary</Typography>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {formData.name}</p>
                    <p><strong>Label:</strong> {formData.label}</p>
                    <p><strong>Category:</strong> {formData.category}</p>
                    <p><strong>Type:</strong> {formData.type}</p>
                    <p><strong>Language:</strong> {formData.language}</p>
                    <p><strong>Parameters:</strong> {parameters.length}</p>
                    <p><strong>Interactive Type:</strong> {formData.message_action_type}</p>
                    {formData.type === 'CAROUSEL' && <p><strong>Carousel Cards:</strong> {carouselCards.length}</p>}
                    {formData.type === 'ORDER_DETAILS' && (
                      <p><strong>Order Items:</strong> {formData.order_details?.items.length || 0}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                disabled={activeStep === 0}
                onClick={() => setActiveStep(prev => prev - 1)}
              >
                Back
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(prev => prev + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  className="!bg-green-600 hover:!bg-green-700"
                  onClick={handleSubmit}
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} /> : <WhatsAppIcon />}
                >
                  Submit Template
                </Button>
              )}
            </div>
          </Paper>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="w-1/3 border-l border-gray-200 bg-gray-200 overflow-y-auto p-6 sticky top-[73px]">
            {renderWhatsAppPreview()}
          </div>
        )}
      </div>
    </div>
  );
}