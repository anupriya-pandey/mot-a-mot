interface SectionHeaderProps {
  icon?: string;
  title: string;
}

export function SectionHeader({ icon, title }: SectionHeaderProps) {
  return (
    <div className="mb-m">
      <div className="mb-s flex items-center gap-s">
        {icon && <span className="text-lg">{icon}</span>}
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="h-px w-full bg-border" />
    </div>
  );
}
