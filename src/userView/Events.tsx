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

const EventCalendar = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode changes
  useEffect(() => {
    const checkDarkMode = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDarkMode(darkMode);
    };

    // Check initial state
    checkDarkMode();

    // Set up observer for class changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Mock data - replace with your API call
  useEffect(() => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockEvents: Event[] = [
          {
            id: "1",
            title: "Mathematics Lecture",
            start: new Date(new Date().setHours(10, 0, 0, 0)),
            end: new Date(new Date().setHours(11, 30, 0, 0)),
            description: "Calculus fundamentals",
            location: "Room 201",
            category: "class",
            instructor: "Dr. Smith",
            course: "MATH 101"
          },
          {
            id: "2",
            title: "Physics Exam",
            start: new Date(new Date().setDate(new Date().getDate() + 2)),
            end: new Date(new Date().setDate(new Date().getDate() + 2)),
            description: "Midterm exam",
            location: "Main Hall",
            category: "exam",
            course: "PHYS 201"
          },
          {
            id: "3",
            title: "Study Abroad Workshop",
            start: new Date(new Date().setDate(new Date().getDate() + 5)),
            end: new Date(new Date().setDate(new Date().getDate() + 5)),
            description: "Application process overview",
            location: "Conference Room A",
            category: "workshop",
            instructor: "Admissions Team"
          },
          {
            id: "4",
            title: "Assignment Deadline",
            start: new Date(new Date().setDate(new Date().getDate() + 7)),
            end: new Date(new Date().setDate(new Date().getDate() + 7)),
            description: "Submit final project",
            category: "deadline",
            course: "CS 301"
          },
          {
            id: "5",
            title: "Chemistry Lab",
            start: new Date(new Date().setDate(new Date().getDate() + 10)),
            end: new Date(new Date().setDate(new Date().getDate() + 10)),
            description: "Organic chemistry experiments",
            location: "Lab 302",
            category: "class",
            instructor: "Prof. Johnson",
            course: "CHEM 202"
          },
          {
            id: "6",
            title: "Research Seminar",
            start: new Date(new Date().setDate(new Date().getDate() + 14)),
            end: new Date(new Date().setDate(new Date().getDate() + 14)),
            description: "Advanced research methods",
            location: "Seminar Room B",
            category: "workshop",
            instructor: "Dr. Wilson"
          }
        ];
        setEvents(mockEvents);
        setLoading(false);
      }, 800);
    } catch (err) {
      setError("Failed to load events");
      setLoading(false);
    }
  }, []);

  // Filter events to show only current and future events
  const currentAndFutureEvents = events.filter(event =>
    new Date(event.end) >= new Date()
  );

  // Event styling based on category
  const eventPropGetter = (event: Event) => {
    const backgroundColor = {
      class: "#3b82f6", // blue
      exam: "#ef4444",  // red
      workshop: "#10b981", // green
      deadline: "#f59e0b", // yellow
      other: "#8b5cf6"  // purple
    }[event.category];

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        border: "none",
        color: "white",
        fontSize: "0.85rem",
        padding: "2px 4px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
      }
    };
  };

  // Agenda view customizations
  const agendaViews = {
    agenda: {
      eventComponent: CustomAgendaRow
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <div className="flex justify-center mb-4">
          <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-red-700 dark:text-red-300 text-lg font-medium mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700">

      <div className="relative">
        {/* CSS for both light and dark modes */}
        <style>{`
          /* Light mode styles */
          .rbc-calendar:not(.dark-mode) .rbc-header,
          .rbc-calendar:not(.dark-mode) .rbc-date-cell,
          .rbc-calendar:not(.dark-mode) .rbc-day-bg,
          .rbc-calendar:not(.dark-mode) .rbc-month-row,
          .rbc-calendar:not(.dark-mode) .rbc-agenda-view table tbody > tr > td,
          .rbc-calendar:not(.dark-mode) .rbc-agenda-view table thead > tr > th,
          .rbc-calendar:not(.dark-mode) .rbc-time-header-content,
          .rbc-calendar:not(.dark-mode) .rbc-time-content,
          .rbc-calendar:not(.dark-mode) .rbc-timeslot-group,
          .rbc-calendar:not(.dark-mode) .rbc-time-slot,
          .rbc-calendar:not(.dark-mode) .rbc-day-slot {
            color: #374151 !important;
            border-color: #e5e7eb !important;
          }
          
          .rbc-calendar:not(.dark-mode) .rbc-off-range-bg {
            background: #f9fafb !important;
          }
          
          .rbc-calendar:not(.dark-mode) .rbc-today {
            background: #dbeafe !important;
          }
          
          .rbc-calendar:not(.dark-mode) .rbc-current-time-indicator {
            background-color: #ef4444 !important;
          }
          
          .rbc-calendar:not(.dark-mode) .rbc-show-more {
            background: transparent !important;
            color: #2563eb !important;
          }
          
          .rbc-calendar:not(.dark-mode) .rbc-agenda-empty {
            color: #6b7280 !important;
          }
          
          /* Dark mode styles */
          .rbc-calendar.dark-mode .rbc-header,
          .rbc-calendar.dark-mode .rbc-date-cell,
          .rbc-calendar.dark-mode .rbc-day-bg,
          .rbc-calendar.dark-mode .rbc-month-row,
          .rbc-calendar.dark-mode .rbc-agenda-view table tbody > tr > td,
          .rbc-calendar.dark-mode .rbc-agenda-view table thead > tr > th,
          .rbc-calendar.dark-mode .rbc-time-header-content,
          .rbc-calendar.dark-mode .rbc-time-content,
          .rbc-calendar.dark-mode .rbc-timeslot-group,
          .rbc-calendar.dark-mode .rbc-time-slot,
          .rbc-calendar.dark-mode .rbc-day-slot {
            color: #f3f4f6 !important;
            border-color: #374151 !important;
          }
          
          .rbc-calendar.dark-mode .rbc-off-range-bg {
            background: #1f2937 !important;
          }
          
          .rbc-calendar.dark-mode .rbc-today {
            background: #1e3a8a !important;
          }
          
          .rbc-calendar.dark-mode .rbc-current-time-indicator {
            background-color: #ef4444 !important;
          }
          
          .rbc-calendar.dark-mode .rbc-show-more {
            background: transparent !important;
            color: #93c5fd !important;
          }
          
          .rbc-calendar.dark-mode .rbc-agenda-empty {
            color: #9ca3af !important;
          }
        `}</style>

        <Calendar
          localizer={localizer}
          events={currentAndFutureEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "700px" }}
          className={`bg-transparent ${isDarkMode ? 'dark-mode' : ''}`}
          components={{
            event: CustomEvent,
            toolbar: CustomToolbar,
            agenda: agendaViews
          }}
          eventPropGetter={eventPropGetter}
          messages={{
            next: "Next",
            previous: "Back",
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
            agenda: "Agenda",
            date: "Date",
            time: "Time",
            event: "Event"
          }}
          formats={{
            dateFormat: "D",
            dayFormat: "ddd D",
            weekdayFormat: "dddd",
            monthHeaderFormat: "MMMM YYYY",
            dayHeaderFormat: "dddd, MMMM D",
            agendaDateFormat: "ddd, MMM D",
            agendaTimeFormat: "hh:mm A",
            agendaHeaderFormat: "ddd, MMM D"
          }}
          views={{ month: true, week: true, day: true, agenda: true }}
          defaultView="month"
          selectable
          onSelectEvent={(event) => {
            alert(`Selected: ${event.title}\n${event.description}`);
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Event Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { category: "class", label: "Class", icon: <BookOpen className="h-4 w-4" />, color: "bg-blue-600" },
            { category: "exam", label: "Exam", icon: <TrendingUp className="h-4 w-4" />, color: "bg-red-600" },
            { category: "workshop", label: "Workshop", icon: <Users className="h-4 w-4" />, color: "bg-green-600" },
            { category: "deadline", label: "Deadline", icon: <Clock className="h-4 w-4" />, color: "bg-yellow-600" },
            { category: "other", label: "Other", icon: <CalendarIcon className="h-4 w-4" />, color: "bg-purple-600" }
          ].map(({ category, label, icon, color }) => (
            <div key={category} className="flex items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className={`${color} w-3 h-3 rounded-full mr-3`}></div>
              <div className="flex items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">{icon}</span>
                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;