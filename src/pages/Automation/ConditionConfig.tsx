// components/automation/ConditionConfig.jsx
import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const ConditionConfig = ({ transition, onChange }) => {
  const [branchName, setBranchName] = useState(transition.name || "");
  const [matchType, setMatchType] = useState(transition.matchType || "AND");
  const [conditions, setConditions] = useState(transition.conditions || []);

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        field: "",
        operator: "EQUALS",
        value: "",
      },
    ]);
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...conditions];
    newConditions[index][field] = value;
    setConditions(newConditions);
    updateTransition();
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateTransition = () => {
    onChange({
      name: branchName,
      matchType: matchType,
      conditions: conditions,
      nextStepId: transition.nextStepId,
    });
  };

  React.useEffect(() => {
    updateTransition();
  }, [branchName, matchType, conditions]);

  const getOperatorOptions = (fieldType) => {
    const operators = [
      { value: "EQUALS", label: "Equals" },
      { value: "NOT_EQUALS", label: "Not Equals" },
      { value: "GREATER_THAN", label: "Greater Than" },
      { value: "LESS_THAN", label: "Less Than" },
      { value: "CONTAINS", label: "Contains" },
      { value: "EXISTS", label: "Exists" },
      { value: "NOT_EXISTS", label: "Not Exists" },
    ];
    return operators;
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Branch Name</label>
        <input
          type="text"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="e.g., High Value Lead, Payment Completed, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Conditions Match Type</label>
        <select
          value={matchType}
          onChange={(e) => setMatchType(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="AND">All Conditions Must Match (AND)</option>
          <option value="OR">Any Condition Can Match (OR)</option>
        </select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Conditions</label>
          <button
            onClick={addCondition}
            className="text-blue-600 text-xs flex items-center gap-1 hover:text-blue-800"
          >
            <Plus size={14} /> Add Condition
          </button>
        </div>

        <div className="space-y-2">
          {conditions.map((condition, index) => (
            <div key={index} className="border rounded p-2 bg-gray-50">
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={condition.field}
                    onChange={(e) => updateCondition(index, "field", e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, "operator", e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    {getOperatorOptions().map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
                {condition.operator !== "EXISTS" && condition.operator !== "NOT_EXISTS" && (
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, "value", e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                )}
                <button
                  onClick={() => removeCondition(index)}
                  className="text-red-500 hover:text-red-700 mt-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {conditions.length === 0 && (
            <p className="text-gray-500 text-xs text-center py-2">
              No conditions added. This branch will always be taken.
            </p>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
        <strong>Tip:</strong> Connect this branch to a target step by dragging from the node's handle to another node.
      </div>
    </div>
  );
};

export default ConditionConfig;