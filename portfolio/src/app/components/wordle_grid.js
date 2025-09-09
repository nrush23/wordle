import { useState } from "react";
import GridSquare from "./grid_square";

export default function Grid() {
    const ROWS = 6;
    const COLS = 5;
    const [grid, setGrid] = useState(() =>
        Array.from({ length: ROWS }, () => Array(COLS).fill(''))
    );

    const setSquare = (r, c, char) => {
        setGrid(prev =>{
            const update = prev.map(row => row.slice());
            update[r][c] = char;
            return update;
        });
    };
    return (
        <div>
            <div className="grid grid-cols-5 gap-2">
                {grid.map((row, r) =>
                    row.map((char, c) => (
                        <GridSquare
                            key={`${r}-${c}`}
                            value={char}
                        ></GridSquare>))
                )}
            </div>
        </div>
    )
};
