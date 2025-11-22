
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EventCategoriesProps {
  categories: string[];
  className?: string;
  isSimRacing?: boolean;
}

const EventCategories: React.FC<EventCategoriesProps> = ({ 
  categories, 
  className = "",
  isSimRacing = false 
}) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const currentCategory = currentPath.includes('/category/') 
    ? currentPath.split("/category/")[1]
    : "";
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
 
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Link
        to={isSimRacing ? "/sim-racing" : "/events"}
        className={cn(
          "px-4 py-1 rounded-full text-sm font-medium transition-colors",
          !currentCategory
            ? "bg-sm-red text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        All {isSimRacing ? "Sim Racing" : "Events"}
      </Link>
      
      {categories.map((category) => (
        <Link
          key={category}
          to={`${isSimRacing ? "/sim-racing" : "/events"}/category/${category}`}
          className={cn(
            "px-4 py-1 rounded-full text-sm font-medium transition-colors",
            currentCategory.replace("%20"," ") === category
              ? "bg-sm-red text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {category}
        </Link>
      ))}
    </div>
  );
};

export default EventCategories;
