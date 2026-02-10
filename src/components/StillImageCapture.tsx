import { forwardRef, useImperativeHandle } from 'react';
import type { VisualCaptureData } from '@/types/assessment';

export interface StillImageCaptureRef {
  stopCapturing: () => void;
  startCapturing?: () => void;
}

interface StillImageCaptureProps {
  isActive: boolean;
  onRecordingComplete: (data: VisualCaptureData) => void;
  onRangeChange: () => void;
  onFrameUpdate: () => void;
}

export const StillImageCapture = forwardRef<StillImageCaptureRef, StillImageCaptureProps>(
  function StillImageCapture(_props, ref) {
    useImperativeHandle(ref, () => ({
      stopCapturing: () => {},
      startCapturing: () => {},
    }));

    return (
      <div className="still-image-capture">
        <p>Still Image Capture Component</p>
      </div>
    );
  }
);
