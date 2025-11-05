import { Request, Response } from 'express';
import User from '../models/User';
import logger from '../utils/logger';
import mongoose from 'mongoose';

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.error('Invalid user ID format', { userId });
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
      logger.warn('User profile not found', { userId });
      res.status(404).json({ error: 'User not found' });
      return;
    }

    logger.info('User profile fetched', { userId });

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching user profile', { error: error.message, stack: error.stack, userId: (req as any).userId });
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { username, email } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.error('Invalid user ID format', { userId });
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    if (!username && !email) {
      res.status(400).json({ error: 'At least one field (username or email) is required' });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      logger.warn('User not found for profile update', { userId });
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if username or email already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        res.status(400).json({ error: 'Username already taken' });
        return;
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ error: 'Email already in use' });
        return;
      }
      user.email = email;
    }

    await user.save();

    logger.info('User profile updated', { userId, username, email });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Error updating user profile', { error: error.message, stack: error.stack, userId: (req as any).userId });
    res.status(500).json({ error: 'Failed to update user profile' });
  }
};

export const deleteUserAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { password } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Password is required to delete account' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.error('Invalid user ID format', { userId });
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      logger.warn('User not found for account deletion', { userId });
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      logger.warn('Invalid password for account deletion', { userId });
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    await User.findByIdAndDelete(userId);

    logger.info('User account deleted', { userId });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting user account', { error: error.message, stack: error.stack, userId: (req as any).userId });
    res.status(500).json({ error: 'Failed to delete account' });
  }
};
