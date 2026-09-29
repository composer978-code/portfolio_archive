import {
  Boxes,
  Clapperboard,
  Command,
  Languages,
  LayoutGrid,
  LockKeyhole,
  Mail,
  Music2,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import SpatialEnvironment from "./SpatialEnvironment";

type DockProps = {
  activeFieldIndex?: number;
  onFieldSelect?: (index: number) => void;
  homeMode?: boolean;
};
type DockItem = { label: string; icon: LucideIcon; href?: string; fieldIndex?: number };

const FIELD_TOOLS: DockItem[] = [
  { label: "SOUND", icon: Music2, fieldIndex: 0 },
  { label: "CONTENT", icon: Clapperboard, fieldIndex: 1 },
  { label: "EXPERIENCE", icon: Boxes, fieldIndex: 2 },
  { label: "LANGUAGE", icon: Languages, fieldIndex: 3 },
];
const ROUTE_TOOLS: DockItem[] = [
  { label: "PROFILE", href: "/about", icon: UserRound },
  { label: "FIELDS", href: "/work", icon: LayoutGrid },
  { label: "CONTACT", href: "/contact", icon: Mail },
  { label: "ARCHIVE", href: "/archive", icon: LockKeyhole },
];

export function SiteHeader() {
  const [location] = useLocation();
  return (
    <header className="spatial-topbar glass-surface">
      <Link href="/" className="spatial-system-mark" aria-label="홈 데스크">
        <span className="spatial-system-icon" aria-hidden="true"><Command size={16} /></span>
        <span className="spatial-system-label">FIELD / OS</span>
      </Link>
      <nav className="spatial-top-nav" aria-label="주요 페이지">
        <Link href="/" className={location === "/" ? "is-current" : ""} aria-current={location === "/" ? "page" : undefined}>DESK</Link>
        <Link href="/work" className={location === "/work" ? "is-current" : ""} aria-current={location === "/work" ? "page" : undefined}>FIELDS</Link>
        <Link href="/about" className={location === "/about" ? "is-current" : ""} aria-current={location === "/about" ? "page" : undefined}>PROFILE</Link>
      </nav>
      <div className="spatial-system-status"><i aria-hidden="true" /> <span>SYSTEM READY</span></div>
    </header>
  );
}

export function SpatialDock({ activeFieldIndex, onFieldSelect, homeMode = false }: DockProps) {
  const [location] = useLocation();
  const [hovered, setHovered] = useState<number | null>(null);
  const fieldItems = homeMode ? FIELD_TOOLS : [];
  const allItems = [...fieldItems, ...ROUTE_TOOLS];

  return (
    <nav className={`spatial-dock glass-surface ${homeMode ? "has-fields" : ""}`} aria-label="앱 도크">
      {allItems.map((item, index) => {
        const scale = hovered === index ? 1.27 : hovered !== null && Math.abs(hovered - index) === 1 ? 1.12 : 1;
        const Icon = item.icon;
        const isField = item.fieldIndex !== undefined;
        const selected = isField ? activeFieldIndex === item.fieldIndex : location === item.href;
        const visual = (
          <>
            <motion.span className="spatial-dock-icon" animate={{ scale }} transition={{ type: "spring", stiffness: 420, damping: 24, mass: 0.45 }}>
              <Icon size={18} strokeWidth={1.65} aria-hidden="true" />
            </motion.span>
            <span className="spatial-dock-label">{item.label}</span>
          </>
        );
        const interaction = {
          onMouseEnter: () => setHovered(index),
          onMouseLeave: () => setHovered(null),
          onFocus: () => setHovered(index),
          onBlur: () => setHovered(null),
        };

        return (
          <span className={`spatial-dock-slot ${homeMode && index === fieldItems.length ? "dock-divider-before" : ""}`} key={item.label}>
            {isField ? (
              <button
                type="button"
                className={`spatial-dock-item ${selected ? "is-selected" : ""}`}
                aria-label={`${item.label} 필드 창 열기`}
                aria-pressed={selected}
                title={item.label}
                onClick={() => onFieldSelect?.(item.fieldIndex!)}
                {...interaction}
              >{visual}</button>
            ) : (
              <Link
                href={item.href!}
                className={`spatial-dock-item ${selected ? "is-selected" : ""}`}
                aria-label={`${item.label} 열기`}
                aria-current={selected ? "page" : undefined}
                title={item.label}
                {...interaction}
              >{visual}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function PublicLayout({ children, homeMode = false, dock }: { children: ReactNode; homeMode?: boolean; dock?: ReactNode }) {
  const [location] = useLocation();
  return (
    <div className={`spatial-public-shell ${location === "/" ? "is-desktop-page" : "is-window-page"}`}>
      <SpatialEnvironment />
      <SiteHeader />
      <main className="spatial-main-content">{children}</main>
      {dock ?? <SpatialDock homeMode={homeMode} />}
      <footer className="spatial-footer" aria-hidden="true"><span>FIELD / 01</span><span>SOUND · IMAGE · EXPERIENCE</span></footer>
    </div>
  );
}

function WindowControl({ kind, label, onClick }: { kind: string; label: string; onClick?: () => void }) {
  if (!onClick) return <span className={`window-dot ${kind}`} aria-hidden="true" />;
  return <button type="button" className={`window-dot ${kind}`} aria-label={label} onClick={onClick} onPointerDown={(event) => event.stopPropagation()} />;
}

export function WindowChrome({ title, onClose, onMinimize, onMaximize, maximized }: { title: string; onClose?: () => void; onMinimize?: () => void; onMaximize?: () => void; maximized?: boolean }) {
  return (
    <div className="os-window-chrome" onDoubleClick={onMaximize}>
      <div className="os-window-controls" aria-label="창 제어">
        <WindowControl kind="dot-close" label="창 닫기" onClick={onClose} />
        <WindowControl kind="dot-minimize" label="창 최소화" onClick={onMinimize} />
        <WindowControl kind="dot-maximize" label={maximized ? "창 복원" : "창 확대"} onClick={onMaximize} />
      </div>
      <span className="os-window-title">{title}</span>
      <span className="os-window-grip" aria-hidden="true">DRAG ↔</span>
    </div>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="spatial-eyebrow">{children}</p>;
}
