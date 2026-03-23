// src/pages/StudyMaterialPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Image,
  Music,
  Video,
  File,
  Search,
  X,
  Eye,
  Lock
} from 'lucide-react';
import Button from '../components/ui/button/Button';
import SecureMaterialViewer from './SecureMaterial';

// Types
interface StudyMaterial {
  _id: string;
  title: string;
  description: string;
  materialType: 'pdf' | 'document' | 'link' | 'image' | 'audio' | 'video';
  file?: {
    url: string;
    publicId: string;
    size: number;
    mimeType: string;
  };
  content?: {
    pages?: number;
    downloadCount: number;
  };
  course: {
    title: string;
  };
  instructor: {
    name: string;
  };
  createdAt: string;
  tags: string[];
  publishedAt: string;
}

// Dummy data
const dummyStudyMaterials = [
  {
    _id: "1",
    title: "Advanced React Hooks Guide",
    description: "Comprehensive guide to React hooks...",
    course: { title: "Mastering React" },
    instructor: { name: "Dr. Sarah Johnson" },
    materialType: "pdf",
    file: { url: "", publicId: "", size: 4215808 },
    content: { pages: 87, downloadCount: 1240 },
    createdAt: "2024-01-10T08:15:22.000Z",
    publishedAt: "2024-01-15T10:30:00.000Z",
    tags: ["react", "javascript", "frontend"]
  },
  {
    _id: "2",
    title: "Calculus I - Limits & Derivatives",
    description: "Complete lecture notes on limits...",
    course: { title: "University Calculus I" },
    instructor: { name: "Prof. Michael Chen" },
    materialType: "pdf",
    file: { url: "", publicId: "", size: 6812672 },
    content: { pages: 120, downloadCount: 980 },
    createdAt: "2024-01-28T11:30:45.000Z",
    publishedAt: "2024-02-05T09:20:00.000Z",
    tags: ["calculus", "math", "derivatives"]
  },
  {
    _id: "3",
    title: "React Performance Optimization",
    description: "Techniques to optimize React apps...",
    course: { title: "Mastering React" },
    instructor: { name: "Dr. Sarah Johnson" },
    materialType: "video",
    file: { url: "", publicId: "", size: 1073741824 },
    content: { pages: null, downloadCount: 890 },
    createdAt: "2024-02-20T14:30:00.000Z",
    publishedAt: "2024-02-25T10:00:00.000Z",
    tags: ["react", "performance", "optimization"]
  },
  {
    _id: "4",
    title: "Linear Algebra Visualized",
    description: "Visual explanations of linear algebra...",
    course: { title: "University Calculus I" },
    instructor: { name: "Prof. Michael Chen" },
    materialType: "image",
    file: { url: "", publicId: "", size: 8388608 },
    content: { pages: null, downloadCount: 540 },
    createdAt: "2024-03-10T09:15:00.000Z",
    publishedAt: "2024-03-15T11:30:00.000Z",
    tags: ["linear-algebra", "math", "visualization"]
  },
  {
    _id: "5",
    title: "Python Data Science Cheat Sheet",
    description: "Quick reference guide for Pandas...",
    course: { title: "Data Science with Python" },
    instructor: { name: "Dr. Emily Rodriguez" },
    materialType: "pdf",
    file: { url: "", publicId: "", size: 2145280 },
    content: { pages: 12, downloadCount: 2150 },
    createdAt: "2024-01-20T16:22:10.000Z",
    publishedAt: "2024-01-28T13:45:00.000Z",
    tags: ["python", "data-science", "pandas"]
  },
  {
    _id: "6",
    title: "Machine Learning Audio Lecture",
    description: "Audio lecture on ML fundamentals...",
    course: { title: "Machine Learning Fundamentals" },
    instructor: { name: "Dr. Lisa Thompson" },
    materialType: "audio",
    file: { url: "", publicId: "", size: 25165824 },
    content: { pages: null, downloadCount: 320 },
    createdAt: "2024-02-10T08:45:20.000Z",
    publishedAt: "2024-02-18T12:15:00.000Z",
    tags: ["machine-learning", "ai", "audio"]
  }
];

// Create more items
const expandedMaterials = [];
for (let i = 0; i < 20; i++) {
  const original = dummyStudyMaterials[i % dummyStudyMaterials.length];
  expandedMaterials.push({
    ...original,
    _id: original._id + i,
    title: `${original.title} ${i > 5 ? `#${Math.floor(i / 6) + 1}` : ''}`,
    content: {
      ...original.content,
      downloadCount: original.content.downloadCount + Math.floor(Math.random() * 500)
    }
  });
}

const StudyMaterialPage = () => {
  const [materials] = useState(expandedMaterials);
  const [loading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Filter materials by tab and search
  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      // Tab filter
      const matchesTab = activeTab === 'all' ||
        (activeTab === 'documents' && (material.materialType === 'pdf' || material.materialType === 'document')) ||
        (activeTab === 'images' && material.materialType === 'image') ||
        (activeTab === 'videos' && material.materialType === 'video') ||
        (activeTab === 'audio' && material.materialType === 'audio');

      // Search filter
      const matchesSearch =
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesTab && matchesSearch;
    });
  }, [materials, activeTab, searchQuery]);

  const getIcon = (type: string) => {
    const iconClass = "h-14 w-14";
    switch (type) {
      case 'pdf': return <img src="https://static.vecteezy.com/system/resources/previews/019/016/806/non_2x/adobe-acrobat-reader-icon-free-png.png" alt="PDF" className={`${iconClass} text-red-500`} />;
      case 'image': return <Image className={`${iconClass} text-green-500`} />;
      case 'audio': return <Music className={`${iconClass} text-blue-500`} />;
      case 'video': return <Video className={`${iconClass} text-purple-500`} />;
      case 'document': return <File className={`${iconClass} text-orange-500`} />;
      default: return <FileText className={`${iconClass} text-gray-500`} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'document': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'image': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'audio': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'video': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (selectedMaterial) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900">
        <div className="relative mx-auto">
          <Button
            onClick={() => setSelectedMaterial(null)}
            className="absolute -top-2 -right-2 z-60 rounded-full text-gray-400 dark:text-gray-500"
            variant=""
            size="sm"
          >
            <X className="h-9 w-9 text-gray-400 rounded-full border dark:border-gray-700 p-2 dark:text-gray-500  hover:bg-gray-100" />
          </Button>
          <SecureMaterialViewer material={selectedMaterial} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-6">

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials, courses, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[
            { id: 'all', label: 'All', count: materials.length },
            { id: 'documents', label: 'Documents', count: materials.filter(m => m.materialType === 'pdf' || m.materialType === 'document').length },
            { id: 'images', label: 'Images', count: materials.filter(m => m.materialType === 'image').length },
            { id: 'videos', label: 'Videos', count: materials.filter(m => m.materialType === 'video').length },
            { id: 'audio', label: 'Audio', count: materials.filter(m => m.materialType === 'audio').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
                }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* File Grid */}
        {filteredMaterials.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-10 max-w-md mx-auto shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
              <FileText className="h-20 w-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                No materials found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                Try adjusting your search or selecting a different tab.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            // layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3"
          >
            <AnimatePresence>
              {filteredMaterials.map(material => (
                <motion.div
                  key={material._id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  // exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedMaterial(material)}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800/50 cursor-pointer transition-all duration-300 overflow-hidden group"
                >
                  {/* File Icon */}
                  <div className="p-6 flex flex-col items-center">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl mb-3 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                      {getIcon(material.materialType)}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm dark:text-white text-center line-clamp-2">
                      {material.title}
                    </h4>
                    {/* <div className={`px-3 py-1 rounded-full text-xs font-medium mb-1 ${getTypeColor(material.materialType)}`}>
                      {material.materialType.charAt(0).toUpperCase() + material.materialType.slice(1)}
                    </div> */}
                  </div>

                  {/* File Details */}
                  <div className="px-6 pb-2">
                    {/* <div className="space-y-3"> */}
                    {/* <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1.5" />
                          {material.content?.downloadCount || 0} views
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1.5" />
                          {formatDate(material.publishedAt)}
                        </span>
                      </div> */}
                    {/* <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span className="truncate">{material.course.title}</span>
                        <span>{formatFileSize(material.file?.size || 0)}</span>
                      </div> */}
                    {/* </div> */}

                    {/* View Button */}
                    {/* <div className="p-3">
                      <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </div>
                    </div> */}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Security Notice */}
        <div className="mt-12 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center justify-center">

            <div className="text-center flex">
              <Lock className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
              <p className="text-blue-700 dark:text-blue-300 text-base">
                All materials are protected with digital rights management. Downloads, printing, and sharing are disabled to protect intellectual property.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyMaterialPage;