import mongoose, { Document, Schema } from "mongoose";

export interface EnrollmentDocument extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId; 
  completedLessons: number;
}

const enrollmentSchema = new Schema<EnrollmentDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    completedLessons: { type: Number, default: 0 },
  },
  { timestamps: true }
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

enrollmentSchema.index({ user: 1 });

const EnrollmentModel = mongoose.model<EnrollmentDocument>(
  "Enrollment",
  enrollmentSchema
);

export default EnrollmentModel;
