// Camera Service
// Handles camera snapshot capture via Spring Boot backend

import { apiClient, apiRequest } from './apiClient';
import { API_ENDPOINTS } from '@/config/api';

export type CameraType = 'front' | 'rear';

export interface CameraSnapshotRequest {
  cameraType: CameraType;
}

export interface CameraSnapshotResponse {
  cameraType: CameraType;
  imageBase64: string;
  timestamp: string;
  success: boolean;
  message?: string;
}

export interface BothCamerasResponse {
  frontImage: string | null;
  rearImage: string | null;
  frontSuccess: boolean;
  rearSuccess: boolean;
  frontMessage?: string;
  rearMessage?: string;
}

/**
 * Capture snapshot from a single camera
 */
export const captureSnapshot = async (
  cameraType: CameraType
): Promise<{ data: string | null; error: string | null }> => {
  const result = await apiRequest<CameraSnapshotResponse>({
    method: 'POST',
    url: API_ENDPOINTS.CAMERA_SNAPSHOT,
    data: { cameraType },
  });

  if (result.error) {
    return { data: null, error: result.error };
  }

  if (result.data && result.data.success) {
    return { data: result.data.imageBase64, error: null };
  }

  return { 
    data: null, 
    error: result.data?.message || `Failed to capture ${cameraType} camera` 
  };
};

/**
 * Capture snapshots from both cameras simultaneously
 * Returns partial success if only one camera works
 */
export const captureBothCameras = async (): Promise<{
  frontImage: string | null;
  rearImage: string | null;
  error: string | null;
}> => {
  try {
    // Try to use the combined endpoint if available
    const response = await apiClient.post<BothCamerasResponse>(
      API_ENDPOINTS.CAMERA_CAPTURE_BOTH
    );

    if (response.data) {
      const { frontImage, rearImage, frontSuccess, rearSuccess, frontMessage, rearMessage } = response.data;
      
      // Build error message if any camera failed
      let errorMsg = null;
      if (!frontSuccess && !rearSuccess) {
        errorMsg = `Both cameras failed. Front: ${frontMessage}, Rear: ${rearMessage}`;
      } else if (!frontSuccess) {
        errorMsg = `Front camera failed: ${frontMessage}`;
      } else if (!rearSuccess) {
        errorMsg = `Rear camera failed: ${rearMessage}`;
      }

      return {
        frontImage,
        rearImage,
        error: errorMsg,
      };
    }
  } catch (error) {
    // Fallback: Try capturing cameras separately
    console.log('Combined endpoint failed, trying individual captures...');
  }

  // Fallback: Capture cameras separately
  const [frontResult, rearResult] = await Promise.allSettled([
    captureSnapshot('front'),
    captureSnapshot('rear'),
  ]);

  const frontImage = frontResult.status === 'fulfilled' ? frontResult.value.data : null;
  const rearImage = rearResult.status === 'fulfilled' ? rearResult.value.data : null;

  let error = null;
  if (!frontImage && !rearImage) {
    error = 'Failed to capture from both cameras';
  } else if (!frontImage) {
    error = 'Front camera capture failed';
  } else if (!rearImage) {
    error = 'Rear camera capture failed';
  }

  return { frontImage, rearImage, error };
};

/**
 * Get camera configuration status
 */
export const getCameraConfigStatus = async (): Promise<{
  configured: boolean;
  frontConfigured: boolean;
  rearConfigured: boolean;
}> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.CAMERA_CONFIG);
    return response.data;
  } catch (error) {
    return { configured: false, frontConfigured: false, rearConfigured: false };
  }
};

/**
 * Save camera configuration
 */
export const saveCameraConfig = async (config: {
  frontIp: string;
  frontUsername: string;
  frontPassword: string;
  rearIp: string;
  rearUsername: string;
  rearPassword: string;
  brand: string;
}): Promise<{ success: boolean; error: string | null }> => {
  const result = await apiRequest({
    method: 'POST',
    url: API_ENDPOINTS.CAMERA_CONFIG,
    data: config,
  });

  return {
    success: !result.error,
    error: result.error,
  };
};
