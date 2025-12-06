import mongoose, { Document, Schema } from "mongoose";

export interface QuizDocument extends Document {
    user: mongoose.Types.ObjectId;
    count: number;
    score: number;
    createdAt: Date;
    updatedAt: Date;
    increaseCount: () => Promise<void>;
    increaseScore: (newScore: number) => Promise<void>;
}

const quizSchema = new Schema<QuizDocument>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        count: { type: Number, default: 0, min: 0 },
        score: { type: Number, default: 0, min: 0 }
    },
    {
        timestamps: true
    }
);

quizSchema.methods.increaseCount = async function (this: QuizDocument): Promise<void> {
    this.count += 1;
    await this.save();
};

quizSchema.methods.increaseScore = async function (this: QuizDocument, newScore: number): Promise<void> {
    this.score += newScore;
    await this.save();
};

const QuizModel = mongoose.model<QuizDocument>("Quiz", quizSchema);
export default QuizModel;