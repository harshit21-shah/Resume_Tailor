export interface Change {
  section: string;
  description: string;
}

export interface Replacement {
  original: string;
  new: string;
}

export interface TailorResponse {
  tailored_resume: string;
  changes: Change[];
  match_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  replacements: Replacement[];
}

export interface TailorRequest {
  resume: string;
  job_description: string;
}
