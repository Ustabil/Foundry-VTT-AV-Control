/** UI access policy. Future socket commands must enforce their own authority checks. */
export function canControl(user) {
  return user?.isGM === true;
}
