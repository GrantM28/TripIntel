import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Trip Intelligence API",
      version: "1.0.0",
      description: "Road-trip planning API with streaming category results"
    },
    servers: [{ url: "http://localhost:4000/api" }]
  },
  apis: []
};

export const swaggerSpec = swaggerJsdoc(options);