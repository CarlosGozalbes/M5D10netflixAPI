import PdfPrinter from "pdfmake";
import axios from "axios";
import getStream from "get-stream";
export const getPDFReadableStream = async (foundMedia, asBuffer = false) => {
  
  const reviewsPart = foundMedia.reviews.map(review=>({
    text:review.text,
    fontSize:16,
    bold:true
  }))
  
  const fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Italics",
    },
  };

  const printer = new PdfPrinter(fonts);
  let imagePart = {};
  if (foundMedia.Poster) {
    const response = await axios.get(foundMedia.Poster, {
      responseType: "arraybuffer",
    });
    const mediaPosterURLParts = foundMedia.Poster.split("/");
    const fileName = mediaPosterURLParts[mediaPosterURLParts.length - 1];
    const [imdbID, extension] = fileName.split(".");
    const base64 = response.data.toString("base64");
    const base64Image = `data:image/${extension};base64,${base64}`;
    imagePart = {
      image: base64Image,
      width: 480,
      height: 300,
      margin: [0, 0, 0, 40],
    };
  }
  const docDefinition = {
    content: [
      imagePart,
      {
        text: foundMedia.Title,
        style: "header",
      },
      "\n",
      foundMedia.Year,
      "\n",
      foundMedia.Type,
      "\n",
      ...reviewsPart
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
      },
    },
    defaultStyle: {
      font: "Helvetica",
    },
  };

  const pdfReadableStream = printer.createPdfKitDocument(docDefinition, {});
  pdfReadableStream.end();
  const buffer = await getStream.buffer(pdfReadableStream);
  return asBuffer ? buffer : pdfReadableStream;
};
