import slugify from "slugify";
import cloudinary from "../../utils/coludinaryConfigrations.js";
import { brandModel } from "../../../DB/Models/brand.model.js";
import { customAlphabet } from "nanoid";
import { productModel } from "../../../DB/Models/product.model.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";

const nanoid = customAlphabet("123456_=!ascbhdtel", 5);

// =========================================== Add Brand ===================
export const createBrand = async (req, res, next) => {
  const { name, desc } = req.body;
  //slug
  const slug = slugify(name, { replacement: "_", lower: true });
  // logo
  if (!req.file) {
    return next(new Error("please upload a brand logo", { cause: 400 }));
  }

  const customId = nanoid();
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.PROJECT_FOLDER}/Brands/${customId}`,
    }
  );
  //database
  const brandObject = {
    name,
    slug,
    desc,
    logo: {
      secure_url,
      public_id,
    },
    createdBy: req.authUser._id,
    customId,
  };

  const brand = await brandModel.create(brandObject);
  if (!brand) {
    await cloudinary.uploader.destroy(public_id);
    return next(
      new Error("try again later , fail to add your brand", { cause: 400 })
    );
  }

  res.status(200).json({ message: "Added Done", brand });
};
//======================== Get all brands ====================
export const getAllBrands = async (req, res, next) => {
  const brands = await brandModel.find().select("name");
  res.status(200).json({ message: "Done", brands });
};

// ========================================== update brand ==========================================
export const updateBrand = async (req, res, next) => {
  const { brandId } = req.params;
  const { name, desc } = req.body;

  // get brand by id
  const brand = await brandModel.findOne({
    _id: brandId,
    createdBy: req.authUser._id,
  });
  if (!brand) {
    return next(new Error("invalud brand Id", { cause: 400 }));
  }

  if (name) {
    // different from old name
    if (brand.name == name.toLowerCase()) {
      return next(
        new Error("please enter different name from the old brand name", {
          cause: 400,
        })
      );
    }

    brand.name = name;
    brand.slug = slugify(name, "_");
  }
  if (desc) {
    brand.desc = desc;
  }
  if (req.file) {
    // delete the old brand image
    await cloudinary.uploader.destroy(brand.logo.public_id);

    // upload the new brand image
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Brands/${brand.customId}`,
      }
    );
    // db
    brand.logo = { secure_url, public_id };
  }

  await brand.save();
  res.status(200).json({ message: "Updated Done", brand });
};

//============================== delete brand ==============

export const deleteBrand = async (req, res, next) => {
  const { brandId } = req.params;
  const brandExists = await brandModel.findOneAndDelete({
    _id: brandId,
    createdBy: req.authUser._id,
  });
  if (!brandExists) {
    return next(new Error("Invalid brand Id", { cause: 400 }));
  }
  const relatedProducts = await productModel.find({
    brandId: brandExists._id,
  });

  if (relatedProducts.length > 0) {
    for (const prod of relatedProducts) {
      await cloudinary.api.delete_resources_by_prefix(prod.folderPath);

      await cloudinary.api.delete_folder(prod.folderPath);
    }
    const deleteRelatedProducts = await productModel.deleteMany({
      brandId: brandExists._id,
    });

    if (!deleteRelatedProducts.deletedCount) {
      return next(
        new Error(
          `delete products related to brand ${brandExists.name} failed`,
          {
            cause: 400,
          }
        )
      );
    }
  }

  await cloudinary.api.delete_resources_by_prefix(
    `${process.env.PROJECT_FOLDER}/Brands/${brandExists.customId}`
  );

  await cloudinary.api.delete_folder(
    `${process.env.PROJECT_FOLDER}/Brands/${brandExists.customId}`
  );

  res.status(200).json({
    message: `Brand ${brandExists.name} deleted Successfully`,
  });
};
