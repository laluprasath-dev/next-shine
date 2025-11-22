
import { useWishlist } from "@/hooks/useWishlist";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, ShoppingCart, Eye, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";

const Wishlist = () => {
  const { wishlistItems, loading, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();
   useEffect(()=>{
     window.scrollTo(0,0)
   },[])
  const { productItems, vehicleItems } = useMemo(() => {
    const products = wishlistItems.filter(item => item.item_type === 'product');
    const vehicles = wishlistItems.filter(item => item.item_type === 'vehicle');
    return { productItems: products, vehicleItems: vehicles };
  }, [wishlistItems]);

  const handleRemove = async (itemId: string, itemType: 'product' | 'vehicle') => {
    await removeFromWishlist(itemId, itemType);
  };

  const handleViewItem = (itemId: string, itemType: 'product' | 'vehicle') => {
    if (itemType === 'product') {
      navigate(`/shop/product/${itemId}`);
    } else {
      navigate(`/vehicles/${itemId}`);
    }
  };

  const renderWishlistItems = (items: typeof wishlistItems) => {
    if (items.length === 0) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No items found</h3>
              <p className="text-gray-600 mb-6">
                Start adding items you like to your wishlist
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/shop')} className="bg-sm-red hover:bg-sm-red-light">
                  Browse Products
                </Button>
                <Button onClick={() => navigate('/vehicles')} variant="outline">
                  Browse Vehicles
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <div className="h-48 bg-gray-100 overflow-hidden">
                  {item.item_type === 'product' && item.product ? (
                    <img
                      src={item.product.images?.[0] || '/placeholder.svg'}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : item.item_type === 'vehicle' && item.vehicle ? (
                    <img
                      src={item.vehicle.images?.[0] || '/placeholder.svg'}
                      alt={item.vehicle.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-gray-400">No Image</div>
                    </div>
                  )}
                </div>
                
                <div className="absolute top-3 left-3">
                  <Badge className={item.item_type === 'product' ? 'bg-blue-500' : 'bg-green-500'}>
                    {item.item_type === 'product' ? (
                      <>
                        <ShoppingCart size={12} className="mr-1" />
                        Product
                      </>
                    ) : (
                      <>
                        <Car size={12} className="mr-1" />
                        Vehicle
                      </>
                    )}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 bg-white/80 hover:bg-white"
                  onClick={() => handleRemove(item.item_id, item.item_type)}
                >
                  <Trash2 size={16} className="text-red-500" />
                </Button>
              </div>

              <CardContent className="p-4">
                <div className="mb-3">
                  {item.item_type === 'product' && item.product ? (
                    <>
                      <h3 className="font-semibold line-clamp-1 mb-1">{item.product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {item.product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">₹{item.product.price}</span>
                        <Badge variant="outline">{item.product.category}</Badge>
                      </div>
                    </>
                  ) : item.item_type === 'vehicle' && item.vehicle ? (
                    <>
                      <h3 className="font-semibold line-clamp-1 mb-1">{item.vehicle.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {item.vehicle.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">₹{item.vehicle.price}</span>
                        <Badge variant="outline">{item.vehicle.category}</Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-500">
                      Item details not available
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleViewItem(item.item_id, item.item_type)}
                  className="w-full bg-sm-red hover:bg-sm-red-light"
                  size="sm"
                >
                  <Eye size={16} className="mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sm-red"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
          <p className="text-gray-600">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All Items
              {wishlistItems.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {wishlistItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingCart size={16} />
              Products
              {productItems.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {productItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Car size={16} />
              Vehicles
              {vehicleItems.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {vehicleItems.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderWishlistItems(wishlistItems)}
          </TabsContent>

          <TabsContent value="products">
            {renderWishlistItems(productItems)}
          </TabsContent>

          <TabsContent value="vehicles">
            {renderWishlistItems(vehicleItems)}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Wishlist;
