/** GM action policy. Read-only presence queries grant no command authority. */
export function canControl(user) {
  return user?.isGM === true;
}
