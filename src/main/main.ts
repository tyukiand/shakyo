import { TrainingState } from "./TrainingState";
import { exit } from "process";

let currentChallengeIndex = 0;
let currentDifficulty = 0.7;
let currentDifficultyControl = 40;

const validatedInitialState = TrainingState.validateConfig(
    {
        'winProbability': 0.5,
        'fragmentLength': 80,
        'challengeFile': './example_text.txt'
    }
);

if ('errors' in validatedInitialState) {
    for (let err of validatedInitialState.errors) {
        console.error('ERROR: ' + err);
    }
    console.error(`There were ${validatedInitialState.errors.length} errors in the configuration. Exit.`);
    exit(1);
} else {
    const initialState = validatedInitialState.valid;
    const [terminationCommand, finalState] = runTrainingLoop(initialState);
    runTerminationCommand(terminationCommand);
}
