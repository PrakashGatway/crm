import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, BookOpen, TrendingUp } from "lucide-react";

// Define event types
interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  category: "class" | "exam" | "workshop" | "deadline" | "other";
  instructor?: string;
  course?: string;
  isAllDay?: boolean;
}

// Localizer for date handling
const localizer = momentLocalizer(moment);

// Custom event component with enhanced styling
const CustomEvent = ({ event }: { event: Event }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "class": return "bg-blue-600 border-blue-700";
      case "exam": return "bg-red-600 border-red-700";
      case "workshop": return "bg-green-600 border-green-700";
      case "deadline": return "bg-yellow-600 border-yellow-700";
      default: return "bg-purple-600 border-purple-700";
    }
  };

  return (
    <div className={`p-2 rounded-lg ${getCategoryColor(event.category)} text-white text-sm truncate relative overflow-hidden`}>
      <div className="font-medium truncate">{event.title}</div>
      <div className="text-xs opacity-90 truncate mt-1">
        {event.isAllDay ? "All Day" : `${moment(event.start).format("HH:mm")} - ${moment(event.end).format("HH:mm")}`}
      </div>
      {event.location && (
        <div className="text-xs opacity-80 mt-1 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {event.location}
        </div>
      )}
    </div>
  );
};

// Custom toolbar component with enhanced design
const CustomToolbar = ({
  date,
  onNavigate,
  onView,
  view
}: {
  date: Date;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  onView: (view: string) => void;
  view: string;
}) => {
  const goToBack = () => onNavigate("PREV");
  const goToNext = () => onNavigate("NEXT");
  const goToToday = () => onNavigate("TODAY");

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
          <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToBack}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <ChevronLeft className="h-4 w-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <ChevronRight className="h-4 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="text-lg font-semibold text-gray-900 dark:text-white min-w-[180px]">
          {moment(date).format("MMMM YYYY")}
        </div>
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          {["month", "week", "day", "agenda"].map((viewType) => (
            <button
              key={viewType}
              className={`px-4 py-2 text-sm capitalize font-medium transition-all duration-200 ${view === viewType
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              onClick={() => onView(viewType)}
            >
              {viewType}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Custom agenda row component
const CustomAgendaRow = ({ event }: { event: Event }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "class": return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "exam": return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "workshop": return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "deadline": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      default: return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300";
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-3">
      <div className="flex items-start">
        <div className={`w-3 h-3 rounded-full ${getCategoryColor(event.category)} mt-1.5 mr-3`}></div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
            <span className={`px-2 py-0.5 rounded text-xs ${getCategoryColor(event.category)}`}>
              {event.category}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {event.isAllDay ? "All Day" : `${moment(event.start).format("HH:mm")} - ${moment(event.end).format("HH:mm")}`}
            </div>
            {event.location && (
              <div className="flex items-center mt-1">
                <Users className="h-4 w-4 mr-1" />
                {event.location}
              </div>
            )}
            {event.instructor && (
              <div className="flex items-center mt-1">
                <BookOpen className="h-4 w-4 mr-1" />
                {event.instructor}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

