const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a2e24', marginBottom: 4, letterSpacing: '-0.3px' }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: '#6b7280' }}>{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export default PageHeader;
