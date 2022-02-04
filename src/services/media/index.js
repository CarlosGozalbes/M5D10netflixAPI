import express from "express";

import uniqid from "uniqid";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import { newMediaValidation, newReviewValidation } from "./validation.js";
import multer from "multer";
import { saveMediaPoster } from "../../lib/fs-tools.js";
import { getMedia, writeMedia } from "../../lib/fs-tools.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
// import { getPDFReadableStream } from "../../lib/pdf-tools.js";
// import { pipeline } from "stream";
// import { sendNewBlog } from "../../lib/email-tools.js";

const mediaRouter = express.Router();

mediaRouter.post("/", newMediaValidation, async (req, res, next) => {
  try {
    const errorsList = validationResult(req);
    if (errorsList.isEmpty()) {
      
      const newMedia = {
        ...req.body,
        createdAt: new Date(),
        imdbID: uniqid(),
      };

      
      const mediaArray = await getMedia();

      
      mediaArray.push(newMedia);

      
      await writeMedia(mediaArray);

      //send blogupload email
    //   const newMedia = req.body;
    //   await sendNewMedia(newMedia);

      res.status(201).send({ imdbID: newMedia.imdbID });
    } else {
      next(
        createHttpError(400, "Some errors occured in request body!", {
          errorsList,
        })
      );
    }
  } catch (error) {
    next(error);
  }
});

mediaRouter.get("/", async (req, res, next) => {
  try {
    const mediaArray = await getMedia();

    res.send(mediaArray);
  } catch (error) {
    next(error); // With the next function I can send the error to the error handler middleware
  }
});

mediaRouter.get("/:mediaimdbID", async (req, res, next) => {
  try {
    const mediaimdbID = req.params.mediaimdbID;

    const mediaArray = await getMedia();

    const foundMedia = mediaArray.find((media) => media.imdbID === mediaimdbID);
    if (foundMedia) {
      res.send(foundMedia);
    } else {
      next(
        createHttpError(
          404,
          `Media with id ${req.params.mediaimdbID} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

mediaRouter.put("/:mediaimdbID", async (req, res, next) => {
  try {
    const mediaimdbID = req.params.mediaimdbID;

    const mediaArray = await getMedia();

    const index = mediaArray.findIndex(
      (media) => media.imdbID === mediaimdbID
    );

    const oldMedia = mediaArray[index];

    const updatedMedia = {
      ...oldMedia,
      ...req.body,
      updatedAt: new Date(),
    };

    mediaArray[index] = updatedMedia;

    await writeMedia(mediaArray);

    res.send(updatedMedia);
  } catch (error) {
    next(error);
  }
});

mediaRouter.delete("/:mediaimdbID", async (req, res, next) => {
  try {
    const mediaimdbID = req.params.mediaimdbID;

    const mediaArray = await getMedia();

    const remaningMedia = mediaArray.filter(
      (media) => media.imdbID !== mediaimdbID
    );

    await writeMedia(remaningMedia);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

//uploadcover

mediaRouter.post(
  "/:mediaimdbID/poster",
  multer({
    storage: new CloudinaryStorage({ cloudinary, params: { folder: "netflix" } }),
  }).single("Poster"),
  async (req, res, next) => {
    // "Poster" does need to match exactly to the name used in FormData field in the frontend, otherwise Multer is not going to be able to find the file in the req.body
    try {
      // console.log("FILE: ", req.file);
      // await saveMediaPoster(req.file.originalname, req.file.buffer);
      const mediaimdbID = req.params.mediaimdbID;

      const mediaArray = await getMedia();

      const index = mediaArray.findIndex(
        (media) => media.imdbID === mediaimdbID
      );

      const oldMedia = mediaArray[index];

      const updatedMedia = {
        ...oldMedia,
        Poster: req.file.path,
        updatedAt: new Date(),
      };

      mediaArray[index] = updatedMedia;

      await writeMedia(mediaArray);

      res.send(req.file.path);
    } catch (error) {
      next(error);
    }
  }
);

//reviews

mediaRouter.post(
  "/:mediaimdbID/reviews",
  newReviewValidation,
  async (req, res, next) => {
    try {
      const mediaimdbID = req.params.mediaimdbID;
      const { comment, rate } = req.body;
      const comment = {
        id: uniqid(),
        comment,
        rate,
        elementId: media.imdbID,
        createdAt: new Date(),
      };

      const mediaArray = await getMedia();

      const index = mediaArray.findIndex(
        (media) => mediaimdbID === req.params.mediaimdbID
      );
      if (!index == -1) {
        res.status(404).send({
          message: `media with ${mediaimdbID} is not found!`,
        });
      }
      const oldMedia = mediaArray[index];
      oldMedia.reviews = oldMedia.reviews || [];
      const updatedMedia = {
        ...oldMedia,
        ...req.body,
        reviews: [...oldMedia.reviews, review],
        updatedAt: new Date(),
      };
      mediaArray[index] = updatedMedia;

      await writeMedia(mediaArray);
      res.send("ok");
    } catch (error) {
      next(error);
    }
  }
);

mediaRouter.delete(
  "/:mediaimdbID/reviews/:reviewId",

  async (req, res, next) => {
    try {
      const mediaimdbID = req.params.mediaimdbID;
      const reviewId = req.params.reviewId;

      const mediaArray = await getMedia();

      const index = mediaArray.findIndex(
        (media) => media.imdbID === mediaimdbID
      );

      const oldMedia = mediaArray[index];

      const remainingReviews = oldMedia.reviews.filter(
        (review) => review._id !== reviewId
      );

      oldMedia["reviews"] = remainingReviews;

      mediaArray[index] = oldMedia;

      await writeMedia(mediaArray);

      res.send(oldMedia.reviews);
    } catch (error) {
      next(error);
    }
  }
);

mediaRouter.get("/:mediaimdbID/pdf", async (req,res,next) => {
    try {
      const mediaimdbID = req.params.mediaimdbID;
      const mediaArray = await getMedia();
      const foundMedia = mediaArray.find(
        (media) => media.imdbID === mediaimdbID
      );
      console.log(foundMedia);
      res.setHeader(
        "Content-Disposition"`attachment; filename=${foundMedia.Title}.pdf`
      );
      const source = getPDFReadableStream(foundMedia);
      const destination = res;
      pipeline(source, destination, (err) => {
        if (err) next(err);
      });
    } catch (error) {
        
    }
});

// blogPostsRouter.get("/:blogPostId/downloadPDF", async (req, res, next) => {
//   try {
//     const blogPostId = req.params.blogPostId;

//     const blogPostsArray = await getBlogPosts();

//     const foundBlogPost = blogPostsArray.find(
//       (blogPost) => blogPost._id === blogPostId
//     );
//     console.log(foundBlogPost);
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=${foundBlogPost.title}.pdf`
//     );

//     const source = getPDFReadableStream(foundBlogPost);
//     const destination = res;
//     pipeline(source, destination, (err) => {
//       if (err) next(err);
//     });
//   } catch (error) {
//     next(error);
//   }
// });

export default mediaRouter;
