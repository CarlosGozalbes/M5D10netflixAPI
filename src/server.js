import express from "express";
import listEndpoints from "express-list-endpoints";

import mediaRouter from "./services/media/index.js";
import {
  badRequestHandler,
  unauthorizedHandler,
  notFoundHandler,
  genericErrorHandler,
} from "./errorHandlers.js";

import cors from "cors";



const server = express();

const port = process.env.PORT || 3001;



//cors
const whiteListedOrigins = [process.env.FE_DEV_URL, process.env.FE_PROD_URL]; 
console.log("Permitted origins:");
console.table(whiteListedOrigins);

server.use(
  cors({
    origin: function (origin, next) {
      console.log("ORIGIN: ", origin);
      if (!origin || whiteListedOrigins.indexOf(origin) !== -1) {
        next(null, true);
      } else {
        next(new Error("CORS ERROR!"));
      }
    },
  })
);

//

server.use(express.json());

//ENDPOINTS

server.use("/media", mediaRouter);

//

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

console.table(listEndpoints(server));

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


server.on('error', (error)=>{
    console.log(error)
})
