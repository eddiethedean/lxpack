/** @deprecated Import from ./progress/codec.js and ./progress/size-policy.js */
export {
  compactProgress,
  expandProgress,
  expandLegacyProgress,
  parseStoredProgress,
} from "./progress/codec.js";
export {
  serializeProgressForStorage,
  trimSuspendData,
} from "./progress/size-policy.js";
export { SCORM_SUSPEND_DATA_MAX } from "./progress/constants.js";
