// Local entry point.
//
// We can't point "main" straight at "expo-router/entry": in this npm-workspaces
// monorepo expo-router is hoisted to the ROOT node_modules, but Metro resolves
// that main field relative to THIS project (mobile/node_modules/...), which
// doesn't exist. Pointing main at this real local file lets Metro resolve the
// entry; the import below then resolves via metro.config's nodeModulesPaths.
import "expo-router/entry";
