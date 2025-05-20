import { Request, Response, NextFunction } from 'express';
import { storage } from "../storage";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Non authentifié' });
  }
  
  next();
};

export const authorize = (roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
      
      // Attach user to request
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };
      
      next();
    } catch (error) {
      console.error('Error in authorization middleware:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  };
};

export const isAdmin = authorize(['admin']);
export const isWorkshopManager = authorize(['admin', 'workshop_manager']);
export const isTechnician = authorize(['admin', 'workshop_manager', 'technician']);
