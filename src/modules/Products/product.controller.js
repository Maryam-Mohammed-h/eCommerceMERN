import slugify from "slugify";
import cloudinary from "../../utils/coludinaryConfigrations.js";
import { categoryModel } from "../../../DB/Models/category.model.js";
import { brandModel } from "../../../DB/Models/brand.model.js";
import { subCategoryModel } from "../../../DB/Models/subCategory.model.js";
import { customAlphabet } from "nanoid";
import { productModel } from "../../../DB/Models/product.model.js";
import { paginationFunction } from "../../utils/pagination.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";

const nanoid = customAlphabet("123456_=!ascbhdtel", 5);

// ========================================== create Product ==========================================
export const addProduct = async (req, res, next) => {
  const { title, desc, price, appliedDiscount, colors, sizes, stock } =
    req.body;
  const { categoryId, subCategoryId, brandId } = req.query;
  //brand, subcategory,category
  const categoryExists = await categoryModel.findById(categoryId);
  if (!categoryExists) {
    return next(new Error("Invalid category id ", { cause: 400 }));
  }
  const subCategoryExists = await subCategoryModel.findById(subCategoryId);
  if (!subCategoryExists) {
    return next(new Error("Invalid subcategory id ", { cause: 400 }));
  }
  if (
    subCategoryExists.categoryId.toString() !== categoryExists._id.toString()
  ) {
    return next(new Error(`Invalid data `, { cause: 400 }));
  }
  const brandExists = await brandModel.findById(brandId);
  if (!brandExists) {
    return next(new Error("Invalid  brand id", { cause: 400 }));
  }

  //title
  const slug = slugify(title, { replacement: "_" });

  //stock
  stock > 0 ? stock : 0;
  //price
  let discountMath;
  if (appliedDiscount) {
    discountMath = price * (appliedDiscount / 100);
  } else {
    discountMath = 0;
  }
  const priceAfterDiscount = price - discountMath;

  //images
  if (!req.files) {
    return next(new Error("please upload product image", { cause: 400 }));
  }
  const customId = nanoid();
  const Images = [];
  const public_ids = [];
  const folderPath = `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/${customId}`;
  for (const file of req.files) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/${customId}`,
      }
    );
    Images.push({ secure_url, public_id });
    public_ids.push(public_id);
  }
  req.imagePath = folderPath;
  const productObject = {
    title,
    slug,
    desc,
    price,
    appliedDiscount,
    priceAfterDiscount,
    colors,
    sizes,
    stock,
    categoryId,
    subCategoryId,
    brandId,
    Images,
    createdBy: req.authUser._id,
    public_ids,
    folderPath,
    customId,
  };

  const product = await productModel.create(productObject);
  if (!product) {
    await cloudinary.api.delete_resources(public_ids);
    return next(
      new Error("try again later , fail to add product", { cause: 400 })
    );
  }

  res.status(200).json({ message: "Added Done", product });
};

// ========================================== update product ==========================================
export const updateProduct = async (req, res, next) => {
  const { productId } = req.params;
  const { title, desc, price, appliedDiscount, colors, sizes, stock } =
    req.body;

  // get product by id
  const product = await productModel.findOne({
    _id: productId,
    createdBy: req.authUser._id,
  });
  if (!product) {
    return next(new Error("Invalid product data ", { cause: 400 }));
  }

  //price
  if (price && appliedDiscount) {
    product.priceAfterDiscount = price - price * (appliedDiscount || 0 / 100);
    product.price = price;
    product.appliedDiscount = appliedDiscount;
  } else if (price) {
    product.priceAfterDiscount =
      price - price * (product.appliedDiscount / 100);
    product.price = price;
  } else if (appliedDiscount) {
    product.priceAfterDiscount =
      product.price - product.price * (appliedDiscount / 100);
    product.appliedDiscount = appliedDiscount;
  }
  //title
  if (title) {
    // different from old name
    if (product.title == title.toLowerCase()) {
      return next(
        new Error("Product name match the old name", {
          cause: 400,
        })
      );
    }
    // unique title
    if (await productModel.findOne({ title: title.toLowerCase() })) {
      return next(
        new Error("This product name is already exist", {
          cause: 400,
        })
      );
    }

    product.title = title;
    product.slug = slugify(title, "_");
  }
  //description
  if (desc) {
    product.desc = desc;
  }
  //stock
  if (stock) {
    if (stock > 0) {
      product.stock = stock;
    }
  }

  //images
  let imagesArr = [];
  let publicIds = [];

  if (req.files.length > 0) {
    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategory.customId}/${product.customId}`,
        }
      );
      imagesArr.push({ secure_url, public_id });
    }
    for (const image of imagesArr) {
      publicIds.push(image.public_id);
    }
    await cloudinary.api.delete_resources(product.public_ids);
  }
  product.Images = imagesArr;
  product.public_ids = publicIds;
  //colors
  if (colors) {
    product.colors = colors;
  }
  // sizes
  if (sizes) {
    product.sizes = sizes;
  }
  await product.save();
  res.status(200).json({ message: "Updated Done", product });
};

//========================================== search Product by title ==========================================
export const searchProduct = async (req, res, next) => {
  const { search, page, elemsByPage } = req.query;
  const { limit, skip } = paginationFunction({ page, elemsByPage });
  const product = await productModel
    .find({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { desc: { $regex: search, $options: "i" } },
      ],
    })
    .select("title priceAfterDiscount")
    .skip(skip)
    .limit(limit)
    .populate([
      {
        path: "Reviews",
      },
    ]);

  res.status(200).json({ message: "Products : ", product });
};
// ========================= get all products pagination ================
export const getAllProducts = async (req, res, next) => {
  const { page, elemsByPage } = req.query;
  const { limit, skip } = paginationFunction({ page, elemsByPage });
  const product = await productModel
    .find()
    // .select("title priceAfterDiscount")
    .skip(skip)
    .limit(limit)
    .populate([
      {
        path: "Reviews",
      },
    ]);
  // let page = req.query.page * 1 || 1;
  res.status(200).json({ message: "success ", product });
};
// ========================= get  product  ================
export const getProduct = async (req, res, next) => {
  const { productId } = req.params;
  const product = await productModel.find({ _id: productId }).populate({path:'categoryId',select:'name'});
  // .populate([
  //   {
  //     path: "Reviews",
  //   },
  // ])
  if (!product) {
    return next(
      new Error("This product is not exist", {
        cause: 400,
      })
    );
  }
  res.status(200).json({ message: "success ", product });
};
// ======================= list products =================================
export const listProducts = async (req, res, next) => {
  const ApiFeatureInstance = new ApiFeatures(productModel.find({}).populate({path:'categoryId',select:'name'}), req.query)

    .sort()
    .pagination()
    .select()
    .filters();
     
  // .populate([
  //   {
  //     path: "Reviews",
  //   },
  // ])
  const products = await ApiFeatureInstance.mongooseQuery;
  res.status(200).json({ message: "success", products });
};

// ================================= Delete Product  =================================
export const deleteProduct = async (req, res, next) => {
  const { productId } = req.params;

  // get product by id
  const product = await productModel.findOneAndDelete({
    _id: productId,
    createdBy: req.authUser._id,
  });

  if (!product) {
    return next(new Error("Delete product fail", { cause: 400 }));
  }

  await cloudinary.api.delete_resources_by_prefix(product.folderPath);

  await cloudinary.api.delete_folder(product.folderPath);
  res.status(200).json({ message: "Delete product Done", product });
};
