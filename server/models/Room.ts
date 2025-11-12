import mongoose, { Schema, Document } from 'mongoose';

// Define the TypeScript interface for a Room document
export interface IRoom extends Document {
  roomId: string;
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
  active: boolean;
}

// Define the schema for the Room collection
const RoomSchema: Schema = new Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },

  // Array of user ObjectIds who have joined the room
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],

  // Automatically set the creation date
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // Indicates whether the room is active
  active: {
    type: Boolean,
    default: true,
  },
});

// Export the Room model for use in controllers
export default mongoose.model<IRoom>('Room', RoomSchema);