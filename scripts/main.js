import { initialize, ready, refreshDisplay, updateDisplayUser } from "./core/lifecycle.js";

// The composition root is the only owner of global lifecycle hooks.
Hooks.once("init", initialize);
Hooks.once("ready", ready);
Hooks.on("userConnected", refreshDisplay);
Hooks.on("updateUser", updateDisplayUser);
Hooks.on("deleteUser", refreshDisplay);
Hooks.on("createUser", refreshDisplay);
