
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, User } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="border-b bg-white p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-sm hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              type="search" 
              placeholder="Search..." 
              className="pl-10 pr-4 w-full"
            />
          </div>

          <Button variant="ghost" size="icon" className="text-gray-500">
            <Bell size={20} />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-gray-500">
            <User size={20} />
          </Button>
        </div>
      </div>
    </header>
  );
}
