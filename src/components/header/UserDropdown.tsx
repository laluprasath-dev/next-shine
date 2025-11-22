
import { Calendar, LogOut, Settings, ShoppingBag, UserCircle, Gamepad, Trophy, Clock, Building, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

export const UserDropdown = () => {
  const navigate = useNavigate();
  const { signOut, user, profile } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <UserCircle size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white z-50">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/profile/${user?.id}`)}>
          <UserCircle className="mr-2 h-4 w-4" /> Profile
        </DropdownMenuItem>
        
        {/* Vendor Dashboard for verified vendors */}
        {profile?.is_vendor && (
          <DropdownMenuItem onClick={() => navigate("/vendor-dashboard")}>
            <Building className="mr-2 h-4 w-4" /> Vendor Dashboard
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate("/wishlist")}>
          <Heart className="mr-2 h-4 w-4 fill-sm-red text-sm-red" /> Wishlist
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate("/shop/orders")}>
          <ShoppingBag className="mr-2 h-4 w-4"></ShoppingBag>
          Orders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/eventHistory")}>
          <Calendar className="mr-2 h-4 w-4"></Calendar>
          Events
        </DropdownMenuItem>
         <DropdownMenuItem onClick={() => navigate("/myServiceBookings")}>
          <Calendar className="mr-2 h-4 w-4"></Calendar>
          Services
        </DropdownMenuItem>
        {/* Sim Racing submenu with history options */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Gamepad className="mr-2 h-4 w-4" />
            Sim Racing
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-white z-50">
            <DropdownMenuItem onClick={() => navigate("/sim-racing")}>
              <Gamepad className="mr-2 h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/sim-racing/my-events")}>
              <Calendar className="mr-2 h-4 w-4" />
              My Events
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/sim-racing/my-leagues")}>
              <Trophy className="mr-2 h-4 w-4" />
              My Leagues
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/sim-racing/history")}>
              <Clock className="mr-2 h-4 w-4" />
              Racing History
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
