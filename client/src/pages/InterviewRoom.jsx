import { JitsiMeeting } from '@jitsi/react-sdk';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InterviewRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      
      {/* Custom Header */}
      <div style={{ height: 60, background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}
          >
            <ArrowLeft size={16} /> Leave Room
          </button>
          <div style={{ width: 1, height: 24, background: '#334155' }} />
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>SkillBridge Live Interview</h1>
        </div>
        
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', background: '#0f172a', padding: '6px 12px', borderRadius: 8 }}>
          End-to-End Encrypted Session
        </div>
      </div>

      {/* Jitsi SDK Mount */}
      <div style={{ flex: 1, position: 'relative' }}>
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={`SKILLBRIDGE_INTERVIEW_${roomId}`}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableModeratorIndicator: true,
            startScreenSharing: false,
            enableEmailInStats: false,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_CHROME_EXTENSION_BANNER: false,
            HIDE_INVITE_MORE_HEADER: true,
          }}
          userInfo={{
            displayName: user?.name || 'Guest User',
            email: user?.email || '',
          }}
          onApiReady={(externalApi) => {
            // Can hook into events here if needed
            externalApi.addListener('videoConferenceLeft', () => {
              navigate(-1);
            });
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
            iframeRef.style.border = 'none';
          }}
        />
      </div>
    </div>
  );
};

export default InterviewRoom;
