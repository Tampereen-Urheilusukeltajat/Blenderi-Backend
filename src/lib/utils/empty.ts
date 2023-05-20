export const allMembersUndefined = (obj: object): boolean => {
  return Object.values(obj).every((el) => el === undefined);
};

export const isEmptyObject = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};
