/**
 * Función utilitaria para convertir recursivamente valores BigInt a string en objetos o arreglos.
 * Útil para payloads enviados por Socket.io.
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

/**
 * Replacer para express app.set('json replacer', bigIntJsonReplacer)
 * Permite que res.json(data) convierta automáticamente cualquier campo BigInt a string.
 */
export function bigIntJsonReplacer(_key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}
