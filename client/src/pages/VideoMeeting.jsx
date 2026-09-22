import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

const VideoMeeting = () => {
  const { roomName } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col relative">
      {/* Top Bar overlays over Jitsi */}
      <div className="absolute top-0 left-0 w-full p-4 z-50 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-800 text-white rounded-xl backdrop-blur-md border border-white/10 transition-all shadow-lg"
        >
          <ArrowLeft size={18} />
          <span className="font-medium text-sm">Leave Session</span>
        </button>
      </div>

      <div className="flex-1 w-full h-full relative">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableModeratorIndicator: true,
            startScreenSharing: true,
            enableEmailInStats: false,
            prejoinPageEnabled: false, // Jump straight into the meeting
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_CHROME_EXTENSION_BANNER: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          }}
          userInfo={{
            displayName: user.name,
            email: user.email,
          }}
          onApiReady={(externalApi) => {
            // Optional external API controls
            console.log('Jitsi Meet External API attached');
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

export default VideoMeeting;
