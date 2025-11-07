import jwt, { Jwt } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface JWTPayload {
  userId?: string;
  adminId?: string;
  email: string;
  iat?: number;
  exp?: number;
}

export class JWTAuth {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  static generateToken(data: { adminId?: string, userId?: string, email: string }): string {
    return jwt.sign(data, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const payload = JWTAuth.verifyToken(token);
    if (!payload) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Attach user info to request
    (req as any).user = payload;
    next();
  };

  static authenticateAdminToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const payload = JWTAuth.verifyToken(token);
    if (!payload) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    if (!payload.adminId) {
      return res.status(403).json({ message: 'Admin access required', payload });
    }

    const admin = await storage.getAdmin(payload.adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: 'Admin account is inactive' });
    }

    // Attach user info to request
    (req as any).admin = admin;
    next();
  };

  static async register(email: string, password: string, firstName?: string, lastName?: string) {

    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
      });

      // Generate token
      const token = this.generateToken({ userId: user.id, email: user.email });

      return { user, token };
    } catch (error) {
      throw error;
    }
  }

  static async login(email: string, password: string) {
    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken({ userId: user.id, email: user.email });

    return { user, token };
  }

  static async adminRegister(email: string, password: string, firstName?: string, lastName?: string) {
    // Check if admin already exists
    try {
      const existingAdmin = await storage.getAdminByEmail(email);
      if (existingAdmin) {
        throw new Error('Admin already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const admin = await storage.createAdmin({
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
      });

      console.log(admin);

      // Generate token
      const token = this.generateToken({ adminId: admin?.id, email: admin?.email! });

      return { admin, token };
    } catch (error) {
      throw error;
    }
  }

  static async adminLogin(email: string, password: string) {
    const admin = await storage.getAdminByEmail(email);
    if (!admin) {
      throw new Error('Invalid credentials');
    }
    if (!admin.isActive) {
      throw new Error('Admin account is inactive');
    }

    // Check password
    const isValidPassword = await this.comparePassword(password, admin.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken({ adminId: admin.id, email: admin.email });

    return { admin, token };
  }

}