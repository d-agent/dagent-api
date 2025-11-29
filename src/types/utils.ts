import { z } from "zod"

export const CloudflareEmbeddingResponse = z.object({
    result: z.object({
        data: z.array(z.array(z.number())),
        response: z.null(),
        shape: z.array(z.number()),
        pooling: z.string(),
        meta: z.object({
            cost_metric_name_1: z.string().nullable(),
            cost_metric_value_1: z.number().nullable(),
            cost_metric_name_2: z.string().nullable(),
            cost_metric_value_2: z.number().nullable(),
            neurons: z.number()
        })
    }),
    success: z.boolean(),
    errors: z.array(z.any()),
    messages: z.array(z.any())
});
