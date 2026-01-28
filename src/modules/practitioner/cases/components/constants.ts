// 2-hour recording limit in seconds (120 minutes * 60)
export const RECORDING_TIME_LIMIT = 2 * 60 * 60;

export const formatBytesToMb = (bytes: number) =>
  `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};
