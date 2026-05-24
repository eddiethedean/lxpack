import { z } from "zod";

export type Condition =
  | { variable: { eq: [string, string | number | boolean] } }
  | { assessment: { passed: string } }
  | { interaction: { done: string } }
  | { all: Condition[] }
  | { any: Condition[] };

const baseConditionSchema = z.union([
  z
    .object({
      variable: z.object({
        eq: z.tuple([
          z.string().min(1),
          z.union([z.string(), z.number(), z.boolean()]),
        ]),
      }),
    })
    .strict(),
  z
    .object({
      assessment: z.object({
        passed: z.string().min(1),
      }),
    })
    .strict(),
  z
    .object({
      interaction: z.object({
        done: z.string().min(1),
      }),
    })
    .strict(),
]);

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    ...baseConditionSchema.options,
    z.object({ all: z.array(conditionSchema) }).strict(),
    z.object({ any: z.array(conditionSchema) }).strict(),
  ]),
);

export const flowRuleSchema = z
  .object({
    when: conditionSchema,
    goto: z.string().min(1),
  })
  .strict();

export type FlowRule = z.infer<typeof flowRuleSchema>;
