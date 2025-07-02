import { CourseController } from "./course.controller";
import { CourseService } from "./course.service";

const courseService = new CourseService();
const courseController = new CourseController(courseService);

export { courseController, courseService };
