'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function Room() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ username: string; message: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [username, setUsername] = useState('User');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.userId || 'anonymous');
      setUsername(payload.username || 'User');
    } catch (error) {
      console.error('Token decode error:', error);
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000');
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const configuration: RTCConfiguration = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        };

        const peerConnection = new RTCPeerConnection(configuration);
        peerConnectionRef.current = peerConnection;

        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        peerConnection.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socketInstance.emit('ice-candidate', roomId, event.candidate);
          }
        };

        peerConnection.onconnectionstatechange = () => {
          console.log('Connection state:', peerConnection.connectionState);
        };

        socketInstance.emit('join-room', roomId, userId);

        socketInstance.on('user-connected', async (connectedUserId: string) => {
          console.log('User connected:', connectedUserId);
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socketInstance.emit('offer', roomId, offer);
        });

        socketInstance.on('offer', async (offer: RTCSessionDescriptionInit) => {
          console.log('Received offer');
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socketInstance.emit('answer', roomId, answer);
        });

        socketInstance.on('answer', async (answer: RTCSessionDescriptionInit) => {
          console.log('Received answer');
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socketInstance.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        });

        socketInstance.on('user-disconnected', (disconnectedUserId: string) => {
          console.log('User disconnected:', disconnectedUserId);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        });

        socketInstance.on('chat-message', (data: { message: string; username: string; timestamp: Date }) => {
          setChatMessages((prev) => [...prev, data]);
        });
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Failed to access camera/microphone. Please grant permissions.');
      }
    };

    initializeMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      socketInstance.disconnect();
    };
  }, [roomId, router, userId]);

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        screenStreamRef.current = screenStream;

        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        videoTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }

    setIsScreenSharing(false);
  };

  const sendChatMessage = () => {
    if (chatInput.trim() && socket) {
      socket.emit('chat-message', roomId, chatInput, username);
      setChatInput('');
    }
  };

  const leaveRoom = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnectionRef.current?.close();
    socket?.disconnect();
    router.push('/dashboard');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-white text-xl font-semibold">Zetra</h1>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Room ID:</span>
            <code className="bg-gray-700 text-white px-3 py-1 rounded text-sm">{roomId}</code>
            <button
              onClick={copyRoomId}
              className="text-blue-400 hover:text-blue-300 text-sm"
              title="Copy Room ID"
            >
              📋
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-400 text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
                <p className="text-white text-sm">You ({username})</p>
              </div>
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-3xl text-white">{username.charAt(0).toUpperCase()}</span>
                    </div>
                    <p className="text-white text-sm">Camera Off</p>
                  </div>
                </div>
              )}
            </div>

            {/* Remote Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
                <p className="text-white text-sm">Remote User</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
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
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendChatMessage}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 flex justify-center items-center gap-4">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full ${
            isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          <span className="text-white text-xl">{isAudioEnabled ? '🎤' : '🔇'}</span>
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${
            isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
        >
          <span className="text-white text-xl">{isVideoEnabled ? '📹' : '📷'}</span>
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-4 rounded-full ${
            isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        >
          <span className="text-white text-xl">🖥️</span>
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 relative"
          title="Toggle Chat"
        >
          <span className="text-white text-xl">💬</span>
          {chatMessages.length > 0 && !showChat && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {chatMessages.length}
            </span>
          )}
        </button>

        <button
          onClick={leaveRoom}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700"
          title="Leave Room"
        >
          <span className="text-white text-xl">📞</span>
        </button>
      </div>
    </div>
  );
}