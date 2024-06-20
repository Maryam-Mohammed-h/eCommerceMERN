import { productModel } from "../../../DB/Models/product.model";
const { page, elemsByPage, sort, select, search } = req.query;
//   ==========================sort=====================================
const sortProduct = await productModel
  .find()
  // .sort("-price stock") //descending price ascending stock
  .sort(sort.replaceAll(",", " "));
//   =======================================select fields at results  =======================
const selectFieldsProduct = await productModel
  .find()
  .select(select.replaceAll(",", " "));
//   =========================================filters=============
const queryInstance = { ...req.query };
const excludeKeysArr = ["page", "elemsByPage", "sort", "select", "search"];
excludeKeysArr.forEach((key) => {
  delete queryInstance[key];
});
const queryString = JSON.parse(
  JSON.stringfy(queryInstance).replaceAll(
    /gt|gte|lt|lte|in|nin|eq|neq|regex/g,
    (match) => {
      `$${match}`;
    }
  )
);
const filterProduct = await productModel
  .find(queryString)
  .sort(req.query.sort.replaceAll(",", " "));
