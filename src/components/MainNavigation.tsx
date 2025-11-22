
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Users, ShoppingBag, Car, Trophy, Calendar, Settings } from "lucide-react";

const MainNavigation = () => {
  const location = useLocation();
  const path = location.pathname;
  
  const getActiveStatus = (route: string) => {
    if (route === "/social" && path.startsWith("/social")) return true;
    if (route === "/shop" && path.startsWith("/shop")) return true;
    if (route === "/vehicles" && path.startsWith("/vehicles")) return true;
    if (route === "/moto-revolution" && path.startsWith("/moto-revolution")) return true;
    if (route === "/services" && path.startsWith("/services")) return true;
    if (route === "/sim-racing" && path.startsWith("/sim-racing")) return true;
    return false;
  };

  return (
    <div className="relative border-b w-full border-gray-200 bg-white">
      <div className="container flex h-12 items-center justify-center px-4">
        <div className="flex items-center space-x-8">
          <Link
            to="/social"
            className={cn(
              "flex items-center space-x-2 text-sm font-medium transition-all hover:text-sm-red",
              getActiveStatus("/social") && "text-sm-red"
            )}
          >
            <Users size={18} />
            <span>Social</span>
          </Link>
          
          <Link
            to="/shop"
            className={cn(
              "flex items-center space-x-2 text-sm font-medium transition-all hover:text-sm-red",
              getActiveStatus("/shop") && "text-sm-red"
            )}
          >
            <ShoppingBag size={18} />
            <span>Shop</span>
          </Link>
          
          <Link
            to="/vehicles"
            className={cn(
              "flex items-center space-x-2 text-sm font-medium transition-all hover:text-sm-red",
              getActiveStatus("/vehicles") && "text-sm-red"
            )}
          >
            <Car size={18} />
            <span>Vehicles</span>
          </Link>
          
          <Link
            to="/services"
            className={cn(
              "flex items-center space-x-2 text-sm font-medium transition-all max-[800px]:hidden hover:text-sm-red",
              getActiveStatus("/services") && "text-sm-red"
            )}
          >
            <Settings size={18} />
            <span>Services</span>
          </Link>
          
          {/* <Link
            to="/sim-racing"
            className={cn(
              "flex items-center space-x-2 text-sm font-medium transition-all hover:text-sm-red",
              getActiveStatus("/sim-racing") && "text-sm-red"
            )}
          >
            <Trophy size={18} />
            <span className="max-[800px]:hidden">Sim Racing</span>
            <span className="hidden max-[800px]:block">Racing</span>
          </Link> */}
          
          <Link
            to="/moto-revolution"
            className={cn(
              "flex items-center space-x-2 text-sm font-medium transition-all hover:text-sm-red",
              getActiveStatus("/moto-revolution") && "text-sm-red"
            )}
          >
            <Car size={18} />
            <span className="max-[800px]:hidden">Moto Revolution</span>
            <span className="hidden max-[800px]:block">MR</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MainNavigation;
