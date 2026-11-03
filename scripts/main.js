import { initialize } from "./core/lifecycle.js";

// The composition root is the only owner of global lifecycle hooks.
Hooks.once("init", initialize);
