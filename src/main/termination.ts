export type TerminationCommandKind = 
export interface TerminationCommand {
    kind: TerminationCommandKind;
    shortcut: string;
}

export const WriteQuit = { kind: 'WriteQuit', shortcut: 'wq' }
export const ForceQuit = { kind: 'ForceQuit', shortcut: 'q!' }
export const Quit = { kind: 'Quit', shortcut: 'q' }