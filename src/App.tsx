import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import GlobalContext from "@/contexts/GlobalContext";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { VendorProtectedRoute } from "@/components/VendorProtectedRoute";
import VendorShopManagement from "@/pages/vendor/ShopManagement";
import VendorVehicleManagement from "@/pages/vendor/VehicleManagement";
import VendorServiceManagement from "@/pages/vendor/ServiceManagement";
import SimRacingManagement from "@/pages/vendor/SimRacingManagement";
import VendorEventManagement from "@/pages/vendor/EventManagement";
import VendorSimEventManagement from "./pages/vendor/SimEventManagement";
import VendorSimLeagueManagement from "./pages/vendor/SimLeagueManagement";
import VendorSimGarageManagement from "./pages/vendor/SimGarageManagement";
import GlobalProvider from "./contexts/GlobalContext";
import { useIsMobile } from "./hooks/useIsMobile";

// Import all pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Social from "./pages/Social";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Settings from "./pages/Settings";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import EventCategory from "./pages/EventCategory";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import ServiceCategory from "./pages/ServiceCategory";
import MyServiceBookings from "./pages/MyServiceBookings";
import Shop from "./pages/Shop";
import ShopCategory from "./pages/ShopCategory";
import ProductDetail from "./pages/ProductDetail";
import ShopCart from "./pages/ShopCart";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import OrderHistory from "./pages/OrderHistory";
import OrderDetail from "./pages/OrderDetail";
import TrackShipment from "./pages/TrackShipment";
import Vehicles from "./pages/Vehicles";
import VehicleDetail from "./pages/VehicleDetail";
import VehicleCategory from "./pages/VehicleCategory";
import SimRacing from "./pages/SimRacing";
import SimRacingProduct from "./pages/SimRacingProduct";
import About from "./pages/About";
import MotoRevolution from "./pages/MotoRevolution";
import BottomNav from "./components/BottomNav";
import BottomLayout from "./components/BottomLayout";
import AdminAuth from "./pages/admin/adminLogin";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { EventRegistrationsHistory } from "./components/profile/EventRegistrationsHistory";
import SimEventManagement from "./pages/admin/SimEventManagement";
import SimEventEdit from "./pages/admin/SimEventEdit";
import SimLeagueManagement from "./pages/admin/SimLeagueManagement";
import SimLeagueEdit from "./pages/admin/SimLeagueEdit";
import SimGarageManagement from "./pages/admin/SimGarageManagement";
import SimGarageEdit from "./pages/admin/SimGarageEdit";
import SimProductManagement from "./pages/admin/SimProductManagement";
import SimProductEdit from "./pages/admin/SimProductEdit";
import SimRacingMyEvents from "./pages/sim-racing/SimRacingEvents";
import NotFound from "./pages/NotFound";

// Import sim racing pages
import SimRacingEvents from "./pages/sim-racing/SimRacingEvents";
import SimRacingEventDetail from "./pages/sim-racing/SimRacingEventDetail";
import SimRacingLeagues from "./pages/sim-racing/SimRacingLeagues";
import SimRacingLeagueDetail from "./pages/sim-racing/SimRacingLeagueDetail";
import SimRacingMyLeagues from "./pages/sim-racing/SimRacingMyLeagues";
import SimRacingGarages from "./pages/sim-racing/SimRacingGarages";
import SimRacingGarageDetail from "./pages/sim-racing/SimRacingGarageDetail";
import SimRacingEquipment from "./pages/sim-racing/SimRacingEquipment";
import SimRacingServices from "./pages/sim-racing/SimRacingServices";
import SimRacingProfile from "./pages/sim-racing/SimRacingProfile";
import SimRacingHistory from "./pages/sim-racing/SimRacingHistory";
import ServiceBookings from "./pages/MyServiceBookings";
import VendorDashboard from "@/pages/vendor/VendorDashboard";
import VendorManagement from "@/pages/admin/VendorManagement";
import VendorAnalytics from "./pages/vendor/VendorAnalytics";
import VendorActivities from "@/pages/admin/VendorActivities";
import VendorActivityDetail from "@/pages/admin/VendorActivityDetail";

// Import vendor pages

import EventManagement from "./pages/vendor/EventManagement";
import ServiceManagement from "./pages/vendor/ServiceManagement";
import ShopManagement from "./pages/vendor/ShopManagement";
import VehicleManagement from "./pages/vendor/VehicleManagement";
import Back from "./pages/vendor/Back";

// Import admin pages
import AdminLogin from "./pages/admin/adminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import VendorUpdateRequests from "./pages/admin/VendorUpdateRequests";
import EventCreate from "./pages/admin/EventCreate";
import EventEdit from "./pages/admin/EventEdit";
import EventManagementAdmin from "./pages/admin/EventManagement";
import ServiceCreate from "./pages/admin/ServiceCreate";
import ServiceEdit from "./pages/admin/ServiceEdit";
import ServiceManagementAdmin from "./pages/admin/ServiceManagement";
import ProductCreate from "./pages/admin/ProductCreate";
import ProductEdit from "./pages/admin/ProductEdit";
import ProductManagementAdmin from "./pages/admin/ProductManagement";
import VehicleEdit from "./pages/admin/VehicleEdit";
import VehicleManagementAdmin from "./pages/admin/VehicleManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import SimEventManagementAdmin from "./pages/admin/SimEventManagement";
import SimLeagueManagementAdmin from "./pages/admin/SimLeagueManagement";
import SimGarageManagementAdmin from "./pages/admin/SimGarageManagement";
import SimProductManagementAdmin from "./pages/admin/SimProductManagement";
import Messenger from "./pages/Messenger";
import ProductManagement from "./pages/admin/ProductManagement";
import SimSoloRegistrationHistory from "./components/sim-racing/SimSoloRegistrationHistory";
import Wishlist from "./pages/Wishlist";

import AdminServiceManagement from "./pages/admin/ServiceManagement";
import AdminEventManagement from "./pages/admin/EventManagement";
import AdminVehicleManagement from "./pages/admin/VehicleManagement";
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
              <GlobalContext>
                <BrowserRouter>
                  <Routes>
                    <Route
                      path="/messenger/:userId?"
                      element={
                        <ProtectedRoute>
                          <Messenger />
                        </ProtectedRoute>
                      }
                    />
                    <Route element={<BottomLayout />}>
                      <Route path="/" element={<Index />} />
                      <Route
                        path="/social"
                        element={
                          <ProtectedRoute>
                            <Social />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="social/post/:id"
                        element={
                          <ProtectedRoute>
                            <PostDetail />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/shop" element={<Shop />} />
                      <Route
                        path="/shop/category/:category"
                        element={<ShopCategory />}
                      />
                      <Route
                        path="/shop/product/:id"
                        element={<ProductDetail />}
                      />
                      <Route
                        path="/shop/cart"
                        element={
                          <ProtectedRoute>
                            <ShopCart />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/shop/checkout"
                        element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="shop/payment-success?"
                        element={
                          <ProtectedRoute>
                            <PaymentSuccess></PaymentSuccess>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/shop/orders"
                        element={
                          <ProtectedRoute>
                            <OrderHistory />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/shop/orders/:id"
                        element={
                          <ProtectedRoute>
                            <OrderDetail />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/track" element={<TrackShipment />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/vehicles" element={<Vehicles />} />
                      <Route
                        path="/vehicles/category/:category"
                        element={<VehicleCategory />}
                      />
                      <Route path="/vehicles/:id" element={<VehicleDetail />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile/:id"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/social/create"
                        element={
                          <ProtectedRoute>
                            <CreatePost />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/wishlist"
                        element={
                          <ProtectedRoute>
                            <Wishlist />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/about" element={<About />} />
                      <Route
                        path="/sim-racing/profile"
                        element={<SimRacingProfile />}
                      />
                      <Route path="/services" element={<Services />} />
                      <Route
                        path="/services/category/:category"
                        element={<ServiceCategory />}
                      />
                      <Route path="/services/:id" element={<ServiceDetail />} />
                      <Route
                        path="/myServiceBookings"
                        element={
                          <ProtectedRoute>
                            <ServiceBookings />
                          </ProtectedRoute>
                        }
                      />

                      {/* Event Routes */}
                      <Route path="/events" element={<Events />} />
                      <Route
                        path="/events/category/:category"
                        element={<EventCategory />}
                      />
                      <Route path="/events/:id" element={<EventDetail />} />

                      {/* Sim Racing Routes */}
                      <Route path="/sim-racing" element={<SimRacing />} />
                      <Route
                        path="/sim-racing/leagues"
                        element={<SimRacingLeagues />}
                      />
                      <Route
                        path="/sim-racing/events"
                        element={<SimRacingEvents />}
                      />
                      <Route
                        path="/sim-racing/services"
                        element={<SimRacingServices />}
                      />
                      <Route
                        path="/sim-racing/garages"
                        element={<SimRacingGarages />}
                      />
                      <Route
                        path="/sim-racing/equipment"
                        element={<SimRacingEquipment />}
                      />
                      <Route
                        path="/sim-racing/leagues/:id"
                        element={<SimRacingLeagueDetail />}
                      />
                      <Route
                        path="/sim-racing/events/:id"
                        element={<SimRacingEventDetail />}
                      />
                      <Route
                        path="/sim-racing/garages/:id"
                        element={<SimRacingGarageDetail />}
                      />
                      <Route
                        path="/sim-racing/category/:category"
                        element={<EventCategory />}
                      />
                      <Route
                        path="/sim-racing/products/:id"
                        element={<SimRacingProduct />}
                      />

                      {/* New sim racing history routes */}
                      <Route
                        path="/sim-racing/my-events"
                        element={
                          <ProtectedRoute>
                            <SimSoloRegistrationHistory />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/sim-racing/my-leagues"
                        element={
                          <ProtectedRoute>
                            <SimRacingMyLeagues />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/sim-racing/history"
                        element={
                          <ProtectedRoute>
                            <SimRacingHistory />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin Routes */}
                      <Route path="/admin/login" element={<AdminAuth />} />

                      <Route
                        path="/admin"
                        element={
                          <AdminProtectedRoute>
                            <AdminDashboard />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/products"
                        element={
                          <AdminProtectedRoute>
                            <ProductManagement />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/products/create"
                        element={
                          <AdminProtectedRoute>
                            <ProductEdit />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/products/edit/:id"
                        element={
                          <AdminProtectedRoute>
                            <ProductEdit />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/vehicles"
                        element={
                          <AdminProtectedRoute>
                            <AdminVehicleManagement />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/vehicles/create"
                        element={
                          <AdminProtectedRoute>
                            <VehicleEdit />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/vehicles/edit/:id"
                        element={
                          <AdminProtectedRoute>
                            <VehicleEdit />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/users"
                        element={
                          <AdminProtectedRoute>
                            <UserManagement />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/orders"
                        element={
                          <AdminProtectedRoute>
                            <OrderManagement />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/services/create"
                        element={
                          <AdminProtectedRoute>
                            <ServiceCreate />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/services/edit/:id"
                        element={
                          <AdminProtectedRoute>
                            <ServiceEdit />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/services"
                        element={
                          <AdminProtectedRoute>
                            <AdminServiceManagement />
                          </AdminProtectedRoute>
                        }
                      />

                      {/* Admin event management routes */}
                      <Route
                        path="/admin/events"
                        element={
                          <AdminProtectedRoute>
                            <AdminEventManagement />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/events/create"
                        element={
                          <AdminProtectedRoute>
                            <EventCreate />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/events/edit/:id"
                        element={
                          <AdminProtectedRoute>
                            <EventEdit />
                          </AdminProtectedRoute>
                        }
                      />

                      {/* Admin sim racing routes */}
                      <Route
                        path="/admin/sim-events"
                        element={
                          <AdminProtectedRoute>
                            <SimEventManagement />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/sim-events/create"
                        element={
                          <AdminProtectedRoute>
                            <SimEventEdit />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/sim-events/edit/:id"
                        element={
                          <AdminProtectedRoute>
                            <SimEventEdit />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/sim-leagues"
                        element={
                          <AdminProtectedRoute>
                            <SimLeagueManagement />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/sim-leagues/create"
                        element={
                          <AdminProtectedRoute>
                            <SimLeagueEdit />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/sim-leagues/edit/:id"
                        element={
                          <AdminProtectedRoute>
                            <SimLeagueEdit />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/sim-garages"
                        element={
                          <AdminProtectedRoute>
                            <SimGarageManagement />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/sim-garages/create"
                        element={
                          <AdminProtectedRoute>
                            <SimGarageEdit />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/sim-garages/edit/:id"
                        element={
                          <AdminProtectedRoute>
                            <SimGarageEdit />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/sim-products"
                        element={
                          <AdminProtectedRoute>
                            <SimProductManagement />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/sim-products/create"
                        element={
                          <AdminProtectedRoute>
                            <SimProductEdit />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/sim-products/edit/:id"
                        element={
                          <AdminProtectedRoute>
                            <SimProductEdit />
                          </AdminProtectedRoute>
                        }
                      />

                      {/* Vendor Category Management Routes */}
                      <Route
                        path="/vendor/shop-management"
                        element={
                          <VendorProtectedRoute requiredCategory="Shop">
                            <VendorShopManagement />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/vehicle-management"
                        element={
                          <VendorProtectedRoute requiredCategory="Vehicle">
                            <VendorVehicleManagement />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/analytics"
                        element={
                          <ProtectedRoute>
                            <VendorAnalytics />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/service-management"
                        element={
                          <VendorProtectedRoute requiredCategory="Service">
                            <VendorServiceManagement />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/simracing-management"
                        element={
                          <VendorProtectedRoute requiredCategory="SimRacing">
                            <SimRacingManagement />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/event-management"
                        element={
                          <VendorProtectedRoute requiredCategory="Event">
                            <VendorEventManagement />
                          </VendorProtectedRoute>
                        }
                      />

                      {/* Vendor Create Routes */}
                      <Route
                        path="/vendor/shop/create"
                        element={
                          <VendorProtectedRoute requiredCategory="Shop">
                            <ProductEdit />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/shop/edit/:id"
                        element={
                          <VendorProtectedRoute requiredCategory="Shop">
                            <ProductEdit />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/vehicle/create"
                        element={
                          <VendorProtectedRoute requiredCategory="Vehicle">
                            <VehicleEdit />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/vehicles/edit/:id"
                        element={
                          <VendorProtectedRoute requiredCategory="Vehicle">
                            <VehicleEdit />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/service/create"
                        element={
                          <VendorProtectedRoute requiredCategory="Service">
                            <ServiceCreate />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/service/edit/:id"
                        element={
                          <VendorProtectedRoute requiredCategory="Service">
                            <ServiceEdit />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/simracing/product/create"
                        element={
                          <VendorProtectedRoute requiredCategory="SimRacing">
                            <SimProductEdit />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/simracing/product/:id"
                        element={
                          <VendorProtectedRoute requiredCategory="SimRacing">
                            <SimProductEdit />
                          </VendorProtectedRoute>
                        }
                      />

                      <Route
                        path="/vendor/simracing/event/:id"
                        element={
                          <VendorProtectedRoute requiredCategory="SimRacing">
                            <SimEventEdit />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/event/create"
                        element={
                          <VendorProtectedRoute requiredCategory="Event">
                            <EventCreate />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/event/edit/:id"
                        element={
                          <VendorProtectedRoute requiredCategory="Event">
                            <EventEdit />
                          </VendorProtectedRoute>
                        }
                      />

                      <Route
                        path="/vendor/simevent-management"
                        element={
                          <VendorProtectedRoute requiredCategory="SimRacing">
                            <VendorSimEventManagement />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/simevent/create"
                        element={
                          <VendorProtectedRoute requiredCategory="SimRacing">
                            <SimEventEdit />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/simevent/edit/:id"
                        element={
                          <VendorProtectedRoute requiredCategory="SimRacing">
                            <SimEventEdit />
                          </VendorProtectedRoute>
                        }
                      />

                      <Route
                        path="/vendor/simleague-management"
                        element={
                          <VendorProtectedRoute requiredCategory={"SimRacing"}>
                            <VendorSimLeagueManagement />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/simleague/create"
                        element={
                          <VendorProtectedRoute requiredCategory={"SimRacing"}>
                            <SimLeagueEdit />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/simleague/edit/:id"
                        element={
                          <VendorProtectedRoute requiredCategory={"SimRacing"}>
                            <SimLeagueEdit />
                          </VendorProtectedRoute>
                        }
                      />

                      <Route
                        path="/vendor/simgarage-management"
                        element={
                          <VendorProtectedRoute requiredCategory={"SimRacing"}>
                            <VendorSimGarageManagement />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/simgarage/create"
                        element={
                          <VendorProtectedRoute requiredCategory={"SimRacing"}>
                            <SimGarageEdit />
                          </VendorProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor/simgarage/edit/:id"
                        element={
                          <VendorProtectedRoute requiredCategory={"SimRacing"}>
                            <SimGarageEdit />
                          </VendorProtectedRoute>
                        }
                      />

                      <Route
                        path="/moto-revolution"
                        element={<MotoRevolution />}
                      />
                      <Route
                        path="/eventHistory"
                        element={
                          <ProtectedRoute>
                            <EventRegistrationsHistory userId={""} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/vendor-dashboard"
                        element={
                          <VendorProtectedRoute requiredCategory="vendor">
                            <VendorDashboard />
                          </VendorProtectedRoute>
                        }
                      />

                      {/* Admin routes */}
                      <Route
                        path="/admin/vendor-management"
                        element={
                          <AdminProtectedRoute>
                            <VendorManagement />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/vendor-activities"
                        element={
                          <AdminProtectedRoute>
                            <VendorActivities />
                          </AdminProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/vendor-activities/:vendorId"
                        element={
                          <AdminProtectedRoute>
                            <VendorActivityDetail />
                          </AdminProtectedRoute>
                        }
                      />

                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                  <Toaster />
                  <Sonner />
                </BrowserRouter>
              </GlobalContext>
            </CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
