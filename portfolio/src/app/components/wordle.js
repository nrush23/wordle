"use client";

import Grid from "./wordle_grid";
import Keyboard from "./wordle_keyboard";

export default function Wordle() {
    const colors = [
        { type: 'unknown', bg: 'neutral-300', txt: 'gray-700' },
        { type: 'invalid', bg: 'neutral-500', txt: 'stone-50' },
        { type: 'found', bg: 'lime-600', txt: 'stone-50' }
    ]
    const keyboard = [
        { letter: 'Q' },
        { letter: 'W' },
        { letter: 'E' },
        { letter: 'R' },
        { letter: 'T' },
        { letter: 'Y' },
        { letter: 'U' },
        { letter: 'I' },
        { letter: 'O' },
        { letter: 'P' },
        { letter: 'S' },
        { letter: 'D' },
        { letter: 'F' },
        { letter: 'G' },
        { letter: 'H' },
        { letter: 'J' },
        { letter: 'K' },
        { letter: 'L' },
        { letter: 'Z' },
        { letter: 'X' },
        { letter: 'C' },
        { letter: 'V' },
        { letter: 'B' },
        { letter: 'N' },
        { letter: 'M' },
    ]
    return (
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
            <Grid></Grid>
            <Keyboard></Keyboard>
        </main>
        // <div className="flex flex-col">
        //     <Grid></Grid>
        //     <Keyboard></Keyboard>
        // </div>
    )
};