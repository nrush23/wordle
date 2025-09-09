import Image from "next/image";

export default function Assignment({ path, name, image = false }) {
    return (
        <li className=" tracking-[-.01em]">
            <a className="p-4 rounded-lg border-2 border-slate-100 flex items-center justify-center gap-16" href={path}>
                <div className="flex flex-center">{name}</div>
                {image != false &&
                    <Image
                        className="rounded-lg"
                        src={image}
                        alt={name}
                        width={64}
                        height={64}
                    />}
            </a>
        </li>
    )
}