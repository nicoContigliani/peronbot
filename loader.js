/**
 * Custom Node.js Loader for Module Aliases
 * This loader resolves @/ aliases for ES modules
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname);

// Alias mappings
const aliases = {
  '@/': join(rootDir, 'src') + '/',
  '@/config': join(rootDir, 'src', 'config'),
  '@/bot': join(rootDir, 'src', 'bot'),
  '@/core': join(rootDir, 'src', 'core'),
  '@/database': join(rootDir, 'src', 'database'),
  '@/middleware': join(rootDir, 'src', 'middleware'),
  '@/routes': join(rootDir, 'src', 'routes'),
  '@/services': join(rootDir, 'src', 'services'),
  '@/apiservices': join(rootDir, 'src', 'apiservices'),
  '@/examples': join(rootDir, 'src', 'examples')
};

/**
 * Custom resolve function for ES modules
 */
export function resolve(specifier, context, nextResolve) {
  // Check if the specifier starts with an alias
  for (const [alias, target] of Object.entries(aliases)) {
    if (specifier.startsWith(alias)) {
      // Replace the alias with the target path
      const resolvedPath = specifier.replace(alias, target);
      return nextResolve(resolvedPath, context);
    }
  }
  
  // Default resolution for non-aliased imports
  return nextResolve(specifier, context);
}
