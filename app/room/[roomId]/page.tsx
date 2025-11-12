'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function Room() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  // State management
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ username: string; message: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [username, setUsername] = useState('User');
  const [userId, setUserId] = useState<string>('');

  // Refs for media and WebRTC
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Initialize socket, media, and WebRTC connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Decode JWT to extract user details
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.userId || 'anonymous');
      setUsername(payload.username || 'User');
    } catch (error) {
      console.error('Token decode error:', error);
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000');
    setSocket(socketInstance);

    socketInstance.on('connect', () => setIsConnected(true));
    socketInstance.on('disconnect', () => setIsConnected(false));

    // Setup media devices and peer connection
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        });
        peerConnectionRef.current = peerConnection;

        // Add local tracks
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

        // Handle remote streams
        peerConnection.ontrack = (event) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) socketInstance.emit('ice-candidate', roomId, event.candidate);
        };

        // Join room
        socketInstance.emit('join-room', roomId, userId);

        // Signaling events
        socketInstance.on('user-connected', async () => {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socketInstance.emit('offer', roomId, offer);
        });

        socketInstance.on('offer', async (offer) => {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socketInstance.emit('answer', roomId, answer);
        });

        socketInstance.on('answer', async (answer) => {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socketInstance.on('ice-candidate', async (candidate) => {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        });

        socketInstance.on('user-disconnected', () => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });

        socketInstance.on('chat-message', (data) => {
          setChatMessages((prev) => [...prev, data]);
        });
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Failed to access camera/microphone.');
      }
    };

    initializeMedia();

    // Cleanup on unmount
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      socketInstance.disconnect();
    };
  }, [roomId, router, userId]);

  // Media and UI controls
  const toggleAudio = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;

        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) sender.replaceTrack(videoTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

        videoTrack.onended = () => stopScreenShare();
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    } else stopScreenShare();
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = peerConnectionRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === 'video');

    if (sender && videoTrack) sender.replaceTrack(videoTrack);
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    setIsScreenSharing(false);
  };

  // Chat and exit
  const sendChatMessage = () => {
    if (chatInput.trim() && socket) {
      socket.emit('chat-message', roomId, chatInput, username);
      setChatInput('');
    }
  };

  const leaveRoom = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
    socket?.disconnect();
    router.push('/dashboard');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied!');
  };

  // UI
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header with connection status */}
      <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-white text-xl font-semibold">Zetra</h1>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Room ID:</span>
            <code className="bg-gray-700 text-white px-3 py-1 rounded text-sm">{roomId}</code>
            <button onClick={copyRoomId} className="text-blue-400 hover:text-blue-300 text-sm">📋</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-400 text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Video and chat layout */}
      <div className="flex-1 flex">
        {/* Video section */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Local video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <span className="text-white text-lg">Camera Off</span>
                </div>
              )}
            </div>

            {/* Remote video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="bg-gray-700 rounded p-3">
                  <p className="text-blue-400 text-sm font-semibold">{msg.username}</p>
                  <p className="text-white text-sm mt-1">{msg.message}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={sendChatMessage} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-gray-800 px-6 py-4 flex justify-center items-center gap-4">
        <button onClick={toggleAudio} className={`p-4 rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-600'}`}>
          {isAudioEnabled ? '🎤' : '🔇'}
        </button>
        <button onClick={toggleVideo} className={`p-4 rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-600'}`}>
          {isVideoEnabled ? '📹' : '📷'}
        </button>
        <button onClick={toggleScreenShare} className={`p-4 rounded-full ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-700'}`}>
          🖥️
        </button>
        <button onClick={() => setShowChat(!showChat)} className="p-4 rounded-full bg-gray-700">
          💬
        </button>
        <button onClick={leaveRoom} className="p-4 rounded-full bg-red-600">
          📞
        </button>
      </div>
    </div>
  );
}