import Link from "next/link";
import {Leaf} from 'lucide-react'

export default function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <Leaf className="h-6 w-6 text-primary" strokeWidth="3" />
      <Link href="/">
        <span className="text-xl font-medium tracking-tight">Openleaf</span>
      </Link>
    </div>
  );
}
