import slugify from "slugify";
import { categoryModel } from "../../../DB/Models/category.model.js";
import { subCategoryModel } from "../../../DB/Models/subCategory.model.js";
import { productModel } from "../../../DB/Models/product.model.js";
import { customAlphabet } from "nanoid";
import cloudinary from "../../utils/coludinaryConfigrations.js";
const nanoid = customAlphabet("123456_=!ascbhdtel", 5);

//======================================= create subCategory ==============================
export const createSubCategory = async (req, res, next) => {
  const { categoryId } = req.params;
  const { name } = req.body;

  // check categoryId
  let categoryExists = await categoryModel.findById(categoryId);
  if (!categoryExists) {
    return next(new Error("invalid categoryId", { cause: 400 }));
  }

  // name is unique
  if (await subCategoryModel.findOne({ name })) {
    return next(new Error("duplicate name", { cause: 400 }));
  }
  // generat slug
  const slug = slugify(name, "_");

  // image upload
  if (!req.file) {
    return next(new Error("please upload a subcategory image", { cause: 400 }));
  }

  const customId = nanoid();
  // host
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${customId}`,
    }
  );

  // db
  const subCategoryObject = {
    name,
    slug,
    customId,
    Image: {
      secure_url,
      public_id,
    },
    categoryId,
    createdBy: req.authUser._id,
  };

  const subCategory = await subCategoryModel.create(subCategoryObject);
  if (!subCategory) {
    await cloudinary.uploader.destroy(public_id);
    return next(new Error("try again later", { cause: 400 }));
  }
  res.status(201).json({ message: "Added Done", subCategory });
};

// ========================================== get all subCategories with category Data ==========================================
export const getAllSubCategories = async (req, res, next) => {
  let { categoryId } = req.params;
  const subCategories = await subCategoryModel
    .find({ categoryId })
    .select("name Image");
  res.status(200).json({ message: "Done", subCategories });
};
// ========================================== update subCategory ==========================================
export const updateSubCategory = async (req, res, next) => {
  const { categoryId, subCategoryId } = req.params;
  const { name } = req.body;
  let categoryExists = await categoryModel.findOne({
    _id: categoryId,
    createdBy: req.authUser._id,
  });
  if (!categoryExists) {
    return next(new Error("invalid categoryId", { cause: 400 }));
  }
  //check if category is the same parent of sub
  // get category by id
  const subCategory = await subCategoryModel.findById(subCategoryId);
  if (!subCategory) {
    return next(new Error("invalid subcategory id", { cause: 400 }));
  }

  if (name) {
    // different from old name
    if (subCategory.name == name.toLowerCase()) {
      return next(
        new Error("please enter different name from the old subCategory name", {
          cause: 400,
        })
      );
    }
    // unique name
    if (await subCategoryModel.findOne({ name })) {
      return next(
        new Error("please enter different subCategory name , duplicate name", {
          cause: 400,
        })
      );
    }

    subCategory.name = name;
    subCategory.slug = slugify(name, "_");
  }

  if (req.file) {
    // delete the old category image
    await cloudinary.uploader.destroy(subCategory.Image.public_id);

    // upload the new category image
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategory.customId}`,
      }
    );
    // db
    subCategory.Image = { secure_url, public_id };
  }

  await subCategory.save();
  res.status(200).json({ message: "Updated Done", subCategory });
};

//============================== delete Subcategory ==============

export const deleteSubCategory = async (req, res, next) => {
  const { subCategoryId } = req.params;
  const subCategoryExists = await subCategoryModel.findOneAndDelete({
    _id: subCategoryId,
    createdBy: req.authUser._id,
  });
  if (!subCategoryExists) {
    return next(new Error("Invalid subcategory Id", { cause: 400 }));
  }
  let category = await categoryModel.findById(subCategoryExists.categoryId);
  const relatedProducts = await productModel.deleteMany({
    subCategoryId: subCategoryExists._id,
  });
  await cloudinary.api.delete_resources_by_prefix(
    `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategoryExists.customId}`
  );

  await cloudinary.api.delete_folder(
    `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategoryExists.customId}`
  );

  res.status(200).json({
    message: `SubCategory ${subCategoryExists.name} deleted Successfully`,
  });
};
