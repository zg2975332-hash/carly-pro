import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  className?: string;
}

const SectionCard = ({ icon: Icon, title, children, className = "" }: SectionCardProps) => {
  return (
    <div className={`section-card ${className}`}>
      <div className="flex flex-col items-center mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-2">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
};

export default SectionCard;