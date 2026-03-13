FROM node:22-slim AS build
WORKDIR /app
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci
COPY frontend/ frontend/
RUN cd frontend && npm run build
COPY api/package*.json api/
RUN cd api && npm ci
COPY api/ api/
RUN cd api && npm run build

FROM node:22-slim
WORKDIR /app
COPY api/package*.json api/
RUN cd api && npm ci --omit=dev
COPY --from=build /app/frontend/dist frontend/dist
COPY --from=build /app/api/dist api/dist
RUN addgroup --system app && adduser --system --ingroup app app
USER app
ENV PORT=8080
EXPOSE 8080
CMD ["node", "api/dist/server.js"]
