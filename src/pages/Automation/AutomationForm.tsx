// components/automation/MessageAutomationForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
    Paper,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    IconButton,
    Typography,
    Divider,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert,
    Stepper,
    Step,
    StepLabel,
    Box,
    Grid,
    Switch,
    FormControlLabel,
    CircularProgress,
    Tabs,
    Tab,
    Stack,
    Container,
    alpha,
    Checkbox,
    ListItemText,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    WhatsApp as WhatsAppIcon,
    Email as EmailIcon,
    Sms as SmsIcon,
    Task as TaskIcon,
    Label as TagIcon,
    Edit as EditIcon,
    Schedule as ScheduleIcon,
    Webhook as WebhookIcon,
    PlayArrow as PlayIcon,
    Flag as FlagIcon,
    Pause as PauseIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import api, { automationAPI } from "../../axiosInstance";
import { toast } from "react-toastify";
import { CheckCircleIcon } from "lucide-react";


// Action Type Components
const ActionConfig = ({ action, onChange, onDelete, templates,pipelines }) => {
    const getActionFields = () => {
        switch (action.type) {
            case "SEND_WHATSAPP":
            case "SEND_EMAIL":
            case "SEND_SMS":
                return (
                    <Grid spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                                <InputLabel>
                                    Select Template
                                </InputLabel>

                                <Select
                                    value={action.templateId || ""}
                                    label="Select Template"
                                    onChange={(e) =>
                                        onChange({
                                            ...action,
                                            templateId: e.target.value
                                        })
                                    }
                                >
                                    {templates?.map((template) => (
                                        <MenuItem
                                            key={template.id}
                                            value={template.name}
                                        >
                                            {template.name}({template.status})
                                        </MenuItem>

                                    ))}

                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                                Variables (Key-Value pairs)
                            </Typography>
                            <Stack spacing={1}>
                                {Object.entries(action.variables || {}).map(([key, value], idx) => (
                                    <Stack key={idx} direction="row" spacing={1} alignItems="center">
                                        <TextField
                                            size="small"
                                            placeholder="Key"
                                            value={key}
                                            onChange={(e) => {
                                                const newVars = { ...(action.variables || {}) };
                                                delete newVars[key];
                                                newVars[e.target.value] = value;
                                                onChange({ ...action, variables: newVars });
                                            }}
                                            sx={{ flex: 1 }}
                                        />
                                        <TextField
                                            size="small"
                                            placeholder="Value"
                                            value={value}
                                            onChange={(e) => {
                                                onChange({
                                                    ...action,
                                                    variables: { ...(action.variables || {}), [key]: e.target.value },
                                                });
                                            }}
                                            sx={{ flex: 1 }}
                                        />
                                        <IconButton size="small" onClick={() => {
                                            const newVars = { ...(action.variables || {}) };
                                            delete newVars[key];
                                            onChange({ ...action, variables: newVars });
                                        }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                ))}
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => {
                                        onChange({
                                            ...action,
                                            variables: { ...(action.variables || {}), "": "" },
                                        });
                                    }}
                                    sx={{ alignSelf: 'flex-start' }}
                                >
                                    Add Variable
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                );
            case "ADD_TAG":
            case "REMOVE_TAG":
            case "CHECK_TAG":
                return (
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Tag Name"
                            value={action.value || ""}
                            onChange={(e) => onChange({ ...action, value: e.target.value })}
                            size="small"
                        />
                    </Grid>
                );
            case "CONDITION":
                return (
                    <Stack spacing={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Match Type</InputLabel>
                            <Select
                                value={action.matchType || "AND"}
                                onChange={(e) =>
                                    onChange({
                                        ...action,
                                        matchType: e.target.value,
                                    })
                                }
                                label="Match Type"
                            >
                                <MenuItem value="AND">
                                    All conditions must match (AND)
                                </MenuItem>

                                <MenuItem value="OR">
                                    Any condition can match (OR)
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <Typography variant="caption" color="textSecondary">
                            Conditions
                        </Typography>

                        {(action.conditions || []).map((condition, condIdx) => (
                            <ConditionConfig
                                key={condIdx}
                                condition={condition}
                                onChange={(updated) => {
                                    const newConditions = [...(action.conditions || [])];
                                    newConditions[condIdx] = updated;

                                    onChange({
                                        ...action,
                                        conditions: newConditions,
                                    });
                                }}
                                onDelete={() => {
                                    const newConditions = (action.conditions || []).filter(
                                        (_, i) => i !== condIdx
                                    );

                                    onChange({
                                        ...action,
                                        conditions: newConditions,
                                    });
                                }}
                            />
                        ))}

                        <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() =>
                                onChange({
                                    ...action,
                                    conditions: [
                                        ...(action.conditions || []),
                                        {
                                            field: "",
                                            operator: "EQUALS",
                                            value: "",
                                        },
                                    ],
                                })
                            }
                            sx={{ alignSelf: "flex-start" }}
                        >
                            Add Condition
                        </Button>
                    </Stack>
                );

            case "WAIT":
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Duration"
                                value={action.delay?.value || ""}
                                onChange={(e) =>
                                    onChange({
                                        ...action,
                                        delay: { ...action.delay, value: parseInt(e.target.value) || 0 },
                                    })
                                }
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Unit</InputLabel>
                                <Select
                                    value={action.delay?.unit || "minutes"}
                                    onChange={(e) =>
                                        onChange({
                                            ...action,
                                            delay: { ...action.delay, unit: e.target.value },
                                        })
                                    }
                                    label="Unit"
                                >
                                    <MenuItem value="minutes">Minutes</MenuItem>
                                    <MenuItem value="hours">Hours</MenuItem>
                                    <MenuItem value="days">Days</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                );

            case "ASSIGN_COUNSELLOR":
                return (
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Counsellor ID"
                            value={action.value || ""}
                            onChange={(e) => onChange({ ...action, value: e.target.value })}
                            size="small"
                        />
                    </Grid>
                );

            case "WEBHOOK":
                return (
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Webhook URL"
                            value={action.meta?.url || ""}
                            onChange={(e) =>
                                onChange({
                                    ...action,
                                    meta: { ...action.meta, url: e.target.value, method: "POST" },
                                })
                            }
                            size="small"
                            placeholder="https://api.example.com/webhook"
                        />
                    </Grid>
                );
            case "MOVE_PIPELINE":
                return (
                    <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                            <InputLabel>
                                Select Pipeline
                            </InputLabel>
                            <Select
                                value={action.value || ""}
                                label="Select Pipeline"
                                onChange={(e) =>
                                    onChange({
                                        ...action,
                                        value: e.target.value
                                    })
                                }
                            >
                                {pipelines?.map((pipeline) => (
                                    <MenuItem
                                        key={pipeline._id}
                                        value={pipeline.name}
                                    >
                                        {pipeline.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                );

            default:
                return null;
        }
    };

    const getActionIcon = () => {
        switch (action.type) {
            case "SEND_WHATSAPP":
                return <WhatsAppIcon sx={{ color: "#25D366" }} />;
            case "SEND_EMAIL":
                return <EmailIcon sx={{ color: "#EA4335" }} />;
            case "SEND_SMS":
                return <SmsIcon sx={{ color: "#34B7F1" }} />;
            case "CREATE_TASK":
                return <TaskIcon color="primary" />;
            case "ADD_TAG":
            case "REMOVE_TAG":
                return <TagIcon color="warning" />;
            case "WAIT":
                return <ScheduleIcon color="info" />;
            case "WEBHOOK":
                return <WebhookIcon color="secondary" />;
            case "CONDITION":
                return <CheckCircleIcon color="success" />;
            default:
                return <EditIcon />;
        }
    };

    return (
        <Card variant="outlined" sx={{ mb: 2, bgcolor: alpha('#f5f5f5', 0.5) }}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        {getActionIcon()}
                        <Typography variant="subtitle2" fontWeight="bold">
                            {action.type.replace(/_/g, " ")}
                        </Typography>
                    </Stack>
                    <IconButton size="small" onClick={onDelete} color="error">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Stack>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Action Type</InputLabel>
                            <Select
                                value={action.type}
                                onChange={(e) => onChange({ ...action, type: e.target.value })}
                                label="Action Type"
                            >
                                <MenuItem value="SEND_WHATSAPP">Send WhatsApp</MenuItem>
                                <MenuItem value="CONDITION">Condition</MenuItem>
                                <MenuItem value="SEND_EMAIL">Send Email</MenuItem>
                                <MenuItem value="CALL_NOW">Connect Over Call</MenuItem>
                                <MenuItem value="SEND_SMS">Send SMS</MenuItem>
                                <MenuItem value="CREATE_TASK">Create Task</MenuItem>
                                <MenuItem value="ADD_TAG">Add Tag</MenuItem>
                                <MenuItem value="CHECK_TAG">Check Tag</MenuItem>
                                <MenuItem value="REMOVE_TAG">Remove Tag</MenuItem>
                                <MenuItem value="UPDATE_FIELD">Update Field</MenuItem>
                                <MenuItem value="ASSIGN_COUNSELLOR">Assign Counsellor</MenuItem>
                                <MenuItem value="MOVE_PIPELINE">Move Pipeline</MenuItem>
                                <MenuItem value="WAIT">Wait</MenuItem>
                                <MenuItem value="WEBHOOK">Webhook</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    {getActionFields()}
                </Grid>
            </CardContent>
        </Card>
    );
};

// Condition Component
const ConditionConfig = ({ condition, onChange, onDelete }) => {
    return (
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <TextField
                size="small"
                placeholder="Field"
                value={condition.field || ""}
                onChange={(e) => onChange({ ...condition, field: e.target.value })}
                sx={{ flex: 2 }}
            />
            <FormControl size="small" sx={{ flex: 1.5 }}>
                <Select
                    value={condition.operator || "EQUALS"}
                    onChange={(e) => onChange({ ...condition, operator: e.target.value })}
                >
                    <MenuItem value="EQUALS">Equals</MenuItem>
                    <MenuItem value="NOT_EQUALS">Not Equals</MenuItem>
                    <MenuItem value="GREATER_THAN">Greater Than</MenuItem>
                    <MenuItem value="LESS_THAN">Less Than</MenuItem>
                    <MenuItem value="CONTAINS">Contains</MenuItem>
                    <MenuItem value="EXISTS">Exists</MenuItem>
                    <MenuItem value="NOT_EXISTS">Not Exists</MenuItem>
                </Select>
            </FormControl>
            {condition.operator !== "EXISTS" && condition.operator !== "NOT_EXISTS" && (
                <TextField
                    size="small"
                    placeholder="Value"
                    value={condition.value || ""}
                    onChange={(e) => onChange({ ...condition, value: e.target.value })}
                    sx={{ flex: 2 }}
                />
            )}
            <IconButton size="small" onClick={onDelete}>
                <DeleteIcon fontSize="small" />
            </IconButton>
        </Stack>
    );
};

// Main Form Component
const MessageAutomationForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [templates, setTemplates] = useState([]);
    const [pipelines, setPipelines] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "LEAD_NURTURING",
        trigger: {
            type: "LEAD_CREATED",
            filters: {},
            schedule: {
                cron: "",
                timezone: "UTC",
            },
        },
        steps: [],
        startStepId: "",
        status: "DRAFT",
    });

    const [currentStepIndex, setCurrentStepIndex] = useState(0);


    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/ws/templates');
            const templateData = response.data.template || [];
            setTemplates(templateData);
        } catch (error) {
            console.error('Error loading templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const loadPipelines = async () => {
        try {
            const response = await automationAPI.getAll({
                limit: 100
            });
            const pipelineData = response.data.data || [];
            setPipelines(pipelineData);
        } catch (error) {
            console.error('Error loading pipelines:', error);
            toast.error('Failed to load pipelines');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadTemplates();
        loadPipelines();
    }, [])

    // Initialize default steps
    useEffect(() => {
        if (formData.steps.length === 0) {
            const defaultSteps = [
                {
                    stepId: "s1",
                    name: "Start",
                    type: "START",
                    actions: [],
                    transitions: [],
                    ui: { x: 100, y: 100 },
                },
                {
                    stepId: "a1",
                    name: "Send Welcome Message",
                    type: "ACTION",
                    actions: [
                        {
                            type: "SEND_WHATSAPP",
                            variables: {},
                        },
                    ],
                    transitions: [],
                    ui: { x: 100, y: 300 },
                },
                {
                    stepId: "e1",
                    name: "End",
                    type: "END",
                    actions: [],
                    transitions: [],
                    ui: { x: 100, y: 500 },
                },
            ];
            setFormData(prev => ({
                ...prev,
                steps: defaultSteps,
                startStepId: "s1",
            }));
            setCurrentStepIndex(1);
        }
    }, []);

    useEffect(() => {
        if (id) {
            loadAutomation();
        }
    }, [id]);

    const loadAutomation = async () => {
        try {
            setLoading(true);
            const response = await automationAPI.getById(id);
            setFormData(response.data.data);
        } catch (error) {
            toast.error("Failed to load automation");
        } finally {
            setLoading(false);
        }
    };

    const validateStep = (step) => {
        const errors = {};
        if (!step.name) errors.name = "Step name is required";
        if (step.type === "ACTION" && step.actions.length === 0) {
            errors.actions = "At least one action is required";
        }
        return errors;
    };

    const handleAddAction = () => {
        const newSteps = [...formData.steps];
        newSteps[currentStepIndex].actions.push({
            type: "SEND_WHATSAPP",
            variables: {},
        });
        setFormData({ ...formData, steps: newSteps });
    };

    const handleUpdateAction = (actionIndex, updatedAction) => {
        const newSteps = [...formData.steps];
        newSteps[currentStepIndex].actions[actionIndex] = updatedAction;
        setFormData({ ...formData, steps: newSteps });
    };

    const handleDeleteAction = (actionIndex) => {
        const newSteps = [...formData.steps];
        newSteps[currentStepIndex].actions.splice(actionIndex, 1);
        setFormData({ ...formData, steps: newSteps });
    };

    const handleAddTransition = () => {
        const newSteps = [...formData.steps];
        if (!newSteps[currentStepIndex].transitions) {
            newSteps[currentStepIndex].transitions = [];
        }
        newSteps[currentStepIndex].transitions.push({
            name: "New Branch",
            conditions: [],
            matchType: "AND",
            nextStepId: "",
        });
        setFormData({ ...formData, steps: newSteps });
    };

    const handleUpdateTransition = (transitionIndex, updatedTransition) => {
        const newSteps = [...formData.steps];
        newSteps[currentStepIndex].transitions[transitionIndex] = updatedTransition;
        setFormData({ ...formData, steps: newSteps });
    };

    const handleDeleteTransition = (transitionIndex) => {
        const newSteps = [...formData.steps];
        newSteps[currentStepIndex].transitions.splice(transitionIndex, 1);
        setFormData({ ...formData, steps: newSteps });
    };

    const handleAddCondition = (transitionIndex) => {
        const newSteps = [...formData.steps];
        newSteps[currentStepIndex].transitions[transitionIndex].conditions.push({
            field: "",
            operator: "EQUALS",
            value: "",
        });
        setFormData({ ...formData, steps: newSteps });
    };

    const handleAddNewStep = () => {
        const newStepNumber = formData.steps.filter(s => s.type !== "START" && s.type !== "END").length;
        const newStep = {
            stepId: `a${newStepNumber + 1}`,
            name: `Step ${newStepNumber + 1}`,
            type: "ACTION",
            actions: [{ type: "SEND_WHATSAPP", variables: {} }],
            transitions: [],
            ui: { x: 100, y: 100 + (formData.steps.length - 1) * 200 },
        };

        // Insert before END step
        const newSteps = [
            ...formData.steps.slice(0, -1),
            newStep,
            formData.steps[formData.steps.length - 1],
        ];
        setFormData({ ...formData, steps: newSteps });
        setCurrentStepIndex(newSteps.length - 2);
        toast.success("New step added");
    };

    const handleDeleteStep = (stepIndex) => {
        if (formData.steps[stepIndex].type === "START" || formData.steps[stepIndex].type === "END") {
            toast.error("Cannot delete Start or End steps");
            return;
        }

        const newSteps = formData.steps.filter((_, idx) => idx !== stepIndex);
        // Renumber remaining action steps
        let actionCounter = 1;
        const renumberedSteps = newSteps.map(step => {
            if (step.type === "ACTION") {
                return { ...step, stepId: `a${actionCounter++}` };
            }
            return step;
        });

        setFormData({ ...formData, steps: renumberedSteps });
        if (currentStepIndex >= stepIndex) {
            setCurrentStepIndex(Math.max(1, currentStepIndex - 1));
        }
        toast.success("Step deleted");
    };

    const handleSaveAutomation = async () => {
        try {
            setLoading(true);

            // Validate all steps
            let hasErrors = false;
            const newErrors = {};
            formData.steps.forEach((step, idx) => {
                const errors = validateStep(step);
                if (Object.keys(errors).length > 0) {
                    newErrors[idx] = errors;
                    hasErrors = true;
                }
            });

            setValidationErrors(newErrors);

            if (hasErrors) {
                toast.error("Please fix validation errors");
                setActiveStep(2);
                return;
            }

            const automationData = {
                ...formData,
                steps: formData.steps.map(step => ({
                    ...step,
                    transitions: step.transitions || [],
                })),
            };

            if (id) {
                await automationAPI.update(id, automationData);
                toast.success("Automation updated successfully");
            } else {
                await automationAPI.create(automationData);
                toast.success("Automation created successfully");
            }
            navigate(-1);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save automation");
        } finally {
            setLoading(false);
        }
    };

    const steps = ["Basic Info", "Trigger", "Workflow", "Review"];

    const triggerTypes = [
        "LEAD_CREATED",
        "TAG_ADDED",
        "CHECK_TAG",
        "TAG_REMOVED",
        "PAYMENT_PENDING",
        "PAYMENT_COMPLETED",
        "LEAD_UPDATED",
        "MANUAL",
        "API",
        "SCHEDULED",
    ];

    const getStepIcon = (type) => {
        switch (type) {
            case "START":
                return <PlayIcon sx={{ fontSize: 16, color: "#4caf50" }} />;
            case "END":
                return <FlagIcon sx={{ fontSize: 16, color: "#f44336" }} />;
            case "ACTION":
                return <TaskIcon sx={{ fontSize: 16, color: "#2196f3" }} />;
            case "CONDITION":
                return <PauseIcon sx={{ fontSize: 16, color: "#ff9800" }} />;
            case "DELAY":
                return <ScheduleIcon sx={{ fontSize: 16, color: "#9c27b0" }} />;
            default:
                return null;
        }
    };

    if (loading && id) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="max-w-7xl p-2 mx-auto">
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                {/* Header */}
                <Box sx={{ p: 3, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" fontWeight="bold" >
                        {id ? "Edit Message Automation" : "Create Message Automation"}
                    </Typography>
                    <Typography variant="body3" color="textSecondary">
                        Configure your marketing automation workflow with triggers, conditions, and actions
                    </Typography>
                </Box>

                {/* Stepper */}
                <Box sx={{ px: 4, pt: 4 }}>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Form Content */}
                <Box sx={{ px: 4, pb: 4 }}>
                    <AnimatePresence mode="wait">
                        {activeStep === 0 && (
                            <motion.div
                                key="basic"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Grid spacing={4} gap={3} >
                                    <Grid item xs={12}>
                                        <TextField
                                            sx={{ marginBottom: 2 }}
                                            fullWidth
                                            label="Automation Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="e.g., Welcome Message, Payment Reminder, etc."
                                            variant="outlined"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            sx={{ marginBottom: 2 }}
                                            multiline
                                            label="Description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            multiline
                                            rows={3}
                                            placeholder="Describe what this automation does..."
                                            variant="outlined"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Category</InputLabel>
                                            <Select
                                                sx={{ marginBottom: 2 }}

                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                label="Category"
                                            >
                                                <MenuItem value="LEAD_NURTURING">Lead Nurturing</MenuItem>
                                                <MenuItem value="FOLLOW_UP">Follow Up</MenuItem>
                                                <MenuItem value="ADMISSION">Admission</MenuItem>
                                                <MenuItem value="PAYMENT">Payment</MenuItem>
                                                <MenuItem value="VISA">Visa</MenuItem>
                                                <MenuItem value="CUSTOM">Custom</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={formData.status === "ACTIVE"}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            status: e.target.checked ? "ACTIVE" : "DRAFT",
                                                        })
                                                    }
                                                />
                                            }
                                            label="Activate automation immediately"
                                        />
                                    </Grid>
                                </Grid>
                            </motion.div>
                        )}
                        {activeStep === 1 && (
                            <motion.div
                                key="trigger"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Grid spacing={4}>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth>
                                            <InputLabel>Trigger Type</InputLabel>
                                            <Select
                                                sx={{ marginBottom: 2 }}
                                                value={formData.trigger.type}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        trigger: { ...formData.trigger, type: e.target.value, filters: {} },
                                                    })
                                                }
                                                label="Trigger Type"
                                            >
                                                {triggerTypes.map((type) => (
                                                    <MenuItem key={type} value={type}>
                                                        {type.replace(/_/g, " ")}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {formData.trigger.type === "SCHEDULED" && (
                                        <>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Cron Expression"
                                                    value={formData.trigger.schedule?.cron || ""}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            trigger: {
                                                                ...formData.trigger,
                                                                schedule: { ...formData.trigger.schedule, cron: e.target.value },
                                                            },
                                                        })
                                                    }
                                                    placeholder="0 9 * * * (Daily at 9 AM)"
                                                    helperText="Format: Minute Hour Day Month DayOfWeek"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Timezone</InputLabel>
                                                    <Select
                                                        value={formData.trigger.schedule?.timezone || "UTC"}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                trigger: {
                                                                    ...formData.trigger,
                                                                    schedule: { ...formData.trigger.schedule, timezone: e.target.value },
                                                                },
                                                            })
                                                        }
                                                        label="Timezone"
                                                    >
                                                        <MenuItem value="UTC">UTC</MenuItem>
                                                        <MenuItem value="America/New_York">America/New_York</MenuItem>
                                                        <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                                                        <MenuItem value="Asia/Dubai">Asia/Dubai (GST)</MenuItem>
                                                        <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                                                        <MenuItem value="Europe/Berlin">Europe/Berlin (CET)</MenuItem>
                                                        <MenuItem value="Australia/Sydney">Australia/Sydney (AEST)</MenuItem>
                                                        <MenuItem value="Japan">Japan (JST)</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        </>
                                    )}

                                    {/* Filters Section - Show for all trigger types except MANUAL */}
                                    {formData.trigger.type !== "MANUAL" && formData.trigger.type !== "API" && (
                                        <Grid xs={12}>
                                            <Card variant="outlined" sx={{ p: 3, bgcolor: alpha('#f5f5f5', 0.5) }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    Filter Conditions
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 3 }}>
                                                    Apply filters to trigger this automation only for specific leads
                                                </Typography>

                                                <Stack spacing={3}>
                                                    {/* Country Filter */}
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Country
                                                        </Typography>
                                                        <div className="flex w-full gap-2">
                                                            <div className="w-full">
                                                                <FormControl fullWidth size="small">
                                                                    <InputLabel>Country Filter Type</InputLabel>
                                                                    <Select
                                                                        value={formData.trigger.filters?.countryOperator || "IN"}
                                                                        onChange={(e) =>
                                                                            setFormData({
                                                                                ...formData,
                                                                                trigger: {
                                                                                    ...formData.trigger,
                                                                                    filters: {
                                                                                        ...formData.trigger.filters,
                                                                                        countryOperator: e.target.value,
                                                                                    },
                                                                                },
                                                                            })
                                                                        }
                                                                        label="Country Filter Type"
                                                                    >
                                                                        <MenuItem value="IN">Included Countries</MenuItem>
                                                                        <MenuItem value="NOT_IN">Excluded Countries</MenuItem>
                                                                    </Select>
                                                                </FormControl>
                                                            </div>
                                                            <div className="w-full">

                                                                <FormControl fullWidth size="small">
                                                                    <InputLabel>Select Countries</InputLabel>
                                                                    <Select
                                                                        multiple
                                                                        value={formData.trigger.filters?.countries || []}
                                                                        onChange={(e) =>
                                                                            setFormData({
                                                                                ...formData,
                                                                                trigger: {
                                                                                    ...formData.trigger,
                                                                                    filters: {
                                                                                        ...formData.trigger.filters,
                                                                                        countries: e.target.value,
                                                                                    },
                                                                                },
                                                                            })
                                                                        }
                                                                        label="Select Countries"
                                                                        renderValue={(selected) => (
                                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                                {selected.map((value) => (
                                                                                    <Chip key={value} label={value} size="small" />
                                                                                ))}
                                                                            </Box>
                                                                        )}
                                                                    >
                                                                        {false && countries?.map((country) => (
                                                                            <MenuItem key={country.code} value={country.code}>
                                                                                <Checkbox checked={(formData.trigger.filters?.countries || []).indexOf(country.code) > -1} />
                                                                                <ListItemText primary={`${country.flag} ${country.name}`} />
                                                                            </MenuItem>
                                                                        ))}
                                                                    </Select>
                                                                </FormControl>
                                                            </div>
                                                        </div>
                                                    </Box>

                                                    {/* Lead Status Filter */}
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Lead Status
                                                        </Typography>
                                                        <div className="flex w-full gap-2">
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>Status Filter Type</InputLabel>
                                                                <Select
                                                                    value={formData.trigger.filters?.statusOperator || "IN"}
                                                                    onChange={(e) =>
                                                                        setFormData({
                                                                            ...formData,
                                                                            trigger: {
                                                                                ...formData.trigger,
                                                                                filters: {
                                                                                    ...formData.trigger.filters,
                                                                                    statusOperator: e.target.value,
                                                                                },
                                                                            },
                                                                        })
                                                                    }
                                                                    label="Status Filter Type"
                                                                >
                                                                    <MenuItem value="IN">Include Statuses</MenuItem>
                                                                    <MenuItem value="NOT_IN">Exclude Statuses</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>Select Statuses</InputLabel>
                                                                <Select
                                                                    multiple
                                                                    value={formData.trigger.filters?.statuses || []}
                                                                    onChange={(e) =>
                                                                        setFormData({
                                                                            ...formData,
                                                                            trigger: {
                                                                                ...formData.trigger,
                                                                                filters: {
                                                                                    ...formData.trigger.filters,
                                                                                    statuses: e.target.value,
                                                                                },
                                                                            },
                                                                        })
                                                                    }
                                                                    label="Select Statuses"
                                                                    renderValue={(selected) => (
                                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                            {selected.map((value) => (
                                                                                <Chip key={value} label={value} size="small" />
                                                                            ))}
                                                                        </Box>
                                                                    )}
                                                                >
                                                                    {false && leadStatuses.map((status) => (
                                                                        <MenuItem key={status.value} value={status.value}>
                                                                            <Checkbox checked={(formData.trigger.filters?.statuses || []).indexOf(status.value) > -1} />
                                                                            <ListItemText primary={status.label} />
                                                                            <Chip label={status.count} size="small" variant="outlined" />
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </div>
                                                    </Box>

                                                    {/* Lead Source Filter */}
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Lead Source
                                                        </Typography>
                                                        <div className="flex w-full gap-2">
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>Source Filter Type</InputLabel>
                                                                <Select
                                                                    value={formData.trigger.filters?.sourceOperator || "IN"}
                                                                    onChange={(e) =>
                                                                        setFormData({
                                                                            ...formData,
                                                                            trigger: {
                                                                                ...formData.trigger,
                                                                                filters: {
                                                                                    ...formData.trigger.filters,
                                                                                    sourceOperator: e.target.value,
                                                                                },
                                                                            },
                                                                        })
                                                                    }
                                                                    label="Source Filter Type"
                                                                >
                                                                    <MenuItem value="IN">Include Sources</MenuItem>
                                                                    <MenuItem value="NOT_IN">Exclude Sources</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>Select Sources</InputLabel>
                                                                <Select
                                                                    multiple
                                                                    value={formData.trigger.filters?.sources || []}
                                                                    onChange={(e) =>
                                                                        setFormData({
                                                                            ...formData,
                                                                            trigger: {
                                                                                ...formData.trigger,
                                                                                filters: {
                                                                                    ...formData.trigger.filters,
                                                                                    sources: e.target.value,
                                                                                },
                                                                            },
                                                                        })
                                                                    }
                                                                    label="Select Sources"
                                                                    renderValue={(selected) => (
                                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                            {selected.map((value) => (
                                                                                <Chip key={value} label={value} size="small" />
                                                                            ))}
                                                                        </Box>
                                                                    )}
                                                                >
                                                                    {false && leadSources.map((source) => (
                                                                        <MenuItem key={source.value} value={source.value}>
                                                                            <Checkbox checked={(formData.trigger.filters?.sources || []).indexOf(source.value) > -1} />
                                                                            <ListItemText primary={source.label} />
                                                                            <Chip label={source.count} size="small" variant="outlined" />
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </div>
                                                    </Box>

                                                    {/* Score Range Filter */}
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Lead Score Range
                                                        </Typography>
                                                        <div className="flex w-full gap-2">
                                                            <TextField
                                                                fullWidth
                                                                type="number"
                                                                label="Minimum Score"
                                                                size="small"
                                                                value={formData.trigger.filters?.minScore || ""}
                                                                onChange={(e) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        trigger: {
                                                                            ...formData.trigger,
                                                                            filters: {
                                                                                ...formData.trigger.filters,
                                                                                minScore: e.target.value ? parseInt(e.target.value) : null,
                                                                            },
                                                                        },
                                                                    })
                                                                }
                                                                InputProps={{ inputProps: { min: 0, max: 100 } }}
                                                            />
                                                            <TextField
                                                                fullWidth
                                                                type="number"
                                                                label="Maximum Score"
                                                                size="small"
                                                                value={formData.trigger.filters?.maxScore || ""}
                                                                onChange={(e) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        trigger: {
                                                                            ...formData.trigger,
                                                                            filters: {
                                                                                ...formData.trigger.filters,
                                                                                maxScore: e.target.value ? parseInt(e.target.value) : null,
                                                                            },
                                                                        },
                                                                    })
                                                                }
                                                                InputProps={{ inputProps: { min: 0, max: 100 } }}
                                                            />
                                                        </div>
                                                    </Box>

                                                    {/* Date Range Filter */}
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Lead Creation Date
                                                        </Typography>
                                                        <div className="flex w-full gap-2">
                                                            <TextField
                                                                fullWidth
                                                                type="date"
                                                                label="From Date"
                                                                size="small"
                                                                value={formData.trigger.filters?.createdFrom || ""}
                                                                onChange={(e) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        trigger: {
                                                                            ...formData.trigger,
                                                                            filters: {
                                                                                ...formData.trigger.filters,
                                                                                createdFrom: e.target.value,
                                                                            },
                                                                        },
                                                                    })
                                                                }
                                                                InputLabelProps={{ shrink: true }}
                                                            />

                                                            <TextField
                                                                fullWidth
                                                                type="date"
                                                                label="To Date"
                                                                size="small"
                                                                value={formData.trigger.filters?.createdTo || ""}
                                                                onChange={(e) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        trigger: {
                                                                            ...formData.trigger,
                                                                            filters: {
                                                                                ...formData.trigger.filters,
                                                                                createdTo: e.target.value,
                                                                            },
                                                                        },
                                                                    })
                                                                }
                                                                InputLabelProps={{ shrink: true }}
                                                            />
                                                        </div>
                                                    </Box>

                                                    {/* Tags Filter */}
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Tags
                                                        </Typography>
                                                        <div className="flex w-full gap-2">

                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>Tags Filter Type</InputLabel>
                                                                <Select
                                                                    value={formData.trigger.filters?.tagsOperator || "HAS_ANY"}
                                                                    onChange={(e) =>
                                                                        setFormData({
                                                                            ...formData,
                                                                            trigger: {
                                                                                ...formData.trigger,
                                                                                filters: {
                                                                                    ...formData.trigger.filters,
                                                                                    tagsOperator: e.target.value,
                                                                                },
                                                                            },
                                                                        })
                                                                    }
                                                                    label="Tags Filter Type"
                                                                >
                                                                    <MenuItem value="HAS_ANY">Has Any Of These Tags</MenuItem>
                                                                    <MenuItem value="HAS_ALL">Has All Of These Tags</MenuItem>
                                                                    <MenuItem value="NOT_HAS">Does Not Have Tags</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>Select Tags</InputLabel>
                                                                <Select
                                                                    multiple
                                                                    value={formData.trigger.filters?.tags || []}
                                                                    onChange={(e) =>
                                                                        setFormData({
                                                                            ...formData,
                                                                            trigger: {
                                                                                ...formData.trigger,
                                                                                filters: {
                                                                                    ...formData.trigger.filters,
                                                                                    tags: e.target.value,
                                                                                },
                                                                            },
                                                                        })
                                                                    }
                                                                    label="Select Tags"
                                                                    renderValue={(selected) => (
                                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                                                            {selected.map((value) => (
                                                                                <Chip key={value} label={value} size="small" />
                                                                            ))}
                                                                        </Box>
                                                                    )}
                                                                >
                                                                    <MenuItem value="hot_lead">
                                                                        <Checkbox checked={(formData.trigger.filters?.tags || []).indexOf("hot_lead") > -1} />
                                                                        <ListItemText primary="🔥 Hot Lead" />
                                                                    </MenuItem>
                                                                    <MenuItem value="warm_lead">
                                                                        <Checkbox checked={(formData.trigger.filters?.tags || []).indexOf("warm_lead") > -1} />
                                                                        <ListItemText primary="⭐ Warm Lead" />
                                                                    </MenuItem>
                                                                    <MenuItem value="cold_lead">
                                                                        <Checkbox checked={(formData.trigger.filters?.tags || []).indexOf("cold_lead") > -1} />
                                                                        <ListItemText primary="❄️ Cold Lead" />
                                                                    </MenuItem>
                                                                    <MenuItem value="interested">
                                                                        <Checkbox checked={(formData.trigger.filters?.tags || []).indexOf("interested") > -1} />
                                                                        <ListItemText primary="💡 Interested" />
                                                                    </MenuItem>
                                                                    <MenuItem value="not_interested">
                                                                        <Checkbox checked={(formData.trigger.filters?.tags || []).indexOf("not_interested") > -1} />
                                                                        <ListItemText primary="🚫 Not Interested" />
                                                                    </MenuItem>
                                                                    <MenuItem value="follow_up">
                                                                        <Checkbox checked={(formData.trigger.filters?.tags || []).indexOf("follow_up") > -1} />
                                                                        <ListItemText primary="📞 Follow Up Required" />
                                                                    </MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        </div>
                                                    </Box>

                                                    {/* Custom Fields Filter */}
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Custom Fields
                                                        </Typography>
                                                        <Button
                                                            size="small"
                                                            startIcon={<AddIcon />}
                                                            onClick={() => {
                                                                const customFields = [...(formData.trigger.filters?.customFields || [])];
                                                                customFields.push({ field: "", operator: "EQUALS", value: "" });
                                                                setFormData({
                                                                    ...formData,
                                                                    trigger: {
                                                                        ...formData.trigger,
                                                                        filters: {
                                                                            ...formData.trigger.filters,
                                                                            customFields,
                                                                        },
                                                                    },
                                                                });
                                                            }}
                                                            sx={{ mb: 2 }}
                                                        >
                                                            Add Custom Field Filter
                                                        </Button>

                                                        {(formData.trigger.filters?.customFields || []).map((field, idx) => (
                                                            <Card key={idx} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                                                <Stack direction="row" spacing={2} alignItems="center">
                                                                    <TextField
                                                                        size="small"
                                                                        placeholder="Field Name"
                                                                        value={field.field}
                                                                        onChange={(e) => {
                                                                            const newFields = [...(formData.trigger.filters?.customFields || [])];
                                                                            newFields[idx].field = e.target.value;
                                                                            setFormData({
                                                                                ...formData,
                                                                                trigger: {
                                                                                    ...formData.trigger,
                                                                                    filters: {
                                                                                        ...formData.trigger.filters,
                                                                                        customFields: newFields,
                                                                                    },
                                                                                },
                                                                            });
                                                                        }}
                                                                        sx={{ flex: 1 }}
                                                                    />
                                                                    <FormControl size="small" sx={{ flex: 1 }}>
                                                                        <Select
                                                                            value={field.operator}
                                                                            onChange={(e) => {
                                                                                const newFields = [...(formData.trigger.filters?.customFields || [])];
                                                                                newFields[idx].operator = e.target.value;
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    trigger: {
                                                                                        ...formData.trigger,
                                                                                        filters: {
                                                                                            ...formData.trigger.filters,
                                                                                            customFields: newFields,
                                                                                        },
                                                                                    },
                                                                                });
                                                                            }}
                                                                        >
                                                                            <MenuItem value="EQUALS">Equals</MenuItem>
                                                                            <MenuItem value="NOT_EQUALS">Not Equals</MenuItem>
                                                                            <MenuItem value="CONTAINS">Contains</MenuItem>
                                                                            <MenuItem value="GREATER_THAN">Greater Than</MenuItem>
                                                                            <MenuItem value="LESS_THAN">Less Than</MenuItem>
                                                                        </Select>
                                                                    </FormControl>
                                                                    <TextField
                                                                        size="small"
                                                                        placeholder="Value"
                                                                        value={field.value}
                                                                        onChange={(e) => {
                                                                            const newFields = [...(formData.trigger.filters?.customFields || [])];
                                                                            newFields[idx].value = e.target.value;
                                                                            setFormData({
                                                                                ...formData,
                                                                                trigger: {
                                                                                    ...formData.trigger,
                                                                                    filters: {
                                                                                        ...formData.trigger.filters,
                                                                                        customFields: newFields,
                                                                                    },
                                                                                },
                                                                            });
                                                                        }}
                                                                        sx={{ flex: 1 }}
                                                                    />
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => {
                                                                            const newFields = (formData.trigger.filters?.customFields || []).filter((_, i) => i !== idx);
                                                                            setFormData({
                                                                                ...formData,
                                                                                trigger: {
                                                                                    ...formData.trigger,
                                                                                    filters: {
                                                                                        ...formData.trigger.filters,
                                                                                        customFields: newFields,
                                                                                    },
                                                                                },
                                                                            });
                                                                        }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Stack>
                                                            </Card>
                                                        ))}
                                                    </Box>

                                                    {/* Reset Filters Button */}
                                                    <Box display="flex" justifyContent="flex-end">
                                                        <Button
                                                            size="small"
                                                            onClick={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    trigger: {
                                                                        ...formData.trigger,
                                                                        filters: {},
                                                                    },
                                                                });
                                                            }}
                                                        >
                                                            Reset All Filters
                                                        </Button>
                                                    </Box>
                                                </Stack>
                                            </Card>
                                        </Grid>
                                    )}

                                    <Grid item xs={12}>
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            <Typography variant="body2">
                                                The automation will trigger when the selected event occurs. Use filters to narrow down
                                                which leads should trigger this automation.
                                            </Typography>
                                        </Alert>
                                    </Grid>
                                </Grid>
                            </motion.div>
                        )}
                        {activeStep === 2 && (
                            <motion.div
                                key="steps"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Stack spacing={3}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="h6" fontWeight="bold">
                                            Automation Workflow
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={handleAddNewStep}
                                            size="small"
                                        >
                                            Add Step
                                        </Button>
                                    </Box>

                                    <Tabs
                                        value={currentStepIndex}
                                        onChange={(e, newValue) => setCurrentStepIndex(newValue)}
                                        variant="scrollable"
                                        scrollButtons="auto"
                                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                                    >
                                        {formData.steps.map((step, idx) => (
                                            <Tab
                                                key={step.stepId}
                                                label={
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        {getStepIcon(step.type)}
                                                        <span>{step.stepId}: {step.name}</span>
                                                        {(step.type !== "START" && step.type !== "END") && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteStep(idx);
                                                                }}
                                                                sx={{ ml: 1 }}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </Stack>
                                                }
                                                sx={{ textTransform: "none", minHeight: 48 }}
                                            />
                                        ))}
                                    </Tabs>

                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentStepIndex}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Stack spacing={3}>
                                                        <TextField
                                                            fullWidth
                                                            label="Step Name"
                                                            value={formData.steps[currentStepIndex].name}
                                                            onChange={(e) => {
                                                                const newSteps = [...formData.steps];
                                                                newSteps[currentStepIndex].name = e.target.value;
                                                                setFormData({ ...formData, steps: newSteps });
                                                            }}
                                                            error={!!validationErrors[currentStepIndex]?.name}
                                                            helperText={validationErrors[currentStepIndex]?.name}
                                                            disabled={formData.steps[currentStepIndex].type === "START" ||
                                                                formData.steps[currentStepIndex].type === "END"}
                                                        />

                                                        <FormControl fullWidth>
                                                            <InputLabel>Step Type</InputLabel>
                                                            <Select
                                                                value={formData.steps[currentStepIndex].type}
                                                                onChange={(e) => {
                                                                    const newSteps = [...formData.steps];
                                                                    newSteps[currentStepIndex].type = e.target.value;
                                                                    setFormData({ ...formData, steps: newSteps });
                                                                }}
                                                                label="Step Type"
                                                            >
                                                                <MenuItem value="ACTION">Action</MenuItem>
                                                                <MenuItem value="CONDITION">Condition</MenuItem>
                                                                <MenuItem value="DELAY">Delay</MenuItem>
                                                            </Select>
                                                        </FormControl>

                                                        {formData.steps[currentStepIndex].type === "ACTION" && (
                                                            <Stack spacing={2}>
                                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                                        Actions
                                                                    </Typography>
                                                                    <Button
                                                                        size="small"
                                                                        startIcon={<AddIcon />}
                                                                        onClick={handleAddAction}
                                                                        variant="outlined"
                                                                    >
                                                                        Add Action
                                                                    </Button>
                                                                </Box>
                                                                {formData.steps[currentStepIndex].actions.map((action, idx) => (
                                                                    <ActionConfig
                                                                        key={idx}
                                                                        action={action}
                                                                        onChange={(updated) => handleUpdateAction(idx, updated)}
                                                                        onDelete={() => handleDeleteAction(idx)}
                                                                        templates={templates}
                                                                        pipelines={pipelines}
                                                                    />
                                                                ))}
                                                                {formData.steps[currentStepIndex].actions.length === 0 && (
                                                                    <Alert severity="warning">
                                                                        No actions added. Add at least one action.
                                                                    </Alert>
                                                                )}
                                                            </Stack>
                                                        )}

                                                        {formData.steps[currentStepIndex].type === "DELAY" && (
                                                            <Stack spacing={2}>
                                                                <Alert severity="info">
                                                                    This step will pause the automation for the specified duration
                                                                </Alert>
                                                                <Grid container spacing={2}>
                                                                    <Grid item xs={6}>
                                                                        <TextField
                                                                            fullWidth
                                                                            type="number"
                                                                            label="Duration"
                                                                            value={formData.steps[currentStepIndex].delay?.value || ""}
                                                                            onChange={(e) => {
                                                                                const newSteps = [...formData.steps];
                                                                                newSteps[currentStepIndex].delay = {
                                                                                    ...newSteps[currentStepIndex].delay,
                                                                                    value: parseInt(e.target.value) || 0,
                                                                                };
                                                                                setFormData({ ...formData, steps: newSteps });
                                                                            }}
                                                                        />
                                                                    </Grid>
                                                                    <Grid item xs={6}>
                                                                        <FormControl fullWidth>
                                                                            <InputLabel>Unit</InputLabel>
                                                                            <Select
                                                                                value={formData.steps[currentStepIndex].delay?.unit || "minutes"}
                                                                                onChange={(e) => {
                                                                                    const newSteps = [...formData.steps];
                                                                                    newSteps[currentStepIndex].delay = {
                                                                                        ...newSteps[currentStepIndex].delay,
                                                                                        unit: e.target.value,
                                                                                    };
                                                                                    setFormData({ ...formData, steps: newSteps });
                                                                                }}
                                                                                label="Unit"
                                                                            >
                                                                                <MenuItem value="minutes">Minutes</MenuItem>
                                                                                <MenuItem value="hours">Hours</MenuItem>
                                                                                <MenuItem value="days">Days</MenuItem>
                                                                            </Select>
                                                                        </FormControl>
                                                                    </Grid>
                                                                </Grid>
                                                            </Stack>
                                                        )}

                                                        <Stack spacing={2}>
                                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                <Typography variant="subtitle1" fontWeight="bold">
                                                                    {formData.steps[currentStepIndex].type === "CONDITION" ? "Branches" : "Transitions"}
                                                                </Typography>
                                                                <Button
                                                                    size="small"
                                                                    startIcon={<AddIcon />}
                                                                    onClick={handleAddTransition}
                                                                    variant="outlined"
                                                                >
                                                                    Add {formData.steps[currentStepIndex].type === "CONDITION" ? "Branch" : "Transition"}
                                                                </Button>
                                                            </Box>

                                                            {(formData.steps[currentStepIndex].transitions || []).map((transition, idx) => (
                                                                <Card key={idx} variant="outlined" sx={{ p: 2, bgcolor: alpha('#fafafa', 0.5) }}>
                                                                    <Stack spacing={2}>
                                                                        <Stack direction="row" spacing={2} alignItems="center">
                                                                            <TextField
                                                                                size="small"
                                                                                label="Branch Name"
                                                                                value={transition.name}
                                                                                onChange={(e) =>
                                                                                    handleUpdateTransition(idx, { ...transition, name: e.target.value })
                                                                                }
                                                                                sx={{ flex: 1 }}
                                                                            />
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => handleDeleteTransition(idx)}
                                                                                color="error"
                                                                            >
                                                                                <DeleteIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Stack>
                                                                        <>
                                                                            <FormControl fullWidth size="small">
                                                                                <InputLabel>Match Type</InputLabel>
                                                                                <Select
                                                                                    value={transition.matchType}
                                                                                    onChange={(e) =>
                                                                                        handleUpdateTransition(idx, {
                                                                                            ...transition,
                                                                                            matchType: e.target.value,
                                                                                        })
                                                                                    }
                                                                                    label="Match Type"
                                                                                >
                                                                                    <MenuItem value="AND">All conditions must match (AND)</MenuItem>
                                                                                    <MenuItem value="OR">Any condition can match (OR)</MenuItem>
                                                                                </Select>
                                                                            </FormControl>

                                                                            <Typography variant="caption" color="textSecondary">
                                                                                Conditions
                                                                            </Typography>
                                                                            {transition.conditions.map((condition, condIdx) => (
                                                                                <ConditionConfig
                                                                                    key={condIdx}
                                                                                    condition={condition}
                                                                                    onChange={(updated) => {
                                                                                        const newConditions = [...transition.conditions];
                                                                                        newConditions[condIdx] = updated;
                                                                                        handleUpdateTransition(idx, {
                                                                                            ...transition,
                                                                                            conditions: newConditions,
                                                                                        });
                                                                                    }}
                                                                                    onDelete={() => {
                                                                                        const newConditions = transition.conditions.filter(
                                                                                            (_, i) => i !== condIdx
                                                                                        );
                                                                                        handleUpdateTransition(idx, {
                                                                                            ...transition,
                                                                                            conditions: newConditions,
                                                                                        });
                                                                                    }}
                                                                                />
                                                                            ))}
                                                                            <Button
                                                                                size="small"
                                                                                startIcon={<AddIcon />}
                                                                                onClick={() => handleAddCondition(idx)}
                                                                                sx={{ alignSelf: 'flex-start' }}
                                                                            >
                                                                                Add Condition
                                                                            </Button>
                                                                        </>
                                                                        <FormControl fullWidth size="small">
                                                                            <InputLabel>Next Step</InputLabel>
                                                                            <Select
                                                                                value={transition.nextStepId}
                                                                                onChange={(e) =>
                                                                                    handleUpdateTransition(idx, {
                                                                                        ...transition,
                                                                                        nextStepId: e.target.value,
                                                                                    })
                                                                                }
                                                                                label="Next Step"
                                                                            >
                                                                                {formData.steps.map((step) => (
                                                                                    <MenuItem key={step.stepId} value={step.stepId}>
                                                                                        {step.stepId}: {step.name} ({step.type})
                                                                                    </MenuItem>
                                                                                ))}
                                                                            </Select>
                                                                        </FormControl>
                                                                    </Stack>
                                                                </Card>
                                                            ))}
                                                        </Stack>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    </AnimatePresence>
                                </Stack>
                            </motion.div>
                        )}

                        {/* Step 4: Review & Save */}
                        {activeStep === 3 && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    Review your automation configuration before saving
                                </Alert>

                                <Accordion defaultExpanded>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography fontWeight="bold">Basic Information</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="textSecondary">Name</Typography>
                                                <Typography variant="body1">{formData.name}</Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="textSecondary">Category</Typography>
                                                <Chip label={formData.category.replace(/_/g, " ")} size="small" />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="textSecondary">Description</Typography>
                                                <Typography variant="body1">{formData.description || "—"}</Typography>
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>

                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography fontWeight="bold">Trigger Configuration</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="body2" color="textSecondary">Trigger Type</Typography>
                                        <Typography variant="body1">{formData.trigger.type.replace(/_/g, " ")}</Typography>
                                        {formData.trigger.type === "SCHEDULED" && (
                                            <>
                                                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                                                    Cron Schedule
                                                </Typography>
                                                <Typography variant="body1">{formData.trigger.schedule?.cron || "—"}</Typography>
                                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                                    Timezone
                                                </Typography>
                                                <Typography variant="body1">{formData.trigger.schedule?.timezone || "UTC"}</Typography>
                                            </>
                                        )}
                                    </AccordionDetails>
                                </Accordion>

                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography fontWeight="bold">Workflow Steps</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Stack spacing={2}>
                                            {formData.steps.map((step, idx) => (
                                                <Card key={step.stepId} variant="outlined" sx={{ p: 2 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                                        {getStepIcon(step.type)}
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            {step.stepId}: {step.name}
                                                        </Typography>
                                                        <Chip label={step.type} size="small" />
                                                    </Stack>
                                                    {step.type === "ACTION" && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            {step.actions.length} action(s)
                                                        </Typography>
                                                    )}
                                                    {step.type === "CONDITION" && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            {step.transitions?.length || 0} branch(es)
                                                        </Typography>
                                                    )}
                                                    {step.type === "DELAY" && step.delay && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            Wait {step.delay.value} {step.delay.unit}
                                                        </Typography>
                                                    )}
                                                    {step.transitions && step.transitions.length > 0 && (
                                                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                                                            {step.transitions.map((t, i) => (
                                                                <Chip
                                                                    key={i}
                                                                    label={`→ ${t.nextStepId}`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            ))}
                                                        </Stack>
                                                    )}
                                                </Card>
                                            ))}
                                        </Stack>
                                    </AccordionDetails>
                                </Accordion>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <Box display="flex" justifyContent="space-between" mt={4}>
                        <Button
                            variant="outlined"
                            onClick={() => setActiveStep((prev) => prev - 1)}
                            disabled={activeStep === 0}
                            size="large"
                        >
                            Back
                        </Button>
                        <Box>
                            {activeStep === steps.length - 1 ? (
                                <Button
                                    variant="contained"
                                    onClick={handleSaveAutomation}
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} /> : null}
                                    size="large"
                                    sx={{ px: 4 }}
                                >
                                    {id ? "Update Automation" : "Create Automation"}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={() => setActiveStep((prev) => prev + 1)}
                                    size="large"
                                    sx={{ px: 4 }}
                                >
                                    Next
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </div >
    );
};

export default MessageAutomationForm;