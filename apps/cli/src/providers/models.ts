/**
 * Abstract base class for serializable models.
 *
 * We use an abstract class instead of interfaces because:
 * 1. It allows us to provide default implementations for common methods (like modelDumpJSON)
 * 2. It enforces that concrete classes must implement modelDump
 * 3. It provides a consistent interface for all serializable models
 * 4. It handles both instance and static methods in one place, avoiding the need for separate interfaces
 *
 * Note: We can't use abstract static methods in TypeScript, so we provide default implementations
 * that throw errors. Concrete classes should override these methods.
 */
export abstract class SerializableModel<T> {
  /** Returns a typed object of this model. Ex. type Thing{ foo: x, bar: y }.
   * Properties are accessible using attribute notification => Thing.foo, Thing.bar
   * rather than object notification => Thing["foo"], Thing["bar"].
   */
  abstract modelDump(): T

  // @ts-ignore - This method is not abstract because it is static and we can't specify static abstract methods.
  static modelValidate(data: unknown): T | undefined {
    throw new Error('modelValidate must be implemented')
  }

  modelDumpJSON(): string {
    return JSON.stringify(this.modelDump(), null, 2)
  }

  static modelValidateJSON(jsonString: string): any {
    const parsed = JSON.parse(jsonString)
    return this.modelValidate(parsed)
  }
}
