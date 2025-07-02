// src/common/interface/category.interface.ts
export interface CreateCategoryDto {
    name: string;
    description?: string;
}

export interface UpdateCategoryDto {
    name?: string;
    description?: string;
}

// src/common/interface/course.interface.ts
export interface CreateCourseDto {
    title: string;
    description: string;
    instructor: string;
    categoryId: string;
    imageUrl?: string;
    price?: number;
    lessons?: Array<{
        title: string;
        content: string;
        videoUrl?: string;
        duration?: number;
    }>;
}

export interface UpdateCourseDto {
    title?: string;
    description?: string;
    categoryId?: string;
    category?: {
        _id: any;
        name: string;
    };
    imageUrl?: string;
    price?: number;
    lessons?: Array<{
        title: string;
        content: string;
        videoUrl?: string;
        duration?: number;
    }>;
}

export interface CourseFilters {
    page: number;
    limit: number;
    category?: string;
    published?: boolean;
    instructor?: string;
    search?: string;
}