import { body } from "express-validator";

export const newMediaValidation = [
  body("Title").exists().withMessage("Title is a mandatory field!"),
  body("Year").exists().withMessage("Category is a mandatory field!"),
  body("Type").exists().withMessage("Email is a mandatory field!"),
];

export const newReviewValidation = [
  body("comment").exists().withMessage("Comment is a mandatory field!"),
  body("rate")
    .exists()
    .withMessage("Rate is a mandatory field!")
    .isNumeric({ min: 0, max: 5 }),
];