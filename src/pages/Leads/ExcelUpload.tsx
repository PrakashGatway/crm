import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import {
    Upload,
    X,
    Check,
    FileSpreadsheet,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    Loader2
} from "lucide-react";
import api from "../../axiosInstance";

const LEAD_FIELD_OPTIONS = [
    { value: "fullName", label: "Full Name", required: true },
    { value: "email", label: "Email", required: true },
    { value: "phone", label: "Phone", required: false },
    { value: "countryOfResidence", label: "Country", required: false },
    { value: "city", label: "City", required: false },
    { value: "coursePreference", label: "Course Preference", required: true },
    { value: "intendedIntake", label: "Intended Intake", required: false },
    { value: "status", label: "Status", required: false },
    { value: "source", label: "Source", required: false },
];

export default function ExcelUpload({
    onUploadComplete,
    onClose,
    uploadApiEndpoint = "/leads/bulk"
}) {
    const [uploadStep, setUploadStep] = useState(1); // 1: Upload, 2: Map, 3: Preview, 4: Upload
    const [excelHeaders, setExcelHeaders] = useState([]);
    const [excelRows, setExcelRows] = useState([]);
    const [columnMapping, setColumnMapping] = useState({});
    const [excelPreview, setExcelPreview] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [mappingStats, setMappingStats] = useState({ mapped: 0, total: 0 });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [extraFieldConsent, setExtraFieldConsent] = useState({});



    // Calculate mapping stats whenever columnMapping changes
    useEffect(() => {
        if (excelHeaders.length > 0) {
            const mappedCount = Object.values(columnMapping).filter(Boolean).length;
            setMappingStats({
                mapped: mappedCount,
                total: excelHeaders.length
            });
        }
    }, [columnMapping, excelHeaders]);

    const unmappedColumns = excelHeaders.filter(
        col => !columnMapping[col]
    );


    const handleFileUpload = (file) => {
        if (!file) return;

        setSelectedFile(file);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const json = XLSX.utils.sheet_to_json(worksheet, {
                    defval: "",
                });

                if (!json.length) {
                    toast.error("Excel file is empty");
                    return;
                }

                const headers = Object.keys(json[0]);
                setExcelHeaders(headers);
                setExcelRows(json);
                setExcelPreview(json.slice(0, 5));
                setUploadStep(2);

                // Initialize auto-mapping
                const initialMapping = {};
                headers.forEach(header => {
                    const headerLower = header.toLowerCase().trim();

                    // Auto-detect common fields
                    if (headerLower.includes('name') || headerLower.includes('full'))
                        initialMapping[header] = 'fullName';
                    else if (headerLower.includes('email') || headerLower.includes('mail'))
                        initialMapping[header] = 'email';
                    else if (headerLower.includes('phone') || headerLower.includes('mobile') || headerLower.includes('contact'))
                        initialMapping[header] = 'phone';
                    else if (headerLower.includes('country'))
                        initialMapping[header] = 'countryOfResidence';
                    else if (headerLower.includes('city') || headerLower.includes('location'))
                        initialMapping[header] = 'city';
                    else if (headerLower.includes('course') || headerLower.includes('program'))
                        initialMapping[header] = 'coursePreference';
                    else if (headerLower.includes('intake') || headerLower.includes('start'))
                        initialMapping[header] = 'intendedIntake';
                    else if (headerLower.includes('status'))
                        initialMapping[header] = 'status';
                    else if (headerLower.includes('source') || headerLower.includes('origin'))
                        initialMapping[header] = 'source';
                });
                setColumnMapping(initialMapping);

                toast.success(`${json.length} records loaded from "${file.name}"`);
            } catch (error) {
                toast.error("Error reading file: " + error.message);
            }
        };

        reader.onerror = () => {
            toast.error("Error reading file");
        };

        reader.readAsArrayBuffer(file);
    };

const buildLeadsFromMapping = () => {
    const usedFields = Object.values(columnMapping).filter(Boolean);

    const duplicates = usedFields.filter(
        (v, i) => usedFields.indexOf(v) !== i
    );
    if (duplicates.length) {
        toast.error("Each Lead field can be mapped only once");
        return null;
    }

    const leads = excelRows.map((row) => {
        const lead = {};
        const extraDetails = {};

        Object.entries(row).forEach(([excelCol, rawValue]) => {
            const mappedField = columnMapping[excelCol];
            const consent = extraFieldConsent[excelCol];
            let value = rawValue;

            if (value === null || value === undefined || value === "") return;

            if (mappedField) {
                if (mappedField === "intendedIntake") {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        value = date.toISOString().split("T")[0];
                    }
                }
                lead[mappedField] = String(value).trim();
            } 
            else if (consent === true) {
                extraDetails[excelCol] = String(value).trim();
            }
        });

        if (Object.keys(extraDetails).length > 0) {
            lead.extraDetails = extraDetails;
        }

        lead.status = lead.status || "new";
        lead.source = lead.source || "excel";

        return lead;
    });

    return leads;
};


    const handleUpload = async () => {
        const leads = buildLeadsFromMapping();
        if (!leads) return;
        console.log(leads);

        if (!leads.length) {
            toast.warn("No leads to upload");
            return;
        }

        try {
            setUploading(true);
            setUploadStep(4);

            // Simulate upload progress
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            // Here you would make your API call
            // Example:
            const res = await api.post(uploadApiEndpoint, { leads });

            clearInterval(interval);
            setUploadProgress(100);

            toast.success(`✅ Successfully processed ${leads.length} leads`);

            if (onUploadComplete) {
                onUploadComplete(leads);
            }
            setTimeout(() => {
                resetUpload();
            }, 500);
        } catch (err) {
            toast.error("Upload failed: " + (err.message || "Unknown error"));
            setUploadStep(3);
        } finally {
            setUploading(false);
        }
    };

    const resetUpload = () => {
        setExcelHeaders([]);
        setExcelRows([]);
        setColumnMapping({});
        setExcelPreview([]);
        setSelectedFile(null);
        setUploadStep(1);
        setMappingStats({ mapped: 0, total: 0 });
        setUploadProgress(0);
        if (onClose) onClose();
    };


    return (
        <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-6">
                {/* <div>
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                        {uploadStep === 1 && "Upload Excel File"}
                        {uploadStep === 2 && "Map Columns"}
                        {uploadStep === 3 && "Preview Data"}
                        {uploadStep === 4 && "Uploading Leads"}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {uploadStep === 1 && "Upload an Excel file containing lead data"}
                        {uploadStep === 2 && "Map Excel columns to lead fields"}
                        {uploadStep === 3 && "Review the data before uploading"}
                        {uploadStep === 4 && "Uploading leads to the system"}
                    </p>
                </div> */}
                {/* <button
                    onClick={resetUpload}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    disabled={uploading}
                >
                    <X className="h-5 w-5" />
                </button> */}
            </div>
            {/* Step 1: File Upload */}
            {uploadStep === 1 && (
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                                <FileSpreadsheet className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h5 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                                Drop your Excel file here
                            </h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Supports .xlsx, .xls, .csv files
                            </p>
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    hidden
                                    onChange={(e) => handleFileUpload(e.target.files[0])}
                                />
                                <div className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    Browse Files
                                </div>
                            </label>
                            <p className="text-xs text-gray-400 mt-3">
                                Max file size: 10MB
                            </p>
                        </div>
                    </div>

                    {selectedFile && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="h-8 w-8 text-green-500" />
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-white">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                </div>
            )}

            {/* Step 2: Column Mapping */}
            {uploadStep === 2 && (
                <div className="space-y-6">
                    <div className="flex items-center justify-start">
                        <div>
                            <h5 className="text-lg font-medium text-gray-800 dark:text-white">
                                Map Excel Columns
                            </h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {excelRows.length} records found • {excelHeaders.length} columns detected
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                    {mappingStats.mapped}/{mappingStats.total} mapped
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Fields marked with <span className="font-bold">*</span> are required
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                        {excelHeaders.map((col) => {
                            const isMapped = Boolean(columnMapping[col]);

                            return (
                                <div
                                    key={col}
                                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2"
                                >
                                    {/* Column header */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{col}</p>
                                            <p className="text-xs text-gray-500 truncate">
                                                Sample: {excelRows[0]?.[col]?.toString().slice(0, 30) || "Empty"}
                                            </p>
                                        </div>

                                        <select
                                            value={columnMapping[col] || ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setColumnMapping((prev) => ({
                                                    ...prev,
                                                    [col]: value,
                                                }));

                                                // Reset extra detail choice if mapped
                                                if (value) {
                                                    setExtraFieldConsent((prev) => {
                                                        const copy = { ...prev };
                                                        delete copy[col];
                                                        return copy;
                                                    });
                                                }
                                            }}
                                            className="w-48 rounded-md border px-3 py-2 text-sm"
                                        >
                                            <option value="">— Not Mapped —</option>
                                            {LEAD_FIELD_OPTIONS.map((f) => (
                                                <option key={f.value} value={f.value}>
                                                    {f.label} {f.required && "*"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Extra Detail Question */}
                                    {!isMapped && (
                                        <div className="ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                Store this field in <b>Extra Details</b>?
                                            </p>

                                            <div className="flex gap-4 text-sm">
                                                <label className="flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        checked={extraFieldConsent[col] === true}
                                                        onChange={() =>
                                                            setExtraFieldConsent((prev) => ({
                                                                ...prev,
                                                                [col]: true,
                                                            }))
                                                        }
                                                    />
                                                    Yes
                                                </label>

                                                <label className="flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        checked={extraFieldConsent[col] === false}
                                                        onChange={() =>
                                                            setExtraFieldConsent((prev) => ({
                                                                ...prev,
                                                                [col]: false,
                                                            }))
                                                        }
                                                    />
                                                    No
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                    </div>

                    <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                        <button
                            onClick={() => setUploadStep(1)}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back
                        </button>
                        <button
                            onClick={() => {
                                const leads = buildLeadsFromMapping();
                                if (leads) {
                                    setUploadStep(3);
                                }
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={mappingStats.mapped === 0}
                        >
                            Continue to Preview
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Data Preview */}
            {uploadStep === 3 && (
                <div className="space-y-6">
                    <div>
                        <h5 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                            Preview Leads ({excelRows.length} records)
                        </h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Review the data before uploading. Only mapped columns are shown.
                        </p>
                    </div>

                    <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                        <div className="overflow-x-auto max-h-96">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                    <tr>
                                        {excelHeaders
                                            .filter(col => columnMapping[col])
                                            .map(col => (
                                                <th
                                                    key={col}
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 dark:text-gray-500 text-xs">
                                                            {col}
                                                        </span>
                                                        <ChevronRight className="h-3 w-3 text-gray-400" />
                                                        <span className="font-medium">
                                                            {LEAD_FIELD_OPTIONS.find(f => f.value === columnMapping[col])?.label}
                                                            {LEAD_FIELD_OPTIONS.find(f => f.value === columnMapping[col])?.required && (
                                                                <span className="text-red-500 ml-1">*</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </th>
                                            ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {excelPreview.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            {excelHeaders
                                                .filter(col => columnMapping[col])
                                                .map(col => (
                                                    <td key={col} className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                                                        {row[col] ? (
                                                            <span className="truncate max-w-xs block">{row[col]}</span>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Empty</span>
                                                        )}
                                                    </td>
                                                ))}
                                        </tr>
                                    ))}
                                    {excelRows.length > 5 && (
                                        <tr>
                                            <td
                                                colSpan={excelHeaders.filter(col => columnMapping[col]).length}
                                                className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800"
                                            >
                                                ... and {excelRows.length - 5} more records
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                        <button
                            onClick={() => setUploadStep(2)}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Mapping
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={resetUpload}
                                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        Upload Leads
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Upload Progress */}
            {uploadStep === 4 && (
                <div className="space-y-6 py-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-900/30 mb-6 relative">
                            {uploading ? (
                                <>
                                    <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-medium text-indigo-600">
                                            {uploadProgress}%
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <Check className="h-10 w-10 text-green-500" />
                            )}
                        </div>

                        <h5 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                            {uploading ? 'Uploading Leads...' : 'Upload Complete!'}
                        </h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            {uploading
                                ? `Processing ${excelRows.length} leads. Please don't close this window.`
                                : `Successfully uploaded ${excelRows.length} leads to the system.`
                            }
                        </p>

                        {uploading && (
                            <div className="mt-6 max-w-md mx-auto">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                                    {uploadProgress}% complete
                                </p>
                            </div>
                        )}

                        {!uploading && (
                            <div className="mt-6">
                                <button
                                    onClick={resetUpload}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}