import { eq, and, or, desc, sql, like, gte, lte, isNull } from "drizzle-orm";
import { db } from "./db";
import {
  users, vehicles, maintenanceSchedules, workOrders, parts, partsUsed, fuelRecords, alerts,
  type User, type InsertUser, type Vehicle, type InsertVehicle,
  type MaintenanceSchedule, type InsertMaintenanceSchedule,
  type WorkOrder, type InsertWorkOrder, type Part, type InsertPart,
  type PartUsed, type InsertPartUsed, type FuelRecord, type InsertFuelRecord,
  type Alert, type InsertAlert
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Vehicle methods
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleByRegistration(registrationNumber: string): Promise<Vehicle | undefined>;
  getVehicles(search?: string, status?: string, limit?: number, offset?: number): Promise<{ vehicles: Vehicle[], total: number }>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  // Maintenance schedule methods
  getMaintenanceSchedule(id: number): Promise<MaintenanceSchedule | undefined>;
  getMaintenanceSchedulesByVehicleId(vehicleId: number): Promise<MaintenanceSchedule[]>;
  createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule>;
  updateMaintenanceSchedule(id: number, schedule: Partial<InsertMaintenanceSchedule>): Promise<MaintenanceSchedule | undefined>;
  deleteMaintenanceSchedule(id: number): Promise<boolean>;
  
  // Work order methods
  getWorkOrder(id: number): Promise<WorkOrder | undefined>;
  getWorkOrdersByVehicleId(vehicleId: number): Promise<WorkOrder[]>;
  getWorkOrdersByTechnicianId(technicianId: number): Promise<WorkOrder[]>;
  getWorkOrders(status?: string, priority?: string, limit?: number, offset?: number): Promise<{ workOrders: WorkOrder[], total: number }>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: number, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined>;
  deleteWorkOrder(id: number): Promise<boolean>;
  
  // Parts inventory methods
  getPart(id: number): Promise<Part | undefined>;
  getPartByReference(reference: string): Promise<Part | undefined>;
  getParts(search?: string, limit?: number, offset?: number): Promise<{ parts: Part[], total: number }>;
  getPartsLowOnStock(): Promise<Part[]>;
  createPart(part: InsertPart): Promise<Part>;
  updatePart(id: number, part: Partial<InsertPart>): Promise<Part | undefined>;
  deletePart(id: number): Promise<boolean>;
  
  // Parts used methods
  getPartsUsedForWorkOrder(workOrderId: number): Promise<PartUsed[]>;
  addPartToWorkOrder(partUsed: InsertPartUsed): Promise<PartUsed>;
  updatePartUsed(id: number, partUsed: Partial<InsertPartUsed>): Promise<PartUsed | undefined>;
  removePartFromWorkOrder(id: number): Promise<boolean>;
  
  // Fuel records methods
  getFuelRecord(id: number): Promise<FuelRecord | undefined>;
  getFuelRecordsByVehicleId(vehicleId: number): Promise<FuelRecord[]>;
  createFuelRecord(fuelRecord: InsertFuelRecord): Promise<FuelRecord>;
  updateFuelRecord(id: number, fuelRecord: Partial<InsertFuelRecord>): Promise<FuelRecord | undefined>;
  deleteFuelRecord(id: number): Promise<boolean>;
  
  // Alert methods
  getAlert(id: number): Promise<Alert | undefined>;
  getAlertsByUserId(userId: number): Promise<Alert[]>;
  getUnreadAlertsByUserId(userId: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: number): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<boolean>;
  
  // Dashboard methods
  getFleetStatistics(): Promise<{ operational: number, maintenance: number, outOfService: number }>;
  getMaintenanceCompliance(): Promise<{ compliant: number, overdue: number, total: number }>;
  getMaintenanceCost(period: 'week' | 'month' | 'quarter' | 'year'): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(
      eq(users.role, role as "admin" | "workshop_manager" | "technician" | "user")
    );
  }
  
  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }
  
  async getVehicleByRegistration(registrationNumber: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.registrationNumber, registrationNumber));
    return vehicle;
  }
  
  async getVehicles(
    search?: string,
    status?: "operational" | "maintenance" | "out_of_service",
    limit = 10,
    offset = 0
  ): Promise<{ vehicles: Vehicle[], total: number }> {
    let query = db.select().from(vehicles);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(vehicles);

    const conditions = [];

    if (search) {
      const likeSearch = `%${search}%`;
      conditions.push(
        or(
          like(vehicles.registrationNumber, likeSearch),
          like(vehicles.brand, likeSearch),
          like(vehicles.model, likeSearch)
        )
      );
    }

    if (status) {
      conditions.push(eq(vehicles.status, status));
    }

    if (conditions.length > 0) {
      const whereClause = conditions.length === 1
        ? conditions[0]
        : conditions.reduce((acc, condition) => and(acc, condition))!;
      query = db.select().from(vehicles).where(whereClause);
      countQuery = db.select({ count: sql<number>`count(*)` }).from(vehicles).where(whereClause);
    }

    query = query.orderBy(desc(vehicles.createdAt)).limit(limit).offset(offset);

    const results = await query;
    const [{ count }] = await countQuery;

    return { vehicles: results, total: count };
  }
  
  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [createdVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return createdVehicle;
  }
  
  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set(vehicle)
      .where(eq(vehicles.id, id))
      .returning();
    return updatedVehicle;
  }
  
  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
    return result.length > 0;
  }
  
  // Maintenance schedule methods
  async getMaintenanceSchedule(id: number): Promise<MaintenanceSchedule | undefined> {
    const [schedule] = await db
      .select()
      .from(maintenanceSchedules)
      .where(eq(maintenanceSchedules.id, id));
    return schedule;
  }
  
  async getMaintenanceSchedulesByVehicleId(vehicleId: number): Promise<MaintenanceSchedule[]> {
    return await db
      .select()
      .from(maintenanceSchedules)
      .where(eq(maintenanceSchedules.vehicleId, vehicleId))
      .orderBy(maintenanceSchedules.scheduledDate);
  }
  
  async createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule> {
    const [createdSchedule] = await db
      .insert(maintenanceSchedules)
      .values(schedule)
      .returning();
    return createdSchedule;
  }
  
  async updateMaintenanceSchedule(id: number, schedule: Partial<InsertMaintenanceSchedule>): Promise<MaintenanceSchedule | undefined> {
    const [updatedSchedule] = await db
      .update(maintenanceSchedules)
      .set(schedule)
      .where(eq(maintenanceSchedules.id, id))
      .returning();
    return updatedSchedule;
  }
  
  async deleteMaintenanceSchedule(id: number): Promise<boolean> {
    const result = await db
      .delete(maintenanceSchedules)
      .where(eq(maintenanceSchedules.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Work order methods
  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    const [workOrder] = await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.id, id));
    return workOrder;
  }
  
  async getWorkOrdersByVehicleId(vehicleId: number): Promise<WorkOrder[]> {
    return await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.vehicleId, vehicleId))
      .orderBy(desc(workOrders.createdAt));
  }
  
  async getWorkOrdersByTechnicianId(technicianId: number): Promise<WorkOrder[]> {
    return await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.technicianId, technicianId))
      .orderBy(desc(workOrders.createdAt));
  }
  
  async getWorkOrders(
    status?: "pending" | "in_progress" | "completed" | "cancelled",
    priority?: "low" | "medium" | "high" | "critical",
    limit = 10,
    offset = 0
  ): Promise<{ workOrders: WorkOrder[], total: number }> {
    let query = db.select().from(workOrders).orderBy(desc(workOrders.createdAt));
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(workOrders);
    
    const conditions = [];
    
    if (status) {
      conditions.push(eq(workOrders.status, status));
    }
    
    if (priority) {
      conditions.push(eq(workOrders.priority, priority));
    }
    
    if (conditions.length > 0) {
      const whereClause = conditions.reduce((acc, condition) => and(acc, condition))!;
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }
    
    query = query.offset(offset).limit(limit);
    
    const results = await query;
    const [{ count }] = await countQuery;
    
    return { workOrders: results, total: count };
  }
  
  async createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder> {
    const [createdWorkOrder] = await db
      .insert(workOrders)
      .values(workOrder)
      .returning();
    return createdWorkOrder;
  }
  
  async updateWorkOrder(id: number, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const [updatedWorkOrder] = await db
      .update(workOrders)
      .set(workOrder)
      .where(eq(workOrders.id, id))
      .returning();
    return updatedWorkOrder;
  }
  
  async deleteWorkOrder(id: number): Promise<boolean> {
    const result = await db
      .delete(workOrders)
      .where(eq(workOrders.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Parts inventory methods
  async getPart(id: number): Promise<Part | undefined> {
    const [part] = await db
      .select()
      .from(parts)
      .where(eq(parts.id, id));
    return part;
  }
  
  async getPartByReference(reference: string): Promise<Part | undefined> {
    const [part] = await db
      .select()
      .from(parts)
      .where(eq(parts.reference, reference));
    return part;
  }
  
  async getParts(search?: string, limit = 10, offset = 0): Promise<{ parts: Part[], total: number }> {
    let query = db.select().from(parts).orderBy(parts.name);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(parts);
    
    if (search) {
      const likeSearch = `%${search}%`;
      const searchCondition = or(
        like(parts.name, likeSearch),
        like(parts.reference, likeSearch),
        like(parts.description, likeSearch)
      );
      
      query = query.where(searchCondition);
      countQuery = countQuery.where(searchCondition);
    }
    
    query = query.limit(limit).offset(offset);
    
    const results = await query;
    const [{ count }] = await countQuery;
    
    return { parts: results, total: count };
  }
  
  async getPartsLowOnStock(): Promise<Part[]> {
    return await db
      .select()
      .from(parts)
      .where(lte(parts.quantity, parts.minQuantity))
      .orderBy(parts.quantity);
  }
  
  async createPart(part: InsertPart): Promise<Part> {
    const [createdPart] = await db
      .insert(parts)
      .values(part)
      .returning();
    return createdPart;
  }
  
  async updatePart(id: number, part: Partial<InsertPart>): Promise<Part | undefined> {
    const [updatedPart] = await db
      .update(parts)
      .set(part)
      .where(eq(parts.id, id))
      .returning();
    return updatedPart;
  }
  
  async deletePart(id: number): Promise<boolean> {
    const result = await db
      .delete(parts)
      .where(eq(parts.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Parts used methods
  async getPartsUsedForWorkOrder(workOrderId: number): Promise<PartUsed[]> {
    return await db
      .select()
      .from(partsUsed)
      .where(eq(partsUsed.workOrderId, workOrderId));
  }
  
  async addPartToWorkOrder(partUsed: InsertPartUsed): Promise<PartUsed> {
    const [createdPartUsed] = await db
      .insert(partsUsed)
      .values(partUsed)
      .returning();
    
    // Decrement part quantity
    await db
      .update(parts)
      .set({
        quantity: sql`${parts.quantity} - ${partUsed.quantity}`
      })
      .where(eq(parts.id, partUsed.partId));
    
    return createdPartUsed;
  }
  
  async updatePartUsed(id: number, partUsed: Partial<InsertPartUsed>): Promise<PartUsed | undefined> {
    // Get current part used to calculate quantity difference
    const [currentPartUsed] = await db
      .select()
      .from(partsUsed)
      .where(eq(partsUsed.id, id));
    
    if (!currentPartUsed) return undefined;
    
    // Update the part used record
    const [updatedPartUsed] = await db
      .update(partsUsed)
      .set(partUsed)
      .where(eq(partsUsed.id, id))
      .returning();
    
    // If quantity changed, update parts inventory
    if (partUsed.quantity && partUsed.quantity !== currentPartUsed.quantity) {
      const quantityDiff = currentPartUsed.quantity - partUsed.quantity;
      
      await db
        .update(parts)
        .set({
          quantity: sql`${parts.quantity} + ${quantityDiff}`
        })
        .where(eq(parts.id, currentPartUsed.partId));
    }
    
    return updatedPartUsed;
  }
  
  async removePartFromWorkOrder(id: number): Promise<boolean> {
    // Get current part used to restore inventory
    const [partUsed] = await db
      .select()
      .from(partsUsed)
      .where(eq(partsUsed.id, id));
    
    if (!partUsed) return false;
    
    // Update parts inventory
    await db
      .update(parts)
      .set({
        quantity: sql`${parts.quantity} + ${partUsed.quantity}`
      })
      .where(eq(parts.id, partUsed.partId));
    
    // Delete the part used record
    const result = await db
      .delete(partsUsed)
      .where(eq(partsUsed.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Fuel records methods
  async getFuelRecord(id: number): Promise<FuelRecord | undefined> {
    const [fuelRecord] = await db
      .select()
      .from(fuelRecords)
      .where(eq(fuelRecords.id, id));
    return fuelRecord;
  }
  
  async getFuelRecordsByVehicleId(vehicleId: number): Promise<FuelRecord[]> {
    return await db
      .select()
      .from(fuelRecords)
      .where(eq(fuelRecords.vehicleId, vehicleId))
      .orderBy(desc(fuelRecords.date));
  }
  
  async createFuelRecord(fuelRecord: InsertFuelRecord): Promise<FuelRecord> {
    const [createdFuelRecord] = await db
      .insert(fuelRecords)
      .values(fuelRecord)
      .returning();
    return createdFuelRecord;
  }
  
  async updateFuelRecord(id: number, fuelRecord: Partial<InsertFuelRecord>): Promise<FuelRecord | undefined> {
    const [updatedFuelRecord] = await db
      .update(fuelRecords)
      .set(fuelRecord)
      .where(eq(fuelRecords.id, id))
      .returning();
    return updatedFuelRecord;
  }
  
  async deleteFuelRecord(id: number): Promise<boolean> {
    const result = await db
      .delete(fuelRecords)
      .where(eq(fuelRecords.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Alert methods
  async getAlert(id: number): Promise<Alert | undefined> {
    const [alert] = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, id));
    return alert;
  }
  
  async getAlertsByUserId(userId: number): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt));
  }
  
  async getUnreadAlertsByUserId(userId: number): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(and(
        eq(alerts.userId, userId),
        eq(alerts.isRead, false)
      ))
      .orderBy(desc(alerts.createdAt));
  }
  
  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [createdAlert] = await db
      .insert(alerts)
      .values(alert)
      .returning();
    return createdAlert;
  }
  
  async markAlertAsRead(id: number): Promise<Alert | undefined> {
    const [updatedAlert] = await db
      .update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.id, id))
      .returning();
    return updatedAlert;
  }
  
  async deleteAlert(id: number): Promise<boolean> {
    const result = await db
      .delete(alerts)
      .where(eq(alerts.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Dashboard methods
  async getFleetStatistics(): Promise<{ operational: number, maintenance: number, outOfService: number }> {
    const operational = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(eq(vehicles.status, 'operational'));
    
    const maintenance = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(eq(vehicles.status, 'maintenance'));
    
    const outOfService = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(eq(vehicles.status, 'out_of_service'));
    
    return {
      operational: operational[0].count,
      maintenance: maintenance[0].count,
      outOfService: outOfService[0].count
    };
  }
  
  async getMaintenanceCompliance(): Promise<{ compliant: number, overdue: number, total: number }> {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    
    const compliant = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(
        or(
          isNull(vehicles.nextMaintenanceDate),
          gte(vehicles.nextMaintenanceDate, todayStr)
        )
      );
    
    const overdue = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(
        and(
          sql`${vehicles.nextMaintenanceDate} is not null`,
          lte(vehicles.nextMaintenanceDate, todayStr)
        )
      );
    
    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles);
    
    return {
      compliant: compliant[0].count,
      overdue: overdue[0].count,
      total: total[0].count
    };
  }
  
  async getMaintenanceCost(period: 'week' | 'month' | 'quarter' | 'year'): Promise<number> {
    let dateCondition;
    const now = new Date();
    
    switch(period) {
      case 'week':
        dateCondition = sql`${workOrders.endDate} >= current_date - interval '7 days'`;
        break;
      case 'month':
        dateCondition = sql`${workOrders.endDate} >= current_date - interval '1 month'`;
        break;
      case 'quarter':
        dateCondition = sql`${workOrders.endDate} >= current_date - interval '3 months'`;
        break;
      case 'year':
        dateCondition = sql`${workOrders.endDate} >= current_date - interval '1 year'`;
        break;
    }
    
    const result = await db
      .select({ total: sql<number>`coalesce(sum(${workOrders.cost}), 0)` })
      .from(workOrders)
      .where(
        and(
          eq(workOrders.status, 'completed'),
          dateCondition
        )
      );
    
    return result[0].total;
  }
}

export const storage = new DatabaseStorage();
