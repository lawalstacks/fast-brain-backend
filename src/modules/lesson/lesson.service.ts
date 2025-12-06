import { BadRequestException, NotFoundException } from "../../common/utils/catch-errors";
import { ErrorCode } from "../../common/enums/error-code.enum";
import LessonModel from "../../database/models/lesson.model";
import CourseModel from "../../database/models/course.model";
import EnrollmentModel from "../../database/models/enrollment.model";
import { CreateLessonDto, UpdateLessonDto } from "../../common/interface/lesson.interface";
import mongoose from "mongoose";
import { uploadAndGetUrl, deleteFile } from "../../config/cloudinary.config";
import { logger } from "../../utils/logger";

export class LessonService {
    /**
     * Create a new lesson
     */
    public async createLesson(lessonData: CreateLessonDto, userId: string) {
        const { courseId, order } = lessonData;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            throw new BadRequestException("Invalid course ID");
        }

        // Verify course exists and user is the instructor
        const course = await CourseModel.findById(courseId);

        if (!course) {
            throw new NotFoundException("Course not found");
        }

        if (course.instructor.toString() !== userId.toString()) {
            throw new BadRequestException("You can only add lessons to your own courses");
        }

        const dataToCreate: any = {};
        dataToCreate.title = lessonData.title;
        dataToCreate.content = lessonData.content;
        dataToCreate.courseId = courseId;
        dataToCreate.videoUrl = null;
        dataToCreate.duration = lessonData.duration;

        // If order is not provided, set it to the next available order
        let lessonOrder = order;

        if (lessonOrder === undefined) {
            const lastLesson = await LessonModel.findOne({ courseId: courseId })
                .sort({ order: -1 })
                .limit(1);
            lessonOrder = lastLesson ? lastLesson.order + 1 : 0;
        }

        // Check if order already exists for this course
        if (lessonOrder !== undefined) {
            const existingLesson = await LessonModel.findOne({
                courseId: courseId,
                order: lessonOrder
            });
            if (existingLesson) {
                throw new BadRequestException(
                    "A lesson with this order already exists in this course",
                    ErrorCode.VALIDATION_ERROR
                );
            }
        }

        if (lessonData.video) {
            const videoUrl = await uploadAndGetUrl(lessonData.video.buffer, lessonData.video.originalname, 'demo-bucket');
            dataToCreate.videoUrl = videoUrl;
        }

        const lesson = await LessonModel.create({
            ...dataToCreate,
            order: lessonOrder
        });

        return lesson;
    }

    /**
     * Get lessons for a course
     */
    public async getLessonsByCourse(courseId: string) {
        const course = await CourseModel.findById(courseId);
        if (!course) {
            throw new NotFoundException("Course not found");
        }

        const lessons = await LessonModel.find({ courseId: courseId })
            .sort({ order: 1 })

        return lessons;
    }

    /**
     * Get lesson by ID
     */
    public async getLessonById(lessonId: string) {
        const lesson = await LessonModel.findById(lessonId)
            .populate('courseId', 'title instructor');

        if (!lesson) {
            throw new NotFoundException("Lesson not found");
        }

        return lesson;
    }

    /**
     * Update lesson
     */
    public async updateLesson(lessonId: string, updateData: UpdateLessonDto, userId: string) {
        const lesson = await LessonModel.findById(lessonId)
            .populate('courseId', 'instructor');

        if (!lesson) {
            throw new NotFoundException("Lesson not found");
        }

        // Check if user is the instructor of the course
        if ((lesson.courseId as any).instructor.toString() !== userId.toString()) {
            throw new BadRequestException("You can only update lessons in your own courses");
        }

        // If order is being updated, check for conflicts
        if (updateData.order !== undefined && updateData.order !== lesson.order) {
            const existingLesson = await LessonModel.findOne({
                courseId: lesson.courseId,
                order: updateData.order,
                _id: { $ne: lessonId }
            });
            if (existingLesson) {
                throw new BadRequestException(
                    "A lesson with this order already exists in this course",
                    ErrorCode.VALIDATION_ERROR
                );
            }
        }

        if (updateData.video) {
            await uploadAndGetUrl(updateData.video.buffer, updateData.video.originalname, 'demo-bucket', lesson.videoUrl);
        }

        delete updateData.video;

        const updatedLesson = await LessonModel.findByIdAndUpdate(
            lessonId,
            updateData,
            { new: true, runValidators: true }
        ).populate('courseId', 'title');

        return updatedLesson;
    }

    /**
     * Delete lesson
     */
    public async deleteLesson(lessonId: string, userId: string) {
        const lesson = await LessonModel.findById(lessonId)
            .populate('courseId', 'instructor');

        if (!lesson) {
            throw new NotFoundException("Lesson not found");
        }

        // Check if user is the instructor of the course
        if ((lesson.courseId as any).instructor.toString() !== userId.toString()) {
            throw new BadRequestException("You can only delete lessons from your own courses");
        }

        // Delete video file if exists
        if (lesson.videoUrl) {
            try {
                const url = lesson.videoUrl;
                const match = url?.split('/').pop();
                if (match) {
                    await deleteFile('demo-bucket', match);
                }
            } catch (err) {
                // Log error but do not block lesson deletion
                console.error('Failed to delete video file:', err);
            }
        }

        await LessonModel.findByIdAndDelete(lessonId);
        return { deleted: true };
    }

    /**
     * Reorder lessons in a course
     */
    public async reorderLessons(courseId: string, lessonIds: string[], userId: string) {
        const course = await CourseModel.findById(courseId);
        if (!course) {
            throw new NotFoundException("Course not found");
        }

        if (course.instructor.toString() !== userId.toString()) {
            throw new BadRequestException("You can only reorder lessons in your own courses");
        }

        // Verify all lessons belong to this course
        const lessons = await LessonModel.find({
            _id: { $in: lessonIds },
            courseId: courseId
        });

        if (lessons.length !== lessonIds.length) {
            throw new BadRequestException("Some lessons do not belong to this course");
        }

        // Update order for each lesson
        const updatePromises = lessonIds.map((lessonId, index) =>
            LessonModel.findByIdAndUpdate(lessonId, { order: index })
        );

        await Promise.all(updatePromises);

        // Return updated lessons
        const updatedLessons = await LessonModel.find({ courseId: courseId })
            .sort({ order: 1 })

        return updatedLessons;
    }

    /**
     * Mark a lesson as completed for a user
     */
    // public async markAsCompleted(userId: string, lessonId: string, courseId: string) {
    //     logger.debug(`markAsCompleted called with userId: ${userId}, lessonId: ${lessonId}, courseId: ${courseId}`);

    //     if (!mongoose.Types.ObjectId.isValid(courseId)) {
    //         logger.debug(`Invalid course ID: ${courseId}`);
    //         throw new BadRequestException("Invalid course ID");
    //     }

    //     if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    //         logger.debug(`Invalid lesson ID: ${lessonId}`);
    //         throw new BadRequestException("Invalid lesson ID");
    //     }

    //     // Check if the lesson exists and belongs to the course
    //     const lesson = await LessonModel.findOne({ _id: lessonId, courseId: courseId });
    //     if (!lesson) {
    //         logger.debug(`Lesson not found in course or does not belong to course. lessonId: ${lessonId}, courseId: ${courseId}`);
    //         throw new NotFoundException("Lesson not found in this course");
    //     }
    //     logger.debug(`Lesson found: ${lesson._id}`);

    //     // Find the user's enrollment for this course
    //     logger.debug(`Attempting to find enrollment for userId: ${userId}, courseId: ${courseId}`);
    //     const enrollment = await EnrollmentModel.findOne({
    //         user: new mongoose.Types.ObjectId(userId),
    //         course: new mongoose.Types.ObjectId(courseId)
    //     });

    //     if (!enrollment) {
    //         logger.debug(`Enrollment not found for userId: ${userId}, courseId: ${courseId}. Throwing BadRequestException.`);
    //         throw new BadRequestException("You are not enrolled in this course");
    //     }
    //     logger.debug(`Enrollment found. Completed lessons: ${enrollment.completedLessons.length}`);


    //     // Check if the lesson is already completed
    //     if (enrollment.completedLessons.includes(lessonId as any)) {
    //         logger.debug(`Lesson ${lessonId} already marked as completed for user ${userId} in course ${courseId}`);
    //         return { message: "Lesson already marked as completed" };
    //     }

    //     // Add the lesson to the completed lessons array
    //     enrollment.completedLessons.push(new mongoose.Types.ObjectId(lessonId));
    //     await enrollment.save();
    //     logger.debug(`Lesson ${lessonId} added to completedLessons for user ${userId} in course ${courseId}`);

    //     return { message: "Lesson marked as completed successfully" };
    // }

    public async markAsCompleted(userId: string, lessonId: string, courseId: string) {
        try {
            logger.debug(`markAsCompleted called with userId: ${userId}, lessonId: ${lessonId}, courseId: ${courseId}`);

            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                logger.debug(`Invalid course ID: ${courseId}`);
                throw new BadRequestException("Invalid course ID");
            }

            if (!mongoose.Types.ObjectId.isValid(lessonId)) {
                logger.debug(`Invalid lesson ID: ${lessonId}`);
                throw new BadRequestException("Invalid lesson ID");
            }

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                logger.debug(`Invalid user ID: ${userId}`);
                throw new BadRequestException("Invalid user ID");
            }

            // Check if the lesson exists and belongs to the course
            const lesson = await LessonModel.findOne({
                _id: lessonId,
                courseId: courseId
            });

            if (!lesson) {
                logger.debug(`Lesson not found in course. lessonId: ${lessonId}, courseId: ${courseId}`);
                throw new NotFoundException("Lesson not found in this course");
            }

            logger.debug(`Lesson found: ${lesson._id}`);

            // Find the user's enrollment
            logger.debug(`Attempting to find enrollment for userId: ${userId}, courseId: ${courseId}`);

            const enrollment = await EnrollmentModel.findOne({
                user: userId,
                course: courseId
            });

            logger.debug(`Enrollment query result: ${enrollment ? 'Found' : 'Not found'}`);

            if (!enrollment) {
                logger.debug(`Enrollment not found for userId: ${userId}, courseId: ${courseId}`);
                throw new BadRequestException("You are not enrolled in this course");
            }

            // Initialize completedLessons if it doesn't exist
            if (!enrollment.completedLessons) {
                logger.debug(`completedLessons field is undefined, initializing as empty array`);
                enrollment.completedLessons = [];
            }

            logger.debug(`Enrollment found. Completed lessons before: ${enrollment.completedLessons.length}`);

            // Check if the lesson is already completed
            const isCompleted = enrollment.completedLessons.some(
                (completedId) => completedId.toString() === lessonId
            );

            logger.debug(`Is lesson already completed: ${isCompleted}`);

            if (isCompleted) {
                logger.debug(`Lesson ${lessonId} already marked as completed`);
                return { message: "Lesson already marked as completed" };
            }

            // Add the lesson to the completed lessons array
            logger.debug(`Attempting to add lesson ${lessonId} to completedLessons`);
            const lessonObjectId = new mongoose.Types.ObjectId(lessonId);
            enrollment.completedLessons.push(lessonObjectId);

            logger.debug(`About to save enrollment. New array length: ${enrollment.completedLessons.length}`);

            await enrollment.save();

            logger.debug(`Enrollment saved successfully. Lesson ${lessonId} added to completedLessons.`);

            return {
                message: "Lesson marked as completed successfully",
                completedLessons: enrollment.completedLessons.length
            };
        } catch (error) {
            logger.error(`Error in markAsCompleted: ${error}`);
            logger.error(`Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
            throw error;
        }
    }
} 