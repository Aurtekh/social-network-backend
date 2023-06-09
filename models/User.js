import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    friends: {
      type: Array,
      default: [],
    },
    status: {
      type: String,
      default: '',
    },
    birthday: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: '',
    },
    university: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('User', UserSchema);
