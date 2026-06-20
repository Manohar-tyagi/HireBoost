/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: blogposts
 * Interface for BlogPosts
 */
export interface BlogPosts {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  bodyContent?: string;
  /** @wixFieldType text */
  metaDescription?: string;
  /** @wixFieldType text */
  metaKeywords?: string;
  /** @wixFieldType text */
  author?: string;
  /** @wixFieldType date */
  publishDate?: Date | string;
  /** @wixFieldType text */
  slug?: string;
  /** @wixFieldType image */
  featuredImage?: string;
}


/**
 * Collection ID: frequentlyaskedquestions
 * Interface for FrequentlyAskedQuestions
 */
export interface FrequentlyAskedQuestions {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  question?: string;
  /** @wixFieldType text */
  answer?: string;
  /** @wixFieldType text */
  category?: string;
  /** @wixFieldType boolean */
  isFeatured?: boolean;
  /** @wixFieldType number */
  displayOrder?: number;
}


/**
 * Collection ID: interviewroles
 * Interface for InterviewRoles
 */
export interface InterviewRoles {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  domain?: string;
  /** @wixFieldType text */
  roleName?: string;
  /** @wixFieldType text */
  roleDescription?: string;
  /** @wixFieldType text */
  difficultyLevel?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
  /** @wixFieldType number */
  suggestedQuestionsCount?: number;
}


/**
 * Collection ID: servicefeatures
 * Interface for ServiceFeatures
 */
export interface ServiceFeatures {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType image */
  illustration?: string;
  /** @wixFieldType text */
  callToActionText?: string;
  /** @wixFieldType url */
  callToActionUrl?: string;
  /** @wixFieldType number */
  displayOrder?: number;
}


/**
 * Collection ID: writingassistanttemplates
 * Interface for WritingAssistantTemplates
 */
export interface WritingAssistantTemplates {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  templateName?: string;
  /** @wixFieldType text */
  templateType?: string;
  /** @wixFieldType text */
  targetRole?: string;
  /** @wixFieldType text */
  templateContent?: string;
  /** @wixFieldType text */
  templateDescription?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
}
