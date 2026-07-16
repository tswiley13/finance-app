// Metro config for the npm-workspaces monorepo (Expo SDK 51).
// Teaches Metro to (1) watch the repo root so it can bundle @stryde/shared, and
// (2) resolve dependencies hoisted to the root node_modules as well as our own.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo (needed to bundle @stryde/shared).
config.watchFolders = [workspaceRoot];

// 2. Resolve node_modules from this app first, then the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Don't let Metro walk up past the workspace root.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
