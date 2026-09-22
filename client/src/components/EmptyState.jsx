const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
    <div style={{
      width: 64, height: 64, borderRadius: 18, background: '#f0faf3',
      border: '1px solid #d5e8da',
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    }}>
      <Icon size={28} color="#2d6a4f" strokeWidth={1.5} />
    </div>
    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a2e24', marginBottom: 8 }}>{title}</h3>
    <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 300, lineHeight: 1.6, marginBottom: 24 }}>{description}</p>
    {action}
  </div>
);

export default EmptyState;
