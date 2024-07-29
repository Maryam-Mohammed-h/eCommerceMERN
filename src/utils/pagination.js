export const paginationFunction = ({ page ,size }) => {
  if (page < 1||page==undefined||page==null||page==NAN) {
    page = 1;
  }
  if (size < 1||size==undefined||size==null||size==NAN) size = 1;

  let limit = size;
  let skip = (page - 1) * limit;
  return { limit, skip };
};
