/**
 * Laravel Inertia Global Helper Functions
 */

/**
 * Generate a route URL
 * @param name - The name of the route
 * @param params - Optional route parameters
 * @returns The generated route URL
 */
declare function route(name: string, params?: Record<string, any> | any[]): string;
