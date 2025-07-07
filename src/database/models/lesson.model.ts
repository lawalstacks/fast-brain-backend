import mongoose, { Document, Schema } from "mongoose";

export interface LessonDocument extends Document {
    title: string;
    content: string;
    videoUrl: string;
    duration: string; // in minutes
    courseId: mongoose.Types.ObjectId;
    order: number; // to maintain lesson sequence
    createdAt: Date;
    updatedAt: Date;
}

const lessonSchema = new Schema<LessonDocument>(
    {
        title: { type: String, required: true, trim: true },
        content: { type: String, required: true },
        videoUrl: { type: String },
        duration: { type: String }, // in minutes
        courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
        order: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

// Create compound index to ensure unique order within a course
lessonSchema.index({ courseId: 1, order: 1 }, { unique: true });

// Create index on course for efficient queries
lessonSchema.index({ courseId: 1 });

const LessonModel = mongoose.model<LessonDocument>("Lesson", lessonSchema);

export default LessonModel; 