export const EMBEDDING_DIMENSION = 3072;

export function normalizeEmbeddingDimension(values: number[], dimension = EMBEDDING_DIMENSION): number[] {
  if (values.length === dimension) {
    return values;
  }

  if (values.length > dimension) {
    return values.slice(0, dimension);
  }

  return [...values, ...Array.from({ length: dimension - values.length }, () => 0)];
}

export function toVectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`;
}
