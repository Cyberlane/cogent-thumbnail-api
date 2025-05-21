import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type { jobs } from "./db.schema";

export type Job = InferSelectModel<typeof jobs>;
export type InsertJob = InferInsertModel<typeof jobs>;
export type JobStatus = Job['status'];