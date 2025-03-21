import mongoose, { Document, Schema } from "mongoose";

enum Role {
    ADMIN = "admin",
    USER = "user",
}

export interface IUser extends Document {
    email: string;
    name: string;
    photo: string;
    googleId: string;
    role: Role;
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true, index: true, unique: true },
    name: { type: String, required: true },
    photo: { type: String, required: false },
    googleId: { type: String, required: true, index: true, unique: true },
    role: { type: String, enum: Object.values(Role), default: Role.USER }
});

export default mongoose.model<IUser>("User", userSchema);