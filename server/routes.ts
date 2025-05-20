import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { storage } from "./storage";
import { authenticate, isAdmin, isWorkshopManager, isTechnician } from "./middleware/auth";
import { 
  insertUserSchema, insertVehicleSchema, insertMaintenanceScheduleSchema, 
  insertWorkOrderSchema, insertPartSchema, insertFuelRecordSchema,
  insertAlertSchema
} from "@shared/schema";
import crypto from "crypto";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "YaroFleetOSSecretKey",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      },
      store: new MemoryStoreSession({
        checkPeriod: 86400000 // 24 hours
      })
    })
  );

  // Simple health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  
  // Authentication Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Nom d'utilisateur et mot de passe requis" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Identifiants invalides" });
      }
      
      // In a real application, use proper password hashing (bcrypt, argon2, etc.)
      // This is a simplified example
      const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
      
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Identifiants invalides" });
      }
      
      // Set user session
      req.session.userId = user.id;
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsedUser = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(parsedUser.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Nom d'utilisateur déjà utilisé" });
      }
      
      const existingEmail = await storage.getUserByEmail(parsedUser.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email déjà utilisé" });
      }
      
      // Hash password
      const hashedPassword = crypto
        .createHash("sha256")
        .update(parsedUser.password)
        .digest("hex");
      
      const user = await storage.createUser({
        ...parsedUser,
        password: hashedPassword
      });
      
      return res.status(201).json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données d'utilisateur invalides",
          errors: error.errors 
        });
      }
      
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: Request & { session: any }, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Déconnexion réussie" });
    });
  });

  // Vehicle Routes
  app.get("/api/vehicles", authenticate, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string || "10");
      const offset = parseInt(req.query.offset as string || "0");
      
      const result = await storage.getVehicles(search, status, limit, offset);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Get vehicles error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/vehicles/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de véhicule invalide" });
      }
      
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Véhicule non trouvé" });
      }
      
      return res.status(200).json(vehicle);
    } catch (error) {
      console.error("Get vehicle error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/vehicles", isWorkshopManager, async (req, res) => {
    try {
      const parsedVehicle = insertVehicleSchema.parse(req.body);
      
      // Check if registration number already exists
      const existingVehicle = await storage.getVehicleByRegistration(parsedVehicle.registrationNumber);
      if (existingVehicle) {
        return res.status(400).json({ message: "Numéro d'immatriculation déjà utilisé" });
      }
      
      const vehicle = await storage.createVehicle(parsedVehicle);
      
      return res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données de véhicule invalides",
          errors: error.errors 
        });
      }
      
      console.error("Create vehicle error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/vehicles/:id", isWorkshopManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de véhicule invalide" });
      }
      
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Véhicule non trouvé" });
      }
      
      const updatedVehicle = await storage.updateVehicle(id, req.body);
      
      return res.status(200).json(updatedVehicle);
    } catch (error) {
      console.error("Update vehicle error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/vehicles/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de véhicule invalide" });
      }
      
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Véhicule non trouvé" });
      }
      
      await storage.deleteVehicle(id);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Delete vehicle error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Maintenance Schedule Routes
  app.get("/api/maintenance-schedules/vehicle/:vehicleId", authenticate, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      
      if (isNaN(vehicleId)) {
        return res.status(400).json({ message: "ID de véhicule invalide" });
      }
      
      const schedules = await storage.getMaintenanceSchedulesByVehicleId(vehicleId);
      
      return res.status(200).json(schedules);
    } catch (error) {
      console.error("Get maintenance schedules error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/maintenance-schedules", isWorkshopManager, async (req, res) => {
    try {
      const parsedSchedule = insertMaintenanceScheduleSchema.parse(req.body);
      
      const schedule = await storage.createMaintenanceSchedule(parsedSchedule);
      
      return res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données de planification invalides",
          errors: error.errors 
        });
      }
      
      console.error("Create maintenance schedule error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/maintenance-schedules/:id", isWorkshopManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de planification invalide" });
      }
      
      const schedule = await storage.getMaintenanceSchedule(id);
      
      if (!schedule) {
        return res.status(404).json({ message: "Planification non trouvée" });
      }
      
      const updatedSchedule = await storage.updateMaintenanceSchedule(id, req.body);
      
      return res.status(200).json(updatedSchedule);
    } catch (error) {
      console.error("Update maintenance schedule error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/maintenance-schedules/:id", isWorkshopManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de planification invalide" });
      }
      
      const schedule = await storage.getMaintenanceSchedule(id);
      
      if (!schedule) {
        return res.status(404).json({ message: "Planification non trouvée" });
      }
      
      await storage.deleteMaintenanceSchedule(id);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Delete maintenance schedule error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Work Order Routes
  app.get("/api/work-orders", authenticate, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const priority = req.query.priority as string | undefined;
      const limit = parseInt(req.query.limit as string || "10");
      const offset = parseInt(req.query.offset as string || "0");
      
      const result = await storage.getWorkOrders(status, priority, limit, offset);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Get work orders error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/work-orders/vehicle/:vehicleId", authenticate, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      
      if (isNaN(vehicleId)) {
        return res.status(400).json({ message: "ID de véhicule invalide" });
      }
      
      const orders = await storage.getWorkOrdersByVehicleId(vehicleId);
      
      return res.status(200).json(orders);
    } catch (error) {
      console.error("Get vehicle work orders error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/work-orders/technician/:technicianId", isTechnician, async (req, res) => {
    try {
      const technicianId = parseInt(req.params.technicianId);
      
      if (isNaN(technicianId)) {
        return res.status(400).json({ message: "ID de technicien invalide" });
      }
      
      const orders = await storage.getWorkOrdersByTechnicianId(technicianId);
      
      return res.status(200).json(orders);
    } catch (error) {
      console.error("Get technician work orders error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/work-orders", isWorkshopManager, async (req, res) => {
    try {
      const parsedWorkOrder = insertWorkOrderSchema.parse(req.body);
      
      const workOrder = await storage.createWorkOrder(parsedWorkOrder);
      
      // If a maintenance schedule is associated, update the vehicle status
      if (parsedWorkOrder.maintenanceScheduleId) {
        const vehicle = await storage.getVehicle(parsedWorkOrder.vehicleId);
        if (vehicle && vehicle.status === 'operational') {
          await storage.updateVehicle(parsedWorkOrder.vehicleId, { status: 'maintenance' });
        }
      }
      
      return res.status(201).json(workOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données d'ordre de travail invalides",
          errors: error.errors 
        });
      }
      
      console.error("Create work order error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/work-orders/:id", isTechnician, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID d'ordre de travail invalide" });
      }
      
      const workOrder = await storage.getWorkOrder(id);
      
      if (!workOrder) {
        return res.status(404).json({ message: "Ordre de travail non trouvé" });
      }
      
      const updatedData = req.body;
      
      // If the status is being updated to completed, update the endDate if not provided
      if (updatedData.status === 'completed' && !updatedData.endDate) {
        updatedData.endDate = new Date();
      }
      
      const updatedWorkOrder = await storage.updateWorkOrder(id, updatedData);
      
      // If work order is completed, update vehicle status back to operational
      if (updatedData.status === 'completed') {
        const vehicle = await storage.getVehicle(workOrder.vehicleId);
        if (vehicle && vehicle.status === 'maintenance') {
          // Check if there are other active work orders for this vehicle
          const activeOrders = await storage.getWorkOrdersByVehicleId(workOrder.vehicleId);
          const otherActiveOrders = activeOrders.filter(order => 
            order.id !== id && 
            ['pending', 'in_progress'].includes(order.status)
          );
          
          if (otherActiveOrders.length === 0) {
            await storage.updateVehicle(workOrder.vehicleId, { status: 'operational' });
          }
        }
      }
      
      return res.status(200).json(updatedWorkOrder);
    } catch (error) {
      console.error("Update work order error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/work-orders/:id", isWorkshopManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID d'ordre de travail invalide" });
      }
      
      const workOrder = await storage.getWorkOrder(id);
      
      if (!workOrder) {
        return res.status(404).json({ message: "Ordre de travail non trouvé" });
      }
      
      await storage.deleteWorkOrder(id);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Delete work order error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Parts Inventory Routes
  app.get("/api/parts", authenticate, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const limit = parseInt(req.query.limit as string || "10");
      const offset = parseInt(req.query.offset as string || "0");
      
      const result = await storage.getParts(search, limit, offset);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Get parts error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/parts/low-on-stock", authenticate, async (_req, res) => {
    try {
      const parts = await storage.getPartsLowOnStock();
      
      return res.status(200).json(parts);
    } catch (error) {
      console.error("Get low stock parts error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/parts", isWorkshopManager, async (req, res) => {
    try {
      const parsedPart = insertPartSchema.parse(req.body);
      
      // Check if reference already exists
      const existingPart = await storage.getPartByReference(parsedPart.reference);
      if (existingPart) {
        return res.status(400).json({ message: "Référence de pièce déjà utilisée" });
      }
      
      const part = await storage.createPart(parsedPart);
      
      return res.status(201).json(part);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données de pièce invalides",
          errors: error.errors 
        });
      }
      
      console.error("Create part error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/parts/:id", isWorkshopManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de pièce invalide" });
      }
      
      const part = await storage.getPart(id);
      
      if (!part) {
        return res.status(404).json({ message: "Pièce non trouvée" });
      }
      
      const updatedPart = await storage.updatePart(id, req.body);
      
      return res.status(200).json(updatedPart);
    } catch (error) {
      console.error("Update part error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/parts/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de pièce invalide" });
      }
      
      const part = await storage.getPart(id);
      
      if (!part) {
        return res.status(404).json({ message: "Pièce non trouvée" });
      }
      
      await storage.deletePart(id);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Delete part error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Parts Used Routes
  app.get("/api/work-orders/:workOrderId/parts", authenticate, async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.workOrderId);
      
      if (isNaN(workOrderId)) {
        return res.status(400).json({ message: "ID d'ordre de travail invalide" });
      }
      
      const partsUsed = await storage.getPartsUsedForWorkOrder(workOrderId);
      
      return res.status(200).json(partsUsed);
    } catch (error) {
      console.error("Get parts used error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/work-orders/:workOrderId/parts", isTechnician, async (req, res) => {
    try {
      const workOrderId = parseInt(req.params.workOrderId);
      
      if (isNaN(workOrderId)) {
        return res.status(400).json({ message: "ID d'ordre de travail invalide" });
      }
      
      const workOrder = await storage.getWorkOrder(workOrderId);
      
      if (!workOrder) {
        return res.status(404).json({ message: "Ordre de travail non trouvé" });
      }
      
      if (workOrder.status === 'completed' || workOrder.status === 'cancelled') {
        return res.status(400).json({ message: "Impossible d'ajouter des pièces à un ordre de travail terminé ou annulé" });
      }
      
      const partUsed = await storage.addPartToWorkOrder({
        ...req.body,
        workOrderId
      });
      
      return res.status(201).json(partUsed);
    } catch (error) {
      console.error("Add part to work order error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/parts-used/:id", isTechnician, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de pièce utilisée invalide" });
      }
      
      await storage.removePartFromWorkOrder(id);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Remove part from work order error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Fuel Records Routes
  app.get("/api/fuel-records/vehicle/:vehicleId", authenticate, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      
      if (isNaN(vehicleId)) {
        return res.status(400).json({ message: "ID de véhicule invalide" });
      }
      
      const fuelRecords = await storage.getFuelRecordsByVehicleId(vehicleId);
      
      return res.status(200).json(fuelRecords);
    } catch (error) {
      console.error("Get fuel records error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/fuel-records", authenticate, async (req, res) => {
    try {
      const parsedFuelRecord = insertFuelRecordSchema.parse(req.body);
      
      const fuelRecord = await storage.createFuelRecord(parsedFuelRecord);
      
      // Update vehicle mileage
      await storage.updateVehicle(parsedFuelRecord.vehicleId, {
        mileage: parsedFuelRecord.mileage
      });
      
      return res.status(201).json(fuelRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données de carburant invalides",
          errors: error.errors 
        });
      }
      
      console.error("Create fuel record error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/fuel-records/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID d'enregistrement de carburant invalide" });
      }
      
      const fuelRecord = await storage.getFuelRecord(id);
      
      if (!fuelRecord) {
        return res.status(404).json({ message: "Enregistrement de carburant non trouvé" });
      }
      
      const updatedFuelRecord = await storage.updateFuelRecord(id, req.body);
      
      // Update vehicle mileage if it has increased
      if (req.body.mileage && req.body.mileage > fuelRecord.mileage) {
        const vehicle = await storage.getVehicle(fuelRecord.vehicleId);
        if (vehicle && req.body.mileage > vehicle.mileage) {
          await storage.updateVehicle(fuelRecord.vehicleId, {
            mileage: req.body.mileage
          });
        }
      }
      
      return res.status(200).json(updatedFuelRecord);
    } catch (error) {
      console.error("Update fuel record error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/fuel-records/:id", isWorkshopManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID d'enregistrement de carburant invalide" });
      }
      
      const fuelRecord = await storage.getFuelRecord(id);
      
      if (!fuelRecord) {
        return res.status(404).json({ message: "Enregistrement de carburant non trouvé" });
      }
      
      await storage.deleteFuelRecord(id);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Delete fuel record error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Alert Routes
  app.get("/api/alerts", authenticate, async (req: Request & { session: any }, res) => {
    try {
      const userId = req.session.userId;
      
      const alerts = await storage.getAlertsByUserId(userId);
      
      return res.status(200).json(alerts);
    } catch (error) {
      console.error("Get alerts error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/alerts/unread", authenticate, async (req: Request & { session: any }, res) => {
    try {
      const userId = req.session.userId;
      
      const alerts = await storage.getUnreadAlertsByUserId(userId);
      
      return res.status(200).json(alerts);
    } catch (error) {
      console.error("Get unread alerts error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/alerts", isWorkshopManager, async (req, res) => {
    try {
      const parsedAlert = insertAlertSchema.parse(req.body);
      
      const alert = await storage.createAlert(parsedAlert);
      
      return res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données d'alerte invalides",
          errors: error.errors 
        });
      }
      
      console.error("Create alert error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/alerts/:id/read", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID d'alerte invalide" });
      }
      
      const alert = await storage.getAlert(id);
      
      if (!alert) {
        return res.status(404).json({ message: "Alerte non trouvée" });
      }
      
      const updatedAlert = await storage.markAlertAsRead(id);
      
      return res.status(200).json(updatedAlert);
    } catch (error) {
      console.error("Mark alert as read error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.delete("/api/alerts/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID d'alerte invalide" });
      }
      
      const alert = await storage.getAlert(id);
      
      if (!alert) {
        return res.status(404).json({ message: "Alerte non trouvée" });
      }
      
      await storage.deleteAlert(id);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Delete alert error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Dashboard Statistics Routes
  app.get("/api/statistics/fleet", authenticate, async (_req, res) => {
    try {
      const statistics = await storage.getFleetStatistics();
      
      return res.status(200).json(statistics);
    } catch (error) {
      console.error("Get fleet statistics error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/statistics/maintenance-compliance", authenticate, async (_req, res) => {
    try {
      const compliance = await storage.getMaintenanceCompliance();
      
      return res.status(200).json(compliance);
    } catch (error) {
      console.error("Get maintenance compliance error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/statistics/maintenance-cost/:period", authenticate, async (req, res) => {
    try {
      const period = req.params.period as 'week' | 'month' | 'quarter' | 'year';
      
      if (!['week', 'month', 'quarter', 'year'].includes(period)) {
        return res.status(400).json({ message: "Période invalide" });
      }
      
      const cost = await storage.getMaintenanceCost(period);
      
      return res.status(200).json({ cost });
    } catch (error) {
      console.error("Get maintenance cost error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
