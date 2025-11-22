import { useState, useEffect } from "react";
import { Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  shipmentService,
  TrackingStatus,
  TrackingEvent,
} from "@/services/shipmentService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface ShipmentTrackingProps {
  orderId: string;
  trackingNumber?: string;
  shipmentStatus?: string;
  courierName?: string;
  estimatedDeliveryDate?: string;
}

const ShipmentTracking = ({
  orderId,
  trackingNumber,
  shipmentStatus,
  courierName,
  estimatedDeliveryDate,
}: ShipmentTrackingProps) => {
  const [trackingData, setTrackingData] = useState<TrackingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trackingNumber) {
      fetchTrackingStatus();
    }
  }, [trackingNumber]);

  const fetchTrackingStatus = async () => {
    if (!trackingNumber) return;

    try {
      setLoading(true);
      setError(null);
      const status = await shipmentService.getTrackingStatus(
        trackingNumber,
        orderId
      );
      setTrackingData(status);
    } catch (err) {
      console.error("Error fetching tracking status:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch tracking status"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusInfo = shipmentService.formatTrackingStatus(status);
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "in_transit":
      case "picked_up":
        return <Truck className="h-5 w-5 text-yellow-600" />;
      case "out_for_delivery":
        return <Truck className="h-5 w-5 text-orange-600" />;
      case "created":
      case "pending":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "failed":
      case "exception":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in_transit":
      case "picked_up":
        return "bg-yellow-100 text-yellow-800";
      case "out_for_delivery":
        return "bg-orange-100 text-orange-800";
      case "created":
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "failed":
      case "exception":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return timestamp;
    }
  };

  if (!trackingNumber) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Shipment Tracking</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Tracking information not available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Shipment Tracking</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrackingStatus}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tracking Number */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tracking Number:</span>
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
            {trackingNumber}
          </code>
        </div>

        {/* Courier Information */}
        {courierName && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Courier:</span>
            <span className="text-sm">{courierName}</span>
          </div>
        )}

        {/* Current Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge
            className={`${getStatusColor(
              trackingData?.current_status || shipmentStatus || "pending"
            )}`}
          >
            {getStatusIcon(
              trackingData?.current_status || shipmentStatus || "pending"
            )}
            <span className="ml-1">
              {
                shipmentService.formatTrackingStatus(
                  trackingData?.current_status || shipmentStatus || "pending"
                ).text
              }
            </span>
          </Badge>
        </div>

        {/* Estimated Delivery */}
        {(trackingData?.estimated_delivery_date || estimatedDeliveryDate) && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estimated Delivery:</span>
            <span className="text-sm">
              {shipmentService.getEstimatedDeliveryDate(
                trackingData?.estimated_delivery_date ||
                  estimatedDeliveryDate ||
                  ""
              )}
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Tracking Events Timeline */}
        {trackingData?.tracking_events &&
          trackingData.tracking_events.length > 0 && (
            <div>
              <Separator className="my-4" />
              <h4 className="font-medium mb-3">Tracking History</h4>
              <div className="space-y-3">
                {trackingData.tracking_events.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(event.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {event.status_description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(event.timestamp)}
                      </p>
                      {event.location && (
                        <p className="text-xs text-gray-400">
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* No tracking events */}
        {trackingData &&
          (!trackingData.tracking_events ||
            trackingData.tracking_events.length === 0) && (
            <div className="text-center py-4">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No tracking events available yet
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default ShipmentTracking;
