export const allMembersUndefined = (obj: object): boolean => {
  return Object.values(obj).every((el) => el === undefined);
};
