import { Upload, MapPin, Activity, Camera, Bot } from "lucide-react";

interface UploadHubProps {
  onOpenFieldForm: () => void;
  onNavigateToTelemetry: () => void;
  onNavigateToImagery: () => void;
  onNavigateToPrescriptions: () => void;
}

const ACTIONS = [
  {
    id: "field",
    label: "Create Field",
    description: "Add field boundary + zones",
    icon: MapPin,
    color: "from-green-600/20 to-green-800/10",
    border: "border-green-500/20 hover:border-green-500/40",
    iconColor: "text-green-400",
    onClick: "onOpenFieldForm",
  },
  {
    id: "telemetry",
    label: "Upload Telemetry",
    description: "Import J1939 or ISOBUS data",
    icon: Activity,
    color: "from-blue-600/20 to-blue-800/10",
    border: "border-blue-500/20 hover:border-blue-500/40",
    iconColor: "text-blue-400",
    onClick: "onNavigateToTelemetry",
  },
  {
    id: "imagery",
    label: "Upload Drone Photo",
    description: "AI-powered crop diagnosis",
    icon: Camera,
    color: "from-purple-600/20 to-purple-800/10",
    border: "border-purple-500/20 hover:border-purple-500/40",
    iconColor: "text-purple-400",
    onClick: "onNavigateToImagery",
  },
  {
    id: "prescription",
    label: "Generate Prescription",
    description: "AI VRA prescription from data",
    icon: Bot,
    color: "from-amber-600/20 to-amber-800/10",
    border: "border-amber-500/20 hover:border-amber-500/40",
    iconColor: "text-amber-400",
    onClick: "onNavigateToPrescriptions",
  },
];

export function UploadHub({
  onOpenFieldForm,
  onNavigateToTelemetry,
  onNavigateToImagery,
  onNavigateToPrescriptions,
}: UploadHubProps) {
  const handlers: Record<string, () => void> = {
    onOpenFieldForm,
    onNavigateToTelemetry,
    onNavigateToImagery,
    onNavigateToPrescriptions,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-200">Quick Actions</h3>
        <Upload size={16} className="text-slate-500" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ACTIONS.map((action, i) => (
          <button
            key={action.id}
            onClick={() => handlers[action.onClick]?.()}
            className={`
              bg-gradient-to-br ${action.color} border ${action.border}
              rounded-xl p-4 text-left transition-all duration-200
              hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20
              active:scale-[0.98]
              animate-stagger-${i + 1}
            `}
          >
            <action.icon size={22} className={`${action.iconColor} mb-2`} />
            <p className="text-sm font-medium text-white">{action.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
