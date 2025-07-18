
'use client';

import * as React from 'react';

type PermissionsState = {
  camera: PermissionState;
  microphone: PermissionState;
  display: PermissionState;
};

export function useProctoring() {
  const [permissions, setPermissions] = React.useState<PermissionsState | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);

  const getCombinedStream = async (): Promise<MediaStream | null> => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setPermissions(prev => ({ ...prev!, display: 'granted' }));

      const userStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setPermissions(prev => ({ ...prev!, camera: 'granted', microphone: 'granted' }));

      const combinedStream = new MediaStream();
      displayStream.getTracks().forEach(track => combinedStream.addTrack(track));
      userStream.getTracks().forEach(track => combinedStream.addTrack(track));
      
      return combinedStream;

    } catch (error: any) {
      console.error('Permission denied for media devices:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('You must grant all permissions (Screen, Camera, and Microphone) to proceed with the test.');
      }
      return null;
    }
  };
  
  const startRecording = (stream: MediaStream) => {
    recordedChunksRef.current = [];
    const options = { mimeType: 'video/webm; codecs=vp8,opus' };
    
    try {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
    } catch (e) {
        console.error('MediaRecorder error:', e);
        // Fallback for browsers that might not support the specific codec combination
        mediaRecorderRef.current = new MediaRecorder(stream);
    }
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorderRef.current.onstop = () => {
        // Stop all tracks to turn off camera/mic light
        stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            setIsRecording(false);
            resolve(blob);
        };
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  };

  return {
    permissions,
    isRecording,
    startRecording,
    stopRecording,
    getCombinedStream,
  };
}
