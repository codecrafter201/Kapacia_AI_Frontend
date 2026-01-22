/**
 * FIXED Audio utility functions for PCM conversion and validation
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
    console.error("[Audio] Invalid PCM buffer size (not divisible by 2):", buffer.byteLength);
    return false;
  }

  // Check for reasonable buffer size (not too small, not too large)
  if (buffer.byteLength < 64) {
    console.warn("[Audio] Very small buffer:", buffer.byteLength, "bytes");
    return false;
  }

  if (buffer.byteLength > 1024 * 1024) { // 1MB limit
    console.warn("[Audio] Very large buffer:", buffer.byteLength, "bytes");
    return false;
  }

  return true;
}

/**
 * Convert Float32Array audio samples to PCM 16-bit Int16Array with improved clamping
 */
export function float32ToPCM16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp the value between -1 and 1 with better precision
    let sample = float32Array[i];
    
    // Handle NaN and Infinity
    if (!isFinite(sample)) {
      sample = 0;
    } else {
      sample = Math.max(-1, Math.min(1, sample));
    }
    
    // Convert to 16-bit PCM with proper scaling
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  
  return int16Array;
}

/**
 * Improved resampling with better interpolation and edge case handling
 */
export function resampleAudio(
  inputData: Float32Array,
  fromRate: number,
  toRate: number
): Int16Array {
  // Validate input parameters
  if (!inputData || inputData.length === 0) {
    console.error("[Audio] Empty input data for resampling");
    return new Int16Array(0);
  }

  if (fromRate <= 0 || toRate <= 0) {
    console.error("[Audio] Invalid sample rates:", fromRate, toRate);
    return float32ToPCM16(inputData);
  }

  // If rates are the same, just convert to PCM
  if (Math.abs(fromRate - toRate) < 0.1) {
    return float32ToPCM16(inputData);
  }

  const ratio = fromRate / toRate;
  const newLength = Math.round(inputData.length / ratio);
  
  if (newLength === 0) {
    console.warn("[Audio] Resampling resulted in zero length");
    return new Int16Array(0);
  }

  const resampled = new Float32Array(newLength);

  // Improved linear interpolation resampling
  for (let i = 0; i < newLength; i++) {
    const originIndex = i * ratio;
    const indexFloor = Math.floor(originIndex);
    const indexCeil = Math.min(indexFloor + 1, inputData.length - 1);
    const t = originIndex - indexFloor;
    
    const sample1 = inputData[indexFloor] || 0;
    const sample2 = inputData[indexCeil] || 0;
    
    // Linear interpolation
    resampled[i] = sample1 + (sample2 - sample1) * t;
  }

  return float32ToPCM16(resampled);
}

/**
 * Enhanced audio buffer statistics for debugging
 */
export function logAudioStats(buffer: ArrayBuffer, label: string = "Audio"): void {
  if (!validatePCMBuffer(buffer)) {
    console.error(`[${label}] Invalid buffer for stats`);
    return;
  }

  const view = new Int16Array(buffer);
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let sumSquares = 0;
  let nonZeroSamples = 0;

  for (let i = 0; i < view.length; i++) {
    const val = view[i];
    if (val < min) min = val;
    if (val > max) max = val;
    sum += Math.abs(val);
    sumSquares += val * val;
    if (val !== 0) nonZeroSamples++;
  }

  const avg = sum / view.length;
  const rms = Math.sqrt(sumSquares / view.length);
  const nonZeroPercent = (nonZeroSamples / view.length) * 100;

  console.log(`[${label}] Size: ${buffer.byteLength} bytes, Samples: ${view.length}, Min: ${min}, Max: ${max}, Avg: ${avg.toFixed(2)}, RMS: ${rms.toFixed(2)}, Non-zero: ${nonZeroPercent.toFixed(1)}%`);
  
  // Warn about potential issues
  if (nonZeroPercent < 1) {
    console.warn(`[${label}] Very low audio activity (${nonZeroPercent.toFixed(1)}% non-zero samples)`);
  }
  
  if (avg < 10) {
    console.warn(`[${label}] Very low audio level (avg: ${avg.toFixed(2)})`);
  }
}

/**
 * Check if audio buffer contains meaningful audio data
 */
export function hasAudioActivity(buffer: ArrayBuffer, threshold: number = 100): boolean {
  if (!validatePCMBuffer(buffer)) {
    return false;
  }

  const view = new Int16Array(buffer);
  let activeSamples = 0;

  for (let i = 0; i < view.length; i++) {
    if (Math.abs(view[i]) > threshold) {
      activeSamples++;
    }
  }

  const activityPercent = (activeSamples / view.length) * 100;
  return activityPercent > 0.5; // At least 0.5% of samples above threshold
}

/**
 * Apply simple noise gate to reduce background noise
 */
export function applyNoiseGate(buffer: ArrayBuffer, threshold: number = 50): ArrayBuffer {
  if (!validatePCMBuffer(buffer)) {
    return buffer;
  }

  const view = new Int16Array(buffer);
  const output = new Int16Array(view.length);

  for (let i = 0; i < view.length; i++) {
    const sample = view[i];
    output[i] = Math.abs(sample) > threshold ? sample : 0;
  }

  return output.buffer;
}

/**
 * Get audio format information
 */
export function getAudioFormat(buffer: ArrayBuffer): {
  sampleCount: number;
  durationMs: number;
  sampleRate: number;
  channels: number;
} {
  const sampleCount = buffer.byteLength / 2; // 16-bit samples
  const sampleRate = 16000; // Assuming 16kHz
  const channels = 1; // Mono
  const durationMs = (sampleCount / sampleRate) * 1000;

  return {
    sampleCount,
    durationMs,
    sampleRate,
    channels,
  };
}