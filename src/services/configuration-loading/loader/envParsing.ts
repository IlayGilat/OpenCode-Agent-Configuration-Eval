export function optionalEnvValue(value: string | undefined): string | null {
  return value?.trim() || null;
}

export function envValueOrDefault(value: string | undefined, defaultValue: string): string {
  return value?.trim() || defaultValue;
}

export function numberEnvValueOrDefault(
  value: string | undefined,
  defaultValue: number,
  envName: string,
): number {
  const trimmed = value?.trim();

  if (!trimmed) {
    return defaultValue;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${envName} must be a finite number, received: ${trimmed}`);
  }

  return parsed;
}
