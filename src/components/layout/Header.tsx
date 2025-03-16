import { Search, Bell, ChevronDown } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  title: string;
  onSearch?: (searchTerm: string) => void;
}

export default function Header({ title, onSearch }: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };
  
  return (
    <header className="bg-primary border-b border-gray-700 py-3 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <h2 className="text-xl font-medium">{title}</h2>
          </div>
        </div>
        <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
          <form onSubmit={handleSearch} className="max-w-lg w-full lg:max-w-xs">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                id="search" 
                name="search" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-primary-dark text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary sm:text-sm" 
                placeholder="Search for logs, users, sessions..." 
                type="search"
              />
            </div>
          </form>
        </div>
        <div className="flex items-center">
          <button className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white relative">
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          
          <div className="ml-4 relative flex-shrink-0">
            <div>
              <button className="bg-primary-light rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
                <span className="sr-only">Open user menu</span>
                <span className="h-8 w-8 rounded-full flex items-center justify-center bg-secondary-dark text-white">
                  A
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
