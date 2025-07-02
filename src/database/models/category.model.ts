import mongoose, { Document, Schema } from "mongoose";

export interface CategoryDocument extends Document {
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
    {
        name: { 
            type: String, 
            required: true, 
            trim: true, 
            unique: true 
        },
        description: { 
            type: String, 
            trim: true 
        },
    },
    { timestamps: true }
);

const CategoryModel = mongoose.model<CategoryDocument>("Category", categorySchema);

export default CategoryModel;