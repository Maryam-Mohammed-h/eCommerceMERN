import { connectionDB } from "../../DB/connection.js";
import { globalResponse } from "./errorhandling.js";
import * as routers from "../modules/index.routes.js";
import { changeCouponStatusCron } from "./cron.js";
import cors from "cors";
export const initiateApp = (app, express) => {
  const port = process.env.PORT || 5000;

  app.use(express.json());
  connectionDB();
  app.use(cors());
  app.get("/", (req, res) => res.send("Hello World!"));
  app.use("/category", routers.categoryRouter);
  app.use("/subCategory", routers.subCategoryRouter);
  app.use("/brand", routers.brandRouter);
  app.use("/product", routers.productRouter);
  app.use("/coupon", routers.couponRouter);
  app.use("/cart", routers.cartRouter);
  app.use("/order", routers.orderRouter);
  app.use("/auth", routers.authRouter);
  app.all("*", (req, res, next) =>
    res.status(404).json({ message: "404 Not Found URL" })
  );

  app.use(globalResponse);
  // changeCouponStatusCron();

  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
};
