/**
 * Audio utility functions for PCM conversion and validation
 */

/**
 * Verify that audio buffer contains valid PCM data
 */
export function validatePCMBuffer(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength === 0) {
    console.error("[Audio] Empty buffer");
    return false;
  }

  // PCM 16-bit should have even number of bytes
  if (buffer.byteLength % 2 !== 0) {
    console.error("[Audio] Invalid PCM buffer size (not divisible by 2)");
    return false;
  }

  return true;
}

/**
 * Convert Float32Array audio samples to PCM 16-bit Int16Array
 */
export function float32ToPCM16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp the value between -1 and 1
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit PCM
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  
  return int16Array;
}

/**
 * Resample audio from one sample rate to another using linear interpolation
 */
export function resampleAudio(
  inputData: Float32Array,
  fromRate: number,
  toRate: number
): Int16Array {
  // If rates are the same, just convert to PCM
  if (fromRate === toRate) {
    return float32ToPCM16(inputData);
  }

  const ratio = fromRate / toRate;
  const newLength = Math.round(inputData.length / ratio);
  const resampled = new Float32Array(newLength);

  // Linear interpolation resampling
  for (let i = 0; i < newLength; i++) {
    const originIndex = i * ratio;
    const indexFloor = Math.floor(originIndex);
    const t = originIndex - indexFloor;
    const sample1 = inputData[indexFloor] || 0;
    const sample2 = inputData[indexFloor + 1] || 0;
    resampled[i] = sample1 + (sample2 - sample1) * t;
  }

  return float32ToPCM16(resampled);
}

/**
 * Log audio buffer statistics for debugging
 */
export function logAudioStats(buffer: ArrayBuffer, label: string = "Audio"): void {
  const view = new Int16Array(buffer);
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (let i = 0; i < view.length; i++) {
    const val = view[i];
    if (val < min) min = val;
    if (val > max) max = val;
    sum += Math.abs(val);
  }

  const avg = sum / view.length;

  console.log(`[${label}] Size: ${buffer.byteLength} bytes, Samples: ${view.length}, Min: ${min}, Max: ${max}, Avg: ${avg.toFixed(2)}`);
}
