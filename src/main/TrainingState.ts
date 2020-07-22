import { parse } from "path"

import { existsSync } from 'fs';

export interface TrainingState {
    /**
     * Number between 0 and 1 that determines how often the user should "win"
     * a challenge without needing extra hints.
     */
    winProbability: number,

    /**
     * Maximal length of text fragments presented to the user.
     */
    fragmentLength: number,

    /**
     * Index of the current challenge.
     */
    challengeIndex: number,

    /**
     * Relative file path from which to load the actual challenge data.
     */
    challengeFile: string,

    /**
     * Maximum number of times the same fragment is attempted.
     */
    maxAttempts: number,
}

export namespace TrainingState {

    type Primitive = number | string | boolean;
    type ValidatedEntryValid<T extends Primitive> = { valid: T };
    type ValidatedEntryInvalid = { error: string };
    type ValidatedEntry<T extends Primitive> = ValidatedEntryValid<T> | ValidatedEntryInvalid;

    interface SchemaEntry<T extends Primitive>{
        type: 'number' | 'string' | 'boolean';
        isRequired: boolean;
        defaultValue?: T;
        check(t: T): ValidatedEntry<T>;
        description: string;
    }

    interface Schema {
        [index: string]: SchemaEntry<any>
    }

    const trainingStateSchema: Schema = {
        'winProbability': {
            type: 'number',
            check(n: number): ValidatedEntry<number> {
                if (n > 0.0 && n < 1.0) {
                    return { valid: n };
                } else {
                    return { error: 'The probability must be strictly between 0 and 1, but was ' + n };
                }
            },
            isRequired: true,
            defaultValue: 0.75,
            description: 'Probability of winning on each challenge that the program should aim for.',
        },
        'fragmentLength': {
            type: 'number',
            check(n: number): ValidatedEntry<number> {
                if (n >= 1) {
                    return { valid: Math.floor(n) };
                } else {
                    return { error: 'The fragment length must be positive, but was ' + n };
                }
            },
            defaultValue: 40,
            isRequired: true,
            description: 'Maximum length of the text fragment in each round.',
        },
        'challengeIndex': {
            type: 'number',
            check(n: number): ValidatedEntry<number> {
                if (n >= 0) {
                    return { valid: Math.floor(n) };
                } else {
                    return { error: 'The challenge index must be non-negative (0-based), but was ' + n };
                }
            },
            defaultValue: 0,
            isRequired: false,
            description: 'Index of the current challenge.',
        },
        'challengeFile': {
            type: 'string',
            check(relFilePath: string): ValidatedEntry<string> {
                if (existsSync(relFilePath)) {
                    return { valid: relFilePath };
                } else {
                    return { error: `Couldn't find the file "${relFilePath}".` };
                }
            },
            isRequired: true,
            description: 'Path to the file containing the textual data.',
        },
        'maxAttempts': {
            type: 'number',
            check(n: number): ValidatedEntry<number> {
                if (n >= 1) {
                    return { valid: Math.floor(n) };
                } else {
                    return { error: `Expected a positive integer number of attempts, but got ${n}.` }
                }
            },
            isRequired: false,
            defaultValue: 3,
            description: 'Maximum number of attempts allowed on same fragment.',
        }
    }

    function validateEntry<T extends Primitive>(
        key: string,
        schemaEntry: SchemaEntry<T>,
        entryValue: any
    ): ValidatedEntry<T> {
        if (typeof entryValue === 'undefined') {
          if (schemaEntry.isRequired) {
              return { error: `Missing required setting '${key}' of type ${schemaEntry.type} (${schemaEntry.description})` };
          } else {
              return { valid: schemaEntry.defaultValue! };
          }
        } else {
          if (typeof entryValue === schemaEntry.type) {
              return schemaEntry.check(entryValue);
          } else {
              return { error: `Invalid type of ${key}, expected a ${schemaEntry.type}, but got: ${entryValue}` };
          }
        }
    }

    export type ValidatedTrainingStateInvalid = { errors: string[] };
    export type ValidatedTrainingStateValid = { valid: TrainingState };
    export type ValidatedTrainingState = ValidatedTrainingStateValid | ValidatedTrainingStateInvalid;

    export type LoadedConfig = Record<string, any>;
    
    export function validateConfig(loadedConfig: LoadedConfig): ValidatedTrainingState {
        const errors: string[] = [];
        const result: LoadedConfig = {};
        for (let key in trainingStateSchema) {
            const schema = trainingStateSchema[key];
            const validatedEntry = validateEntry(key, schema, loadedConfig[key]);
            if ('error' in validatedEntry) {
                errors.push(validatedEntry.error);
            } else {
                result[key] = validatedEntry.valid;
            }
        }
        if (errors.length > 0) {
            return ({ errors });
        } else {
            return ({ valid: result as TrainingState });
        }
    }
}
