export const generateString = () =>
  Math.random()
    .toString(36)
    .substr(2, 5)
    
export const lowercaseFirst = (val: string) =>
    val.charAt(0).toLowerCase() + val.slice(1)