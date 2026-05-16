// components/automation/ActionConfig.jsx
import React, { useState } from "react";
import { Trash2, Plus } from "lucide-react";

const ActionConfig = ({ action, onChange }) => {
  const [actionType, setActionType] = useState(action.type || "SEND_WHATSAPP");
  const [templateId, setTemplateId] = useState(action.templateId || "");
  const [delayValue, setDelayValue] = useState(action.delay?.value || "");
  const [delayUnit, setDelayUnit] = useState(action.delay?.unit || "minutes");
  const [field, setField] = useState(action.field || "");
  const [value, setValue] = useState(action.value || "");
  const [variables, setVariables] = useState(Object.fromEntries(action.variables || new Map()));
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarValue, setNewVarValue] = useState("");

  const handleActionChange = (updatedAction) => {
    onChange(updatedAction);
  };

  const updateAction = () => {
    const updatedAction = {
      type: actionType,
      variables: new Map(Object.entries(variables)),
      meta: {},
    };

    // Add type-specific fields
    if (["SEND_WHATSAPP", "SEND_EMAIL", "SEND_SMS"].includes(actionType)) {
      updatedAction.templateId = templateId;
    } else if (actionType === "WAIT") {
      updatedAction.delay = {
        value: parseInt(delayValue),
        unit: delayUnit,
      };
    } else if (["UPDATE_FIELD", "ASSIGN_COUNSELLOR"].includes(actionType)) {
      updatedAction.field = field;
      updatedAction.value = value;
    } else if (["ADD_TAG", "REMOVE_TAG"].includes(actionType)) {
      updatedAction.value = value;
    } else if (actionType === "WEBHOOK") {
      updatedAction.meta = {
        url: value,
        method: "POST",
      };
    }

    handleActionChange(updatedAction);
  };

  React.useEffect(() => {
    updateAction();
  }, [actionType, templateId, delayValue, delayUnit, field, value, variables]);

  const addVariable = () => {
    if (newVarKey && newVarValue) {
      setVariables({
        ...variables,
        [newVarKey]: newVarValue,
      });
      setNewVarKey("");
      setNewVarValue("");
    }
  };

  const removeVariable = (key) => {
    const newVariables = { ...variables };
    delete newVariables[key];
    setVariables(newVariables);
  };

  const getActionFields = () => {
    switch (actionType) {
      case "SEND_WHATSAPP":
      case "SEND_EMAIL":
      case "SEND_SMS":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Template ID</label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Select template"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Variables</label>
              <div className="space-y-2">
                {Object.entries(variables).map(([key, val]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={key}
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      readOnly
                    />
                    <input
                      type="text"
                      value={val}
                      onChange={(e) =>
                        setVariables({ ...variables, [key]: e.target.value })
                      }
                      className="flex-1 border rounded px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => removeVariable(key)}
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Variable name"
                    value={newVarKey}
                    onChange={(e) => setNewVarKey(e.target.value)}
                    className="flex-1 border rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Value/Expression"
                    value={newVarValue}
                    onChange={(e) => setNewVarValue(e.target.value)}
                    className="flex-1 border rounded px-2 py-1 text-sm"
                  />
                  <button
                    onClick={addVariable}
                    className="bg-blue-600 text-white px-3 rounded text-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "WAIT":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Delay Value</label>
              <input
                type="number"
                value={delayValue}
                onChange={(e) => setDelayValue(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Enter number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select
                value={delayUnit}
                onChange={(e) => setDelayUnit(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        );

      case "ADD_TAG":
      case "REMOVE_TAG":
        return (
          <div>
            <label className="block text-sm font-medium mb-1">Tag Name</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Enter tag name"
            />
          </div>
        );

      case "UPDATE_FIELD":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Field Name</label>
              <input
                type="text"
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="e.g., status, score, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="New value"
              />
            </div>
          </div>
        );

      case "ASSIGN_COUNSELLOR":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Counsellor ID</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Select counsellor"
              />
            </div>
          </div>
        );

      case "WEBHOOK":
        return (
          <div>
            <label className="block text-sm font-medium mb-1">Webhook URL</label>
            <input
              type="url"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="https://api.example.com/webhook"
            />
          </div>
        );

      case "MOVE_PIPELINE":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Target Pipeline</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Select pipeline"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Action Type</label>
        <select
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="SEND_WHATSAPP">Send WhatsApp</option>
          <option value="SEND_EMAIL">Send Email</option>
          <option value="SEND_SMS">Send SMS</option>
          <option value="CREATE_TASK">Create Task</option>
          <option value="ADD_TAG">Add Tag</option>
          <option value="REMOVE_TAG">Remove Tag</option>
          <option value="UPDATE_FIELD">Update Field</option>
          <option value="ASSIGN_COUNSELLOR">Assign Counsellor</option>
          <option value="MOVE_PIPELINE">Move Pipeline</option>
          <option value="WAIT">Wait/Delay</option>
          <option value="WEBHOOK">Webhook</option>
        </select>
      </div>

      {getActionFields()}
    </div>
  );
};

export default ActionConfig;