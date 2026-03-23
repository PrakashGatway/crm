import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { toast } from "react-toastify";
import api from "../../axiosInstance";

export default function FormAssignmentModal({
  isOpen,
  onClose,
  counselors
}) {

  const [configs, setConfigs] = useState([]);
  const [formId, setFormId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [selectedCounselors, setSelectedCounselors] = useState([]);

  const fetchConfigs = async () => {
    try {
      const res = await api.get("/json/form");
      setConfigs(res.data.data || []);
    } catch (err) {
      toast.error("Failed to fetch configs");
    }
  };

  useEffect(() => {
    if (isOpen) fetchConfigs();
  }, [isOpen]);

  const createConfig = async () => {
    if (!formId || selectedCounselors.length === 0) {
      toast.warn("FormId and counselors required");
      return;
    }

    try {
      await api.post("/json/form", {
        formId,
        campaign_id: campaignId,
        counselors: selectedCounselors
      });

      toast.success("Assignment created");

      setFormId("");
      setCampaignId("");
      setSelectedCounselors([]);

      fetchConfigs();

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const deleteConfig = async (formId) => {
    if (!window.confirm("Delete this assignment?")) return;

    try {
      await api.delete(`/json/form/${formId}`);
      toast.success("Deleted");
      fetchConfigs();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleCounselor = (id) => {
    if (selectedCounselors.includes(id)) {
      setSelectedCounselors(selectedCounselors.filter(c => c !== id));
    } else {
      setSelectedCounselors([...selectedCounselors, id]);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl overflow-hidden">

      <div className="p-8 space-y-3 max-h-[80vh] overflow-y-auto">

        <h2 className="text-xl font-semibold">Form Lead Assignment</h2>

        {/* Create Form */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <input
            placeholder="Form ID"
            value={formId}
            onChange={(e) => setFormId(e.target.value)}
            className="border rounded px-3 py-2"
          />

          <input
            placeholder="Campaign Name"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="border rounded px-3 py-2"
          />

        </div>
         <Button onClick={createConfig} className="!py-2">
            Add Assignment
          </Button>

        {/* Counselor Multi Select */}

        <div>
          <p className="text-sm mb-3 font-medium">Select Counselors</p>

          <div className="flex flex-wrap gap-2">

            {counselors.map(c => (
              <button
                key={c._id}
                onClick={() => toggleCounselor(c._id)}
                className={`px-3 py-1 rounded-full border text-sm 
                ${selectedCounselors.includes(c._id)
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-gray-800"}`}
              >
                {c.name}
              </button>
            ))}

          </div>
        </div>

        {/* Existing Config */}

        <div className="mt-4">

          <h3 className="font-medium mb-2">Existing Assignments</h3>

          <div className="space-y-2">

            {configs.map(c => (

              <div
                key={c.formId}
                className="flex justify-between items-center border rounded-full px-4 py-2"
              >

                <div>
                  <p className="font-medium text-sm">{c.campaign_id}</p>
                  <p className="text-xs text-gray-500">
                    Campaign: {c.formId}
                  </p>
                </div>

                <div className="flex gap-2">

                  <span className="text-sm">
                    {c.counselors.length} counselors
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteConfig(c.formId)}
                  >
                    Delete
                  </Button>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </Modal>
  );
}