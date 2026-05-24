import {
  packageCourse,
  packageScorm2004Dir,
  packageStandaloneDir,
  type ExportTarget,
  type PackageOptions,
} from "@lxpack/scorm";

export interface ZipPackager {
  package(options: PackageOptions): Promise<{ outputPath: string; fileCount: number }>;
}

export interface DirPackager {
  package(
    options: Omit<PackageOptions, "outputPath"> & { outputDir: string },
  ): Promise<{ outputDir: string; fileCount: number }>;
}

const zipPackagers: Record<ExportTarget, ZipPackager> = {
  scorm12: { package: packageCourse },
  scorm2004: { package: packageCourse },
  standalone: { package: packageCourse },
};

const dirPackagers: Record<ExportTarget, DirPackager> = {
  scorm12: { package: packageStandaloneDir },
  scorm2004: { package: packageScorm2004Dir },
  standalone: { package: packageStandaloneDir },
};

export function getZipPackager(target: ExportTarget): ZipPackager {
  return zipPackagers[target];
}

export function getDirPackager(target: ExportTarget): DirPackager {
  return dirPackagers[target];
}
