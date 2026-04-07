import { useState } from "react";
import { Plus, CheckCircle2, Circle, Calendar, User, AlertCircle } from "lucide-react";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import Badge from "../../components/ui/badge/Badge";

interface Task {
  _id: string;
  title: string;
  dueDate: string;
  priority: string;
  status: string;
  assignedTo: string;
}

interface TasksTabProps {
  tasks: Task[];
}

const priorityStyles: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  Low: "bg-success/10 text-success border-success/20",
};

const TasksTab = ({ tasks: initialTasks }: TasksTabProps) => {
  const [tasks, setTasks] = useState(initialTasks);
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", priority: "Medium" });

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t._id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t));
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    setTasks([{
      _id: `new-${Date.now()}`,
      title: newTask.title,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      priority: newTask.priority,
      status: "pending",
      assignedTo: "You",
    }, ...tasks]);
    setNewTask({ title: "", priority: "Medium" });
    setShowAdd(false);
  };

  const formatDate = (ts: string) => {
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {tasks.length} Tasks • {tasks.filter(t => t.status === "completed").length} completed
        </h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Task
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-xl bg-card border border-border p-4 space-y-3 animate-fade-in">
          <Input
            placeholder="Task title..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button size="sm" onClick={addTask}>Add</Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task._id}
            className={`flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors ${
              task.status === "completed" ? "opacity-60" : ""
            }`}
          >
            <button onClick={() => toggleTask(task._id)} className="mt-0.5 shrink-0">
              {task.status === "completed" ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {formatDate(task.dueDate)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {task.assignedTo}
                </span>
              </div>
            </div>
            <Badge className={priorityStyles[task.priority] || "bg-muted text-muted-foreground"}>
              {task.priority}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksTab;
