import { ZodError } from "zod";

export const formatZodError = (err: ZodError) => {
    return err.issues.map((e: any) => ({
        field: e.path.join("."),
        message: e.message
    }));
};