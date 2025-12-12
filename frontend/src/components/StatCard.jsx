import React from 'react';
import { CCard, CCardBody, CSpinner } from '@coreui/react';

const StatCard = React.memo(({ title, value, unit, icon, color, loading, trend }) => (
  <CCard
    className="stat-card"
    style={{
      background: 'var(--card-bg, #ffffff)',
      border: '1px solid var(--border-color, rgba(0, 0, 0, 0.05))',
      borderRadius: '16px',
      boxShadow: 'var(--shadow-sm)',
      height: '100%',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      borderLeft: `4px solid ${color}`,
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
  >
    <CCardBody className="p-4">
      <div className="d-flex justify-content-between align-items-start">
        <div className="stat-content flex-grow-1">
          <div className="stat-title text-muted small fw-semibold mb-2">{title}</div>
          {loading ? (
            <div className="d-flex align-items-center">
              <CSpinner size="sm" className="me-2" />
              <span className="text-muted">جاري التحميل...</span>
            </div>
          ) : (
            <>
              <div className="stat-number h4 fw-bold mb-1" style={{ color }}>
                {value}
              </div>
              <div className="stat-unit text-muted small">{unit}</div>
            </>
          )}
        </div>
        <div
          className="stat-icon p-2 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            backgroundColor: `${color}15`,
            color,
            width: '48px',
            height: '48px',
          }}
        >
          {icon}
        </div>
      </div>
      {trend && !loading && (
        <div className={`trend-indicator mt-3 small d-flex align-items-center ${trend.value > 0 ? 'text-success' : 'text-danger'}`}>
          <i className={`fas ${trend.value > 0 ? 'fa-arrow-up' : 'fa-arrow-down'} me-2`}></i>
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}
    </CCardBody>
  </CCard>
));

export default StatCard;


