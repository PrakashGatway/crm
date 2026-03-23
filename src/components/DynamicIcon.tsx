import * as LucideIcons from "lucide-react";

export default function DynamicIcon({
    name,
    size = 24,
    color = "currentColor",
    className = "",
}) {
    const Icon =                                                                                                                                                                                                                                                         LucideIcons[name]; 

    const FallbackIcon = LucideIcons.HelpCircle;

    return Icon ? (
        <Icon size={size} color={color} className={className} />
    ) : (
        <FallbackIcon size={size} color="red" className={className} />
    );
}
