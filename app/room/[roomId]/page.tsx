'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function Room() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [socket, setSocket] = useState<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000');
    setSocket(socketInstance);

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
            socketInstance.emit('ice-candidate', {
              candidate: event.candidate,
              roomId,
            });
          }
        };

        socketInstance.emit('join-room', roomId);

        socketInstance.on('user-joined', async () => {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socketInstance.emit('offer', { offer, roomId });
        });

        socketInstance.on('offer', async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socketInstance.emit('answer', { answer, roomId });
        });

        socketInstance.on('answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socketInstance.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initializeMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      socketInstance.disconnect();
    };
  }, [roomId]);

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-white text-2xl mb-4">Room: {roomId}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-lg bg-black"
            />
            <p className="text-white text-sm mt-2">You</p>
          </div>
          <div className="relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-black"
            />
            <p className="text-white text-sm mt-2">Remote User</p>
          </div>
        </div>
      </div>
    </div>
  );
}
