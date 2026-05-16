// components/automation/StepConfigPanel.jsx
import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import ActionConfig from "./ActionConfig";
import ConditionConfig from "./ConditionConfig";

const StepConfigPanel = ({ step, onSave, onClose }) => {
  const [stepName, setStepName] = useState(step?.name || "");
  const [stepType, setStepType] = useState(step?.type || "ACTION");
  const [actions, setActions] = useState(step?.actions || []);
  const [transitions, setTransitions] = useState(step?.transitions || []);
  const [delayValue, setDelayValue] = useState(step?.delay?.value || "");
  const [delayUnit, setDelayUnit] = useState(step?.delay?.unit || "minutes");

  const addAction = () => {
    setActions([
      ...actions,
      {
        type: "SEND_WHATSAPP",
        variables: new Map(),
        meta: {},
      },
    ]);
  };

  const updateAction = (index, action) => {
    const newActions = [...actions];
    newActions[index] = action;
    setActions(newActions);
  };

  const removeAction = (index) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const addTransition = () => {
    setTransitions([
      ...transitions,
      {
        name: "New Branch",
        conditions: [],
        matchType: "AND",
        nextStepId: "",
      },
    ]);
  };

  const updateTransition = (index, transition) => {
    const newTransitions = [...transitions];
    newTransitions[index] = transition;
    setTransitions(newTransitions);
  };

  const removeTransition = (index) => {
    setTransitions(transitions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const stepConfig = {
      stepId: step?.stepId || `step_${Date.now()}`,
      name: stepName,
      type: stepType,
      actions: stepType === "ACTION" ? actions : [],
      transitions: transitions,
    };

    if (stepType === "DELAY") {
      stepConfig.delay = {
        value: parseInt(delayValue),
        unit: delayUnit,
      };
    }

    onSave(stepConfig);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-xl z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Configure Step</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X size={20} />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium mb-1">Step Name</label>
          <input
            type="text"
            value={stepName}
            onChange={(e) => setStepName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter step name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Step Type</label>
          <select
            value={stepType}
            onChange={(e) => setStepType(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="ACTION">Action</option>
            <option value="CONDITION">Condition</option>
            <option value="DELAY">Delay</option>
          </select>
        </div>

        {/* Delay Configuration */}
        {stepType === "DELAY" && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Delay Configuration</h4>
            <div>
              <label className="block text-sm font-medium mb-1">Delay Value</label>
              <input
                type="number"
                value={delayValue}
                onChange={(e) => setDelayValue(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select
                value={delayUnit}
                onChange={(e) => setDelayUnit(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        )}

        {/* Actions Section */}
        {stepType === "ACTION" && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Actions</h4>
              <button
                onClick={addAction}
                className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-800"
              >
                <Plus size={16} /> Add Action
              </button>
            </div>
            <div className="space-y-3">
              {actions.map((action, index) => (
                <div key={index} className="border rounded-lg p-3 relative bg-gray-50">
                  <button
                    onClick={() => removeAction(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ActionConfig
                    action={action}
                    onChange={(updated) => updateAction(index, updated)}
                  />
                </div>
              ))}
              {actions.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No actions added. Click "Add Action" to configure.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Transitions Section */}
        {(stepType === "CONDITION" || (stepType === "ACTION" && transitions.length > 0)) && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">
                {stepType === "CONDITION" ? "Branches" : "Transitions"}
              </h4>
              {stepType === "CONDITION" && (
                <button
                  onClick={addTransition}
                  className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-800"
                >
                  <Plus size={16} /> Add Branch
                </button>
              )}
            </div>
            <div className="space-y-3">
              {transitions.map((transition, index) => (
                <div key={index} className="border rounded-lg p-3 relative bg-gray-50">
                  <button
                    onClick={() => removeTransition(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ConditionConfig
                    transition={transition}
                    onChange={(updated) => updateTransition(index, updated)}
                  />
                </div>
              ))}
              {stepType === "CONDITION" && transitions.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No branches added. Click "Add Branch" to create conditional paths.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="sticky bottom-0 bg-white border-t pt-4 mt-6">
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Save Step
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepConfigPanel;