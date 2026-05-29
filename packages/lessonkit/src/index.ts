export {
  buildCourse,
  packageLessonkit,
  validateCourse,
  type BuildCourseOptions,
  type BuildCourseResult,
  type PackageLessonkitOptions,
  type PackageLessonkitResult,
  type ValidateCourseOptions,
  type ValidateCourseResult,
} from "@lxpack/api";

export {
  getLxpackBridge,
  createLxpackBridgeHost,
  normalizeScore,
  normalizePassingThreshold,
  supportedBridgeVersions,
  type LxpackBridgeV1,
  type LxpackBridgeRoot,
} from "@lxpack/spa-bridge";

export {
  mapLessonkitTelemetryToLxpack,
  mapLessonkitTelemetryToBridgeAction,
  type LessonkitTelemetryEvent,
  type LessonkitTelemetryEventName,
} from "@lxpack/tracking-schema";

export {
  parseLessonkitInterchange,
  interchangeToManifest,
  materializeLessonkitProject,
  lessonkitInterchangeSchema,
  inferScormSpaLayout,
  type LessonkitInterchangeV1,
  type ScormSpaLayout,
} from "@lxpack/validators";
