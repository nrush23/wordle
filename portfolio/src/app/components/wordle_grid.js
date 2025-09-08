import GridSquare from "./grid_square";

export default function Grid() {
    const entries = Array(6);
    return (
        <div>
            <span>Grid</span>
            {entries.forEach((index)=>{
                index = Array(6)
                for(let i = 0; i < 5; i++){
                    index[i] = GridSquare;
                }
            })}
            </div>
    )
};