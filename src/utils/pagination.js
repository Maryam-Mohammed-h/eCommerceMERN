export const paginationFunction = ({ page=1 ,elemsByPage=2 }) => {
  if (page < 1) {
    page = 1;
  }
  if (elemsByPage < 1) elemsByPage = 1;

  let limit = elemsByPage;
  let skip = (page - 1) * limit;
  return { limit, skip };
};
