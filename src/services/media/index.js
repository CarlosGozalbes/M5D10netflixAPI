import express from "express";
import axios from "axios";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import { newMediaValidation, newReviewValidation } from "./validation.js";
import multer from "multer";

import { getMedia, writeMedia } from "../../lib/fs-tools.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";


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
    if (req.query && req.query.Title) {
        const filteredMedia = mediaArray.filter(
            (media) => media.Title === req.query.Title
        )
        res.send(filteredMedia)
    } else { 
        axios.get(`http://www.omdbapi.com/?s=${req.query.Title}&apikey=bf46dbfc`).then(OMDbMedia => res.data.Search).catch(err=> console.log(err))
        mediaArray.push(OMDbMedia);
        await writeMedia(mediaArray)

    res.send(OMDbMedia);
    }
  } catch (error) {
    next(error); 
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
    
    try {
      
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
      const review = {
        id: uniqid(),
        comment,
        rate,
        elementId: mediaimdbID,
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



export default mediaRouter;
