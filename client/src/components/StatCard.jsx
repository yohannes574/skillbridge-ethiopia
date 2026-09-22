import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color = '#2d6a4f', bg = '#e8f5e9', trend, to }) => {
  const cardStyle = {
    background: '#fff', border: '1px solid #eef1f4', borderRadius: 16, padding: '24px',
    transition: 'all 0.2s', cursor: to ? 'pointer' : 'default',
    textDecoration: 'none', display: 'block',
  };

  const cardBody = (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: bg || '#e8f5e9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: trend >= 0 ? '#2d6a4f' : '#dc2626',
            background: trend >= 0 ? '#e8f5e9' : '#fee2e2',
            padding: '3px 8px', borderRadius: 20,
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, color: '#1a2e24', marginBottom: 4 }}>{value}</p>
      <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</p>
    </>
  );

  if (to) {
    return (
      <Link to={to} style={cardStyle}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {cardBody}
      </Link>
    );
  }

  return (
    <div style={cardStyle}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {cardBody}
    </div>
  );
};

export default StatCard;
