import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { vendorApi } from "@/integrations/supabase/modules/vendors";
import { useQuery } from "@tanstack/react-query";

interface VendorProtectedRouteProps {
  children: React.ReactNode;
  requiredCategory: string;
}

export const VendorProtectedRoute: React.FC<VendorProtectedRouteProps> = ({
  children,
  requiredCategory,
}) => {
  const { user, loading } = useAuth();
  
  const { data: vendorData, isLoading: vendorLoading } = useQuery({
    queryKey: ["vendor-registration", user?.id],
    queryFn: () => vendorApi.getByUserId(user!.id),
    enabled: !!user,
  });

  if (loading || vendorLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }
  if(vendorData?.data?.status != "approved" &&
        vendorData?.data.is_verified_by_admin != true)
        {
           return <Navigate to="/settings" replace />;
        }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if(!vendorData?.data && requiredCategory=="vendor")
    {
       return <Navigate to="/" replace />
    }

  if (!vendorData?.data) {
    return <Navigate to="/vendor-dashboard" replace />;
  }

  const vendor = vendorData.data;
if(vendorData?.data && requiredCategory=="vendor")
    {
       return <>{children}</>
    }
  if (!vendor.is_verified_by_admin) {
    return <Navigate to="/vendor-dashboard" replace />;
  }
    
  if (!vendor.categories.includes(requiredCategory)) {
    return <Navigate to="/vendor-dashboard" replace />;
  }

  return <>{children}</>;
};
