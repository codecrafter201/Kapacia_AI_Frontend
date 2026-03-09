// 2-hour recording limit in seconds (120 minutes * 60)
export const RECORDING_TIME_LIMIT = 2 * 60 * 60;

export const formatBytesToMb = (bytes: number) =>
  `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export const getCurrentDate = () => {
  const today = new Date();
  // Return date in YYYY-MM-DD format for local timezone
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
