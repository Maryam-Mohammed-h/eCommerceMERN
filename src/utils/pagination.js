export const paginationFunction = ({ page = 1, size = 2 }) => {
  if (page < 1) {
    page = 1;
  }
  if (size < 1) size = 1;

  let limit = size;
  let skip = (page - 1) * limit;
  return { limit, skip };
};
