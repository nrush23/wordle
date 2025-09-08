"use client";

import { useState } from "react";

export default function GridSquare(){
    const [isEmpty, setIsEmpty] = useState(true);

    return(<div className="w-32 h-32">X</div>)
};