import { useState } from "react";
import "./KpiCard.css";

function KpiCard({ icon, title, count, children, className = "" }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`kpi-card ${className} ${expanded ? "expanded" : ""}`}>
      <div className="kpi-header" onClick={() => setExpanded(!expanded)}>
        
        <div className="kpi-header-left">
          <span className="kpi-icon">{icon}</span>
          <div className="kpi-info">
            <h3>{title}</h3>
          </div>
        </div>

        <div className="kpi-count">{count}</div>

        <span className="kpi-toggle">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="kpi-content">
          {children}
        </div>
      )}
    </div>
  );
}

export default KpiCard;
