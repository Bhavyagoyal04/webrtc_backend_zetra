import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import logger from '../utils/logger';
import mongoose from 'mongoose';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      res.status(400).json({ error: `User with this ${field} already exists` });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, email, passwordHash });
    await user.save();

    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const token = generateToken(userId);

    logger.info('User registered successfully', { userId, username, email });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    logger.error('Registration error', { error: error.message, stack: error.stack });

    if (error.code === 11000) {
      res.status(400).json({ error: 'User with this email or username already exists' });
      return;
    }

    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', { email, userId: user._id });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const token = generateToken(userId);

    logger.info('User logged in successfully', { userId, email });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: userId,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password are required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ error: 'New password must be different from current password' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('Password change attempt for non-existent user', { userId });
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn('Password change attempt with incorrect current password', { userId });
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    await user.save();

    logger.info('Password changed successfully', { userId });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error: any) {
    logger.error('Password change error', { error: error.message, stack: error.stack, userId: (req as any).userId });
    res.status(500).json({ error: 'Server error during password change' });
  }
};
