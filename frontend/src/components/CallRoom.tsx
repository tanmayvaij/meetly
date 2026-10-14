import { VideoPlayer } from "./VideoPlayer";
import { useWebRTC } from "../hooks/useWebRTC";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { Video, Mic, VideoOff, MicOff, PhoneOff, Copy, MessageSquareText, Captions } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface CallRoomProps {
  roomId: string;
  onLeave: () => void;
}

export function CallRoom({ roomId, onLeave }: CallRoomProps) {
  const { localStream, remoteStream, isConnected, connectionStatus, error, transcriptions, sendTranscription } = useWebRTC(roomId);
  
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  const { isListening, toggleListening, interimTranscript, isSupported } = useSpeechRecognition((text) => {
    sendTranscription(text);
  }, true);

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-red-500 bg-white m-4 rounded-[2rem] shadow-sm border border-gray-100">
        <p className="text-xl font-semibold mb-4">{error}</p>
        <Button onClick={onLeave} variant="outline" className="rounded-full">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-900 w-full relative overflow-hidden">
      
      {/* Sidebar for Transcriptions */}
      {showSidebar && (
        <div className="w-full md:w-80 h-1/3 md:h-full bg-gray-950 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col flex-shrink-0 z-30 shadow-2xl relative">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/80 backdrop-blur sticky top-0">
             <h3 className="text-gray-200 font-semibold flex items-center gap-2"><Captions className="w-4 h-4 text-emerald-400"/> Live Captions</h3>
             <button onClick={toggleListening} className={`text-xs px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${isListening ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {isListening ? 'Listening' : 'Start'}
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
             {transcriptions.map((t, i) => (
               <div key={i} className={`flex flex-col ${t.sender === 'me' ? 'items-end' : 'items-start'}`}>
                 <span className="text-[10px] text-gray-500 font-medium mb-1">{t.sender === 'me' ? 'You' : 'Remote Peer'}</span>
                 <div className={`px-3 py-2 rounded-2xl text-sm max-w-[90%] shadow-sm ${t.sender === 'me' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-800 text-gray-200 rounded-tl-sm'}`}>
                   {t.text}
                 </div>
               </div>
             ))}
             {isListening && interimTranscript && (
               <div className="flex flex-col items-end opacity-60">
                 <span className="text-[10px] text-gray-500 font-medium mb-1">You</span>
                 <div className="px-3 py-2 rounded-2xl text-sm max-w-[90%] bg-indigo-600/80 text-white rounded-tr-sm italic">
                   {interimTranscript}
                 </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Main Video Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* Video Area (Main Speaker + PiP) */}
        <div className="flex-1 relative bg-gray-900 overflow-hidden">
          {/* Remote Video (Full Screen) */}
          <div className="absolute inset-0">
            <VideoPlayer stream={remoteStream} className="w-full h-full object-cover rounded-[1.5rem]" />
          </div>

          {/* Local Video (PiP) */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-28 sm:w-48 aspect-video z-10 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/20 sm:border-2 hover:border-white/40 transition-all cursor-move">
            <VideoPlayer stream={localStream} muted={true} className="w-full h-full object-cover bg-gray-900" />
            <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black/40 backdrop-blur-md px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-white text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5">
              {!audioEnabled && <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />}
              You
            </div>
          </div>
        </div>

        {/* Floating Controls Bar */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 w-max max-w-[95vw]">
          <div className="flex items-center gap-1 sm:gap-3 bg-white px-3 sm:px-6 py-2 sm:py-3 rounded-full shadow-2xl border border-gray-100">
            
            <div className="flex items-center gap-1.5 sm:gap-2 pr-2 sm:pr-4 border-r border-gray-200 mr-1 sm:mr-2">
              <span className="text-gray-500 text-xs sm:text-sm font-mono truncate w-20 sm:w-32" title={roomId}>{roomId}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  toast.success("Meeting ID copied to clipboard!");
                }}
                className="text-gray-400 hover:text-gray-700 transition cursor-pointer shrink-0 p-1 rounded-md hover:bg-gray-100"
                title="Copy Room ID"
              >
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <Button
              variant={videoEnabled ? "secondary" : "destructive"}
              size="icon"
              className={`rounded-full w-10 h-10 sm:w-12 sm:h-12 transition-all shrink-0 ${videoEnabled ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
              onClick={toggleVideo}
            >
              {videoEnabled ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
            <Button
              variant={audioEnabled ? "secondary" : "destructive"}
              size="icon"
              className={`rounded-full w-10 h-10 sm:w-12 sm:h-12 transition-all shrink-0 ${audioEnabled ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
              onClick={toggleAudio}
            >
              {audioEnabled ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
            
            {isSupported && (
              <Button
                variant={showSidebar ? "default" : "secondary"}
                size="icon"
                className={`rounded-full w-10 h-10 sm:w-12 sm:h-12 transition-all shrink-0 ${showSidebar ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                onClick={() => setShowSidebar(!showSidebar)}
                title="Toggle Captions"
              >
                <MessageSquareText className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            )}
            
            <div className="w-px h-6 sm:h-8 bg-gray-200 mx-1 sm:mx-2 shrink-0"></div>
            
            <button
              className="rounded-full w-12 h-10 sm:w-14 sm:h-12 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-transform hover:scale-105 flex items-center justify-center cursor-pointer shrink-0"
              onClick={onLeave}
              title="End Call"
            >
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
