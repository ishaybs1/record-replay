import React from "react";
import { useLocation } from "react-router-dom";
import { useRecorder } from "./RecorderContext";

export const NavigationTracker: React.FC = () => {
  const location = useLocation();
  const { addNavigate, isRecording } = useRecorder();

  React.useEffect(() => {
    if (isRecording) {
      addNavigate(location.pathname + location.search + location.hash);
    }
  }, [location, isRecording, addNavigate]);

  return null;
};

export default NavigationTracker;
