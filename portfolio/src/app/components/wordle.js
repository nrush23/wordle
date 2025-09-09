"use client";

import Grid from "./wordle_grid";
import Keyboard from "./wordle_keyboard";

export default function Wordle() {
    const colors = [
        { type: 'unknown', bg: 'neutral-300', txt: 'gray-700' },
        { type: 'invalid', bg: 'neutral-500', txt: 'stone-50' },
        { type: 'found', bg: 'lime-600', txt: 'stone-50' }
    ]

    //Need this for both the keyboard and the Grid
    function changeColor(type){
        if (type == 'invalid'){

        }else if (type == 'found'){

        }
    }

    //This will be where we check their current word against our word list
    function checkValid(){

    }

    return (
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
            <Grid></Grid>
            <Keyboard></Keyboard>
        </main>
    )
};