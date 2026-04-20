require("dotenv").config();

const cors = require("cors");
const express = require("express");
const pool = require("./db");
const authRoutes = require("./modules/auth/auth.routes");
const customerRoutes = require("./modules/customers/customers.routes");
const quotationRoutes = require("./modules/quotations/quotations.routes");
const roleRoutes = require("./modules/roles/roles.routes");
const userRoutes = require("./modules/users/users.routes");
const zipCodeRoutes = require("./modules/zip-codes/zip-codes.routes");
const { requireAuth } = require("./middlewares/auth");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      name: "cotacao_v02 Backend",
      status: "ok",
      endpoints: [
        "GET /health",
        "GET /health/db",
        "POST /v1/auth/login",
        "GET /v1/customers",
        "GET /v1/roles",
        "GET /v1/roles/:id",
        "POST /v1/roles",
        "PUT /v1/roles/:id",
        "DELETE /v1/roles/:id",
        "GET /v1/users",
        "GET /v1/users/:id",
        "POST /v1/users",
        "PUT /v1/users/:id",
        "DELETE /v1/users/:id",
        "PATCH /v1/users/:id/activate",
        "GET /v1/customers/:id",
        "POST /v1/customers",
        "PUT /v1/customers/:id",
        "DELETE /v1/customers/:id",
        "PATCH /v1/customers/:id/activate",
        "PATCH /v1/customers/:id/deactivate",
        "GET /v1/zip-codes/:zipCode",
        "GET /v1/quotations",
        "GET /v1/quotations/:id",
        "POST /v1/quotations",
        "PUT /v1/quotations/:id",
        "DELETE /v1/quotations/:id",
        "PATCH /v1/quotations/:id/activate"
      ]
    });
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "backend",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/health/db", async (_req, res) => {
    try {
      const [rows] = await pool.query("SELECT NOW() AS db_time");

      res.json({
        status: "ok",
        service: "database",
        dbTime: rows[0].db_time
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Falha ao conectar no banco",
        detail: error.message
      });
    }
  });

  app.use("/v1/auth", authRoutes);
  app.use("/v1/customers", requireAuth, customerRoutes);
  app.use("/v1/zip-codes", requireAuth, zipCodeRoutes);
  app.use("/v1/quotations", requireAuth, quotationRoutes);
  app.use("/v1/roles", requireAuth, roleRoutes);
  app.use("/v1/users", requireAuth, userRoutes);

  return app;
}

module.exports = createApp;
