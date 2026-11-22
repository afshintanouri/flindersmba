import { ArrowLeft, ArrowRight } from "lucide-react";
/** Navigate to a hash path (see lib/routes.ts). */
export type Go = (s: string) => void;
export function Frame({
  label,
  title,
  desc,
  children,
  back,
  className,
}: {
  label: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
  back?: () => void;
  /** Extra class for screen-specific entrance motion (CSS only). */
  className?: string;
}) {
  return (
    <section className={"wrap frame" + (className ? " " + className : "")}>
      {back && (
        <button className="back" onClick={back}>
          <ArrowLeft size={16} />
          Back
        </button>
      )}
      <div className="eyebrow">
        <i />
        {label}
      </div>
      <h1>{title}</h1>
      {desc && <p className="lead">{desc}</p>}
      {children}
    </section>
  );
}
export function Action({
  onClick,
  children,
  secondary = false,
  disabled = false,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  secondary?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      className={"action " + (secondary ? "secondary" : "") + (className ? " " + className : "")}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      <ArrowRight size={17} />
    </button>
  );
}
export function Chips({ items }: { items: string[] }) {
  return (
    <div className="chips">
      {items.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  );
}
