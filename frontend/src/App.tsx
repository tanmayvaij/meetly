import { useState } from "react";
import { CallRoom } from "./components/CallRoom";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { Video, Plus, Sparkles, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { Toaster } from "sonner";

function App() {
  const [roomId, setRoomId] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      setIsJoined(true);
    }
  };

  const generateMeeting = () => {
    const newId = uuidv4();
    setRoomId(newId);
    setIsJoined(true);
  };

  if (isJoined) {
    return (
      <div className="h-screen w-screen bg-[#F3F4F6] overflow-hidden">
        <CallRoom roomId={roomId} onLeave={() => setIsJoined(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-emerald-100 selection:text-emerald-900 flex items-center justify-center">

      <div className="max-w-6xl w-full mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* Left Side - Hero / Brand */}
        <div className="z-10 max-w-xl mx-auto lg:mx-0">
          <div className="flex items-center space-x-3 mb-10">
            <div className="bg-emerald-600 p-2.5 rounded-xl">
              <Video className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Meetly
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Premium video meetings, free for everyone.</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
            Connect with <br />
            <span className="text-emerald-600">
              clarity.
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium">
            Meetly provides secure, ultra-low latency video calls for you and your friends, completely free and directly in your browser.
          </p>

          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4 text-gray-700">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="font-semibold text-lg">Direct Peer-to-Peer Connection</span>
            </div>
            <div className="flex items-center gap-4 text-gray-700">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <span className="font-semibold text-lg">Ultra-low latency via TURN routing</span>
            </div>
          </div>
        </div>

        {/* Right Side - Action Card */}
        <div className="z-10 flex flex-col items-center lg:items-end w-full">
          <div className="w-full max-w-md">
            <Card className="bg-white border border-gray-200 shadow-sm rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 space-y-8">
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">Start a new meeting</h2>
                  <p className="text-gray-500">Create a secure room instantly</p>
                </div>

                <Button 
                  onClick={generateMeeting}
                  className="w-full h-14 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Generate Meeting Link
                </Button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-500 text-sm font-medium uppercase tracking-wider">or join existing</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="space-y-2 relative">
                    <Input
                      type="text"
                      placeholder="Enter room code"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 h-14 text-lg px-5 rounded-2xl focus-visible:ring-emerald-600 focus-visible:bg-white transition-all pr-32"
                    />
                    <Button 
                      type="submit" 
                      disabled={!roomId.trim()}
                      className="absolute right-1.5 top-1.5 bottom-1.5 h-11 px-4 font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Join
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <p className="text-center text-sm text-gray-500 mt-8 font-medium">
              Secured by WebRTC & Socket.io
            </p>
          </div>
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
