export function encodeProjectName(projectName: string): string {
  return encodeURIComponent(projectName);
}

export function decodeProjectName(encodedName: string): string {
  return decodeURIComponent(encodedName);
}

