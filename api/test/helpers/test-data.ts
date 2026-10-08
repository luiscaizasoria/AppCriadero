export function uniqueEmail(prefix = "test") {
  return `${prefix}.${Date.now()}@kikirikis.local`;
}
