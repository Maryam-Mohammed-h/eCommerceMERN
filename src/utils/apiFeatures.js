import { paginationFunction } from "./pagination.js";
export class ApiFeatures {
  constructor(mongooseQuery, queryData) {
    this.mongooseQuery = mongooseQuery;
    this.queryData = queryData;
  }

  //pagination
  pagination() {
    const { page, elemsByPage } = this.queryData;
    const { limit, skip } = paginationFunction({ page, elemsByPage });
    this.mongooseQuery.limit(limit).skip(skip);
    return this;
  }
  //sort
  sort() {
    this.mongooseQuery.sort(this.queryData.sort?.replaceAll(",", " "));

    return this;
  }
  //select
  select() {
    this.mongooseQuery.select(this.queryData.select?.replaceAll(",", " "));

    return this;
  }
  //filters
  filters() {
    const queryInstance = { ...this.queryData };
    const excludeKeysArr = ["page", "elemsByPage", "sort", "select", "search"];
    excludeKeysArr.forEach((key) => {
      delete queryInstance[key];
    });
    const queryString = JSON.parse(
      JSON.stringify(queryInstance).replaceAll(
        /gt|gte|lt|lte|in|nin|eq|neq|regex/g,
        (match) => `$${match}`
      )
    );
    this.mongooseQuery.find(queryString);
    return this;
  }
}
