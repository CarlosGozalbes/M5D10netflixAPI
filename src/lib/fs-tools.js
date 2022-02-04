import fs from "fs-extra"; 
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { createReadStream } from "fs";

const { readJSON, writeJSON, writeFile } = fs;

const dataFolderPath = join(dirname(fileURLToPath(import.meta.url)), "../data");

const mediaPublicFolderPath = join(process.cwd(), "./public/img/media");


const mediaJSONPath = join(dataFolderPath, "media.json");


export const getMedia = () => readJSON(mediaJSONPath);
export const writeMedia = (content) =>
  writeJSON(mediaJSONPath, content);


export const saveMediaPoster = (filename, contentAsABuffer) =>
  writeFile(join(mediaPublicFolderPath, filename), contentAsABuffer);

console.log(mediaPublicFolderPath);


