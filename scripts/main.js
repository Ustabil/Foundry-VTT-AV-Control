import {
  initialize, ready, refreshDisplay, updateDisplayUser, syncScreen, concealScreen,
  updateDisplayToken, updateDisplayActor, updateDisplayScene
} from "./core/lifecycle.js";

// The composition root is the only owner of global lifecycle hooks.
Hooks.once("init", initialize);
Hooks.once("ready", ready);
Hooks.on("userConnected", refreshDisplay);
Hooks.on("updateUser", updateDisplayUser);
Hooks.on("deleteUser", refreshDisplay);
Hooks.on("createUser", refreshDisplay);
Hooks.once("setup", syncScreen);
Hooks.on("canvasInit", concealScreen);
Hooks.on("canvasReady", syncScreen);
Hooks.on("controlToken", syncScreen);
Hooks.on("updateToken", updateDisplayToken);
Hooks.on("createToken", syncScreen);
Hooks.on("deleteToken", syncScreen);
Hooks.on("updateActor", updateDisplayActor);
Hooks.on("updateScene", updateDisplayScene);
