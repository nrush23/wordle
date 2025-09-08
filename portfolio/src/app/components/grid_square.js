"use client";

import { useState } from "react";

export default function GridSquare(){
    const [value, setValue] = useState("X");

    return(<div className="w-16 h-16 border-2 border-slate-100 text-center">{value}</div>)
};