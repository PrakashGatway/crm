// components/automation/AutomationEditor.jsx
import React, { useCallback, useState, useEffect, useRef } from "react";
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Panel,
    MarkerType,
    ReactFlowProvider,
    updateEdge,
    Handle,
    Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { useParams, useNavigate } from "react-router";
import { Save, Plus, Trash2, Edit2, X, Check, ArrowRight, Settings, Eye, EyeOff } from "lucide-react";
import { automationAPI } from "../../axiosInstance";
import { toast } from "react-toastify";
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
    Box,
    Typography,
    IconButton,
    Stack,
    Chip,
    Divider,
    Alert,
    Switch,
    FormControlLabel,
    Grid,
    Card,
    CardContent,
    alpha,
    CircularProgress,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    WhatsApp as WhatsAppIcon,
    Email as EmailIcon,
    Sms as SmsIcon,
    Task as TaskIcon,
    Label as TagIcon,
    Schedule as ScheduleIcon,
    Webhook as WebhookIcon,
    PlayArrow as PlayIcon,
    Flag as FlagIcon,
    Pause as PauseIcon,
} from "@mui/icons-material";

// Custom Node Components with improved styling
const StartNode = ({ data, selected }) => (
    <div className={`relative px-5 py-3 bg-gradient-to-r from-green-400 to-green-500 rounded-xl shadow-lg min-w-[140px] text-center cursor-pointer transition-all duration-200 ${selected ? 'ring-4 ring-green-300 scale-105' : 'hover:scale-102'}`}>
        <Handle
            type="source"
            position={Position.Right}
            className="w-4 h-4 bg-green-600 border-2 border-white rounded-full hover:scale-125 transition-transform"
        />
        <PlayIcon className="w-5 h-5 text-white mx-auto mb-1" />
        <div className="font-semibold text-white">{data.label}</div>
        <div className="text-xs text-green-100 mt-1">Start Point</div>
        <button
            onClick={(e) => { e.stopPropagation(); data.onEdit && data.onEdit(data.step); }}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
        >
            <Settings className="w-3 h-3 text-white" />
        </button>
    </div>
);

const ActionNode = ({ data, selected }) => (
    <div className={`relative px-5 py-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl shadow-lg min-w-[160px] cursor-pointer transition-all duration-200 ${selected ? 'ring-4 ring-blue-300 scale-105' : 'hover:scale-102'}`}>
        <Handle
            type="target"
            position={Position.Top}
            className="w-4 h-4 bg-blue-600 border-2 border-white rounded-full hover:scale-125 transition-transform"
        />
        <Handle
            type="source"
            position={Position.Bottom}
            className="w-4 h-4 bg-blue-600 border-2 border-white rounded-full hover:scale-125 transition-transform"
        />
        <TaskIcon className="w-5 h-5 text-white mx-auto mb-1" />
        <div className="font-semibold text-white">{data.label}</div>
        {data.step?.actions?.length > 0 && (
            <div className="text-xs text-blue-100 mt-1">
                {data.step.actions.length} action(s)
            </div>
        )}
        <button
            onClick={(e) => { e.stopPropagation(); data.onEdit && data.onEdit(data.step); }}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
        >
            <Settings className="w-3 h-3 text-white" />
        </button>
    </div>
);

const ConditionNode = ({ data, selected }) => (
    <div className={`relative px-5 py-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl shadow-lg min-w-[160px] cursor-pointer transition-all duration-200 ${selected ? 'ring-4 ring-orange-300 scale-105' : 'hover:scale-102'}`}>
        <Handle
            type="target"
            position={Position.Top}
            className="w-4 h-4 bg-orange-600 border-2 border-white rounded-full hover:scale-125 transition-transform"
        />
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-4">
            {data.step?.transitions?.map((transition, idx) => (
                <Handle
                    key={idx}
                    type="source"
                    position={Position.Bottom}
                    id={`branch-${idx}`}
                    className={`w-4 h-4 ${idx === 0 ? 'bg-green-600' : 'bg-red-600'} border-2 border-white rounded-full hover:scale-125 transition-transform`}
                    style={{ position: 'relative', transform: 'none', left: 'auto' }}
                />
            ))}
        </div>
        <PauseIcon className="w-5 h-5 text-white mx-auto mb-1" />
        <div className="font-semibold text-white">{data.label}</div>
        {data.step?.transitions?.length > 0 && (
            <div className="text-xs text-orange-100 mt-1">
                {data.step.transitions.length} branch(es)
            </div>
        )}
        <button
            onClick={(e) => { e.stopPropagation(); data.onEdit && data.onEdit(data.step); }}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
        >
            <Settings className="w-3 h-3 text-white" />
        </button>
    </div>
);

const DelayNode = ({ data, selected }) => (
    <div className={`relative px-5 py-3 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl shadow-lg min-w-[160px] cursor-pointer transition-all duration-200 ${selected ? 'ring-4 ring-purple-300 scale-105' : 'hover:scale-102'}`}>
        <Handle
            type="target"
            position={Position.Top}
            className="w-4 h-4 bg-purple-600 border-2 border-white rounded-full hover:scale-125 transition-transform"
        />
        <Handle
            type="source"
            position={Position.Bottom}
            className="w-4 h-4 bg-purple-600 border-2 border-white rounded-full hover:scale-125 transition-transform"
        />
        <ScheduleIcon className="w-5 h-5 text-white mx-auto mb-1" />
        <div className="font-semibold text-white">{data.label}</div>
        {data.step?.delay && (
            <div className="text-xs text-purple-100 mt-1">
                Wait {data.step.delay.value} {data.step.delay.unit}
            </div>
        )}
        <button
            onClick={(e) => { e.stopPropagation(); data.onEdit && data.onEdit(data.step); }}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
        >
            <Settings className="w-3 h-3 text-white" />
        </button>
    </div>
);

const EndNode = ({ data, selected }) => (
    <div className={`relative px-5 py-3 bg-gradient-to-r from-red-400 to-red-500 rounded-xl shadow-lg min-w-[140px] text-center cursor-pointer transition-all duration-200 ${selected ? 'ring-4 ring-red-300 scale-105' : 'hover:scale-102'}`}>
        <Handle
            type="target"
            position={Position.Left}
            className="w-4 h-4 bg-red-600 border-2 border-white rounded-full hover:scale-125 transition-transform"
        />
        <FlagIcon className="w-5 h-5 text-white mx-auto mb-1" />
        <div className="font-semibold text-white">{data.label}</div>
        <div className="text-xs text-red-100 mt-1">End Point</div>
    </div>
);

const nodeTypes = {
    start: StartNode,
    action: ActionNode,
    condition: ConditionNode,
    delay: DelayNode,
    end: EndNode,
};

// Action Configuration Component (reused from form)
const ActionConfigModal = ({ action, onChange, onDelete }) => {
    const getActionFields = () => {
        switch (action.type) {
            case "SEND_WHATSAPP":
            case "SEND_EMAIL":
            case "SEND_SMS":
                return (
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Template ID"
                            value={action.templateId || ""}
                            onChange={(e) => onChange({ ...action, templateId: e.target.value })}
                            placeholder="Enter template ID"
                            size="small"
                        />
                        <Typography variant="caption" color="textSecondary">
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
                    </Stack>
                );

            case "ADD_TAG":
            case "REMOVE_TAG":
                return (
                    <TextField
                        fullWidth
                        label="Tag Name"
                        value={action.value || ""}
                        onChange={(e) => onChange({ ...action, value: e.target.value })}
                        size="small"
                    />
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

            case "WEBHOOK":
                return (
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
            default:
                return <Settings />;
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
                <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Action Type</InputLabel>
                        <Select
                            value={action.type}
                            onChange={(e) => onChange({ ...action, type: e.target.value })}
                            label="Action Type"
                        >
                            <MenuItem value="SEND_WHATSAPP">Send WhatsApp</MenuItem>
                            <MenuItem value="SEND_EMAIL">Send Email</MenuItem>
                            <MenuItem value="SEND_SMS">Send SMS</MenuItem>
                            <MenuItem value="CREATE_TASK">Create Task</MenuItem>
                            <MenuItem value="ADD_TAG">Add Tag</MenuItem>
                            <MenuItem value="REMOVE_TAG">Remove Tag</MenuItem>
                            <MenuItem value="UPDATE_FIELD">Update Field</MenuItem>
                            <MenuItem value="ASSIGN_COUNSELLOR">Assign Counsellor</MenuItem>
                            <MenuItem value="WAIT">Wait</MenuItem>
                            <MenuItem value="WEBHOOK">Webhook</MenuItem>
                        </Select>
                    </FormControl>
                    {getActionFields()}
                </Stack>
            </CardContent>
        </Card>
    );
};

// Step Configuration Modal
const StepConfigPanel = ({ step, onSave, onClose }) => {
    const [config, setConfig] = useState(step || {
        stepId: `step_${Date.now()}`,
        name: "New Step",
        type: "ACTION",
        actions: [],
        transitions: [],
        delay: { value: 1, unit: "minutes" }
    });

    const handleAddAction = () => {
        setConfig({
            ...config,
            actions: [...(config.actions || []), { type: "SEND_WHATSAPP", variables: {} }]
        });
    };

    const handleUpdateAction = (index, updatedAction) => {
        const newActions = [...(config.actions || [])];
        newActions[index] = updatedAction;
        setConfig({ ...config, actions: newActions });
    };

    const handleDeleteAction = (index) => {
        const newActions = (config.actions || []).filter((_, i) => i !== index);
        setConfig({ ...config, actions: newActions });
    };

    const handleAddTransition = () => {
        setConfig({
            ...config,
            transitions: [...(config.transitions || []), {
                name: "New Branch",
                conditions: [],
                matchType: "AND",
                nextStepId: ""
            }]
        });
    };

    const handleUpdateTransition = (index, updatedTransition) => {
        const newTransitions = [...(config.transitions || [])];
        newTransitions[index] = updatedTransition;
        setConfig({ ...config, transitions: newTransitions });
    };

    const handleDeleteTransition = (index) => {
        const newTransitions = (config.transitions || []).filter((_, i) => i !== index);
        setConfig({ ...config, transitions: newTransitions });
    };

    const handleAddCondition = (transitionIndex) => {
        const newTransitions = [...(config.transitions || [])];
        newTransitions[transitionIndex].conditions.push({
            field: "",
            operator: "EQUALS",
            value: ""
        });
        setConfig({ ...config, transitions: newTransitions });
    };

    const handleUpdateCondition = (transitionIndex, conditionIndex, updatedCondition) => {
        const newTransitions = [...(config.transitions || [])];
        newTransitions[transitionIndex].conditions[conditionIndex] = updatedCondition;
        setConfig({ ...config, transitions: newTransitions });
    };

    const handleDeleteCondition = (transitionIndex, conditionIndex) => {
        const newTransitions = [...(config.transitions || [])];
        newTransitions[transitionIndex].conditions = newTransitions[transitionIndex].conditions.filter((_, i) => i !== conditionIndex);
        setConfig({ ...config, transitions: newTransitions });
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Configure Step: {config.name}</Typography>
                    <IconButton onClick={onClose}>
                        <X />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3}>
                    <TextField
                        fullWidth
                        label="Step Name"
                        value={config.name}
                        onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Step Type</InputLabel>
                        <Select
                            value={config.type}
                            onChange={(e) => setConfig({ ...config, type: e.target.value })}
                            label="Step Type"
                        >
                            <MenuItem value="ACTION">Action</MenuItem>
                            <MenuItem value="CONDITION">Condition</MenuItem>
                            <MenuItem value="DELAY">Delay</MenuItem>
                        </Select>
                    </FormControl>

                    {config.type === "ACTION" && (
                        <Stack spacing={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle1" fontWeight="bold">Actions</Typography>
                                <Button size="small" startIcon={<AddIcon />} onClick={handleAddAction} variant="outlined">
                                    Add Action
                                </Button>
                            </Box>
                            {(config.actions || []).map((action, idx) => (
                                <ActionConfigModal
                                    key={idx}
                                    action={action}
                                    onChange={(updated) => handleUpdateAction(idx, updated)}
                                    onDelete={() => handleDeleteAction(idx)}
                                />
                            ))}
                            {(config.actions || []).length === 0 && (
                                <Alert severity="warning">No actions added. Add at least one action.</Alert>
                            )}
                        </Stack>
                    )}

                    {config.type === "DELAY" && (
                        <Stack spacing={2}>
                            <Alert severity="info">This step will pause the automation for the specified duration</Alert>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Duration"
                                        value={config.delay?.value || 1}
                                        onChange={(e) => setConfig({ ...config, delay: { ...config.delay, value: parseInt(e.target.value) || 0 } })}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Unit</InputLabel>
                                        <Select
                                            value={config.delay?.unit || "minutes"}
                                            onChange={(e) => setConfig({ ...config, delay: { ...config.delay, unit: e.target.value } })}
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
                                {config.type === "CONDITION" ? "Branches" : "Transitions"}
                            </Typography>
                            <Button size="small" startIcon={<AddIcon />} onClick={handleAddTransition} variant="outlined">
                                Add {config.type === "CONDITION" ? "Branch" : "Transition"}
                            </Button>
                        </Box>

                        {(config.transitions || []).map((transition, idx) => (
                            <Card key={idx} variant="outlined" sx={{ p: 2 }}>
                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <TextField
                                            size="small"
                                            label="Branch Name"
                                            value={transition.name}
                                            onChange={(e) => handleUpdateTransition(idx, { ...transition, name: e.target.value })}
                                            sx={{ flex: 1 }}
                                        />
                                        <IconButton size="small" onClick={() => handleDeleteTransition(idx)} color="error">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>

                                    {config.type === "CONDITION" && (
                                        <>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Match Type</InputLabel>
                                                <Select
                                                    value={transition.matchType || "AND"}
                                                    onChange={(e) => handleUpdateTransition(idx, { ...transition, matchType: e.target.value })}
                                                    label="Match Type"
                                                >
                                                    <MenuItem value="AND">All conditions must match (AND)</MenuItem>
                                                    <MenuItem value="OR">Any condition can match (OR)</MenuItem>
                                                </Select>
                                            </FormControl>

                                            <Typography variant="caption" color="textSecondary">Conditions</Typography>
                                            {(transition.conditions || []).map((condition, condIdx) => (
                                                <Stack key={condIdx} direction="row" spacing={1} alignItems="center">
                                                    <TextField
                                                        size="small"
                                                        placeholder="Field"
                                                        value={condition.field || ""}
                                                        onChange={(e) => handleUpdateCondition(idx, condIdx, { ...condition, field: e.target.value })}
                                                        sx={{ flex: 2 }}
                                                    />
                                                    <FormControl size="small" sx={{ flex: 1.5 }}>
                                                        <Select
                                                            value={condition.operator || "EQUALS"}
                                                            onChange={(e) => handleUpdateCondition(idx, condIdx, { ...condition, operator: e.target.value })}
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
                                                            onChange={(e) => handleUpdateCondition(idx, condIdx, { ...condition, value: e.target.value })}
                                                            sx={{ flex: 2 }}
                                                        />
                                                    )}
                                                    <IconButton size="small" onClick={() => handleDeleteCondition(idx, condIdx)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
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
                                    )}
                                </Stack>
                            </Card>
                        ))}
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={() => onSave(config)} variant="contained" color="primary">
                    Save Step
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Main Automation Editor Component
const AutomationEditor = ({ formData,
    setFormData }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [showStepModal, setShowStepModal] = useState(false);
    const [currentStepData, setCurrentStepData] = useState(null);
    const [currentNodeId, setCurrentNodeId] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    // const [automationName, setAutomationName] = useState("");
    // const [automationDescription, setAutomationDescription] = useState("");
    // const [automationCategory, setAutomationCategory] = useState("LEAD_NURTURING");
    // const [triggerType, setTriggerType] = useState("MANUAL");
    const [loading, setLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

   const onNodeDragStop = (event, node) => {

    const updatedSteps = formData.steps.map((step) => {

        if (step.stepId === node.id) {

            return {
                ...step,
                ui: {
                    x: node.position.x,
                    y: node.position.y
                }
            };

        }

        return step;

    });

    setFormData({
        ...formData,
        steps: updatedSteps
    });

};

    useEffect(() => {

        if (!formData?.steps) return;

        const flowNodes = formData.steps.map((step, index) => ({
            id: step.stepId,
            type: step.type.toLowerCase(),
            position: step.ui || {
                x: 250,
                y: index * 180
            },
            data: {
                label: step.name,
                step: step,
                onEdit: (stepData) =>
                    openStepModal(stepData, step.stepId)
            }
        }));

        const flowEdges = [];

        formData.steps.forEach((step) => {

            if (step.transitions?.length > 0) {

                step.transitions.forEach((transition, idx) => {

                    if (transition.nextStepId) {

                        flowEdges.push({
                            id: `${step.stepId}-${transition.nextStepId}-${idx}`,
                            source: step.stepId,
                            target: transition.nextStepId,
                            label: transition.name,
                            markerEnd: {
                                type: MarkerType.ArrowClosed
                            },
                            animated: true,
                            style: {
                                stroke: '#888',
                                strokeWidth: 2
                            },
                            data: {
                                transition
                            }
                        });

                    }

                });

            }

        });

        setNodes(flowNodes);
        setEdges(flowEdges);

    }, [formData]);

    const loadAutomation = async () => {
        try {
            setLoading(true);
            const response = await automationAPI.getById(id);
            const automation = response.data.data;


            const flowNodes = automation.steps.map((step) => ({
                id: step.stepId,
                type: step.type.toLowerCase(),
                position: step.ui || { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
                data: {
                    label: step.name,
                    step: step,
                    onEdit: (stepData) => openStepModal(stepData, step.stepId)
                },
            }));

            const flowEdges = [];
            automation.steps.forEach((step) => {
                if (step.transitions && step.transitions.length > 0) {
                    step.transitions.forEach((transition, idx) => {
                        if (transition.nextStepId) {
                            flowEdges.push({
                                id: `${step.stepId}-${transition.nextStepId}-${idx}`,
                                source: step.stepId,
                                target: transition.nextStepId,
                                label: transition.name,
                                markerEnd: { type: MarkerType.ArrowClosed },
                                animated: true,
                                style: { stroke: '#888', strokeWidth: 2 },
                                data: { transition }
                            });
                        }
                    });
                }
            });

            setNodes(flowNodes);
            setEdges(flowEdges);
        } catch (error) {
            console.error("Failed to load automation:", error);
            toast.error("Failed to load automation");
        } finally {
            setLoading(false);
        }
    };

    const initializeNewAutomation = () => {
        const startNodeId = `start_${Date.now()}`;
        const endNodeId = `end_${Date.now()}`;

        const startNode = {
            id: startNodeId,
            type: "start",
            position: { x: 100, y: 100 },
            data: {
                label: "Start",
                step: {
                    stepId: startNodeId,
                    name: "Start",
                    type: "START",
                    actions: [],
                    transitions: []
                },
                onEdit: (step) => openStepModal(step, startNodeId)
            },
        };

        const endNode = {
            id: endNodeId,
            type: "end",
            position: { x: 100, y: 400 },
            data: {
                label: "End",
                step: {
                    stepId: endNodeId,
                    name: "End",
                    type: "END",
                    actions: [],
                    transitions: []
                },
                onEdit: (step) => openStepModal(step, endNodeId)
            },
        };

        setNodes([startNode, endNode]);
    };

    const openStepModal = (step, nodeId) => {
        setCurrentStepData(step || {
            stepId: nodeId || `step_${Date.now()}`,
            name: "New Step",
            type: "ACTION",
            actions: [],
            transitions: [],
            delay: { value: 1, unit: "minutes" }
        });
        setCurrentNodeId(nodeId);
        setShowStepModal(true);
    };

    const saveStepConfig = (stepConfig) => {
        if (currentNodeId) {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === currentNodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                label: stepConfig.name,
                                step: {
                                    ...stepConfig,
                                    stepId: node.id,
                                },
                            },
                        };
                    }
                    return node;
                })
            );
        } else {
            const newNode = {
                id: stepConfig.stepId,
                type: stepConfig.type.toLowerCase(),
                position: { x: 400, y: 200 + Math.random() * 100 },
                data: {
                    label: stepConfig.name,
                    step: stepConfig,
                    onEdit: (step) => openStepModal(step, stepConfig.stepId),
                },
            };
            setNodes((nds) => [...nds, newNode]);
        }
        setShowStepModal(false);
        setCurrentStepData(null);
        setCurrentNodeId(null);
        toast.success("Step configured successfully");
    };

    const addNewStep = () => {
        const newStepId = `step_${Date.now()}`;
        openStepModal(null, newStepId);
    };

    const deleteSelectedNode = () => {
        if (selectedNode) {
            if (selectedNode.type === 'start' || selectedNode.type === 'end') {
                toast.error("Cannot delete Start or End nodes");
                return;
            }
            setEdges((eds) => eds.filter(
                edge => edge.source !== selectedNode.id && edge.target !== selectedNode.id
            ));
            setNodes((nds) => nds.filter(node => node.id !== selectedNode.id));
            setSelectedNode(null);
            toast.success("Step deleted");
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const steps = nodes.map((node) => {
                const outgoingEdges = edges.filter(edge => edge.source === node.id);
                const transitions = outgoingEdges.map((edge, idx) => ({
                    name: edge.label || `Branch ${idx + 1}`,
                    conditions: edge.data?.transition?.conditions || [],
                    matchType: edge.data?.transition?.matchType || "AND",
                    nextStepId: edge.target,
                }));
                return {
                    stepId: node.id,
                    name: node.data.label,
                    type: node.type.toUpperCase(),
                    actions: node.data.step?.actions || [],
                    transitions: transitions,
                    delay: node.data.step?.delay,
                    ui: node.position,
                };
            });

            const startStep = steps.find(step => step.type === "START");
            if (!startStep) {
                toast.error("No start step found in automation");
                setLoading(false);
                return;
            }

            const automationData = {
                name: formData.name || "Untitled Automation",
                description: formData.description,
                category: formData.category,
                trigger: {
                    type: formData.trigger.type,
                    filters: {},
                    schedule: formData.trigger.type === "SCHEDULED" ? { cron: "", timezone: "UTC" } : {}
                },
                steps: steps,
                startStepId: startStep.stepId,
                status: "DRAFT",
            };

            if (id) {
                await automationAPI.update(id, automationData);
                toast.success("Automation updated successfully");
            } else {
                await automationAPI.create(automationData);
                toast.success("Automation created successfully");
            }
            navigate("/automations");
        } catch (error) {
            console.error("Failed to save automation:", error);
            toast.error("Failed to save automation: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const onNodeClick = (event, node) => setSelectedNode(node);

    const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
        setEdges((els) => updateEdge(oldEdge, newConnection, els));
    }, [setEdges]);

    const onConnect = useCallback((params) => {
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);
        if (!sourceNode || !targetNode) {
            toast.error("Invalid connection");
            return;
        }
        if (sourceNode.type === 'end') {
            toast.error("Cannot connect from End node");
            return;
        }
        if (targetNode.type === 'start') {
            toast.error("Cannot connect to Start node");
            return;
        }
        const newEdge = {
            ...params,
            id: `${params.source}-${params.target}-${Date.now()}`,
            markerEnd: { type: MarkerType.ArrowClosed },
            animated: true,
            label: 'Transition',
            style: { stroke: '#888', strokeWidth: 2 },
        };
        setEdges((eds) => addEdge(newEdge, eds));
        toast.success("Connection added");
    }, [nodes, setEdges]);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event) => {
        event.preventDefault();
        const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
        const type = event.dataTransfer.getData('application/reactflow');
        if (!type || !reactFlowInstance || !reactFlowBounds) return;
        const position = reactFlowInstance.project({
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
        });
        const newNodeId = `step_${Date.now()}`;
        const newNode = {
            id: newNodeId,
            type: type,
            position,
            data: {
                label: type === 'action' ? 'New Action' : type === 'condition' ? 'New Condition' : 'New Delay',
                step: {
                    stepId: newNodeId,
                    name: type === 'action' ? 'New Action' : type === 'condition' ? 'New Condition' : 'New Delay',
                    type: type.toUpperCase(),
                    actions: [],
                    transitions: [],
                    delay: type === 'delay' ? { value: 1, unit: "minutes" } : undefined
                },
                onEdit: (step) => openStepModal(step, newNodeId),
            },
        };
        setNodes((nds) => nds.concat(newNode));
    }, [reactFlowInstance, setNodes]);

    const nodeColor = (node) => {
        switch (node.type) {
            case 'start': return '#86efac';
            case 'end': return '#fca5a5';
            case 'condition': return '#fde047';
            case 'delay': return '#c084fc';
            default: return '#93c5fd';
        }
    };

    if (loading && id) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <CircularProgress size={32} className="mx-auto" />
                    <p className="mt-3 text-xs text-gray-600">Loading automation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 text-[11px]">
            {/* ========== COMPACT HEADER ========== */}
            <div className="bg-white border-b px-3 py-2 shrink-0">
                {/* <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Settings className="w-4 h-4 text-blue-600" />
                            <h1 className="text-xs font-semibold truncate">Automation Editor</h1>
                        </div>
                        <div className="h-4 w-px bg-gray-300 shrink-0" />
                        <input
                            type="text"
                            placeholder="Automation Name"
                            value={formData.name || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value
                                })
                            }
                            className="text-xs font-medium border-0 focus:ring-0 focus:outline-none focus:border-b-2 focus:border-blue-500 px-1.5 py-1 bg-transparent min-w-0 flex-1 truncate placeholder:text-gray-400"
                        />
                        <div className="flex gap-2 shrink-0">
                            <select
                                value={formData.category || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        category: e.target.value
                                    })
                                }
                                className="text-[10px] border rounded px-2 py-1 bg-white shrink-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="LEAD_NURTURING">Lead Nurturing</option>
                                <option value="FOLLOW_UP">Follow Up</option>
                                <option value="ADMISSION">Admission</option>
                                <option value="PAYMENT">Payment</option>
                                <option value="VISA">Visa</option>
                                <option value="CUSTOM">Custom</option>
                            </select>
                            <select
                                value={formData.trigger?.type || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        trigger: {
                                            ...formData.trigger,
                                            type: e.target.value
                                        }
                                    })
                                }
                                className="text-[10px] border rounded px-2 py-1 bg-white shrink-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="MANUAL">Manual</option>
                                <option value="LEAD_CREATED">Lead Created</option>
                                <option value="TAG_ADDED">Tag Added</option>
                                <option value="PAYMENT_COMPLETED">Payment</option>
                                <option value="SCHEDULED">Scheduled</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                        <Button
                            variant="outlined"
                            onClick={() => navigate("/automations")}
                            size="small"
                            sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.7rem', height: '28px' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={loading}
                            size="small"
                            sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.7rem', height: '28px' }}
                            startIcon={loading ? <CircularProgress size={12} /> : <Save size={12} />}
                        >
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div> */}
            </div>

            {/* ========== MAIN CONTENT AREA ========== */}
            <div className="flex-1 flex overflow-hidden min-h-0">

                {/* ----- Compact Sidebar ----- */}
                {showSidebar && (
                    <div className="w-40 bg-white border-r flex flex-col shrink-0">
                        <div className="px-2.5 py-2 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-[10px]">Components</h3>
                            <IconButton size="small" onClick={() => setShowSidebar(false)} sx={{ p: 0.5, '& svg': { width: 14, height: 14 } }}>
                                <EyeOff />
                            </IconButton>
                        </div>
                        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                            {[
                                { type: 'action', label: 'Action', desc: 'Send messages, tags', icon: TaskIcon, bg: 'bg-blue-50', border: 'border-blue-200', color: 'text-blue-600' },
                                { type: 'condition', label: 'Condition', desc: 'Branch logic', icon: PauseIcon, bg: 'bg-orange-50', border: 'border-orange-200', color: 'text-orange-600' },
                                { type: 'delay', label: 'Delay', desc: 'Wait duration', icon: ScheduleIcon, bg: 'bg-purple-50', border: 'border-purple-200', color: 'text-purple-600' },
                            ].map((item) => (
                                <div
                                    key={item.type}
                                    draggable
                                    onDragStart={(event) => {
                                        event.dataTransfer.setData('application/reactflow', item.type);
                                        event.dataTransfer.effectAllowed = 'move';
                                    }}
                                    className={`p-2 ${item.bg} ${item.border} border rounded cursor-move hover:opacity-90 transition-opacity`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <item.icon className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
                                        <span className="text-[10px] font-medium truncate">{item.label}</span>
                                    </div>
                                    <p className="text-[9px] text-gray-500 mt-0.5 truncate">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t shrink-0">
                            {selectedNode && selectedNode.type !== 'start' && selectedNode.type !== 'end' && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={deleteSelectedNode}
                                    size="small"
                                    fullWidth
                                    sx={{ fontSize: '0.65rem', py: 0.5, height: '24px' }}
                                    startIcon={<Trash2 size={10} />}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* ----- React Flow Canvas ----- */}
                <div className="flex-1 relative min-w-0" ref={reactFlowWrapper}>
                    {!showSidebar && (
                        <button
                            onClick={() => setShowSidebar(true)}
                            className="absolute top-2 left-2 z-10 p-1.5 bg-white rounded shadow hover:bg-gray-50 transition-colors"
                            title="Show Sidebar"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    )}
                    <ReactFlow
                        nodes={nodes}
                        onNodeDragStop={onNodeDragStop}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onEdgeUpdate={onEdgeUpdate}
                        onNodeClick={onNodeClick}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        fitView
                        snapToGrid
                        snapGrid={[15, 15]}
                        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
                        deleteKeyCode={['Delete', 'Backspace']}
                        onNodesDelete={(deletedNodes) => {
                            deletedNodes.forEach(node => {
                                if (node.type !== 'start' && node.type !== 'end') {
                                    toast.success(`Deleted: ${node.data.label}`);
                                }
                            });
                        }}
                        sx={{
                            '& .react-flow__node': {
                                fontSize: '0.7rem',
                                '& .react-flow__handle': { width: '7px', height: '7px' }
                            },
                            '& .react-flow__edge-text': { fontSize: '0.65rem', background: '#fff', padding: '2px 4px', borderRadius: '3px' },
                            '& .react-flow__controls-button': { width: '24px', height: '24px', '& svg': { width: '12px', height: '12px' } },
                            '& .react-flow__minimap': { '& svg': { fontSize: '8px' } }
                        }}
                    >
                        <Background variant="dots" gap={20} size={0.5} />
                        <Controls showInteractive={false} />
                        <MiniMap
                            nodeColor={nodeColor}
                            nodeStrokeWidth={2}
                            zoomable
                            pannable
                            style={{ width: '90px', height: '60px' }}
                            maskColor="rgba(240, 240, 240, 0.6)"
                        />
                    </ReactFlow>
                </div>
            </div>

            {/* ========== STEP CONFIG MODAL (Full Overlay) ========== */}
            {showStepModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-lg shadow-xl w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-4 py-2.5 border-b flex justify-between items-center shrink-0">
                            <h3 className="font-semibold text-sm">Configure Step</h3>
                            <IconButton size="small" onClick={() => setShowStepModal(false)} sx={{ p: 0.5 }}>
                                <X className="w-4 h-4" />
                            </IconButton>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <StepConfigPanel
                                step={currentStepData}
                                onSave={saveStepConfig}
                                onClose={() => {
                                    setShowStepModal(false);
                                    setCurrentStepData(null);
                                    setCurrentNodeId(null);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Wrap with ReactFlowProvider
const AutomationEditorWithProvider = ({
    formData,
    setFormData
}) => {

    return (
        <>
            <ReactFlowProvider>
                <AutomationEditor
                    formData={formData}
                    setFormData={setFormData}
                />
            </ReactFlowProvider>
        </>
    );
};

export default AutomationEditorWithProvider;